import React from 'react';
import { motion } from 'framer-motion';

export function SkeletonChatItem() {
  return (
    <div className="p-3 rounded-xl space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded-full w-24 animate-pulse" />
          <div className="h-2 bg-white/10 rounded-full w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <motion.div
      className="flex gap-3 mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
      <div className="h-10 bg-white/10 rounded-2xl animate-pulse w-1/2" />
    </motion.div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="pb-4 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded-full w-24 animate-pulse" />
          <div className="h-3 bg-white/10 rounded-full w-16 animate-pulse" />
        </div>
      </div>
      <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonChatItem key={i} />
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonMessage key={i} />
      ))}
    </div>
  );
}
