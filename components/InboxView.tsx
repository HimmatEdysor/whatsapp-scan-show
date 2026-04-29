'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Search, Phone, Paperclip, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';

interface InboxViewProps {
  sessionId: string | null;
  onBackToScan: () => void;
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

export default function InboxView({ sessionId, onBackToScan }: InboxViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load chats
    fetchChats();
  }, [sessionId]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      const mockChats: Chat[] = [
        {
          id: '1',
          name: 'John Doe',
          lastMessage: 'Hey! How are you?',
          timestamp: '2 min ago',
          unread: 2,
          avatar: '👨‍💼',
          isActive: true,
        },
        {
          id: '2',
          name: 'Design Team',
          lastMessage: 'UI looks great! 🎨',
          timestamp: '15 min ago',
          unread: 0,
          avatar: '👥',
        },
        {
          id: '3',
          name: 'Mom',
          lastMessage: 'Call me when you can',
          timestamp: '1 hour ago',
          unread: 1,
          avatar: '👩',
        },
        {
          id: '4',
          name: 'Project Manager',
          lastMessage: 'Meeting at 3 PM',
          timestamp: '3 hours ago',
          unread: 0,
          avatar: '👨‍💼',
        },
      ];
      setChats(mockChats);
      setSelectedChat(mockChats[0]);
      fetchMessages(mockChats[0].id);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      // Simulate API call
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: 'John Doe',
          content: 'Hey! How are you doing?',
          timestamp: '10:30 AM',
          isOwn: false,
          avatar: '👨‍💼',
        },
        {
          id: '2',
          sender: 'You',
          content: 'Great! Just finished the project review.',
          timestamp: '10:31 AM',
          isOwn: true,
          avatar: '😊',
        },
        {
          id: '3',
          sender: 'John Doe',
          content: 'Awesome! The team is impressed with the results 🎉',
          timestamp: '10:32 AM',
          isOwn: false,
          avatar: '👨‍💼',
        },
        {
          id: '4',
          sender: 'You',
          content: 'Thanks! Looking forward to the next phase.',
          timestamp: '10:33 AM',
          isOwn: true,
          avatar: '😊',
        },
        {
          id: '5',
          sender: 'John Doe',
          content: 'Let\'s sync tomorrow at 2 PM?',
          timestamp: '10:35 AM',
          isOwn: false,
          avatar: '👨‍💼',
        },
        {
          id: '6',
          sender: 'You',
          content: 'Sure! Works for me. See you then! 👍',
          timestamp: '10:36 AM',
          isOwn: true,
          avatar: '😊',
        },
      ];
      setMessages(mockMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      avatar: '😊',
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    // Simulate API call
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: selectedChat?.name || 'User',
        content: 'Thanks for your message! 😊',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        avatar: selectedChat?.avatar || '👤',
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1000);
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Back Button */}
        <button
          onClick={onBackToScan}
          className="flex items-center gap-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Scan</span>
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

        {/* Chats List */}
        <ChatList
          chats={filteredChats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          isLoading={isLoading}
        />
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
                <p className="text-xs text-green-400">● Active now</p>
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
            <AnimatePresence mode="popLayout">
              {messages.map((message, idx) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  delay={idx * 0.05}
                />
              ))}
            </AnimatePresence>
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
            />
            <motion.button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-4 py-3 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          className="flex-1 glass rounded-3xl p-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto" />
            <p className="text-slate-300">Loading messages...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
