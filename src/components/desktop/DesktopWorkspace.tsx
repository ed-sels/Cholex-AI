import React from 'react';

export default function DesktopWorkspace() {
  return (
    <div className="flex-1 bg-zinc-950 p-6 flex flex-col h-full overflow-hidden">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex-1 flex flex-col justify-between shadow-xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#FF5A36] uppercase tracking-wider">Dedicated Desktop Workspace View</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono">Wide Screen & Multi-Panel</span>
          </div>
          <h2 className="text-lg font-bold text-white">Cholex AI Healthcare Consultation & NLP Analysis</h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            This dedicated desktop layout provides expanded navigation, multi-column metrics, and rich interactive dashboards for healthcare providers and researchers.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-semibold">Twi Intent Classifier</span>
            <div className="text-sm font-bold text-emerald-400 mt-1">Active (99.4% accuracy)</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-semibold">Vocabulary N-Grams</span>
            <div className="text-sm font-bold text-zinc-100 mt-1">TF-IDF Vectorizer</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-semibold">API Endpoint</span>
            <div className="text-sm font-bold text-[#FF5A36] mt-1">/ml-studio & /api/flask</div>
          </div>
        </div>
      </div>
    </div>
  );
}
