import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { page = 1, limit = 20 } = req.query

    // 必須使用能列出所有 Dataset 的 Key (Admin Key)
    const apiKey = process.env.DIFY_ADMIN_API_KEY

    if (!apiKey) {
      return res.status(500).json({ message: 'Server configuration error: DIFY_ADMIN_API_KEY is missing' })
    }

    let baseUrl = (process.env.API_URL || process.env.DIFY_API_URL || 'http://api:5001').replace(/\/$/, '')
    if (!baseUrl.endsWith('/v1')) {
      baseUrl += '/v1'
    }

    // 嚴格按照 curl 範例：/v1/datasets
    const url = `${baseUrl}/datasets?page=${page}&limit=${limit}`

    console.log(`[Proxy] GET ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Proxy] Error:', response.status, data)
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[Proxy] Server Error:', error)
    return res.status(500).json({ message: error.message })
  }
}
