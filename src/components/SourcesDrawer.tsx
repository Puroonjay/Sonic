'use client';

import React from 'react';
import { RetrievedCitation } from '@/src/hooks/useVoiceRAG';
import { sounds } from '@/src/lib/soundEffects';
import {
  X,
  Layers,
  FileText,
  Languages,
  Database,
  CheckCircle2,
  Share2,
  ExternalLink
} from 'lucide-react';

interface SourcesDrawerProps {
  citation: RetrievedCitation | null;
  index: number;
  onClose: () => void;
}

export function SourcesDrawer({ citation, index, onClose }: SourcesDrawerProps) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-bold text-sm font-mono">
                MSMARCO-XI Document #{index + 1}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">LanceDB IVF-PQ Vector Match</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 flex-1 font-mono text-xs text-zinc-300">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-850">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Cosine Distance</span>
              <span className="text-emerald-400 font-bold text-sm">{citation.distance}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Chunk Strategy</span>
              <span className="text-zinc-300 font-semibold text-[11px] truncate block">
                {citation.chunk_strategy}
              </span>
            </div>
          </div>

          {/* Child Chunk */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              50-Word High-Precision Child Chunk:
            </span>
            <div className="bg-emerald-950/20 border border-emerald-800/30 p-3.5 rounded-xl text-emerald-200 leading-relaxed font-sans text-xs">
              "{citation.chunk_text}"
            </div>
          </div>

          {/* Full Parent Passage */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Full Parent MSMARCO-XI Grounding Passage:
            </span>
            <div className="bg-zinc-900/80 border border-zinc-850 p-3.5 rounded-xl text-zinc-300 leading-relaxed font-sans text-xs">
              {citation.parent_passage}
            </div>
          </div>

          {/* Hindi Translation Split */}
          {citation.translated_passage && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                Hindi Translation Split:
              </span>
              <div className="bg-amber-950/15 border border-amber-800/30 p-3.5 rounded-xl text-amber-200 leading-relaxed font-sans text-xs">
                {citation.translated_passage}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Grounded
          </span>
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
