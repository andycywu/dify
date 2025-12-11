import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm, File as FormidableFile } from 'formidable'
import fs from 'fs'
// Node 20 has global FormData and Blob.

export const config = {
  api: {
    bodyParser: false, // 必須關閉以處理 multipart/form-data
  },
}

// Minimal process typing
declare const process: any

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const form = new IncomingForm()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(500).json({ message: 'Error parsing form data' })
    }

    try {
      const datasetId = Array.isArray(fields.datasetId) ? fields.datasetId[0] : fields.datasetId
      if (!datasetId) {
        return res.status(400).json({ message: 'Missing datasetId' })
      }

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
      if (!uploadedFile) {
        return res.status(400).json({ message: 'Missing file' })
      }

      // 優先使用 Admin Key
      const apiKey = process.env.DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_DATASET_KEY

      if (!apiKey) {
        return res.status(500).json({ message: 'Server configuration error: API Key is missing' })
      }

      let baseUrl = (process.env.API_URL || process.env.DIFY_API_URL || 'http://api:5001').replace(/\/$/, '')
      if (!baseUrl.endsWith('/v1')) {
        baseUrl += '/v1'
      }

      // 嚴格按照 curl 範例：/v1/datasets/{dataset_id}/document/create-by-file
      // 注意：這裡是單數 document 和連字號 create-by-file
      const url = `${baseUrl}/datasets/${datasetId}/document/create-by-file`

      console.log(`[Proxy] POST File to ${url}`)

      // 建構 FormData
      const upstreamFormData = new FormData()

      // 1. 準備 'data' 欄位 (JSON String)
      const dataObj: any = {}

      if (fields.process_rule) {
        try {
          const rawRule = Array.isArray(fields.process_rule) ? fields.process_rule[0] : fields.process_rule
          if (rawRule) {
             dataObj.process_rule = JSON.parse(rawRule)
          }
        } catch (e) {
          console.warn('Failed to parse process_rule')
        }
      }

      if (fields.indexing_technique) {
         const rawTech = Array.isArray(fields.indexing_technique) ? fields.indexing_technique[0] : fields.indexing_technique
         if (rawTech) {
            dataObj.indexing_technique = rawTech
         }
      }

      // 只有當有內容時才 append 'data'
      if (Object.keys(dataObj).length > 0) {
        upstreamFormData.append('data', JSON.stringify(dataObj))
      }

      // 2. 準備 'file' 欄位
      const fileBuffer = fs.readFileSync(uploadedFile.filepath)
      const fileBlob = new Blob([fileBuffer], { type: uploadedFile.mimetype || 'application/octet-stream' })

      // 使用 as any 繞過 TS 類型檢查 (Node FormData vs DOM FormData)
      upstreamFormData.append('file', fileBlob as any, uploadedFile.originalFilename || 'upload.txt')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          // fetch 會自動設定 multipart boundary Content-Type
        },
        body: upstreamFormData,
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('[Proxy] Upstream Error:', response.status, responseData)
        return res.status(response.status).json(responseData)
      }

      return res.status(200).json(responseData)

    } catch (error: any) {
      console.error('[Proxy] Server Error:', error)
      return res.status(500).json({ message: error.message || 'Internal Server Error' })
    }
  })
}
