/**
 * PDF 檔案解析器
 * 使用 pdf-parse 提取 PDF 文字內容
 */

import { NormalizedDocument, FileType } from '../types';

export async function parsePdf(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const pdfParse = require('pdf-parse');

  try {
    // 使用 pdf-parse 解析 PDF
    const data = await pdfParse(buffer);

    let content = data.text;

    // 清理文字
    content = content
      .replace(/\r\n/g, '\n')      // 統一換行符號
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')  // 移除多餘空行
      .replace(/\f/g, '\n\n---\n\n')  // 分頁符號轉換成分隔線
      .trim();

    // 嘗試提取標題（通常在第一行或檔名）
    const lines = content.split('\n');
    let title = fileName.replace(/\.[^/.]+$/, '');

    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        title = firstLine;
        // 從內容中移除標題行
        content = lines.slice(1).join('\n').trim();
      }
    }

    return {
      title,
      content,
      metadata: {
        fileType: FileType.PDF,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString(),
        pdfInfo: {
          pages: data.numpages,
          info: data.info
        }
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
