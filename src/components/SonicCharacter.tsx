'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, ShieldAlert, Mic, Radio, Zap } from 'lucide-react';

export type CharacterState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'refusal';

interface SonicCharacterProps {
  state: CharacterState;
  textToSpeak?: string;
  languageCode?: string;
  isAudioPlaying?: boolean;
  onAudioToggle?: () => void;
  subTitle?: string;
}

export function SonicCharacter({
  state,
  textToSpeak,
  languageCode = 'en-IN',
  isAudioPlaying,
  onAudioToggle,
  subTitle,
}: SonicCharacterProps) {
  const [clickCount, setClickCount] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Trigger speech synthesis when requested
  useEffect(() => {
    if (!synthRef.current) return;

    if (state === 'speaking' && textToSpeak && isAudioPlaying) {
      synthRef.current.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Attempt language match
      if (languageCode.startsWith('hi')) {
        utterance.lang = 'hi-IN';
      } else if (languageCode.startsWith('ta')) {
        utterance.lang = 'ta-IN';
      } else if (languageCode.startsWith('te')) {
        utterance.lang = 'te-IN';
      } else if (languageCode.startsWith('mr')) {
        utterance.lang = 'mr-IN';
      } else if (languageCode.startsWith('gu')) {
        utterance.lang = 'gu-IN';
      } else if (languageCode.startsWith('bn')) {
        utterance.lang = 'bn-IN';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      utterance.onstart = () => setSpeechActive(true);
      utterance.onend = () => setSpeechActive(false);
      utterance.onerror = () => setSpeechActive(false);

      synthRef.current.speak(utterance);
    } else {
      synthRef.current.cancel();
      setSpeechActive(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [state, textToSpeak, isAudioPlaying, languageCode]);

  const handleCharacterClick = () => {
    setClickCount((prev) => prev + 1);
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1200);
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return {
          text: 'LISTENING INTENTLY',
          icon: <Mic className="w-3.5 h-3.5 animate-bounce text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        };
      case 'thinking':
        return {
          text: 'RAG NEURAL SEARCH',
          icon: <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />,
          bgColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        };
      case 'speaking':
        return {
          text: 'SYNTHESIZING ANSWER',
          icon: <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        };
      case 'refusal':
        return {
          text: 'GUARDRAIL BLOCKED',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        };
      default:
        return {
          text: 'SONIC COMPANION (ACTIVE)',
          icon: <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
          bgColor: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Dynamic Status Capsule */}
      <div className="flex items-center gap-2 mb-3 z-10">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider border shadow-lg backdrop-blur-md transition-all duration-300 ${status.bgColor}`}
        >
          {status.icon}
          <span>{status.text}</span>
        </div>

        {onAudioToggle && state === 'speaking' && (
          <button
            type="button"
            onClick={onAudioToggle}
            className={`p-1.5 rounded-full border text-xs transition-all ${
              isAudioPlaying
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title={isAudioPlaying ? 'Mute voice narration' : 'Unmute voice narration'}
          >
            {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Main Avatar Canvas Area */}
      <div
        onClick={handleCharacterClick}
        className={`relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center cursor-pointer transition-transform duration-300 ${
          isWaving ? 'scale-105' : 'hover:scale-102'
        }`}
      >
        {/* State Effect Overlays */}
        
        {/* 1. Listening Soundwave Ripples */}
        {state === 'listening' && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-sonic-pulse pointer-events-none" />
            <div
              className="absolute inset-0 rounded-full border border-emerald-400/20 animate-sonic-pulse pointer-events-none"
              style={{ animationDelay: '0.6s' }}
            />
            <div
              className="absolute -inset-6 rounded-full border border-emerald-500/15 animate-sonic-pulse pointer-events-none"
              style={{ animationDelay: '1.2s' }}
            />
          </>
        )}

        {/* 2. Thinking Orbiting Neural Particles */}
        {state === 'thinking' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-cyan-500/30 border-dashed animate-spin duration-1000" />
            <div
              className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-ping"
              style={{ top: '10%', left: '50%' }}
            />
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/80 animate-ping"
              style={{ bottom: '15%', right: '20%', animationDelay: '0.4s' }}
            />
          </div>
        )}

        {/* 3. Guardrail Refusal Forcefield Shield */}
        {state === 'refusal' && (
          <div className="absolute inset-0 rounded-full border-2 border-rose-500/60 bg-rose-500/10 backdrop-blur-xs animate-pulse pointer-events-none shadow-xl shadow-rose-500/20" />
        )}

        {/* Dynamic Hologram Glow Aura */}
        <div
          className={`absolute inset-4 rounded-full blur-2xl transition-all duration-500 -z-10 ${
            state === 'listening'
              ? 'bg-emerald-500/30'
              : state === 'thinking'
              ? 'bg-cyan-500/30'
              : state === 'speaking'
              ? 'bg-amber-500/25'
              : state === 'refusal'
              ? 'bg-rose-500/30'
              : 'bg-emerald-500/15'
          }`}
        />

        {/* Interactive SVG Robot Character */}
        <div
          className={`w-full h-full relative transition-transform duration-300 ${
            state === 'listening'
              ? 'animate-ear-wiggle scale-105'
              : state === 'speaking'
              ? 'animate-float-slow'
              : 'animate-float'
          }`}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-2xl overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Ear Antenna */}
            <g className={`transition-transform duration-300 origin-center ${state === 'listening' ? 'rotate-[-8deg]' : ''}`}>
              <rect x="24" y="80" width="14" height="28" rx="7" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle
                cx="31"
                cy="74"
                r="5"
                fill={state === 'listening' ? '#10b981' : state === 'refusal' ? '#f43f5e' : '#06b6d4'}
                className="animate-pulse"
              />
              <line x1="31" y1="74" x2="31" y2="80" stroke="#71717a" strokeWidth="2" />
            </g>

            {/* Right Ear Antenna */}
            <g className={`transition-transform duration-300 origin-center ${state === 'listening' ? 'rotate-[8deg]' : ''}`}>
              <rect x="162" y="80" width="14" height="28" rx="7" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle
                cx="169"
                cy="74"
                r="5"
                fill={state === 'listening' ? '#10b981' : state === 'refusal' ? '#f43f5e' : '#06b6d4'}
                className="animate-pulse"
              />
              <line x1="169" y1="74" x2="169" y2="80" stroke="#71717a" strokeWidth="2" />
            </g>

            {/* Floating Robot Body / Torso */}
            <path
              d="M72 145 C72 138 128 138 128 145 L136 172 C136 182 64 182 64 172 Z"
              fill="url(#bodyGradient)"
              stroke="#27272a"
              strokeWidth="2"
            />
            {/* Core Reactor on Chest */}
            <circle
              cx="100"
              cy="158"
              r="7"
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
            <circle cx="100" cy="158" r="11" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Main Robot Head Helmet */}
            <rect
              x="36"
              y="42"
              width="128"
              height="100"
              rx="32"
              fill="url(#helmetGradient)"
              stroke="#3f3f46"
              strokeWidth="2.5"
            />

            {/* Top Head Sensor / Crest */}
            <path d="M84 42 C84 32 116 32 116 42 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
            <circle
              cx="100"
              cy="34"
              r="3.5"
              fill={state === 'thinking' ? '#06b6d4' : '#10b981'}
              className="animate-pulse"
            />

            {/* Visor Screen Glass */}
            <rect
              x="46"
              y="56"
              width="108"
              height="72"
              rx="20"
              fill="#09090b"
              stroke="#18181b"
              strokeWidth="2"
            />

            {/* Visor Scanline Sweep Effect - Strictly clipped inside robot visor */}
            {state === 'thinking' && (
              <g clipPath="url(#sonicVisorClip)">
                <line
                  x1="46"
                  y1="60"
                  x2="154"
                  y2="60"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                  className="animate-scanline"
                />
              </g>
            )}

            {/* Visor Gloss Reflection */}
            <path
              d="M52 64 C65 60 135 60 148 64 C140 70 60 70 52 64 Z"
              fill="white"
              fillOpacity="0.06"
            />

            {/* Eyes & Face Expressions */}
            <g className="transition-all duration-300">
              {state === 'listening' ? (
                /* Attentive Large Focused Eyes */
                <>
                  <ellipse cx="74" cy="86" rx="13" ry="15" fill="#10b981" />
                  <ellipse cx="126" cy="86" rx="13" ry="15" fill="#10b981" />
                  <circle cx="77" cy="82" r="4.5" fill="#ffffff" />
                  <circle cx="129" cy="82" r="4.5" fill="#ffffff" />
                  <circle cx="72" cy="90" r="2" fill="#a7f3d0" />
                  <circle cx="124" cy="90" r="2" fill="#a7f3d0" />
                </>
              ) : state === 'thinking' ? (
                /* Scanning Neural Eyes */
                <>
                  <rect x="62" y="82" width="24" height="6" rx="3" fill="#06b6d4" className="animate-pulse" />
                  <rect x="114" y="82" width="24" height="6" rx="3" fill="#06b6d4" className="animate-pulse" />
                  <circle cx="74" cy="85" r="4" fill="#ffffff" />
                  <circle cx="126" cy="85" r="4" fill="#ffffff" />
                </>
              ) : state === 'refusal' ? (
                /* Alert / Surprised Warning Eyes */
                <>
                  <ellipse cx="74" cy="86" rx="10" ry="12" fill="#f43f5e" />
                  <ellipse cx="126" cy="86" rx="10" ry="12" fill="#f43f5e" />
                  <circle cx="74" cy="86" r="4" fill="#ffffff" />
                  <circle cx="126" cy="86" r="4" fill="#ffffff" />
                </>
              ) : state === 'speaking' ? (
                /* Cheerful Speaking Eyes */
                <>
                  <path d="M64 88 C68 80 80 80 84 88" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                  <path d="M116 88 C120 80 132 80 136 88" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                </>
              ) : (
                /* Default Idle Eyes with Blinking */
                <g className="animate-eye-blink origin-center">
                  <ellipse cx="74" cy="86" rx="11" ry="13" fill="#10b981" />
                  <ellipse cx="126" cy="86" rx="11" ry="13" fill="#10b981" />
                  <circle cx="77" cy="83" r="3.5" fill="#ffffff" />
                  <circle cx="129" cy="83" r="3.5" fill="#ffffff" />
                </g>
              )}
            </g>

            {/* Expressive Animated Mouth */}
            <g>
              {state === 'speaking' ? (
                /* Moving Talking Mouth */
                <rect
                  x="86"
                  y="108"
                  width="28"
                  height="12"
                  rx="6"
                  fill="#10b981"
                  className="animate-pulse"
                />
              ) : state === 'listening' ? (
                /* Curious Small 'O' Mouth */
                <circle cx="100" cy="112" r="4" fill="#10b981" />
              ) : state === 'refusal' ? (
                /* Straight Stern Line */
                <line x1="88" y1="112" x2="112" y2="112" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
              ) : (
                /* Friendly Smile */
                <path
                  d="M88 109 C92 115 108 115 112 109"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </g>

            {/* Cheeks Blush */}
            <circle cx="60" cy="104" r="5" fill="#10b981" fillOpacity={state === 'listening' || state === 'speaking' ? '0.35' : '0.15'} />
            <circle cx="140" cy="104" r="5" fill="#10b981" fillOpacity={state === 'listening' || state === 'speaking' ? '0.35' : '0.15'} />

            {/* Gradients & Clip Paths */}
            <defs>
              <clipPath id="sonicVisorClip">
                <rect x="46" y="56" width="108" height="72" rx="20" />
              </clipPath>
              <linearGradient id="helmetGradient" x1="100" y1="42" x2="100" y2="142" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27272a" />
                <stop offset="1" stopColor="#18181b" />
              </linearGradient>
              <linearGradient id="bodyGradient" x1="100" y1="140" x2="100" y2="180" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27272a" />
                <stop offset="1" stopColor="#09090b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Reactive Frequency Visualizer Bars when listening or speaking */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="flex items-center gap-1 mt-2 h-7">
          {[40, 75, 100, 60, 90, 45, 80, 100, 65, 35].map((heightPct, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                state === 'listening' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{
                height: `${Math.max(6, (heightPct * (state === 'listening' ? 0.28 : 0.22)))}px`,
                animation: 'soundwaveBar 0.8s ease-in-out infinite',
                animationDelay: `${idx * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Subtitle / Interactive helper */}
      {subTitle && (
        <p className="text-[11px] font-mono text-zinc-400 mt-2 text-center max-w-xs transition-opacity duration-300">
          {subTitle}
        </p>
      )}
    </div>
  );
}
