import React from 'react';

export default function MobileHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-zinc-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs">
          CX
        </div>
        <div>
          <h2 className="text-xs font-bold">Cholex AI Mobile</h2>
          <p className="text-[10px] text-zinc-400">Asante Twi & English Health Bot</p>
        </div>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono">Live</span>
    </div>
  );
}
