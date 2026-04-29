import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  chats: Array<{
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
    avatar?: string;
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

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    const wuzApiUrl = process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com';
    const wuzApiKey = process.env.WUZ_API_KEY;

    if (!wuzApiKey) {
      return res.status(500).json({ error: 'Wuz API key not configured' });
    }

    // Call real Wuz API to fetch chats
    const response = await fetch(`${wuzApiUrl}/sessions/${sessionId}/chats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${wuzApiKey}`,
      },
    });

    if (!response.ok) {
      // Return default/sample data if API fails or no chats yet
      return res.status(200).json({ 
        chats: [
          {
            id: 'default-1',
            name: 'Support Team',
            lastMessage: 'Welcome! How can we help you today?',
            timestamp: 'now',
            unread: 0,
            avatar: '👥',
          },
          {
            id: 'default-2',
            name: 'Updates Channel',
            lastMessage: 'Latest features are now available 🎉',
            timestamp: '5 min ago',
            unread: 1,
            avatar: '📢',
          },
          {
            id: 'default-3',
            name: 'Notifications',
            lastMessage: 'Your message was sent successfully ✓',
            timestamp: '1 hour ago',
            unread: 0,
            avatar: '🔔',
          },
        ]
      });
    }

    const data = await response.json();

    // If no chats, return default data
    if (!data.chats || data.chats.length === 0) {
      return res.status(200).json({ 
        chats: [
          {
            id: 'default-1',
            name: 'Support Team',
            lastMessage: 'Welcome! How can we help you today?',
            timestamp: 'now',
            unread: 0,
            avatar: '👥',
          },
          {
            id: 'default-2',
            name: 'Updates Channel',
            lastMessage: 'Latest features are now available 🎉',
            timestamp: '5 min ago',
            unread: 1,
            avatar: '📢',
          },
        ]
      });
    }

    res.status(200).json({ 
      chats: data.chats 
    });
  } catch (error) {
    console.error('Chats fetch error:', error);
    // Return default data on error
    return res.status(200).json({ 
      chats: [
        {
          id: 'default-1',
          name: 'Support Team',
          lastMessage: 'Welcome! How can we help you today?',
          timestamp: 'now',
          unread: 0,
          avatar: '👥',
        },
        {
          id: 'default-2',
          name: 'Updates Channel',
          lastMessage: 'Latest features are now available 🎉',
          timestamp: '5 min ago',
          unread: 1,
          avatar: '📢',
        },
      ]
    });
  }
}
