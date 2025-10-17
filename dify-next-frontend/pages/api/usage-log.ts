import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId, tokenUsage } = req.body;

  if (!userId || typeof tokenUsage !== 'number') {
    return res.status(400).json({ error: 'Missing userId or tokenUsage' });
  }

  // 以今日日期為 key，累加 tokenUsage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const usage = await prisma.userUsage.upsert({
      where: { userId_date: { userId, date: today } },
      update: { tokenUsage: { increment: tokenUsage } },
      create: { userId, date: today, tokenUsage },
    });

    // 注意:User 表沒有 tokenUsage 欄位,使用量已記錄在 UserUsage 表中
    return res.status(200).json({ success: true, usage });
  } catch (e) {
    console.error('Error logging usage:', e);
    return res.status(500).json({ error: 'Failed to log usage' });
  }
}
