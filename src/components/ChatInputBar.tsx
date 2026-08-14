'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Layers,
  Zap,
  ArrowUp,
  Globe,
  Radio,
  Volume2
} from 'lucide-react';
import { sounds } from '@/src/lib/soundEffects';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  isRecording: boolean;
  audioLevel?: number;
  onToggleRecording: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  sampleQueries: Array<{ label: string; text: string }>;
  selectedLanguage: string;
}

export function ChatInputBar({
  onSendMessage,
  isProcessing,
  isRecording,
  audioLevel = 0,
  onToggleRecording,
  onStartRecording,
  onStopRecording,
  sampleQueries,
  selectedLanguage,
}: ChatInputBarProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing) return;
    sounds.playBlip();
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicClick = () => {
    sounds.playBlip();
    onToggleRecording();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6 space-y-3">
      {/* Quick Suggestion Pills above the input */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar justify-start md:justify-center">
        {sampleQueries.slice(0, 4).map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              sounds.playBlip();
              onSendMessage(item.text);
            }}
            disabled={isProcessing}
            className="shrink-0 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 text-[11px] font-mono px-3 py-1 rounded-full transition-all shadow-xs hover:border-emerald-500/40 cursor-pointer disabled:opacity-40"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Floating Input Capsule */}
      <div
        className={`w-full rounded-2xl md:rounded-3xl border transition-all duration-300 relative shadow-2xl backdrop-blur-2xl ${
          isRecording
            ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/40 ring-4 ring-rose-500/20'
            : 'bg-zinc-900/90 border-zinc-800/90 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-black/60'
        }`}
      >
        <form onSubmit={handleSubmit} className="p-3 md:p-3.5 flex flex-col gap-2">
          {/* Live Recording Soundwave Bar (Shows inside input when recording) */}
          {isRecording && (
            <div className="flex items-center justify-between bg-rose-950/60 border border-rose-800/40 rounded-xl px-3 py-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-mono font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>LISTENING TO YOUR VOICE... (CLICK MIC TO STOP & SUBMIT)</span>
              </div>

              {/* Dynamic Audio Level Meter */}
              <div className="flex items-center gap-1 h-5">
                {[20, 50, 90, 40, 80, 100, 60, 30].map((baseHeight, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, baseHeight * Math.max(0.3, audioLevel))}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Textarea Input */}
          {!isRecording && (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isProcessing
                    ? '⚡ Sonic is retrieving from MSMARCO-XI & synthesizing...'
                    : 'Ask Sonic anything, or click the mic button to speak in 10+ Indic languages...'
                }
                disabled={isProcessing}
                className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none resize-none max-h-32 font-sans py-1 leading-relaxed"
              />
            </div>
          )}

          {/* Bottom Dock Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs font-mono">
            <div className="flex items-center gap-2">
              {/* Voice Query Toggle / Push Button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none shadow-md ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/50 ring-2 ring-white/30'
                    : 'bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white border border-zinc-700'
                }`}
                title={isRecording ? 'Click to stop and send' : 'Click to start voice recording'}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 animate-bounce" />
                    <span>Stop & Send</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voice Query</span>
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                  Enter ↵
                </kbd>
                <span>to send</span>
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!text.trim() || isProcessing}
              className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-zinc-950 flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
              title="Send Query"
            >
              {isProcessing ? (
                <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <ArrowUp className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
