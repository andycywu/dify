import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'This API endpoint has been deprecated',
    message: '密碼驗證功能已整合至 Wiki.js 系統，不再支援本地驗證',
    redirectTo: process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000',
    deprecated: true,
    timestamp: new Date().toISOString()
  });
}
