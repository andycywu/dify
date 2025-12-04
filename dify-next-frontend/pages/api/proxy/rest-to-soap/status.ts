import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const REST_TO_SOAP_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.get(`${REST_TO_SOAP_URL}/status`, {
      timeout: 5000,
    });
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch REST-to-SOAP status:', error.message);
    return res.status(error.response?.status || 500).json({
      error: 'Failed to fetch status',
      message: error.message,
    });
  }
}
