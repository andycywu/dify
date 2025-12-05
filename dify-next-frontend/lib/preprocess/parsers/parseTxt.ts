/**
 * TXT 檔案解析器
 */

import { NormalizedDocument, FileType } from '../types';

export async function parseTxt(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  // 嘗試多種編碼
  let content: string;

  try {
    content = buffer.toString('utf-8');
  } catch (error) {
    // Fallback to latin1
    content = buffer.toString('latin1');
  }

  // 清理內容
  content = content
    .replace(/\r\n/g, '\n')  // 統一換行符號
    .replace(/\r/g, '\n')
    .trim();

  // 使用檔名作為標題（移除副檔名）
  const title = fileName.replace(/\.[^/.]+$/, '');

  return {
    title,
    content,
    metadata: {
      fileType: FileType.TXT,
      fileName,
      fileSize: buffer.length,
      processedAt: new Date().toISOString(),
      encoding: 'utf-8'
    }
  };
}
