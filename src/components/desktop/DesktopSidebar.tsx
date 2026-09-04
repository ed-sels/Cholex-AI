import React from 'react';

export default function DesktopSidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5A36] to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            CX
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">Cholex AI Desktop</h1>
            <p className="text-[10px] text-zinc-400">Cholera Prevention & Twi NLP</p>
          </div>
        </div>
        <nav className="space-y-1 pt-2">
          <div className="px-3 py-2 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] text-xs font-bold flex items-center gap-2">
            <span>💬</span> Chat Assistant
          </div>
          <div className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer">
            <span>📊</span> Analytics & Metrics
          </div>
          <div className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer">
            <span>⚙️</span> Model Settings
          </div>
        </nav>
      </div>
      <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 px-2">
        Desktop Workspace v3.2
      </div>
    </aside>
  );
}
