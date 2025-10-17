import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 只允许 admin/super admin 查询
    // 权限验证请在 middleware 或 session 层处理
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        isSystem: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  }
  if (req.method === 'POST') {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    return res.status(201).json(user);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
