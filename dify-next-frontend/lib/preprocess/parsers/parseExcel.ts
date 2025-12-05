/**
 * Excel 檔案解析器 (XLSX/XLS)
 */

import { NormalizedDocument, FileType, DocumentSection } from '../types';

export async function parseExcel(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const XLSX = require('xlsx');

  try {
    // 讀取 Excel 檔案
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sections: DocumentSection[] = [];

    // 處理每個工作表
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      // 轉換成 JSON
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: ''
      });

      if (rows.length === 0) continue;

      // 轉換成 Markdown 表格格式
      const headers = Object.keys(rows[0]);

      // 組合每一行
      const rowsMarkdown = rows.map((row, index) => {
        const fields = headers
          .map(header => `**${header}:** ${row[header] || '-'}`)
          .join('  \n');

        return `### Row ${index + 1}\n\n${fields}`;
      }).join('\n\n');

      sections.push({
        heading: sheetName,
        content: rowsMarkdown,
        level: 1,
        metadata: {
          sheetName,
          rowCount: rows.length,
          columnCount: headers.length
        }
      });
    }

    const markdownContent = sections
      .map(s => `# ${s.heading}\n\n${s.content}`)
      .join('\n\n---\n\n');

    const title = fileName.replace(/\.[^/.]+$/, '');

    return {
      title,
      content: markdownContent,
      metadata: {
        fileType: FileType.XLSX,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString()
      },
      sections
    };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
