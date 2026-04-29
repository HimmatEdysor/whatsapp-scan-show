import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  messages: Array<{
    id: string;
    sender: string;
    content: string;
    timestamp: string;
  }>;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;
  const { sessionId } = req.query;

  if (!chatId || !sessionId) {
    return res.status(400).json({ error: 'Chat ID and Session ID required' });
  }

  try {
    const wuzApiUrl = process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com';
    const wuzApiKey = process.env.WUZ_API_KEY;

    if (!wuzApiKey) {
      return res.status(500).json({ error: 'Wuz API key not configured' });
    }

    // Call real Wuz API to fetch messages
    const response = await fetch(
      `${wuzApiUrl}/sessions/${sessionId}/chats/${chatId}/messages`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${wuzApiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Wuz API error: ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({ 
      messages: data.messages || [] 
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch messages' 
    });
  }
}
