/**
 * 文件前處理 API Route
 *
 * POST /api/documents/preprocess
 *
 * 接收上傳的檔案，執行前處理（解析 + chunking），回傳 Markdown
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs/promises';
import { preprocessFile } from '../../../lib/preprocess';
import { PreprocessResult } from '../../../lib/preprocess/types';

// 禁用預設 body parser
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreprocessResult | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 使用 formidable 解析 multipart/form-data
    const form = formidable({
      maxFileSize: 15 * 1024 * 1024, // 15MB
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // 取得上傳的檔案
    const fileArray = files.file;
    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!uploadedFile) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please upload a file using the "file" field name'
      });
    }

    // 讀取檔案內容
    const buffer = await fs.readFile(uploadedFile.filepath);
    const fileName = uploadedFile.originalFilename || 'unknown';
    const mimeType = uploadedFile.mimetype || undefined;

    console.log(`[Preprocess] Processing file: ${fileName} (${buffer.length} bytes)`);

    // 執行前處理
    const result = await preprocessFile(buffer, fileName, mimeType);

    // 清理暫存檔
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (unlinkError) {
      console.warn('Failed to delete temp file:', unlinkError);
    }

    if (!result.success) {
      console.error('[Preprocess] Failed:', result.error);
      return res.status(500).json({
        error: 'Preprocessing failed',
        details: result.error
      });
    }

    console.log(`[Preprocess] Success: ${result.metadata.chunkCount} chunks, ${result.metadata.processingTimeMs}ms`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('[Preprocess] Unexpected error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error during preprocessing'
    });
  }
}
