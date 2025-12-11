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

    // 嚴格按照 curl 範例：/v1/datasets/{dataset_id}/document/create-by-text
    // 注意：這裡是單數 document 和連字號 create-by-text
    const url = `${baseUrl}/datasets/${datasetId}/document/create-by-text`

    console.log(`[Proxy] POST ${url}`)

    const body: any = {
      name,
      text,
      indexing_technique: indexing_technique || 'high_quality',
      process_rule: process_rule || { mode: 'automatic' },
      doc_form: 'text_model',
      doc_language: 'English',
    }

    console.log(`[Proxy] Payload:`, JSON.stringify(body, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
