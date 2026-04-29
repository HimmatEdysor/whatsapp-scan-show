import React from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  avatar: string;
}

interface MessageBubbleProps {
  message: Message;
  delay?: number;
}

export default function MessageBubble({ message, delay = 0 }: MessageBubbleProps) {
  return (
    <motion.div
      className={`flex gap-3 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      layout
    >
      {!message.isOwn && (
        <div className="flex-shrink-0 text-2xl">{message.avatar}</div>
      )}
      
      <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'}`}>
        <motion.div
          className={`max-w-xs px-4 py-3 rounded-2xl ${
            message.isOwn
              ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-br-none'
              : 'bg-white/10 border border-white/20 text-slate-100 rounded-bl-none'
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm font-medium">{message.content}</p>
        </motion.div>
        <span className="text-xs text-slate-400 mt-1 px-2">{message.timestamp}</span>
      </div>

      {message.isOwn && (
        <div className="flex-shrink-0 text-2xl">{message.avatar}</div>
      )}
    </motion.div>
  );
}
