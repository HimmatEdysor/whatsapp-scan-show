import type { NextApiRequest, NextApiResponse } from 'next';
import { sendText } from '@/lib/wuzApi';

type ResponseData = {
  success: boolean;
  messageId?: string;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: 'Chat ID and message required' });
  }

  try {
    const messageId = await sendText(String(chatId), String(message));
    return res.status(200).json({
      success: true,
      messageId,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send via OpenWA',
    });
  }
}
