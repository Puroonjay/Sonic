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
  liveTranscript?: string;
  onToggleRecording: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  selectedLanguage: string;
}

export function ChatInputBar({
  onSendMessage,
  isProcessing,
  isRecording,
  audioLevel = 0,
  liveTranscript = '',
  onToggleRecording,
  onStartRecording,
  onStopRecording,
  selectedLanguage,
}: ChatInputBarProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasRecordingRef = useRef<boolean>(false);

  // Sync live real-time speech recognition transcript into the searchbox
  useEffect(() => {
    if (isRecording && liveTranscript) {
      setText(liveTranscript);
    }
  }, [isRecording, liveTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [text]);

  // Instantly clear searchbox when recording stops
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording) {
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

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
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6">
      {/* Main Floating Input Capsule */}
      <div
        className={`w-full rounded-2xl md:rounded-3xl border transition-all duration-300 relative shadow-2xl backdrop-blur-2xl ${
          isRecording
            ? 'bg-zinc-900/95 border-emerald-500/60 shadow-emerald-950/40 ring-4 ring-emerald-500/20 shadow-black/80'
            : 'bg-zinc-900/90 border-zinc-800/90 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-black/60'
        }`}
      >
        <form onSubmit={handleSubmit} className="p-3 md:p-3.5 flex flex-col gap-2">
          {/* Live Recording Ambient Audio Indicator */}
          {isRecording && (
            <div className="flex items-center justify-between bg-zinc-950/70 border border-emerald-500/25 rounded-xl px-3.5 py-2 animate-in fade-in duration-300 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
                </div>
                <span className="text-xs font-sans font-medium text-zinc-200">
                  Listening to your voice...
                </span>
              </div>

              {/* Dynamic Gradient Acoustic Visualizer Wave */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 h-5 px-2.5 py-0.5 bg-emerald-950/50 rounded-full border border-emerald-500/20">
                  {[25, 60, 95, 45, 80, 100, 70, 40, 85, 30].map((baseHeight, idx) => (
                    <div
                      key={idx}
                      className="w-0.5 bg-gradient-to-t from-emerald-400 to-cyan-300 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(20, baseHeight * Math.max(0.25, audioLevel))}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  Auto-sends on pause
                </span>
              </div>
            </div>
          )}

          {/* Textarea Input (Always visible, streams speech in real time) */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? ' Listening... '
                  : isProcessing
                  ? ' Sonic is thinking...'
                  : 'Ask Sonic anything...'
              }
              disabled={isProcessing}
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none resize-none max-h-32 font-sans py-1 leading-relaxed"
            />
          </div>

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

              {/* <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                  Enter ↵
                </kbd>
                <span>to send</span>
              </div> */}
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
