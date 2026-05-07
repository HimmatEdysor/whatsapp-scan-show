'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Search, Phone, Paperclip, Loader2, MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';

interface InboxViewProps {
  sessionId: string | null;
  onDisconnect: () => void;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  avatar: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isActive?: boolean;
}

export default function InboxView({ sessionId, onDisconnect }: InboxViewProps) {
  const CHAT_PAGE_SIZE = 50;
  const [chats, setChats] = useState<Chat[]>([]);
  const [visibleChatsCount, setVisibleChatsCount] = useState(CHAT_PAGE_SIZE);
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [lastSeenAt, setLastSeenAt] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchChats();
      // Auto-refresh chats every 30 seconds
      const interval = setInterval(() => fetchChats(), 30000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // All users are inactive by default.
    const wsUrl = process.env.NEXT_PUBLIC_REVERB_WS_URL;
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Optional handshake/subscription payload for Reverb channels.
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `presence.whatsapp.${sessionId}`,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Expected payload example:
        // { type: "presence.update", userId: "chat-id-or-jid", isOnline: true }
        if (payload?.type === 'presence.update' && payload?.userId) {
          const now = Date.now();
          setLastSeenAt((prev) => ({ ...prev, [payload.userId]: now }));
          setOnlineUsers((prev) => ({
            ...prev,
            [payload.userId]: Boolean(payload.isOnline),
          }));
        }
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  useEffect(() => {
    // Re-check live status every 10s.
    // If no heartbeat in last 10s, mark user offline.
    const interval = setInterval(() => {
      const now = Date.now();
      setOnlineUsers((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((userId) => {
          const seenAt = lastSeenAt[userId] || 0;
          next[userId] = now - seenAt <= 10000;
        });
        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [lastSeenAt]);

  const fetchChats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/whatsapp/chats?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load chats');
      }
      
      const realChats = (data.chats || []).map((c: any) => ({
        ...c,
        avatar: c.avatar || '👤',
      }));
      
      setChats(realChats);
      setVisibleChatsCount(CHAT_PAGE_SIZE);
      setOnlineUsers((prev) => {
        // Default all loaded users to inactive unless already online.
        const next = { ...prev };
        realChats.forEach((chat: Chat) => {
          if (next[chat.id] === undefined) {
            next[chat.id] = false;
          }
        });
        return next;
      });
      
      if (realChats.length > 0 && !selectedChat) {
        setSelectedChat(realChats[0]);
        fetchMessages(realChats[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load WhatsApp chats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/whatsapp/messages/${encodeURIComponent(chatId)}?sessionId=${sessionId}`);
      const data = await response.json();
      
      const realMessages = (data.messages || []).map((m: any) => ({
        ...m,
        avatar: m.isOwn ? '😊' : '👤',
      }));
      
      setMessages(realMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat || isSending) return;

    const messageText = messageInput;
    setMessageInput('');
    setIsSending(true);

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'You',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      avatar: '😊',
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/whatsapp/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          chatId: selectedChat.id,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Refresh messages from server
      setTimeout(() => fetchMessages(selectedChat.id), 1000);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = useMemo(
    () => chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [chats, searchQuery],
  );

  const visibleChats = useMemo(
    () => filteredChats.slice(0, visibleChatsCount),
    [filteredChats, visibleChatsCount],
  );

  const hasMoreChats = visibleChats.length < filteredChats.length;

  const loadMoreChats = () => {
    if (!hasMoreChats || isLoadingMoreChats) return;
    setIsLoadingMoreChats(true);
    setVisibleChatsCount((prev) => prev + CHAT_PAGE_SIZE);
    // Lightweight async feel for smooth UI.
    setTimeout(() => setIsLoadingMoreChats(false), 120);
  };

  const handleChatListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const distanceToTop = target.scrollTop;

    // Load more near bottom OR top (user asked scroll up behavior).
    if (distanceToBottom < 120 || distanceToTop < 120) {
      loadMoreChats();
    }
  };

  useEffect(() => {
    // When chat opens or new messages arrive, jump to last message.
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selectedChat?.id, messages.length, isLoadingMessages]);

  return (
    <motion.div
      className="h-screen max-h-[calc(100vh-120px)] flex gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Sidebar */}
      <motion.div
        className="w-96 glass rounded-3xl p-4 flex flex-col overflow-hidden"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Disconnect Button */}
        <button
          onClick={onDisconnect}
          className="flex items-center gap-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Disconnect WhatsApp</span>
        </button>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-200 text-xs">{error}</p>
          </div>
        )}

        {/* Chats List */}
        {chats.length === 0 && !isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3 px-6">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No chats yet</p>
              <p className="text-xs text-slate-500">
                Send or receive a message on your WhatsApp to see it here
              </p>
            </div>
          </div>
        ) : (
          <ChatList
            chats={visibleChats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            isLoading={isLoading}
            onlineUsers={onlineUsers}
            hasMore={hasMoreChats}
            isLoadingMore={isLoadingMoreChats}
            onListScroll={handleChatListScroll}
          />
        )}
      </motion.div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <motion.div
          className="flex-1 glass rounded-3xl p-6 flex flex-col overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedChat.avatar}</span>
              <div>
                <h3 className="font-bold text-lg text-white">{selectedChat.name}</h3>
                <p className={onlineUsers[selectedChat.id] ? 'text-xs text-green-400' : 'text-xs text-slate-400'}>
                  ● {onlineUsers[selectedChat.id] ? 'Active' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <MessageCircle className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-xs text-slate-500">Send a message to start the conversation</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, idx) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    delay={idx * 0.02}
                  />
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <button
              type="button"
              className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500/50"
              disabled={isSending}
            />
            <motion.button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className="px-4 py-3 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          className="flex-1 glass rounded-3xl p-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto" />
              <p className="text-slate-300">Loading your WhatsApp chats...</p>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="w-16 h-16 text-slate-600 mx-auto" />
              <h3 className="text-xl font-bold text-white">Select a chat to view messages</h3>
              <p className="text-slate-400 text-sm">
                Your real WhatsApp chats appear in the sidebar.
                {chats.length === 0 && ' Once you receive or send a message, it will appear here.'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
