// Custom hook for managing inbox state and fetching data

import { useState, useCallback, useEffect } from 'react';

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isActive?: boolean;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  avatar: string;
}

export function useInbox(sessionId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/whatsapp/chats/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch chats');

      const data = await response.json();
      setChats(data.chats || []);
      
      if (data.chats && data.chats.length > 0) {
        setSelectedChat(data.chats[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching chats');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/whatsapp/messages/${chatId}?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching messages');
    }
  }, [sessionId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedChat || !sessionId) return;

      try {
        const response = await fetch('/api/whatsapp/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            chatId: selectedChat.id,
            message: content,
          }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        // Refetch messages
        await fetchMessages(selectedChat.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error sending message');
      }
    },
    [selectedChat, sessionId, fetchMessages]
  );

  // Load chats on mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, fetchMessages]);

  return {
    chats,
    messages,
    selectedChat,
    isLoading,
    error,
    setSelectedChat,
    sendMessage,
    refetchChats: fetchChats,
    refetchMessages: () => selectedChat && fetchMessages(selectedChat.id),
  };
}
