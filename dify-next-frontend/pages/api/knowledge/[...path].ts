import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// Minimal process typing
declare const process: any

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust as needed
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query

  if (!path || !Array.isArray(path)) {
    res.status(400).json({ error: 'Invalid path' })
    return
  }

  // Reconstruct the path (e.g., ['datasets', '123'] -> '/datasets/123')
  const endpoint = '/' + path.join('/')

  // Determine upstream base URL
  let baseRaw = process.env.API_URL || process.env.DIFY_API_URL || process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://api:5001/v1'
  if (baseRaw.includes(':5001') && !baseRaw.endsWith('/v1') && !baseRaw.endsWith('/console/api')) {
    baseRaw = `${baseRaw}/v1`
  }
  const upstreamBase = String(baseRaw).replace(/\/$/, '')

  const url = `${upstreamBase}${endpoint}`

  // Determine API Key
  const adminKey = process.env.DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_DATASET_KEY

  if (!adminKey) {
    res.status(500).json({ error: 'Missing Dify API key in environment' })
    return
  }

  console.log(`[KnowledgeProxy] ${req.method} ${url}`)

  // Remove 'path' from query parameters
  const { path: _path, ...queryParams } = req.query

  try {
    const response = await axios({
      method: req.method,
      url: url,
      headers: {
        'Authorization': `Bearer ${adminKey}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      data: req.body,
      params: queryParams,
    })

    res.status(response.status).json(response.data)
  } catch (error: any) {
    console.error(`[KnowledgeProxy] Error calling ${url}:`, error.message)
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}
