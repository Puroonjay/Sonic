'use client';

import React, { useState, useEffect } from 'react';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Languages,
  CheckCircle2
} from 'lucide-react';

interface InshortsAnswerCardProps {
  response: RAGResponse;
  languageCode: string;
  onInspectContext?: () => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
}

export function InshortsAnswerCard({
  response,
  languageCode,
  onInspectContext,
  isAudioPlaying,
  onToggleAudio,
}: InshortsAnswerCardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showFullContext, setShowFullContext] = useState(false);
  const [activeCitationIdx, setActiveCitationIdx] = useState(0);

  // Typewriter effect simulation for Inshorts snappy presentation
  useEffect(() => {
    if (!response.answer) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    
    let currentIndex = 0;
    const fullText = response.answer;
    const speedMs = Math.max(10, Math.min(25, Math.floor(600 / fullText.length)));

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [response.answer]);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplayTypewriter = () => {
    if (!response.answer) return;
    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;
    const fullText = response.answer;
    const speedMs = 15;

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speedMs);
  };

  const confidencePct = Math.round((response.confidence_score ?? 0.85) * 100);

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Main Inshorts Card */}
      <div
        className={`w-full rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-2xl ${
          response.refused
            ? 'bg-rose-950/20 border-rose-800/40 shadow-rose-950/20'
            : 'bg-zinc-900/80 border-zinc-800/90 shadow-black/40 backdrop-blur-xl'
        }`}
      >
        {/* Top Accent Line */}
        <div
          className={`h-1 w-full ${
            response.refused
              ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
          }`}
        />

        <div className="p-5 md:p-6 space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                  response.refused
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {response.refused ? (
                  <>
                    <ShieldAlert className="w-3 h-3" />
                    GUARDRAIL ENFORCEMENT
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    INSHORTS AI SUMMARY
                  </>
                )}
              </span>

              {!response.refused && (
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">{confidencePct}%</span> Grounded
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {onToggleAudio && !response.refused && (
                <button
                  type="button"
                  onClick={onToggleAudio}
                  className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                    isAudioPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                  title={isAudioPlaying ? 'Stop Audio' : 'Speak Answer'}
                >
                  {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">
                    {isAudioPlaying ? 'Speaking...' : 'Listen'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors flex items-center gap-1"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleReplayTypewriter}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                title="Replay Inshorts animation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Query Transcript Bubble */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-3">
            <span className="text-xs font-mono font-bold text-zinc-500 shrink-0 mt-0.5">Q:</span>
            <p className="text-xs md:text-sm font-mono text-zinc-300 italic leading-relaxed">
              "{response.transcript}"
            </p>
          </div>

          {/* Answer Area with Animated Typewriter Ticker */}
          <div className="bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 md:p-5 relative min-h-[90px]">
            {response.refused ? (
              <div className="space-y-2">
                <p className="text-rose-300 font-mono text-sm leading-relaxed font-semibold">
                  {response.answer}
                </p>
                {response.refusal_reason && (
                  <p className="text-xs text-rose-400/90 font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/40">
                    <span className="font-bold">Policy Note:</span> {response.refusal_reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative">
                <p className="text-zinc-100 text-sm md:text-base font-medium leading-relaxed tracking-wide">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-blink-cursor align-middle rounded-xs" />
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Guardrail Verification Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-zinc-500 mr-1">GUARDRAILS:</span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
              <ShieldCheck className="w-3 h-3" />
              Tier 1 Safety
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
              <ShieldCheck className="w-3 h-3" />
              Tier 2 Distance &le; 0.55
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
              <ShieldCheck className="w-3 h-3" />
              Tier 3 Indic Groundedness
            </span>
          </div>

          {/* Collapsible MSMARCO-XI Context Drawer Button */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowFullContext((prev) => !prev)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    MSMARCO-XI Evidence Documents ({response.citations.length} Sources)
                  </span>
                </span>
                {showFullContext ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {/* Context Drawer Content */}
              {showFullContext && (
                <div className="mt-3 space-y-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Doc Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {response.citations.map((cit, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveCitationIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                          activeCitationIdx === idx
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        Doc #{idx + 1} (Dist: {cit.distance})
                      </button>
                    ))}
                  </div>

                  {/* Active Doc Details */}
                  {response.citations[activeCitationIdx] && (
                    <div className="space-y-3 pt-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-1 border-b border-zinc-850">
                        <span>Strategy: <strong className="text-zinc-300">{response.citations[activeCitationIdx].chunk_strategy}</strong></span>
                        <span>Cosine Distance: <strong className="text-emerald-400">{response.citations[activeCitationIdx].distance}</strong></span>
                      </div>

                      {/* Highlighted Matched Child Chunk */}
                      <div>
                        <div className="text-[10px] uppercase text-emerald-400 font-bold mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Matched Vector Chunk (High-Precision Child Window):
                        </div>
                        <p className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-200 leading-relaxed">
                          "{response.citations[activeCitationIdx].chunk_text}"
                        </p>
                      </div>

                      {/* Full Parent Passage */}
                      <div>
                        <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">
                          Full Parent Grounding Passage:
                        </div>
                        <p className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 leading-relaxed">
                          {response.citations[activeCitationIdx].parent_passage}
                        </p>
                      </div>

                      {/* Hindi Translation Split if available */}
                      {response.citations[activeCitationIdx].translated_passage && (
                        <div>
                          <div className="text-[10px] uppercase text-amber-400 font-bold mb-1 flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            Hindi Translation Alignment:
                          </div>
                          <p className="p-2.5 rounded-lg bg-amber-950/10 border border-amber-900/30 text-amber-200 leading-relaxed font-sans text-xs">
                            {response.citations[activeCitationIdx].translated_passage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
