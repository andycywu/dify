import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 只回傳一個全域費率
    const record = await prisma.general.findUnique({ where: { key: 'token_billing_rate' } });
    return res.status(200).json({ rate: record ? Number(record.value) : 0.01 });
  }
  if (req.method === 'POST') {
    const { rate } = req.body;
    if (typeof rate !== 'number' || isNaN(rate)) return res.status(400).json({ error: 'Invalid rate' });
    await prisma.general.upsert({
      where: { key: 'token_billing_rate' },
      update: { value: String(rate) },
      create: { key: 'token_billing_rate', value: String(rate) },
    });
    return res.status(200).json({ success: true });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
