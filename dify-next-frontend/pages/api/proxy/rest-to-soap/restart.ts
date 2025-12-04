import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const REST_TO_SOAP_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.post(`${REST_TO_SOAP_URL}/restart`);
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Failed to restart service:', error.message);
    return res.status(error.response?.status || 500).json({
      error: 'Failed to restart service',
      message: error.message,
    });
  }
}
