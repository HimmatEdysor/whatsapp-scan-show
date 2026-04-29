// Type definitions for the application

export interface User {
  id: string;
  name: string;
  avatar: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  avatar: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size: number;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isActive?: boolean;
  lastMessageTime?: number;
}

export interface Session {
  id: string;
  qrCode: string;
  isConnected: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface QRCodeResponse {
  sessionId: string;
  qrCode: string;
  expiresIn: number;
}

export interface SessionStatusResponse {
  sessionId: string;
  isConnected: boolean;
  status: 'waiting' | 'connected' | 'expired';
}

export interface MessageResponse {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface SendMessageRequest {
  sessionId: string;
  chatId: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  timestamp: string;
}

export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
