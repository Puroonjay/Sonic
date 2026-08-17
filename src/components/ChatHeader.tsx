'use client';

import React from 'react';
import { SonicLogo } from './SonicLogo';
import {
  Menu,
  Volume2,
  VolumeX,
  Globe
} from 'lucide-react';
import { sounds } from '@/src/lib/soundEffects';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  selectedLanguageLabel: string;
  activeModel?: string;
}

function formatModelName(model?: string): string {
  if (!model) return 'Sonic GPT-OSS-20B';
  const lower = model.toLowerCase();
  if (lower.includes('gpt-oss-20b')) return 'Sonic GPT-OSS-20B';
  if (lower.includes('gpt-oss-120b')) return 'Sonic GPT-OSS-120B';
  if (lower.includes('qwen')) return 'Sonic Qwen-3.6-27B';
  if (lower.includes('compound')) return 'Sonic Compound-Mini';
  if (lower.includes('llama-3.3') || lower.includes('70b')) return 'Sonic LLaMA-3.3-70B';
  if (lower.includes('llama-3.1') || lower.includes('llama')) return 'Sonic LLaMA-3.1';
  return model.startsWith('openai/') ? `Sonic ${model.replace('openai/', '')}` : `Sonic ${model}`;
}

export function ChatHeader({
  onToggleSidebar,
  isAudioEnabled,
  onToggleAudio,
  selectedLanguageLabel,
  activeModel,
}: ChatHeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between font-mono text-xs sticky top-0 z-30 shadow-sm">
      {/* Left Area: Sidebar Hamburger & Model Pill */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Model Indicator Pill (Dynamic active engine badge) */}
        <div
          className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-1 shadow-xs transition-all duration-300 hover:border-emerald-500/40"
          title={`Active Engine: ${activeModel || 'openai/gpt-oss-20b'} on Groq LPU`}
        >
          <SonicLogo size={18} glow={false} animated={false} />
          <span className="font-bold text-zinc-200 text-xs tracking-tight">
            {formatModelName(activeModel)}
          </span>
          {/* <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active on Groq LPU" /> */}
        </div>

        <span className="text-zinc-700 hidden md:inline">|</span>

        {/* Language Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{selectedLanguageLabel}</span>
        </div>
      </div>

      {/* Right Controls: Audio Toggle */}
      <div className="flex items-center gap-2">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={() => {
            sounds.playBlip();
            onToggleAudio();
          }}
          className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
            isAudioEnabled
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
          }`}
          title={isAudioEnabled ? 'Mute Speech & SFX' : 'Unmute Speech & SFX'}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px] font-semibold">
            {isAudioEnabled ? 'Voice ON' : 'Muted'}
          </span>
        </button>
      </div>
    </header>
  );
}
