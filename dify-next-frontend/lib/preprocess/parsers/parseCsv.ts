/**
 * CSV 檔案解析器
 */

import { NormalizedDocument, FileType, DocumentSection } from '../types';

export async function parseCsv(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const csvParse = require('csv-parse/sync');

  let content = buffer.toString('utf-8');

  try {
    // 使用 csv-parse 解析
    const records = csvParse.parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });

    // 轉換成 Markdown 格式
    const sections: DocumentSection[] = records.map((row: any, index: number) => {
      const rowContent = Object.entries(row)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('  \n');

      return {
        heading: `Row ${index + 1}`,
        content: rowContent,
        level: 2,
        metadata: { rowIndex: index }
      };
    });

    const markdownContent = sections
      .map(s => `## ${s.heading}\n\n${s.content}`)
      .join('\n\n');

    const title = fileName.replace(/\.[^/.]+$/, '');

    return {
      title,
      content: markdownContent,
      metadata: {
        fileType: FileType.CSV,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString(),
        encoding: 'utf-8'
      },
      sections
    };
  } catch (error) {
    console.error('CSV parsing error:', error);
    // Fallback: 當作純文字
    return {
      title: fileName.replace(/\.[^/.]+$/, ''),
      content: content.trim(),
      metadata: {
        fileType: FileType.CSV,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString(),
        encoding: 'utf-8'
      }
    };
  }
}
