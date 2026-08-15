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
}

export function ChatHeader({
  onToggleSidebar,
  isAudioEnabled,
  onToggleAudio,
  selectedLanguageLabel,
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

        {/* Model Selector Pill (ChatGPT/Perplexity Style - Static clean badge) */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-1 shadow-xs">
          <SonicLogo size={18} glow={false} animated={false} />
          <span className="font-bold text-zinc-200 text-xs">Sonic LLaMA-3.1</span>
          <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
            (Sub-200ms)
          </span>
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
