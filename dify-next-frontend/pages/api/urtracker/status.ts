import type { NextApiRequest, NextApiResponse } from 'next';

const REST_TO_SOAP_BASE_URL = process.env.REST_TO_SOAP_BASE_URL || 'http://rest-to-soap-proxy:5001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(`${REST_TO_SOAP_BASE_URL}/api/https/status`);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        loggedIn: false,
        message: '無法檢查登入狀態'
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('檢查登入狀態錯誤:', error);
    return res.status(500).json({
      success: false,
      loggedIn: false,
      error: '內部伺服器錯誤',
      message: error.message || '無法連接到 Urtracker 服務'
    });
  }
}
