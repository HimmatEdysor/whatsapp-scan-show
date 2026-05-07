import type { NextApiRequest, NextApiResponse } from 'next';
import { getContacts } from '@/lib/wuzApi';

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
};

type ResponseData = {
  chats: Chat[];
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

  try {
    const contacts = await getContacts();
    const chats: Chat[] = Object.keys(contacts).map((jid: string) => {
      const c = contacts[jid] || {};
      const isGroup = String(jid).includes('@g.us');
      const number = String(jid).split('@')[0];
      return {
        id: jid,
        name: c.FullName || c.PushName || c.BusinessName || number,
        lastMessage: 'Tap to view messages',
        timestamp: 'Recent',
        unread: 0,
        avatar: isGroup ? '👥' : '👤',
      };
    });
    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(200).json({ chats: [] });
  }
}
