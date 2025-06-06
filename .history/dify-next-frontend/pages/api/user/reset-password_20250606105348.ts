import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  // 查找用戶
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  // 重設密碼為 dify12345
  const newPassword = 'dify12345';
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  // 寄送 email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '密碼已重設 Password Reset',
      text: `您的密碼已重設為 dify12345，請盡快登入後修改密碼。\nYour password has been reset to dify12345. Please login and change it as soon as possible.`,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Password reset, but failed to send email', detail: String(e) });
  }
  return res.status(200).json({ success: true });
}
