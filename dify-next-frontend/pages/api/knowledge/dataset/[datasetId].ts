import type { NextApiRequest, NextApiResponse } from 'next'

// Minimal process typing
declare const process: any

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { datasetId } = req.query
  const { method } = req

  if (!datasetId) {
    return res.status(400).json({ message: 'Missing datasetId' })
  }

  const apiKey = process.env.DIFY_ADMIN_API_KEY
  if (!apiKey) {
    return res.status(500).json({ message: 'Server configuration error: DIFY_ADMIN_API_KEY is missing' })
  }

  let baseUrl = (process.env.API_URL || process.env.DIFY_API_URL || 'http://api:5001').replace(/\/$/, '')
  if (!baseUrl.endsWith('/v1')) {
    baseUrl += '/v1'
  }

  const url = `${baseUrl}/datasets/${datasetId}`

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (method === 'PATCH') {
      options.body = JSON.stringify(req.body)
    }

    console.log(`[Proxy] ${method} ${url}`)
    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[Proxy] Server Error:', error)
    return res.status(500).json({ message: error.message })
  }
}
