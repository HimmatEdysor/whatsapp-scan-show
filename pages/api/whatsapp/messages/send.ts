import type { NextApiRequest, NextApiResponse } from 'next';

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

  const { sessionId, chatId, message } = req.body;

  if (!sessionId || !chatId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const wuzApiUrl = process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com';
    const wuzApiKey = process.env.WUZ_API_KEY;

    if (!wuzApiKey) {
      return res.status(500).json({ error: 'Wuz API key not configured' });
    }

    // Call real Wuz API to send message
    const response = await fetch(
      `${wuzApiUrl}/sessions/${sessionId}/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wuzApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error(`Wuz API error: ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({ 
      success: true,
      messageId: data.messageId,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    });
  }
}
