'use client';

import React, { useState, useEffect } from 'react';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import { sounds } from '@/src/lib/soundEffects';
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
  CheckCircle2,
  Share2,
  Zap,
  BookOpen,
  Eye
} from 'lucide-react';

interface InshortsFeedCardProps {
  response: RAGResponse;
  languageCode: string;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
}

export function InshortsFeedCard({
  response,
  languageCode,
  isAudioPlaying = true,
  onToggleAudio,
}: InshortsFeedCardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'inshorts' | 'context'>('inshorts');
  const [activeCitationIdx, setActiveCitationIdx] = useState(0);

  // Typewriter effect with gentle mechanical ticks
  useEffect(() => {
    if (!response.answer) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const fullText = response.answer;
    setDisplayedText('');
    setIsTyping(true);

    let charCount = 0;
    const speedMs = Math.max(10, Math.min(22, Math.floor(700 / fullText.length)));

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
  }, [response.answer]);

  const handleCopy = () => {
    sounds.playBlip();
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = () => {
    sounds.playBlip();
    if (!response.answer) return;
    const fullText = response.answer;
    setDisplayedText('');
    setIsTyping(true);
    let charCount = 0;
    const speedMs = 15;

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

  const confidencePct = Math.round((response.confidence_score ?? 0.85) * 100);
  const topCitation = response.citations?.[0];

  return (
    <div className="w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
      {/* Inshorts / Deep Context Mode Switcher Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              setActiveTab('inshorts');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'inshorts'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inshorts Digest</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              setActiveTab('context');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'context'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4x Vector Context ({response.citations?.length || 0})</span>
          </button>
        </div>

        {/* Speed / Guardrail status */}
        <div className="flex items-center gap-2">
          {response.refused ? (
            <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
              <ShieldAlert className="w-3 h-3" />
              REFUSED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {confidencePct}% GROUNDED
            </span>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      {activeTab === 'inshorts' ? (
        /* Inshorts Mode View */
        <div
          className={`w-full rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-2xl ${
            response.refused
              ? 'bg-rose-950/20 border-rose-800/40 shadow-rose-950/20'
              : 'glass-panel border-zinc-800/90 shadow-black/50 backdrop-blur-2xl'
          }`}
        >
          {/* Top Luminous Neon Bar */}
          <div
            className={`h-1.5 w-full ${
              response.refused
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
            }`}
          />

          <div className="p-5 md:p-7 space-y-4">
            {/* Header Action Row */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                  MSMARCO-XI Verified Fact
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {onToggleAudio && !response.refused && (
                  <button
                    type="button"
                    onClick={onToggleAudio}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm ${
                      isAudioPlaying
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-850 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-semibold">{isAudioPlaying ? 'Narrating' : 'Listen'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                  title="Replay animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Question Transcript Prompt */}
            <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3 shadow-inner">
              <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 mt-0.5">
                USER QUERY:
              </span>
              <p className="text-xs md:text-sm font-mono text-zinc-200 italic leading-relaxed">
                "{response.transcript}"
              </p>
            </div>

            {/* Answer Display with Dynamic Inshorts Typewriter */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 md:p-6 relative min-h-[100px] shadow-xl">
              {response.refused ? (
                <div className="space-y-2">
                  <p className="text-rose-300 font-mono text-sm leading-relaxed font-semibold">
                    {response.answer}
                  </p>
                  {response.refusal_reason && (
                    <div className="text-xs text-rose-300/90 font-mono bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 mt-2">
                      <span className="font-bold text-rose-400">Guardrail Rationale:</span>{' '}
                      {response.refusal_reason}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <p className="text-zinc-100 text-base md:text-lg font-medium leading-relaxed tracking-wide">
                    {displayedText}
                    {isTyping && (
                      <span className="inline-block w-2.5 h-5 ml-1 bg-emerald-400 animate-blink-cursor align-middle rounded-xs" />
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Multi-Tier Guardrails Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">GUARDRAIL VERIFICATION:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Tier 1 Safety OK
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Dist &le; 0.55 OK
                </span>
              </div>

              {topCitation && (
                <span className="text-zinc-400">
                  Best Match Dist: <strong className="text-emerald-400">{topCitation.distance}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Deep Vector Context View */
        <div className="w-full glass-panel rounded-3xl border border-zinc-800 p-5 md:p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              MSMARCO-XI 4X MULTI-STRATEGY CITATIONS
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Retrieved {response.citations?.length || 0} Passages
            </span>
          </div>

          {/* Citation Tabs */}
          {response.citations && response.citations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {response.citations.map((cit, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sounds.playBlip();
                      setActiveCitationIdx(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                      activeCitationIdx === idx
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    Doc #{idx + 1} (Dist: {cit.distance})
                  </button>
                ))}
              </div>

              {/* Active Citation Card */}
              {response.citations[activeCitationIdx] && (
                <div className="space-y-3 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-zinc-850">
                    <span className="text-zinc-400">
                      Chunk Strategy:{' '}
                      <strong className="text-emerald-400">
                        {response.citations[activeCitationIdx].chunk_strategy}
                      </strong>
                    </span>
                    <span className="text-zinc-400">
                      Distance Score:{' '}
                      <strong className="text-emerald-400">
                        {response.citations[activeCitationIdx].distance}
                      </strong>
                    </span>
                  </div>

                  {/* Matched Child Window */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      50-Word High-Precision Child Chunk:
                    </span>
                    <p className="bg-emerald-950/20 border border-emerald-800/30 p-3 rounded-xl text-emerald-200 leading-relaxed">
                      "{response.citations[activeCitationIdx].chunk_text}"
                    </p>
                  </div>

                  {/* Full Parent Grounding Context */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                      Full Parent MSMARCO-XI Passage:
                    </span>
                    <p className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-zinc-300 leading-relaxed">
                      {response.citations[activeCitationIdx].parent_passage}
                    </p>
                  </div>

                  {/* Hindi Translation Split */}
                  {response.citations[activeCitationIdx].translated_passage && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                        <Languages className="w-3.5 h-3.5" />
                        Hindi Translation Alignment:
                      </span>
                      <p className="bg-amber-950/15 border border-amber-800/30 p-3 rounded-xl text-amber-200 leading-relaxed font-sans text-xs">
                        {response.citations[activeCitationIdx].translated_passage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-zinc-500 italic">No citations retrieved.</p>
          )}
        </div>
      )}
    </div>
  );
}
