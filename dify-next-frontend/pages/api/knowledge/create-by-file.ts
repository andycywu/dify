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

  const debugEnabled = process.env.DEBUG_PROCESS_RULE === '1'

  const MAX_UPLOAD_FILE_BYTES = 15 * 1024 * 1024

  const form = new IncomingForm({
    maxFileSize: MAX_UPLOAD_FILE_BYTES,
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      const msg = String((err as any)?.message || err)
      const isTooLarge = msg.toLowerCase().includes('maxfilesize') || msg.toLowerCase().includes('max file size')
      if (isTooLarge) {
        console.warn('[Proxy] Upload rejected: file too large', { maxBytes: MAX_UPLOAD_FILE_BYTES })
        return res.status(413).json({ message: '上傳檔案超過 15MB，請先切小一點再上傳。' })
      }

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
             console.log('[Proxy] process_rule received:', {
               mode: dataObj.process_rule?.mode,
               hasRules: !!dataObj.process_rule?.rules,
             })
          }
        } catch (e) {
          console.warn('[Proxy] Failed to parse process_rule', {
            type: typeof fields.process_rule,
            sample: String(Array.isArray(fields.process_rule) ? fields.process_rule[0] : fields.process_rule).slice(0, 200),
          })
        }
      } else {
        console.log('[Proxy] process_rule missing (will rely on dataset latest rule / automatic default)')
      }

      if (fields.indexing_technique) {
         const rawTech = Array.isArray(fields.indexing_technique) ? fields.indexing_technique[0] : fields.indexing_technique
         if (rawTech) {
            dataObj.indexing_technique = rawTech
         }
      }

      // 只有當有內容時才 append 'data'
      if (Object.keys(dataObj).length > 0) {
        if (debugEnabled) {
          console.log('[Proxy][Debug] Upstream data payload keys:', Object.keys(dataObj))
        }
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

      // Optional: verify the actual rule applied to the created document via GET /documents/{id}
      let debug: any | undefined
      try {
        const docId = responseData?.document?.id
        if (docId) {
          const detailUrl = `${baseUrl}/datasets/${datasetId}/documents/${docId}?metadata=without`
          const detailResp = await fetch(detailUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          })

          if (detailResp.ok) {
            const detail = await detailResp.json()
            const mode = detail?.document_process_rule?.mode
            const seg = detail?.document_process_rule?.rules?.segmentation
            console.log('[Proxy] Document process rule confirmed:', {
              documentId: docId,
              mode,
              separator: seg?.separator,
              max_tokens: seg?.max_tokens,
            })
            if (debugEnabled) {
              debug = {
                documentId: docId,
                dataset_process_rule_id: detail?.dataset_process_rule_id,
                document_process_rule: detail?.document_process_rule,
              }
            }
          } else {
            console.warn('[Proxy] Failed to fetch document detail for rule confirmation:', {
              documentId: docId,
              status: detailResp.status,
            })
          }
        }
      } catch (e: any) {
        console.warn('[Proxy] Rule confirmation step failed:', e?.message || e)
      }

      return res.status(200).json(debugEnabled ? { ...responseData, _debug: debug } : responseData)

    } catch (error: any) {
      console.error('[Proxy] Server Error:', error)
      return res.status(500).json({ message: error.message || 'Internal Server Error' })
    }
  })
}
