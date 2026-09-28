import React from 'react';
import { motion } from 'framer-motion';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Phone, Loader2 } from 'lucide-react';

export interface CallItem {
  id: string;
  callId: string;
  waId: string;
  name?: string;
  direction: 'inbound' | 'outbound';
  status: 'missed' | 'rejected' | 'accepted' | 'ringing' | 'ended';
  isVideo: boolean;
  timestamp: number;
  durationSeconds: number;
}

interface CallListProps {
  calls: CallItem[];
  isLoading: boolean;
}

function formatWhen(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-GB')}, ${time}`;
}

function statusLabel(call: CallItem): { text: string; className: string } {
  const isMissed = call.status === 'missed' || call.status === 'rejected';
  if (isMissed) {
    return {
      text: call.direction === 'inbound' ? 'Missed' : call.status === 'rejected' ? 'Declined' : 'No answer',
      className: 'text-red-400',
    };
  }
  if (call.status === 'ringing') {
    return { text: 'Ringing…', className: 'text-yellow-400' };
  }
  return {
    text: call.direction === 'inbound' ? 'Incoming' : 'Outgoing',
    className: 'text-slate-400',
  };
}

function CallIcon({ call }: { call: CallItem }) {
  const isMissed = call.status === 'missed' || call.status === 'rejected';
  const cls = 'w-4 h-4';
  if (isMissed) return <PhoneMissed className={`${cls} text-red-400`} />;
  if (call.direction === 'inbound') return <PhoneIncoming className={`${cls} text-green-400`} />;
  return <PhoneOutgoing className={`${cls} text-blue-400`} />;
}

export default function CallList({ calls, isLoading }: CallListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <Phone className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No calls yet</p>
          <p className="text-xs text-slate-500">
            WhatsApp does not sync past calls. New voice/video calls will appear here
            once they happen while connected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
      {calls.map((call, idx) => {
        const label = statusLabel(call);
        return (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">
              {call.isVideo ? <Video className="w-5 h-5 text-slate-200" /> : '👤'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {call.name || call.waId || 'Unknown'}
              </p>
              <div className="flex items-center gap-1.5">
                <CallIcon call={call} />
                <span className={`text-xs ${label.className}`}>{label.text}</span>
                {call.isVideo && <span className="text-[10px] text-slate-500">· Video</span>}
                {call.durationSeconds > 0 && (
                  <span className="text-[10px] text-slate-500">
                    ·{' '}
                    {call.durationSeconds < 60
                      ? `${call.durationSeconds}s`
                      : `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-slate-500 shrink-0">{formatWhen(call.timestamp)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
