/**
 * DOCX 檔案解析器
 * 使用 mammoth 將 DOCX 轉換成 Markdown
 */

import { NormalizedDocument, FileType } from '../types';

export async function parseDocx(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const mammoth = require('mammoth');

  try {
    // 使用 mammoth 轉換 DOCX 到 Markdown
    const result = await mammoth.convertToMarkdown(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => # ",
          "p[style-name='Heading 2'] => ## ",
          "p[style-name='Heading 3'] => ### ",
          "p[style-name='Heading 4'] => #### ",
        ]
      }
    );

    let markdown = result.value;

    // 清理 Markdown
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')  // 移除多餘空行
      .replace(/\\\[/g, '[')       // 清理跳脫字元
      .replace(/\\\]/g, ']')
      .trim();

    // 警告訊息
    if (result.messages.length > 0) {
      console.warn('DOCX conversion warnings:', result.messages);
    }

    // 提取標題（取第一個 H1）
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : fileName.replace(/\.[^/.]+$/, '');

    return {
      title,
      content: markdown,
      metadata: {
        fileType: FileType.DOCX,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
