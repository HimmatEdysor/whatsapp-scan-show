import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isActive?: boolean;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  isLoading: boolean;
}

export default function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  isLoading,
}: ChatListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <MessageCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No chats found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
      <AnimatePresence>
        {chats.map((chat, idx) => (
          <motion.button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full p-3 rounded-xl transition-all text-left ${
              selectedChat?.id === chat.id
                ? 'bg-gradient-to-r from-green-400/30 to-emerald-600/30 border border-green-500/50'
                : 'hover:bg-white/10 border border-transparent'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl pt-1">{chat.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white truncate">{chat.name}</h4>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{chat.unread}</span>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
