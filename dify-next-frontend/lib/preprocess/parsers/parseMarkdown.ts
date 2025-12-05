/**
 * Markdown 檔案解析器
 */

import { NormalizedDocument, FileType, DocumentSection } from '../types';

export async function parseMarkdown(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  let content = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 解析 frontmatter（如果有的話）
  let title = fileName.replace(/\.[^/.]+$/, '');
  let mainContent = content;

  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    mainContent = frontmatterMatch[2];

    // 嘗試提取標題
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/['"]/g, '');
    }
  }

  // 解析 sections（基於標題）
  const sections = parseMarkdownSections(mainContent);

  return {
    title,
    content: mainContent.trim(),
    metadata: {
      fileType: FileType.MARKDOWN,
      fileName,
      fileSize: buffer.length,
      processedAt: new Date().toISOString(),
      encoding: 'utf-8'
    },
    sections: sections.length > 0 ? sections : undefined
  };
}

/**
 * 解析 Markdown 標題結構
 */
function parseMarkdownSections(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = content.split('\n');

  let currentSection: DocumentSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // 儲存前一個 section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }

      // 開始新 section
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      currentSection = {
        heading,
        content: '',
        level,
        metadata: { level }
      };
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // 儲存最後一個 section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }

  // 如果沒有標題，將整個內容作為單一 section
  if (sections.length === 0 && currentContent.length > 0) {
    const allContent = currentContent.join('\n').trim();
    if (allContent) {
      sections.push({
        content: allContent
      });
    }
  }

  return sections;
}
