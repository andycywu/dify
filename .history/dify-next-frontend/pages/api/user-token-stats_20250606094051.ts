import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  try {
    // 查詢 UserUsage 表，依日期排序
    const usages = await prisma.userUsage.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    // 回傳格式: [{ date, tokenUsage, billing }]
    const dailyUsage = usages.map(u => ({
      date: u.date.toISOString().slice(0, 10),
      tokenUsage: u.tokenUsage,
      billing: u.billing,
    }));
    return res.status(200).json({ dailyUsage });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch user usage', detail: String(e) });
  }
}
