'use client';

import React from 'react';
import {
  Plus,
  MessageSquare,
  Sparkles,
  Database,
  Layers,
  Cpu,
  Zap,
  ChevronLeft,
  ChevronRight,
  Languages,
  ShieldCheck,
  Terminal,
  Activity,
  Award
} from 'lucide-react';
import { sounds } from '@/src/lib/soundEffects';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  languages: Array<{ code: string; label: string }>;
  history: Array<{ transcript: string; timestamp: string }>;
  onSelectHistoryItem: (transcript: string) => void;
  onNewChat: () => void;
  activeChatCount: number;
}

export function Sidebar({
  isOpen,
  onToggle,
  selectedLanguage,
  onSelectLanguage,
  languages,
  history,
  onSelectHistoryItem,
  onNewChat,
  activeChatCount,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-zinc-950/95 lg:bg-zinc-950/70 border-r border-zinc-850 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
          isOpen ? 'w-72' : 'w-0 lg:w-16'
        } overflow-hidden`}
      >
        {/* Top Header & New Chat */}
        <div className="p-3.5 space-y-4">
          {/* Brand Logo & Toggle */}
          <div className="flex items-center justify-between">
            {isOpen ? (
              <div className="flex items-center gap-2.5 px-1.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20 font-black text-sm">
                  ⚡
                </div>
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                    <span>SonicRAG</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v2.0
                    </span>
                  </h1>
                  <p className="text-[10px] text-zinc-500 font-mono">Sub-200ms Indic Voice AI</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-black text-sm shadow-md shadow-emerald-500/20">
                ⚡
              </div>
            )}

            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors hidden lg:flex"
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* New Chat Button (ChatGPT / Perplexity Style) */}
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onNewChat();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition-all shadow-sm group cursor-pointer ${
              !isOpen ? 'lg:px-0' : ''
            }`}
            title="Start New Query"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
            {isOpen && <span className="font-mono font-semibold">New Session</span>}
          </button>

          {/* Language Selector Pill in Sidebar */}
          {isOpen && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-1">
                Spoken / Output Language
              </label>
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-2.5 py-1.5 shadow-inner">
                <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    sounds.playBlip();
                    onSelectLanguage(e.target.value);
                  }}
                  className="bg-transparent text-zinc-200 text-xs font-mono focus:outline-none cursor-pointer w-full"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-900 text-zinc-200">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Chat History Feed */}
          {isOpen && (
            <div className="space-y-1 pt-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Recent Queries ({history.length})</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {history.length === 0 ? (
                  <p className="text-[11px] font-mono text-zinc-600 px-2 py-3 italic">
                    No past queries yet. Ask Sonic or hold mic!
                  </p>
                ) : (
                  history.slice(0, 8).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sounds.playBlip();
                        onSelectHistoryItem(item.transcript);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 text-xs font-mono truncate transition-colors flex items-center gap-2 group"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 shrink-0" />
                      <span className="truncate">{item.transcript}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom System & Team Capsule */}
        <div className="p-3.5 border-t border-zinc-850/80 space-y-2.5 bg-zinc-950/60">
          {isOpen ? (
            <>
              {/* Architecture badges */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">MSMARCO-XI</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Groq LPUs</span>
                </div>
              </div>

              {/* Team Capsule */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                    WH
                  </div>
                  <div>
                    <div className="text-zinc-200 font-bold text-[11px]">WeHustlers</div>
                    <div className="text-zinc-500 text-[9px]">HH Goa Shortlisting</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                WH
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
