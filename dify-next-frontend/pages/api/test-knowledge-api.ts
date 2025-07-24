import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
    const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;

    if (!ADMIN_API_KEY || !API_BASE_URL) {
      return res.status(500).json({ 
        message: 'Missing API configuration',
        config: {
          hasApiKey: !!ADMIN_API_KEY,
          hasBaseUrl: !!API_BASE_URL
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        message: `API request failed: ${response.statusText}`,
        status: response.status
      });
    }

    const data = await response.json();
    res.status(200).json({
      message: 'API connection successful',
      data: data,
      config: {
        apiKey: ADMIN_API_KEY.substring(0, 10) + '...',
        baseUrl: API_BASE_URL
      }
    });

  } catch (error) {
    console.error('API test failed:', error);
    res.status(500).json({ 
      message: 'API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
