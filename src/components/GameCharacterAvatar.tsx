'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CharacterState } from './SonicCharacter';
import { sounds } from '@/src/lib/soundEffects';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  Mic,
  Zap,
  Bot,
  Heart,
  Music
} from 'lucide-react';

import { ttsEngine } from '@/src/lib/ttsEngine';

interface GameCharacterAvatarProps {
  state: CharacterState;
  transcript?: string;
  responseAnswer?: string;
  languageCode?: string;
  isAudioPlaying?: boolean;
  onAudioToggle?: () => void;
  onCharacterPoke?: () => void;
}

export function GameCharacterAvatar({
  state,
  transcript,
  responseAnswer,
  languageCode = 'hi-IN',
  isAudioPlaying = true,
  onAudioToggle,
  onCharacterPoke,
}: GameCharacterAvatarProps) {
  // Cursor tracking for interactive gaze
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState(0);
  const [isPetted, setIsPetted] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // SFX triggers on state transitions
  useEffect(() => {
    if (state === 'listening') {
      sounds.playListenStart();
    } else if (state === 'speaking') {
      sounds.playSuccess();
    } else if (state === 'refusal') {
      sounds.playRefusal();
    }
  }, [state]);

  // Mouse cursor tracking: eyes follow the pointer around the screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - charCenterX;
      const dy = e.clientY - charCenterY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 7; // Max eye shift in px

      if (distance > 0) {
        const factor = Math.min(1, distance / 400);
        const offsetX = (dx / distance) * maxOffset * factor;
        const offsetY = (dy / distance) * maxOffset * factor;
        setEyeOffset({ x: offsetX, y: offsetY });
        setHeadTilt((dx / window.innerWidth) * 12);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle petting / clicking Sonic
  const handlePetCharacter = (e: React.MouseEvent) => {
    sounds.playPoke();
    setIsPetted(true);
    if (onCharacterPoke) onCharacterPoke();

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const newHeart = { id: Date.now(), x: clickX, y: clickY };
      setHearts((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1000);
    }

    setTimeout(() => setIsPetted(false), 900);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none py-2"
    >
      {/* Floating Hearts when petted */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute z-50 pointer-events-none text-rose-400 animate-in fade-in zoom-in slide-out-to-top-8 duration-700"
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
        >
          <Heart className="w-6 h-6 fill-rose-500 text-rose-400 drop-shadow-lg animate-bounce" />
        </div>
      ))}

      {/* Dynamic Status Pill with Sound Controls */}
      <div className="flex items-center gap-2 mb-3 z-20">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider border shadow-xl backdrop-blur-md transition-all duration-300 ${
            state === 'listening'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20'
              : state === 'thinking'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20'
              : state === 'speaking'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/20'
              : state === 'refusal'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-rose-500/20'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
          }`}
        >
          {state === 'listening' ? (
            <>
              <Mic className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
              <span>LISTENING (AUDIO DETECTED)</span>
            </>
          ) : state === 'thinking' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>SEARCHING MSMARCO-XI INDEX</span>
            </>
          ) : state === 'speaking' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>SYNTHESIZING ANSWER</span>
            </>
          ) : state === 'refusal' ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>GUARDRAIL RESTRICTION</span>
            </>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>SONIC AI (IDLE & READY)</span>
            </>
          )}
        </div>

        {onAudioToggle && (
          <button
            type="button"
            onClick={onAudioToggle}
            className={`p-1.5 rounded-full border text-xs transition-all shadow-md ${
              isAudioPlaying
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title={isAudioPlaying ? 'Mute SFX & Voice' : 'Unmute SFX & Voice'}
          >
            {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Main Character Stage */}
      <div
        onClick={handlePetCharacter}
        title="Click to interact with Sonic!"
        className={`relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center cursor-pointer transition-transform duration-300 ${
          isPetted ? 'scale-110' : 'hover:scale-105 active:scale-95'
        }`}
      >
        {/* Holographic Radar Waves during Listening */}
        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border-2 border-emerald-400/40 animate-sonic-pulse" />
            <div
              className="w-56 h-56 rounded-full border border-emerald-400/25 animate-sonic-pulse"
              style={{ animationDelay: '0.5s' }}
            />
            <div
              className="w-64 h-64 rounded-full border border-emerald-400/15 animate-sonic-pulse"
              style={{ animationDelay: '1.0s' }}
            />
          </div>
        )}

        {/* Gyroscopic 3D Rings during Thinking */}
        {state === 'thinking' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 rounded-full border border-cyan-400/40 border-dashed animate-spin duration-1000" />
            <div
              className="w-44 h-44 rounded-full border border-emerald-400/40 border-dotted animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '3s' }}
            />
          </div>
        )}

        {/* Hexagonal Shield Barrier during Refusal */}
        {state === 'refusal' && (
          <div className="absolute -inset-2 rounded-3xl border-2 border-rose-500/70 bg-rose-500/10 backdrop-blur-xs animate-pulse pointer-events-none shadow-2xl shadow-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-16 h-16 text-rose-500/30" />
          </div>
        )}

        {/* Dynamic Backlight Halo */}
        <div
          className={`absolute inset-4 rounded-full blur-2xl transition-all duration-700 -z-10 ${
            state === 'listening'
              ? 'bg-emerald-500/40 scale-110'
              : state === 'thinking'
              ? 'bg-cyan-500/40 scale-110'
              : state === 'speaking'
              ? 'bg-amber-500/30 scale-105'
              : state === 'refusal'
              ? 'bg-rose-500/40 scale-110'
              : 'bg-emerald-500/20'
          }`}
        />

        {/* Animated Robot SVG Body */}
        <div
          className={`w-full h-full relative transition-transform duration-300 ${
            state === 'listening'
              ? 'animate-ear-wiggle'
              : state === 'speaking'
              ? 'animate-float-slow'
              : isPetted
              ? 'animate-bounce'
              : 'animate-float'
          }`}
          style={{ transform: `rotate(${headTilt}deg)` }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-2xl overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Robotic Ear / Antenna */}
            <g
              className={`transition-transform duration-300 origin-center ${
                state === 'listening' ? 'rotate-[-12deg]' : isPetted ? 'rotate-[-15deg]' : ''
              }`}
            >
              <rect x="22" y="78" width="16" height="32" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle
                cx="30"
                cy="70"
                r="6"
                fill={
                  state === 'listening'
                    ? '#10b981'
                    : state === 'thinking'
                    ? '#06b6d4'
                    : state === 'refusal'
                    ? '#f43f5e'
                    : '#10b981'
                }
                className="animate-pulse"
              />
              <line x1="30" y1="70" x2="30" y2="78" stroke="#71717a" strokeWidth="2.5" />
            </g>

            {/* Right Robotic Ear / Antenna */}
            <g
              className={`transition-transform duration-300 origin-center ${
                state === 'listening' ? 'rotate-[12deg]' : isPetted ? 'rotate-[15deg]' : ''
              }`}
            >
              <rect x="162" y="78" width="16" height="32" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle
                cx="170"
                cy="70"
                r="6"
                fill={
                  state === 'listening'
                    ? '#10b981'
                    : state === 'thinking'
                    ? '#06b6d4'
                    : state === 'refusal'
                    ? '#f43f5e'
                    : '#10b981'
                }
                className="animate-pulse"
              />
              <line x1="170" y1="70" x2="170" y2="78" stroke="#71717a" strokeWidth="2.5" />
            </g>

            {/* Floating Torso */}
            <path
              d="M70 144 C70 136 130 136 130 144 L138 174 C138 184 62 184 62 174 Z"
              fill="url(#bodyGradient)"
              stroke="#27272a"
              strokeWidth="2.5"
            />
            {/* Chest Arc Reactor */}
            <circle
              cx="100"
              cy="158"
              r="8"
              fill={
                state === 'listening'
                  ? '#10b981'
                  : state === 'thinking'
                  ? '#06b6d4'
                  : state === 'speaking'
                  ? '#f59e0b'
                  : state === 'refusal'
                  ? '#f43f5e'
                  : '#10b981'
              }
              className="animate-pulse"
            />
            <circle cx="100" cy="158" r="12" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Main Robot Helmet */}
            <rect
              x="36"
              y="40"
              width="128"
              height="102"
              rx="34"
              fill="url(#helmetGradient)"
              stroke="#3f3f46"
              strokeWidth="2.5"
            />

            {/* Top Crown Crest */}
            <path d="M82 40 C82 30 118 30 118 40 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
            <circle
              cx="100"
              cy="33"
              r="4"
              fill={state === 'thinking' ? '#06b6d4' : '#10b981'}
              className="animate-pulse"
            />

            {/* Gloss Visor Screen */}
            <rect
              x="46"
              y="54"
              width="108"
              height="74"
              rx="22"
              fill="#09090b"
              stroke="#18181b"
              strokeWidth="2"
            />

            {/* Scanline Sweep in Visor */}
            {state === 'thinking' && (
              <line
                x1="46"
                y1="58"
                x2="154"
                y2="58"
                stroke="#06b6d4"
                strokeWidth="2.5"
                opacity="0.9"
                className="animate-scanline"
              />
            )}

            {/* Visor Glare Curve */}
            <path
              d="M54 62 C68 58 132 58 146 62 C138 68 62 68 54 62 Z"
              fill="white"
              fillOpacity="0.07"
            />

            {/* Expressive Dynamic LED Eyes with Cursor Follow Tracking */}
            <g
              style={{
                transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              {state === 'listening' ? (
                /* Attentive Large Focused Eyes */
                <>
                  <ellipse cx="74" cy="85" rx="14" ry="16" fill="#10b981" />
                  <ellipse cx="126" cy="85" rx="14" ry="16" fill="#10b981" />
                  <circle cx="77" cy="81" r="5" fill="#ffffff" />
                  <circle cx="129" cy="81" r="5" fill="#ffffff" />
                  <circle cx="71" cy="89" r="2.5" fill="#a7f3d0" />
                  <circle cx="123" cy="89" r="2.5" fill="#a7f3d0" />
                </>
              ) : state === 'thinking' ? (
                /* Scanning Cyber Visor Eyes */
                <>
                  <rect x="60" y="82" width="26" height="6" rx="3" fill="#06b6d4" className="animate-pulse" />
                  <rect x="114" y="82" width="26" height="6" rx="3" fill="#06b6d4" className="animate-pulse" />
                  <circle cx="73" cy="85" r="4" fill="#ffffff" />
                  <circle cx="127" cy="85" r="4" fill="#ffffff" />
                </>
              ) : state === 'refusal' ? (
                /* Alert Warning Eyes */
                <>
                  <ellipse cx="74" cy="85" rx="11" ry="13" fill="#f43f5e" />
                  <ellipse cx="126" cy="85" rx="11" ry="13" fill="#f43f5e" />
                  <circle cx="74" cy="85" r="4.5" fill="#ffffff" />
                  <circle cx="126" cy="85" r="4.5" fill="#ffffff" />
                </>
              ) : state === 'speaking' || isPetted ? (
                /* Joyful / Happy Cheerful Eyes */
                <>
                  <path d="M62 88 C67 78 81 78 86 88" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M114 88 C119 78 133 78 138 88" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
                </>
              ) : (
                /* Normal Idle Eyes with Blinking */
                <g className="animate-eye-blink origin-center">
                  <ellipse cx="74" cy="85" rx="12" ry="14" fill="#10b981" />
                  <ellipse cx="126" cy="85" rx="12" ry="14" fill="#10b981" />
                  <circle cx="77" cy="81" r="4" fill="#ffffff" />
                  <circle cx="129" cy="81" r="4" fill="#ffffff" />
                </g>
              )}
            </g>

            {/* Expressive Animated Mouth */}
            <g>
              {state === 'speaking' ? (
                <rect
                  x="86"
                  y="107"
                  width="28"
                  height="14"
                  rx="7"
                  fill="#10b981"
                  className="animate-pulse"
                />
              ) : state === 'listening' ? (
                <circle cx="100" cy="111" r="4.5" fill="#10b981" />
              ) : state === 'refusal' ? (
                <line x1="88" y1="111" x2="112" y2="111" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
              ) : (
                <path
                  d="M86 108 C92 116 108 116 114 108"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}
            </g>

            {/* Cheeks Blush Aura */}
            <circle cx="58" cy="103" r="6" fill="#10b981" fillOpacity={state === 'listening' || state === 'speaking' || isPetted ? '0.4' : '0.15'} />
            <circle cx="142" cy="103" r="6" fill="#10b981" fillOpacity={state === 'listening' || state === 'speaking' || isPetted ? '0.4' : '0.15'} />

            {/* Gradients */}
            <defs>
              <linearGradient id="helmetGradient" x1="100" y1="40" x2="100" y2="142" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27272a" />
                <stop offset="1" stopColor="#18181b" />
              </linearGradient>
              <linearGradient id="bodyGradient" x1="100" y1="144" x2="100" y2="184" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27272a" />
                <stop offset="1" stopColor="#09090b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Real-time Frequency Visualizer Sound Waves */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="flex items-center gap-1 mt-2 h-7">
          {[45, 80, 100, 65, 90, 50, 85, 100, 70, 40].map((heightPct, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                state === 'listening' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 shadow-sm shadow-amber-400'
              }`}
              style={{
                height: `${Math.max(6, heightPct * 0.26)}px`,
                animation: 'soundwaveBar 0.7s ease-in-out infinite',
                animationDelay: `${idx * 0.07}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
