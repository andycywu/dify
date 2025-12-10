import type { NextApiRequest, NextApiResponse } from 'next'

// Minimal process typing to avoid TS errors if @types/node is not present
declare const process: any

type CreateByTextBody = {
  datasetId: string
  name: string
  text: string
  indexing_technique?: 'high_quality' | 'economy' | string
  process_rule?: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const body = req.body as CreateByTextBody
  const { datasetId, name, text, indexing_technique = 'high_quality', process_rule } = body || {}

  if (!datasetId || !name || !text) {
    res.status(400).json({ error: 'Missing required fields: datasetId, name, text' })
    return
  }

  const baseRaw = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || process.env.DIFY_API_URL || 'http://api:5001/v1'
  const base = String(baseRaw).replace(/\/$/, '')
  const adminKey = process.env.DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_DATASET_KEY

  if (!adminKey) {
    res.status(500).json({ error: 'Missing Dify API key in environment' })
    return
  }

  const payload = {
    name,
    text,
    indexing_technique,
    process_rule: process_rule ?? { mode: 'automatic' },
  }

  const candidates = [
    `/datasets/${datasetId}/document/create_by_text`, // official
    `/datasets/${datasetId}/documents/create_by_text`,
    `/datasets/${datasetId}/document/create-by-text`,
    `/datasets/${datasetId}/documents/create-by-text`,
  ]

  let lastStatus = 500
  let lastData: any = { error: 'Unknown error' }

  for (const ep of candidates) {
    try {
      const resp = await fetch(base + ep, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const text = await resp.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = text }
      if (!resp.ok) {
        lastStatus = resp.status
        lastData = data
        // 401/403 不再嘗試
        if (resp.status === 401 || resp.status === 403) break
        // 404/405/500 嘗試下一個變體
        if ([404, 405, 500].includes(resp.status)) continue
        break
      }
      // 成功
      res.status(200).json(data)
      return
    } catch (e: any) {
      lastStatus = 500
      lastData = { error: String(e?.message || e) }
      // 繼續嘗試下一個變體
    }
  }

  res.status(lastStatus).json({ error: 'Failed to create by text', detail: lastData })
}
