/**
 * Markdown Chunking 模組
 * 將文件切分成適當大小的 chunks
 */

import { MarkdownChunk, NormalizedDocument, ChunkOptions } from '../types';
import { DEFAULT_CHUNK_OPTIONS } from '../config';

/**
 * 將 NormalizedDocument 轉換成 Markdown chunks (格式 A)
 *
 * 格式 A:
 * ```markdown
 * # <title>
 *
 * <body>
 *
 * ---
 * ```
 */
export function chunkMarkdown(
  doc: NormalizedDocument,
  options: ChunkOptions = {}
): MarkdownChunk[] {
  const {
    maxChunkSize = DEFAULT_CHUNK_OPTIONS.maxChunkSize,
    preserveHeadings = DEFAULT_CHUNK_OPTIONS.preserveHeadings
  } = options;

  const chunks: MarkdownChunk[] = [];

  if (doc.sections && doc.sections.length > 0) {
    // 有結構化 sections，按 section 分塊
    for (const section of doc.sections) {
      const title = section.heading || doc.title;
      const body = section.content;

      // 如果 section 太大，進一步切分
      if (body.length > maxChunkSize) {
        const subChunks = splitLargeText(body, maxChunkSize);
        subChunks.forEach((subBody, index) => {
          chunks.push({
            title: subChunks.length > 1 ? `${title} (Part ${index + 1})` : title,
            body: subBody,
            metadata: {
              ...section.metadata,
              partIndex: index,
              totalParts: subChunks.length
            }
          });
        });
      } else {
        chunks.push({
          title,
          body,
          metadata: section.metadata
        });
      }
    }
  } else {
    // 無結構化，直接切分 content
    const subChunks = splitLargeText(doc.content, maxChunkSize);
    subChunks.forEach((body, index) => {
      chunks.push({
        title: subChunks.length > 1 ? `${doc.title} (Part ${index + 1})` : doc.title,
        body,
        metadata: {
          partIndex: index,
          totalParts: subChunks.length
        }
      });
    });
  }

  return chunks;
}

/**
 * 將 chunks 轉換成最終 Markdown 字串 (格式 A)
 */
export function chunksToMarkdown(chunks: MarkdownChunk[]): string {
  return chunks.map(chunk => {
    return `# ${chunk.title}\n\n${chunk.body}\n\n---`;
  }).join('\n\n');
}

/**
 * 切分大型文字，盡量保持段落完整性
 */
function splitLargeText(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const testLength = currentChunk.length + (currentChunk ? 2 : 0) + para.length;

    if (testLength <= maxSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      // 當前段落會超過限制
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // 段落本身太大，強制切分
      if (para.length > maxSize) {
        const sentences = para.split(/(?<=[.!?。！？])\s+/);
        let sentenceChunk = '';

        for (const sentence of sentences) {
          if ((sentenceChunk.length + sentence.length + 1) <= maxSize) {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
          } else {
            if (sentenceChunk) {
              chunks.push(sentenceChunk);
            }
            // 如果單句也太長，直接切分
            if (sentence.length > maxSize) {
              for (let i = 0; i < sentence.length; i += maxSize) {
                chunks.push(sentence.slice(i, i + maxSize));
              }
              sentenceChunk = '';
            } else {
              sentenceChunk = sentence;
            }
          }
        }
        currentChunk = sentenceChunk;
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(c => c.trim().length > 0);
}

/**
 * CSV/Excel 專用 Chunker
 * 每一行轉換成格式 A 變體：
 *
 * # <Test Item>
 *
 * **Field1:** Value1
 * **Field2:** Value2
 * ...
 *
 * ---
 */
export function chunkTabularData(
  rows: Record<string, any>[],
  options: {
    titleField?: string;      // 用作標題的欄位名稱
    maxRowsPerChunk?: number; // 每個 chunk 最多幾行
  } = {}
): MarkdownChunk[] {
  const { titleField, maxRowsPerChunk = 10 } = options;
  const chunks: MarkdownChunk[] = [];

  for (let i = 0; i < rows.length; i += maxRowsPerChunk) {
    const rowBatch = rows.slice(i, i + maxRowsPerChunk);

    const body = rowBatch.map(row => {
      return Object.entries(row)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('  \n');
    }).join('\n\n');

    const title = titleField && rowBatch[0]?.[titleField]
      ? String(rowBatch[0][titleField])
      : `Data Rows ${i + 1}-${Math.min(i + maxRowsPerChunk, rows.length)}`;

    chunks.push({ title, body });
  }

  return chunks;
}
