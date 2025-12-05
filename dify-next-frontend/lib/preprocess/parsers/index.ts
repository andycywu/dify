/**
 * Parser Router
 * 根據檔案類型路由到對應的 parser
 */

import { FileType, NormalizedDocument, ParserFunction } from '../types';
import { parseTxt } from './parseTxt';
import { parseMarkdown } from './parseMarkdown';
import { parseCsv } from './parseCsv';
import { parseExcel } from './parseExcel';
import { parseDocx } from './parseDocx';
import { parsePdf } from './parsePdf';
import { parseHtml } from './parseHtml';
import { parseVtt } from './parseVtt';
import { parseProperties } from './parseProperties';

/**
 * 根據檔案類型解析檔案
 */
export async function parseFile(
  buffer: Buffer,
  fileType: FileType,
  fileName: string
): Promise<NormalizedDocument> {
  const parserMap: Record<FileType, ParserFunction> = {
    [FileType.TXT]: parseTxt,
    [FileType.MARKDOWN]: parseMarkdown,
    [FileType.MDX]: parseMarkdown,  // MDX 當作 Markdown 處理
    [FileType.CSV]: parseCsv,
    [FileType.XLSX]: parseExcel,
    [FileType.XLS]: parseExcel,
    [FileType.DOCX]: parseDocx,
    [FileType.PDF]: parsePdf,
    [FileType.HTML]: parseHtml,
    [FileType.HTM]: parseHtml,
    [FileType.VTT]: parseVtt,
    [FileType.PROPERTIES]: parseProperties,
    [FileType.UNKNOWN]: parseTxt  // Fallback
  };

  const parser = parserMap[fileType];

  if (!parser) {
    throw new Error(`No parser available for file type: ${fileType}`);
  }

  try {
    return await parser(buffer, fileName);
  } catch (error) {
    console.error(`Parser error for ${fileType}:`, error);

    // Fallback: 嘗試當作純文字處理
    if (fileType !== FileType.TXT) {
      console.warn(`Falling back to text parser for ${fileName}`);
      return await parseTxt(buffer, fileName);
    }

    throw error;
  }
}

// 導出所有 parsers
export {
  parseTxt,
  parseMarkdown,
  parseCsv,
  parseExcel,
  parseDocx,
  parsePdf,
  parseHtml,
  parseVtt,
  parseProperties
};
