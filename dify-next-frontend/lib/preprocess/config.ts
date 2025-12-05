/**
 * 前處理系統配置
 */

import { FileType } from './types';

// 支援的檔案格式列表
export const SUPPORTED_FILE_TYPES = [
  'txt', 'markdown', 'mdx', 'md', 'pdf', 'html', 'htm',
  'xlsx', 'xls', 'docx', 'csv', 'vtt', 'properties'
];

// 檔案大小限制（15MB）
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

// MIME Type 對應表
export const MIME_TYPE_MAP: Record<string, string> = {
  'txt': 'text/plain',
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  'mdx': 'text/markdown',
  'pdf': 'application/pdf',
  'html': 'text/html',
  'htm': 'text/html',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'csv': 'text/csv',
  'vtt': 'text/vtt',
  'properties': 'text/plain'
};

// 需要 Server-Side 處理的格式
export const SERVER_SIDE_FORMATS = [
  FileType.PDF,
  FileType.DOCX,
  FileType.XLSX,
  FileType.XLS
];

// Chunking 預設設定
export const DEFAULT_CHUNK_OPTIONS = {
  maxChunkSize: 2000,
  separator: '\n\n---\n\n',
  preserveHeadings: true
};

// 前處理超時時間（毫秒）
export const PREPROCESSING_TIMEOUT = 30000; // 30 秒
