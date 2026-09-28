import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatHistory } from '@/lib/wuzApi';

type Message = {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
};

type ResponseData =
  | {
      messages: Message[];
    }
  | {
      error: string;
    };

// Note: WhatsApp/whatsmeow does NOT include call events in chat history, so
// calls are handled separately via the webhook (see /api/whatsapp/webhook and
// the Calls tab). This endpoint returns text/media messages only.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;

  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID required' });
  }

  try {
    const raw = await getChatHistory(String(chatId));

    const messages: Message[] = raw.map((m: any, idx: number) => {
      const ts = Number(m.Timestamp) || 0;
      const tsFormatted = ts
        ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Now';

      return {
        id: m.id || m._id || m._serialized || `msg-${idx}`,
        sender: m.IsFromMe ? 'You' : m.Sender || m.From || 'Unknown',
        content: m.Body || m.Text || '',
        timestamp: tsFormatted,
        isOwn: Boolean(m.IsFromMe),
      };
    });

    return res.status(200).json({ messages });
  } catch {
    return res.status(200).json({ messages: [] });
  }
}
