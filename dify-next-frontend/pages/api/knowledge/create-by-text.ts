import type { NextApiRequest, NextApiResponse } from 'next'

// Minimal process typing
declare const process: any

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }



  try {
    const { datasetId, name, text, indexing_technique, process_rule } = req.body

    if (!datasetId || !name || !text) {
      return res.status(400).json({ message: 'Missing required fields: datasetId, name, text' })
    }

    // 優先使用 Admin Key，否則使用 Dataset Key
    const apiKey = process.env.DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_DATASET_KEY

    if (!apiKey) {
      return res.status(500).json({ message: 'Server configuration error: API Key is missing' })
    }

    // 優先使用內部 API URL (http://api:5001)，避免 DNS 問題
    let baseUrl = (process.env.API_URL || process.env.DIFY_API_URL || 'http://api:5001').replace(/\/$/, '')

    // 確保 Base URL 包含 /v1
    if (!baseUrl.endsWith('/v1')) {
      baseUrl += '/v1'
    }

    // 策略調整：由於後端 create_by_text 存在 Bug (Static Method 存取 self)，且我們不修改後端程式碼
    // 因此我們在 Proxy 層將 "文字建立" 請求轉換為 "檔案上傳" 請求，呼叫後端正常的 create-by-file 介面
    const url = `${baseUrl}/datasets/${datasetId}/document/create-by-file`

    console.log(`[Proxy] POST (Redirected to File API) ${url}`)

    const formData = new FormData()

    // 1. 準備 'data' 參數
    const dataPayload = {
      indexing_technique: indexing_technique || 'high_quality',
      process_rule: process_rule || { mode: 'automatic' },
      doc_form: 'text_model',
      doc_language: 'English',
    }
    formData.append('data', JSON.stringify(dataPayload))

    // 2. 準備 'file' 參數 (將文字轉為 Blob)
    const filename = name.endsWith('.txt') ? name : `${name}.txt`
    const fileBlob = new Blob([text], { type: 'text/plain' })
    formData.append('file', fileBlob, filename)

    console.log(`[Proxy] Payload (Converted to FormData):`, JSON.stringify(dataPayload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // fetch 會自動設定 multipart boundary Content-Type
      },
      body: formData,
    })

    const responseText = await response.text()
    console.log(`[Proxy] Response Status: ${response.status}`)
    console.log(`[Proxy] Response Body: ${responseText}`)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('[Proxy] Failed to parse JSON response')
      return res.status(response.status || 500).send(responseText)
    }

    if (!response.ok) {
      console.error('[Proxy] Error:', response.status, data)
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[Proxy] Server Error:', error)
    return res.status(500).json({ message: error.message || 'Internal Server Error' })
  }
}
