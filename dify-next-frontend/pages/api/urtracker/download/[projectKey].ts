import type { NextApiRequest, NextApiResponse } from 'next';

const REST_TO_SOAP_BASE_URL = process.env.REST_TO_SOAP_BASE_URL || 'http://rest-to-soap-proxy:5001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { projectKey } = req.query;
  const state = (req.query.state as string) || 'all';

  if (!projectKey || typeof projectKey !== 'string') {
    return res.status(400).json({
      success: false,
      error: '缺少專案代號',
      message: '請提供有效的 projectKey (TV, PD, MNT, AVA)'
    });
  }

  try {
    const response = await fetch(
      `${REST_TO_SOAP_BASE_URL}/api/https/download-by-name/${projectKey}?state=${state}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `下載失敗: ${response.statusText}`
      }));

      return res.status(response.status).json({
        success: false,
        error: errorData.error || '下載失敗',
        message: errorData.message
      });
    }

    // 獲取 Excel 文件
    const buffer = await response.arrayBuffer();
    const blob = Buffer.from(buffer);

    // 設置響應頭
    const contentType = response.headers.get('content-type') || 'application/vnd.ms-excel';
    const contentDisposition = response.headers.get('content-disposition') ||
      `attachment; filename="${projectKey}_${state}.xls"`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', blob.length);

    return res.send(blob);
  } catch (error: any) {
    console.error('Urtracker API 錯誤:', error);
    return res.status(500).json({
      success: false,
      error: '內部伺服器錯誤',
      message: error.message || '無法連接到 Urtracker 服務'
    });
  }
}
