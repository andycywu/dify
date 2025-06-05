import type { NextApiRequest, NextApiResponse } from 'next';

// Example OpenAI rate (can be updated via POST)
let openAIRate = {
  model: 'gpt-3.5-turbo',
  pricePer1KToken: 0.0015, // USD per 1K tokens
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return current rate
    return res.status(200).json(openAIRate);
  }
  if (req.method === 'POST') {
    // Update rate
    const { model, pricePer1KToken } = req.body;
    if (!model || typeof pricePer1KToken !== 'number') {
      return res.status(400).json({ error: 'model and pricePer1KToken required' });
    }
    openAIRate = { model, pricePer1KToken };
    return res.status(200).json(openAIRate);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
