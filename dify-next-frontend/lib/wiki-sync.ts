
import { prisma } from './prisma';
import { DifyClient } from './dify-client';

const WIKI_GRAPHQL_URL = process.env.WIKI_GRAPHQL_URL || 'http://wiki:3000/graphql';
const WIKI_API_KEY = process.env.WIKI_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || 'http://api:5001/v1'; // Use v1 API
const DIFY_ADMIN_API_KEY = process.env.DIFY_ADMIN_API_KEY;

if (!DIFY_ADMIN_API_KEY) {
  console.warn('DIFY_ADMIN_API_KEY is not set. Sync may fail.');
}

const difyClient = new DifyClient(DIFY_API_URL, DIFY_ADMIN_API_KEY || '');

async function wikiRequest(query: string, variables: any = {}) {
  const response = await fetch(WIKI_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WIKI_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Wiki GraphQL Error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

export async function syncWikiToDify() {
  console.log('Starting Wiki to Dify sync...');

  const settings = await prisma.chatbotSetting.findMany();

  for (const setting of settings) {
    const { department, datasetId } = setting;
    const wikiPath = department.toLowerCase(); // e.g., 'EE' -> 'ee'

    console.log(`Processing department: ${department} (Path: /${wikiPath})`);

    // 1. Ensure Dify Dataset Exists
    let targetDatasetId = datasetId;
    if (!targetDatasetId) {
      console.log(`Dataset ID not found for ${department}, searching/creating...`);
      // Try to find existing dataset by name
      const datasets = await difyClient.listDatasets(1, 100);
      const existing = datasets.data.find((d: any) => d.name === `Wiki - ${department}`);

      if (existing) {
        targetDatasetId = existing.id;
        console.log(`Found existing dataset: ${targetDatasetId}`);
      } else {
        const newDataset = await difyClient.createDataset(`Wiki - ${department}`);
        targetDatasetId = newDataset.id;
        console.log(`Created new dataset: ${targetDatasetId}`);
      }

      // Update setting
      await prisma.chatbotSetting.update({
        where: { id: setting.id },
        data: { datasetId: targetDatasetId },
      });
    }

    // 2. Ensure Wiki Path Exists (Create Home Page if missing)
    // Check if page exists
    const checkPageQuery = `
      query ($path: String!) {
        pages {
          single(id: 0, path: $path) {
            id
            title
          }
        }
      }
    `;

    try {
        const pageResult = await wikiRequest(checkPageQuery, { path: wikiPath });
        if (!pageResult.pages.single) {
            console.log(`Wiki path /${wikiPath} does not exist. Creating home page...`);
            const createPageMutation = `
              mutation ($content: String!, $description: String!, $editor: String!, $isPrivate: Boolean!, $isPublished: Boolean!, $locale: String!, $path: String!, $tags: [String]!, $title: String!) {
                pages {
                  create(content: $content, description: $description, editor: $editor, isPrivate: $isPrivate, isPublished: $isPublished, locale: $locale, path: $path, tags: $tags, title: $title) {
                    responseResult {
                      succeeded
                      message
                    }
                  }
                }
              }
            `;

            await wikiRequest(createPageMutation, {
                content: `# ${department} Knowledge Base\n\nWelcome to the ${department} knowledge base.`,
                description: `${department} Home Page`,
                editor: 'markdown',
                isPrivate: false,
                isPublished: true,
                locale: 'en', // Default locale
                path: wikiPath,
                tags: [department],
                title: department
            });
        }
    } catch (e) {
        console.error(`Error checking/creating wiki page for ${department}:`, e);
    }

    // 3. Fetch all pages under this path
    // Note: Wiki.js GraphQL 'list' filter by path prefix is tricky.
    // We might need to fetch all pages and filter, or use a specific query if available.
    // For now, let's assume we can list pages.
    const listPagesQuery = `
      query {
        pages {
          list {
            id
            path
            title
            content
            updatedAt
          }
        }
      }
    `;

    const allPagesResult = await wikiRequest(listPagesQuery);
    const deptPages = allPagesResult.pages.list.filter((p: any) => p.path === wikiPath || p.path.startsWith(`${wikiPath}/`));

    console.log(`Found ${deptPages.length} pages for ${department}`);

    // 4. Sync to Dify
    // Get existing documents in Dify to avoid duplicates (simple check by name/path)
    // Note: Dify API doesn't easily support "get by custom metadata".
    // We'll list documents and match by name == wiki path.

    const difyDocs = await difyClient.listDocuments(targetDatasetId!, 1, 100);
    const difyDocMap = new Map(difyDocs.data.map((d: any) => [d.name, d]));

    for (const page of deptPages) {
        const docName = page.path; // Use path as document name
        const content = `# ${page.title}\n\n${page.content}`;

        if (difyDocMap.has(docName)) {
            // Update
            const existingDoc: any = difyDocMap.get(docName);
            console.log(`Updating document: ${docName}`);
            await difyClient.updateDocumentByText(targetDatasetId!, existingDoc.id, docName, content);
        } else {
            // Create
            console.log(`Creating document: ${docName}`);
            await difyClient.createDocumentByText(targetDatasetId!, docName, content);
        }
    }
  }

  console.log('Wiki sync completed.');
}
