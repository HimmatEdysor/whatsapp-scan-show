import re

with open('pages/api/whatsapp/messages/[chatId].ts', 'r') as f:
    content = f.read()

# Replace CallHistory type
content = re.sub(
    r'type CallHistory = \{[\s\S]*?\};',
    '''type CallHistory = {
  totalCalls: number;
  firstCallTime: string | null;
  lastCallTime: string | null;
  calls: any[];
};''',
    content
)

# Replace raw.map logic
new_map = '''
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
'''
content = re.sub(
    r'const messages: Message\[\] = raw\.map\(\(m: any, idx: number\) => \{[\s\S]*?\}\);',
    new_map,
    content
)

# Add calls to callHistory response
content = content.replace(
    'lastCallTime: lastCallTimestamp !== 0 ? new Date(lastCallTimestamp * 1000).toLocaleTimeString([], { hour: \'2-digit\', minute: \'2-digit\' }) : null,',
    'lastCallTime: lastCallTimestamp !== 0 ? new Date(lastCallTimestamp * 1000).toLocaleTimeString([], { hour: \'2-digit\', minute: \'2-digit\' }) : null,\n      calls,'
)

content = content.replace(
    'callHistory: { totalCalls: 0, firstCallTime: null, lastCallTime: null }',
    'callHistory: { totalCalls: 0, firstCallTime: null, lastCallTime: null, calls: [] }'
)

with open('pages/api/whatsapp/messages/[chatId].ts', 'w') as f:
    f.write(content)
