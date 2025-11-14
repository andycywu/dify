import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 清除所有認證相關的 cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token'
    ];

    cookiesToClear.forEach(cookieName => {
      res.setHeader('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
    });

    return res.status(200).json({ 
      message: 'JWT tokens and auth cookies cleared successfully',
      clearedCookies: cookiesToClear
    });
  } catch (error) {
    console.error('Error clearing JWT tokens:', error);
    return res.status(500).json({ error: 'Failed to clear tokens' });
  }
}