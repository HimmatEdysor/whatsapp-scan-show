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
  calls: any[];
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
    
    
    const calls: any[] = [];
    const messages: Message[] = raw.map((m: any, idx: number) => {
      // Determine if it's a call event (works for various Baileys/whatsmeow representations)
      const isCall = m.Type === 'call' || m.Type === 'call_log' || m.MessageStubType === 40 || m.MessageStubType === 41 || !!m.Message?.call;
      const ts = Number(m.Timestamp) || 0;
      
      const tsFormatted = ts
          ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Now';
          
      const dateFormatted = ts
          ? new Date(ts * 1000).toLocaleDateString('en-GB')
          : '';

      const senderStr = m.IsFromMe ? 'You' : m.Sender || m.From || 'Unknown';
      let content = m.Body || m.Text || '';
      
      if (isCall) {
        totalCalls++;
        if (ts > 0 && ts < firstCallTimestamp) firstCallTimestamp = ts;
        if (ts > 0 && ts > lastCallTimestamp) lastCallTimestamp = ts;
        
        let duration = m.Duration || m.Message?.call?.callDuration || m.Message?.callLogMessage?.duration || 0;
        let durationStr = duration > 0 ? `${Math.floor(duration/60)}m ${duration%60}s` : 'Missed/Declined';
        
        calls.push({
          id: m.id || m._id || m._serialized || `call-${idx}`,
          timestamp: ts,
          timeFormatted: tsFormatted,
          dateFormatted: dateFormatted,
          sender: senderStr,
          duration,
          durationStr,
          isOwn: Boolean(m.IsFromMe)
        });
        
        content = `📞 Call: ${dateFormatted}, ${tsFormatted} · ${durationStr}`;
      }
      
      return {
        id: m.id || m._id || m._serialized || `msg-${idx}`,
        sender: senderStr,
        content: isCall ? content : content,
        timestamp: tsFormatted,
        isOwn: Boolean(m.IsFromMe),
      };
    });

    
    const callHistory = {
      totalCalls,
      firstCallTime: firstCallTimestamp !== Infinity ? new Date(firstCallTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      lastCallTime: lastCallTimestamp !== 0 ? new Date(lastCallTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      calls,
    };
    
    // Fire and forget sync to B2B_CRM
    if (calls.length > 0) {
      fetch("http://127.0.0.1:8000/api/webhook/wuz/sync-history-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: String(chatId).replace(/[^0-9]/g, ""),
          calls: calls
        })
      }).catch(err => console.error("Failed to sync calls:", err));
    }

    return res.status(200).json({ messages, callHistory });
  } catch {
    return res.status(200).json({ messages: [], callHistory: { totalCalls: 0, firstCallTime: null, lastCallTime: null, calls: [] } });
  }
}
