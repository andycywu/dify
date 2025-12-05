/**
 * 前處理系統型別定義
 */

// 支援的檔案類型
export enum FileType {
  TXT = 'txt',
  MARKDOWN = 'markdown',
  MDX = 'mdx',
  PDF = 'pdf',
  HTML = 'html',
  HTM = 'htm',
  DOCX = 'docx',
  XLSX = 'xlsx',
  XLS = 'xls',
  CSV = 'csv',
  VTT = 'vtt',
  PROPERTIES = 'properties',
  UNKNOWN = 'unknown'
}

// 文件段落
export interface DocumentSection {
  heading?: string;
  content: string;
  level?: number;
  metadata?: Record<string, any>;
}

// 標準化文件格式
export interface NormalizedDocument {
  title: string;
  content: string;
  metadata: {
    fileType: FileType;
    fileName: string;
    fileSize: number;
    processedAt: string;
    encoding?: string;
  };
  sections?: DocumentSection[];
}

// Markdown Chunk (格式 A)
export interface MarkdownChunk {
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

// 前處理結果
export interface PreprocessResult {
  success: boolean;
  markdown: string;           // 最終 Markdown 輸出
  chunks: MarkdownChunk[];    // 分塊資料
  metadata: {
    originalFileType: FileType;
    chunkCount: number;
    totalCharacters: number;
    processingTimeMs: number;
  };
  error?: string;
}

// Parser 函數型別
export type ParserFunction = (
  buffer: Buffer,
  fileName: string
) => Promise<NormalizedDocument>;

// Chunking 選項
export interface ChunkOptions {
  maxChunkSize?: number;      // 最大字元數（預設 2000）
  separator?: string;          // 分隔符號
  preserveHeadings?: boolean;  // 保留標題結構
}
