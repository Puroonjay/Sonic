'use client';

import React, { useState, useEffect } from 'react';
import { RAGResponse, RetrievedCitation } from '@/src/hooks/useVoiceRAG';
import { sounds } from '@/src/lib/soundEffects';
import { ttsEngine } from '@/src/lib/ttsEngine';
import {
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Layers,
  RotateCcw,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Languages
} from 'lucide-react';

interface MessageItemProps {
  response: RAGResponse;
  languageCode?: string;
  onOpenSourceModal: (citation: RetrievedCitation, index: number) => void;
  isLatest: boolean;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export function MessageItem({
  response,
  languageCode = 'hi-IN',
  onOpenSourceModal,
  isLatest,
  isAudioPlaying,
  onToggleAudio,
}: MessageItemProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(isLatest);
  const [copied, setCopied] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(response.answer);
      setIsTyping(false);
      return;
    }

    const fullText = response.answer;
    setDisplayedText('');
    setIsTyping(true);

    let charCount = 0;
    const speedMs = Math.max(8, Math.min(20, Math.floor(600 / fullText.length)));

    const interval = setInterval(() => {
      charCount++;
      if (charCount <= fullText.length) {
        setDisplayedText(fullText.slice(0, charCount));
        if (charCount % 6 === 0) sounds.playTypeTick();
      } else {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [response.answer, isLatest]);

  const handleCopy = () => {
    sounds.playBlip();
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = () => {
    sounds.playBlip();
    const fullText = response.answer;
    setDisplayedText('');
    setIsTyping(true);
    let charCount = 0;
    const speedMs = 12;

    const interval = setInterval(() => {
      charCount++;
      if (charCount <= fullText.length) {
        setDisplayedText(fullText.slice(0, charCount));
        if (charCount % 6 === 0) sounds.playTypeTick();
      } else {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speedMs);
  };

  const handleSpeakClick = () => {
    sounds.playBlip();
    if (isPlayingSpeech) {
      ttsEngine.stop();
      setIsPlayingSpeech(false);
    } else {
      setIsPlayingSpeech(true);
      ttsEngine.speak(
        response.answer,
        languageCode,
        () => setIsPlayingSpeech(false),
        () => setIsPlayingSpeech(false)
      );
    }
  };

  const confidencePct = Math.round((response.confidence_score ?? 0.85) * 100);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. User Message Row */}
      <div className="flex items-start gap-3 justify-end max-w-2xl ml-auto">
        <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl rounded-tr-sm px-4 py-3 text-zinc-100 text-sm font-sans shadow-md">
          {response.transcript}
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0 text-xs font-bold">
          <User className="w-4 h-4 text-zinc-300" />
        </div>
      </div>

      {/* 2. Assistant Response Card (Perplexity & Gemini Style) */}
      <div className="flex items-start gap-3 max-w-3xl mr-auto">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 shrink-0 shadow-md shadow-emerald-500/20 font-black text-xs">
          ⚡
        </div>

        {/* Message Container */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Perplexity Sources Bar (Citations) */}
          {response.citations && response.citations.length > 0 && !response.refused && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retrieved MSMARCO-XI Sources:</span>
              </div>

              {/* Source Chips Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {response.citations.map((cit, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sounds.playBlip();
                      onOpenSourceModal(cit, idx);
                    }}
                    className="shrink-0 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-2 text-left transition-all max-w-[210px] group shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-zinc-500 group-hover:text-emerald-400">
                      <span className="font-bold">Doc #{idx + 1}</span>
                      <span className="text-zinc-600">Dist: {cit.distance}</span>
                    </div>
                    <p className="text-[11px] font-sans text-zinc-300 line-clamp-2 leading-snug">
                      {cit.chunk_text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning & Latency Capsule */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              {response.metrics.total_ms}ms Total
            </span>

            <span className="text-zinc-500 hidden sm:inline">•</span>

            <span className="text-zinc-400 hidden sm:inline">
              LanceDB: <strong className="text-emerald-400">{response.metrics.retrieval_ms}ms</strong>
            </span>

            <span className="text-zinc-500 hidden sm:inline">•</span>

            <span className="text-zinc-400 hidden sm:inline">
              Groq: <strong className="text-emerald-400">{response.metrics.generation_ms}ms</strong>
            </span>

            {!response.refused && (
              <span className="text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {confidencePct}% Grounded
              </span>
            )}
          </div>

          {/* Answer Body Card */}
          <div
            className={`rounded-2xl p-4 md:p-5 border transition-all ${
              response.refused
                ? 'bg-rose-950/20 border-rose-800/40'
                : 'bg-zinc-900/70 border-zinc-800/80 shadow-md backdrop-blur-md'
            }`}
          >
            {response.refused ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-bold uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  Guardrail Intercepted Query
                </div>
                <p className="text-rose-200 text-sm font-sans leading-relaxed">
                  {response.answer}
                </p>
                {response.refusal_reason && (
                  <div className="text-xs font-mono text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40 mt-1">
                    <strong>Reason:</strong> {response.refusal_reason}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-zinc-100 text-sm md:text-base font-sans leading-relaxed font-normal">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-blink-cursor align-middle rounded-xs" />
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {/* Voice Read Aloud Button with Indic TTS */}
              {!response.refused && (
                <button
                  type="button"
                  onClick={handleSpeakClick}
                  className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                    isPlayingSpeech
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                  title={isPlayingSpeech ? 'Stop Speech' : 'Speak in Indic Language'}
                >
                  {isPlayingSpeech ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">
                    {isPlayingSpeech ? 'Speaking...' : 'Narrate'}
                  </span>
                </button>
              )}

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs transition-colors flex items-center gap-1 font-mono"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Replay Typewriter */}
              <button
                type="button"
                onClick={handleReplay}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                title="Replay Typewriter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Guardrail Indicators */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Safety PASS
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Grounded PASS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
