import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const REST_TO_SOAP_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:5001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.post(`${REST_TO_SOAP_URL}/test`, req.body);
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Failed to test service:', error.message);
    return res.status(error.response?.status || 500).json({
      error: 'Failed to test service',
      message: error.message,
    });
  }
}
