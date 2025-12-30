import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 檢查用戶認證
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 檢查角色
    const isAdmin = token.role === 'Administrator';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // 生成臨時認證 token 或使用 session 資訊
    const authToken = Buffer.from(JSON.stringify({
      email: token.email,
      role: token.role,
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 分鐘過期
    })).toString('base64');

    // 重定向到 wiki-batch-importer，帶上認證參數
    const batchImporterUrl = process.env.NEXT_PUBLIC_WIKI_BATCH_IMPORTER_URL || 'http://localhost:5050';
    const redirectUrl = `${batchImporterUrl}?auth=${authToken}`;

    console.log('[wiki-batch-importer] Redirecting to:', redirectUrl);

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('[wiki-batch-importer] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
