import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'This API endpoint has been deprecated',
    message: '密碼重設功能已整合至 Wiki.js 系統，請前往 Wiki.js 進行密碼重設',
    redirectTo: process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000',
    deprecated: true,
    timestamp: new Date().toISOString()
  });
}
