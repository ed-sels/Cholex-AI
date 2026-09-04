import React from 'react';

export default function MobileChatView() {
  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 p-4 rounded-3xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <span className="text-xs font-bold text-[#FF5A36] uppercase tracking-wider">Mobile View Layout</span>
        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">iOS / Android Optimized</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center font-bold">
            📱
          </div>
          <p className="text-xs font-semibold text-zinc-300">Dedicated Mobile View Component</p>
          <p className="text-[11px] text-zinc-500 max-w-xs">Optimized touch targets, bottom navigation, and compact chat layout.</p>
        </div>
      </div>
    </div>
  );
}
