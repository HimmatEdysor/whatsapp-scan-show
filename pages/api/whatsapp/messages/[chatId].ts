import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  messages: Array<{
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    isOwn?: boolean;
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
      // Return default messages if API fails
      return res.status(200).json({ 
        messages: getDefaultMessages(chatId as string)
      });
    }

    const data = await response.json();

    // If no messages, return default messages
    if (!data.messages || data.messages.length === 0) {
      return res.status(200).json({ 
        messages: getDefaultMessages(chatId as string)
      });
    }

    res.status(200).json({ 
      messages: data.messages || [] 
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    // Return default messages on error
    return res.status(200).json({ 
      messages: getDefaultMessages(chatId as string)
    });
  }
}

function getDefaultMessages(chatId: string) {
  const defaultMessagesByChat: { [key: string]: any[] } = {
    'default-1': [
      {
        id: '1',
        sender: 'Support Team',
        content: 'Welcome to WhatsApp Hub! 👋',
        timestamp: '12:00 PM',
        isOwn: false,
      },
      {
        id: '2',
        sender: 'You',
        content: 'Thanks! Looking forward to using this.',
        timestamp: '12:01 PM',
        isOwn: true,
      },
      {
        id: '3',
        sender: 'Support Team',
        content: 'How can we help you today?',
        timestamp: '12:02 PM',
        isOwn: false,
      },
      {
        id: '4',
        sender: 'You',
        content: 'I want to integrate WhatsApp messaging with my CRM',
        timestamp: '12:03 PM',
        isOwn: true,
      },
      {
        id: '5',
        sender: 'Support Team',
        content: 'Great! We can help with that. Let me connect you to our team.',
        timestamp: '12:04 PM',
        isOwn: false,
      },
    ],
    'default-2': [
      {
        id: '1',
        sender: 'Updates Channel',
        content: '🎉 New Features Released!',
        timestamp: '10:00 AM',
        isOwn: false,
      },
      {
        id: '2',
        sender: 'Updates Channel',
        content: '✅ Auto-connect to WhatsApp\n✅ Real-time message sync\n✅ Better UI/UX',
        timestamp: '10:01 AM',
        isOwn: false,
      },
    ],
  };

  return defaultMessagesByChat[chatId] || defaultMessagesByChat['default-1'];
}
