/**
 * Properties 檔案解析器
 */

import { NormalizedDocument, FileType } from '../types';

export async function parseProperties(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const content = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = content.split('\n');
  const properties: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳過註解和空行
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    // 解析 key=value 或 key:value
    const match = trimmed.match(/^([^=:]+)[=:](.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      properties[key] = value;
    }
  }

  // 轉換成 Markdown 格式
  const markdownContent = Object.entries(properties)
    .map(([key, value]) => `**${key}:** ${value}`)
    .join('  \n');

  const title = fileName.replace(/\.[^/.]+$/, '');

  return {
    title,
    content: markdownContent,
    metadata: {
      fileType: FileType.PROPERTIES,
      fileName,
      fileSize: buffer.length,
      processedAt: new Date().toISOString(),
      encoding: 'utf-8'
    }
  };
}
