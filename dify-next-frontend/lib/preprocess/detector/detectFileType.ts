/**
 * 檔案類型偵測模組
 */

import { FileType } from '../types';
import { SERVER_SIDE_FORMATS } from '../config';

/**
 * 根據檔案名稱和 MIME type 偵測檔案類型
 */
export function detectFileType(fileName: string, mimeType?: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase();

  // 優先使用副檔名
  const extensionMap: Record<string, FileType> = {
    'txt': FileType.TXT,
    'md': FileType.MARKDOWN,
    'markdown': FileType.MARKDOWN,
    'mdx': FileType.MDX,
    'pdf': FileType.PDF,
    'html': FileType.HTML,
    'htm': FileType.HTM,
    'docx': FileType.DOCX,
    'xlsx': FileType.XLSX,
    'xls': FileType.XLS,
    'csv': FileType.CSV,
    'vtt': FileType.VTT,
    'properties': FileType.PROPERTIES
  };

  if (ext && extensionMap[ext]) {
    return extensionMap[ext];
  }

  // Fallback to MIME type
  if (mimeType) {
    if (mimeType.includes('pdf')) return FileType.PDF;
    if (mimeType.includes('word') || mimeType.includes('document')) return FileType.DOCX;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileType.XLSX;
    if (mimeType.includes('csv')) return FileType.CSV;
    if (mimeType.includes('html')) return FileType.HTML;
    if (mimeType.includes('markdown')) return FileType.MARKDOWN;
    if (mimeType.includes('text')) return FileType.TXT;
  }

  return FileType.UNKNOWN;
}

/**
 * 檢查是否為支援的檔案類型
 */
export function isSupportedFileType(fileType: FileType): boolean {
  return fileType !== FileType.UNKNOWN;
}

/**
 * 檢查是否需要在 Server-Side 解析
 */
export function requiresServerSideParsing(fileType: FileType): boolean {
  return SERVER_SIDE_FORMATS.includes(fileType);
}

/**
 * 取得檔案類型的友善名稱
 */
export function getFileTypeName(fileType: FileType): string {
  const nameMap: Record<FileType, string> = {
    [FileType.TXT]: 'Text',
    [FileType.MARKDOWN]: 'Markdown',
    [FileType.MDX]: 'MDX',
    [FileType.PDF]: 'PDF',
    [FileType.HTML]: 'HTML',
    [FileType.HTM]: 'HTML',
    [FileType.DOCX]: 'Word Document',
    [FileType.XLSX]: 'Excel Spreadsheet',
    [FileType.XLS]: 'Excel Spreadsheet',
    [FileType.CSV]: 'CSV',
    [FileType.VTT]: 'WebVTT',
    [FileType.PROPERTIES]: 'Properties',
    [FileType.UNKNOWN]: 'Unknown'
  };

  return nameMap[fileType] || 'Unknown';
}
