/**
 * 前處理系統統一導出
 */

// 型別
export * from './types';

// 配置
export * from './config';

// 檔案偵測
export * from './detector/detectFileType';

// Parser
export * from './parsers';

// Chunker
export * from './chunker/chunkMarkdown';

// 主要前處理函數
import { detectFileType, isSupportedFileType } from './detector/detectFileType';
import { parseFile } from './parsers';
import { chunkMarkdown, chunksToMarkdown } from './chunker/chunkMarkdown';
import { PreprocessResult, FileType } from './types';

/**
 * 完整前處理流程
 *
 * @param buffer 檔案 buffer
 * @param fileName 檔案名稱
 * @param mimeType MIME type (optional)
 * @returns PreprocessResult
 */
export async function preprocessFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<PreprocessResult> {
  const startTime = Date.now();

  try {
    // 1. 偵測檔案類型
    const fileType = detectFileType(fileName, mimeType);

    if (!isSupportedFileType(fileType)) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // 2. 解析檔案
    const normalizedDoc = await parseFile(buffer, fileType, fileName);

    // 3. Chunk 成 Markdown
    const chunks = chunkMarkdown(normalizedDoc, {
      maxChunkSize: 2000,
      preserveHeadings: true
    });

    // 4. 轉換成最終 Markdown string
    const markdown = chunksToMarkdown(chunks);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      markdown,
      chunks,
      metadata: {
        originalFileType: fileType,
        chunkCount: chunks.length,
        totalCharacters: markdown.length,
        processingTimeMs: processingTime
      }
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      markdown: '',
      chunks: [],
      metadata: {
        originalFileType: FileType.UNKNOWN,
        chunkCount: 0,
        totalCharacters: 0,
        processingTimeMs: processingTime
      },
      error: error instanceof Error ? error.message : 'Unknown preprocessing error'
    };
  }
}
