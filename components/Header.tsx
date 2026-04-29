import React from 'react';
import { MessageCircle, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">WhatsApp Hub</h1>
              <p className="text-sm text-slate-400">Scan & Manage Messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <Zap className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-green-300 font-medium">Live Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
