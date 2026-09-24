import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatHistory } from '@/lib/wuzApi';

type Message = {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
};

type CallHistory = {
  totalCalls: number;
  firstCallTime: string | null;
  lastCallTime: string | null;
};

type ResponseData = {
  messages: Message[];
  callHistory?: CallHistory;
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

  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID required' });
  }

  try {
    const raw = await getChatHistory(String(chatId));
    
    let totalCalls = 0;
    let firstCallTimestamp = Infinity;
    let lastCallTimestamp = 0;
    
    const messages: Message[] = raw.map((m: any, idx: number) => {
      // Determine if it's a call event (works for various Baileys/whatsmeow representations)
      const isCall = m.Type === 'call' || m.Type === 'call_log' || m.MessageStubType === 40 || m.MessageStubType === 41 || !!m.Message?.call;
      const ts = Number(m.Timestamp) || 0;
      
      if (isCall) {
        totalCalls++;
        if (ts > 0 && ts < firstCallTimestamp) firstCallTimestamp = ts;
        if (ts > 0 && ts > lastCallTimestamp) lastCallTimestamp = ts;
      }
      
      return {
        id: m.id || m._id || m._serialized || `msg-${idx}`,
        sender: m.IsFromMe ? 'You' : m.Sender || m.From || 'Unknown',
        content: isCall ? '📞 Voice/Video Call' : (m.Body || m.Text || ''),
        timestamp: ts
          ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Now',
        isOwn: Boolean(m.IsFromMe),
      };
    });
    
    const callHistory = {
      totalCalls,
      firstCallTime: firstCallTimestamp !== Infinity ? new Date(firstCallTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      lastCallTime: lastCallTimestamp !== 0 ? new Date(lastCallTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    };
    
    return res.status(200).json({ messages, callHistory });
  } catch {
    return res.status(200).json({ messages: [], callHistory: { totalCalls: 0, firstCallTime: null, lastCallTime: null } });
  }
}
