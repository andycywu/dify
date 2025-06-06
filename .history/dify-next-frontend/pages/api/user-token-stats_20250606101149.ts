import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  try {
    // 取得全域 token 計費費率
    const record = await prisma.general.findUnique({ where: { key: 'token_billing_rate' } });
    const rate = record ? Number(record.value) : 0.01;
    // 查詢 UserUsage 表，依日期排序
    const usages = await prisma.userUsage.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    // 自動計算 billing，若有異動則同步回存
    const updates = [];
    const dailyUsage = usages.map(u => {
      const calcBilling = Number((u.tokenUsage / 1000 * rate).toFixed(6));
      if (u.billing !== calcBilling) {
        updates.push(prisma.userUsage.update({ where: { id: u.id }, data: { billing: calcBilling } }));
      }
      return {
        date: u.date.toISOString().slice(0, 10),
        tokenUsage: u.tokenUsage,
        billing: calcBilling,
      };
    });
    if (updates.length > 0) await Promise.all(updates);
    return res.status(200).json({ dailyUsage });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch user usage', detail: String(e) });
  }
}
