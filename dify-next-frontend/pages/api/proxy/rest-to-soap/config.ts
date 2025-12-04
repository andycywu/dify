import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const REST_TO_SOAP_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const response = await axios.get(`${REST_TO_SOAP_URL}/config`);
      return res.status(200).json(response.data);
    } else if (req.method === 'PUT') {
      const response = await axios.put(`${REST_TO_SOAP_URL}/config`, req.body);
      return res.status(200).json(response.data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Failed to handle config request:', error.message);
    return res.status(error.response?.status || 500).json({
      error: 'Failed to handle config request',
      message: error.message,
    });
  }
}
