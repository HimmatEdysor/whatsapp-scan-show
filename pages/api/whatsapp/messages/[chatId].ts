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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;

  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID required' });
  }

  try {
    // In production, this would fetch messages from the Wuz API
    const messages = [
      {
        id: '1',
        sender: 'John Doe',
        content: 'Hey! How are you doing?',
        timestamp: '10:30 AM',
      },
      {
        id: '2',
        sender: 'You',
        content: 'Great! Just finished the project review.',
        timestamp: '10:31 AM',
      },
    ];

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
