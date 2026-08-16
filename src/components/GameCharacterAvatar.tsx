'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterState } from './SonicCharacter';
import { sounds } from '@/src/lib/soundEffects';
import {
  Sparkles,
  ShieldAlert,
  Mic,
  Heart,
  Music,
  Zap,
  RefreshCw
} from 'lucide-react';

type ActionMode =
  | 'idle'
  | 'spin'
  | 'dance'
  | 'hyper'
  | 'wink'
  | 'curious'
  | 'love'
  | 'matrix'
  | 'tickle';

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'star' | 'music' | 'bolt' | 'spark' | 'ring';
  color: string;
}

interface GameCharacterAvatarProps {
  state: CharacterState;
  transcript?: string;
  responseAnswer?: string;
  languageCode?: string;
  isAudioPlaying?: boolean;
  onAudioToggle?: () => void;
  onCharacterPoke?: () => void;
  onTriggerQuery?: (query: string) => void;
  onStartVoice?: () => void;
}

const SAMPLE_INTERACTIVE_QUERIES: Record<string, string[]> = {
  'hi-IN': [
    'भारत की राजधानी क्या है?',
    'निगम क्या है और यह कैसे काम करता है?',
    'पौधों में प्रकाश संश्लेषण कैसे होता है?',
    'उच्च रक्तचाप के मुख्य लक्षण क्या हैं?'
  ],
  'en-IN': [
    'what is a corporation?',
    'what is the capital of india',
    'how does photosynthesis work in plants',
    'symptoms of malaria and dengue fever'
  ],
  'gu-IN': [
    'ભારતની રાજધાની કઈ છે?',
    'સૂર્યપ્રકાશમાંથી વીજળી કેવી રીતે બને છે?'
  ],
  'mr-IN': [
    'भारताची राजधानी कोणती आहे?',
    'रक्तदाब वाढण्याची कारणे काय आहेत?'
  ],
  'ta-IN': [
    'இந்தியாவின் தலைநகரம் எது?'
  ]
};

export function GameCharacterAvatar({
  state,
  transcript,
  responseAnswer,
  languageCode = 'en-IN',
  isAudioPlaying = true,
  onAudioToggle,
  onCharacterPoke,
  onTriggerQuery,
  onStartVoice,
}: GameCharacterAvatarProps) {
  // Eye tracking & 3D tilt
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic Action Mode
  const [actionMode, setActionMode] = useState<ActionMode>('idle');
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SFX triggers on state transitions
  useEffect(() => {
    if (state === 'listening') {
      sounds.playListenStart();
      setActionMode('idle');
    } else if (state === 'speaking') {
      sounds.playSuccess();
      setActionMode('idle');
    } else if (state === 'refusal') {
      sounds.playRefusal();
      setActionMode('idle');
    }
  }, [state]);

  // Smooth mouse cursor tracking: robot eyes and head follow the pointer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - charCenterX;
      const dy = e.clientY - charCenterY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 8;

      if (distance > 0) {
        const factor = Math.min(1, distance / 350);
        const offsetX = (dx / distance) * maxOffset * factor;
        const offsetY = (dy / distance) * maxOffset * factor;
        setEyeOffset({ x: offsetX, y: offsetY });
        setHeadTilt((dx / (window.innerWidth || 1000)) * 14);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Spawn visual particles at position
  const spawnParticles = useCallback(
    (
      clickX: number,
      clickY: number,
      type: FloatingParticle['type'] = 'spark',
      count = 5,
      color = '#10b981'
    ) => {
      const newItems: FloatingParticle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
        const dist = 30 + Math.random() * 40;
        newItems.push({
          id: Date.now() + Math.random() * 10000 + i,
          x: clickX + Math.cos(angle) * dist,
          y: clickY + Math.sin(angle) * dist,
          type,
          color,
        });
      }

      setParticles((prev) => [...prev, ...newItems]);
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newItems.some((item) => item.id === p.id))
        );
      }, 1000);
    },
    []
  );

  // Trigger an interactive action sequence
  const triggerAction = useCallback(
    (mode: ActionMode) => {
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);

      setActionMode(mode);

      // Sound and particle mapping
      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = (rect?.width || 240) / 2;
      const centerY = (rect?.height || 240) / 2;

      switch (mode) {
        case 'spin':
          sounds.playSpin();
          spawnParticles(centerX, centerY, 'ring', 6, '#06b6d4');
          break;
        case 'dance':
          sounds.playDanceBeat();
          spawnParticles(centerX, centerY, 'music', 6, '#f59e0b');
          break;
        case 'hyper':
          sounds.playPowerUp();
          spawnParticles(centerX, centerY, 'bolt', 7, '#10b981');
          break;
        case 'wink':
          sounds.playChirp();
          spawnParticles(centerX, centerY, 'star', 6, '#fbbf24');
          break;
        case 'love':
          sounds.playGiggle();
          spawnParticles(centerX, centerY, 'heart', 6, '#f43f5e');
          break;
        case 'matrix':
          sounds.playTypeTick();
          spawnParticles(centerX, centerY, 'spark', 8, '#10b981');
          break;
        case 'tickle':
          sounds.playGiggle();
          spawnParticles(centerX, centerY, 'heart', 4, '#34d399');
          break;
        default:
          sounds.playPoke();
          spawnParticles(centerX, centerY, 'spark', 4, '#10b981');
          break;
      }

      // Auto-reset action
      const duration = mode === 'spin' ? 800 : mode === 'dance' ? 2200 : mode === 'hyper' ? 1800 : 1200;
      actionTimerRef.current = setTimeout(() => {
        setActionMode('idle');
      }, duration);
    },
    [spawnParticles]
  );

  // Main click handler on Sonic
  const handleCharacterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCharacterPoke) onCharacterPoke();

    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = rect ? e.clientX - rect.left : 100;
    const clickY = rect ? e.clientY - rect.top : 100;

    const modes: ActionMode[] = ['spin', 'dance', 'love', 'wink', 'hyper', 'matrix', 'tickle'];
    const nextMode = modes[Math.floor(Math.random() * modes.length)];
    triggerAction(nextMode);
    spawnParticles(clickX, clickY, nextMode === 'love' ? 'heart' : 'star', 5);
  };

  // Quick action: Trigger a random sample query
  const handleRandomQuery = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = SAMPLE_INTERACTIVE_QUERIES[languageCode] || SAMPLE_INTERACTIVE_QUERIES['en-IN'];
    const randomQ = list[Math.floor(Math.random() * list.length)];
    triggerAction('spin');
    if (onTriggerQuery) {
      setTimeout(() => onTriggerQuery(randomQ), 400);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none py-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Particles Overlay */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute z-50 pointer-events-none animate-in fade-in zoom-in slide-out-to-top-12 duration-700"
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.type === 'heart' && (
            <Heart className="w-5 h-5 fill-rose-500 text-rose-400 drop-shadow-md animate-bounce" />
          )}
          {p.type === 'star' && (
            <Sparkles className="w-5 h-5 text-amber-300 drop-shadow-md animate-spin duration-700" />
          )}
          {p.type === 'music' && (
            <Music className="w-5 h-5 text-cyan-400 drop-shadow-md animate-bounce" />
          )}
          {p.type === 'bolt' && (
            <Zap className="w-5 h-5 fill-amber-400 text-amber-300 drop-shadow-md animate-pulse" />
          )}
          {p.type === 'ring' && (
            <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-ping" />
          )}
          {p.type === 'spark' && (
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/80 animate-ping" />
          )}
        </div>
      ))}

      {/* Main Character Stage */}
      <div
        onClick={handleCharacterClick}
        title="Tap Sonic to trigger dances, spins, reactions & sounds!"
        className={`relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center cursor-pointer transition-all duration-300 ${
          actionMode === 'spin'
            ? 'animate-turbo-spin'
            : actionMode === 'dance'
            ? 'animate-cyber-dance'
            : actionMode === 'hyper'
            ? 'animate-hyper-charge scale-110'
            : isHovered
            ? 'scale-105'
            : 'hover:scale-105 active:scale-95'
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

        {/* Turbo Spin Shockwave Burst */}
        {actionMode === 'spin' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
            <div className="w-64 h-64 rounded-full border border-emerald-400 animate-ping opacity-40" />
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
              : actionMode === 'hyper'
              ? 'bg-amber-500/50 scale-125'
              : actionMode === 'dance'
              ? 'bg-purple-500/40 scale-115'
              : actionMode === 'spin'
              ? 'bg-cyan-500/45 scale-120'
              : actionMode === 'love'
              ? 'bg-rose-500/40 scale-110'
              : 'bg-emerald-500/20'
          }`}
        />

        {/* Animated Robot SVG Body with 3D Tilt */}
        <div
          className={`w-full h-full relative transition-transform duration-300 ${
            state === 'listening'
              ? 'animate-ear-wiggle'
              : state === 'speaking'
              ? 'animate-float-slow'
              : actionMode === 'dance'
              ? 'animate-cyber-dance'
              : actionMode === 'hyper'
              ? 'animate-hyper-charge'
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
                state === 'listening' || actionMode === 'dance'
                  ? 'rotate-[-14deg]'
                  : actionMode === 'spin'
                  ? 'rotate-[-20deg]'
                  : ''
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
                    : actionMode === 'hyper'
                    ? '#fbbf24'
                    : actionMode === 'dance'
                    ? '#c084fc'
                    : '#10b981'
                }
                className="animate-pulse"
              />
              <line x1="30" y1="70" x2="30" y2="78" stroke="#71717a" strokeWidth="2.5" />
            </g>

            {/* Right Robotic Ear / Antenna */}
            <g
              className={`transition-transform duration-300 origin-center ${
                state === 'listening' || actionMode === 'dance'
                  ? 'rotate-[14deg]'
                  : actionMode === 'spin'
                  ? 'rotate-[20deg]'
                  : ''
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
                    : actionMode === 'hyper'
                    ? '#fbbf24'
                    : actionMode === 'dance'
                    ? '#c084fc'
                    : '#10b981'
                }
                className="animate-pulse"
              />
              <line x1="170" y1="70" x2="170" y2="78" stroke="#71717a" strokeWidth="2.5" />
            </g>

            {/* DJ Headphones Ring during Dance Mode */}
            {actionMode === 'dance' && (
              <path
                d="M28 80 C28 20 172 20 172 80"
                stroke="#c084fc"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="animate-pulse"
              />
            )}

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
              r={actionMode === 'hyper' ? '10' : '8'}
              fill={
                state === 'listening'
                  ? '#10b981'
                  : state === 'thinking'
                  ? '#06b6d4'
                  : state === 'speaking'
                  ? '#f59e0b'
                  : state === 'refusal'
                  ? '#f43f5e'
                  : actionMode === 'hyper'
                  ? '#fbbf24'
                  : actionMode === 'dance'
                  ? '#c084fc'
                  : actionMode === 'love'
                  ? '#f43f5e'
                  : '#10b981'
              }
              className="animate-pulse"
            />
            <circle
              cx="100"
              cy="158"
              r="12"
              stroke={actionMode === 'hyper' ? '#fbbf24' : '#3f3f46'}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

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
              fill={
                state === 'thinking'
                  ? '#06b6d4'
                  : actionMode === 'hyper'
                  ? '#fbbf24'
                  : '#10b981'
              }
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

            {/* Scanline Sweep in Visor - Strictly clipped inside robot visor */}
            {(state === 'thinking' || actionMode === 'curious') && (
              <g clipPath="url(#visorClip)">
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
              </g>
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
              ) : actionMode === 'love' ? (
                /* Heart Eyes LED */
                <>
                  <path
                    d="M74 80 C70 74 62 76 62 82 C62 88 74 94 74 94 C74 94 86 88 86 82 C86 76 78 74 74 80 Z"
                    fill="#f43f5e"
                    className="animate-pulse"
                  />
                  <path
                    d="M126 80 C122 74 114 76 114 82 C114 88 126 94 126 94 C126 94 138 88 138 82 C138 76 130 74 126 80 Z"
                    fill="#f43f5e"
                    className="animate-pulse"
                  />
                </>
              ) : actionMode === 'hyper' ? (
                /* Lightning Bolt Eyes */
                <>
                  <path d="M78 74 L68 86 L74 86 L70 96 L80 84 L74 84 Z" fill="#fbbf24" className="animate-pulse" />
                  <path d="M130 74 L120 86 L126 86 L122 96 L132 84 L126 84 Z" fill="#fbbf24" className="animate-pulse" />
                </>
              ) : actionMode === 'wink' ? (
                /* Winking Eye */
                <>
                  <path d="M62 88 C67 80 81 80 86 88" stroke="#fbbf24" strokeWidth="4.5" strokeLinecap="round" />
                  <ellipse cx="126" cy="85" rx="12" ry="14" fill="#fbbf24" />
                  <circle cx="129" cy="81" r="4" fill="#ffffff" />
                </>
              ) : actionMode === 'dance' ? (
                /* Equalizer DJ Eyes */
                <>
                  <rect x="64" y="78" width="5" height="16" rx="2" fill="#c084fc" className="animate-pulse" />
                  <rect x="72" y="72" width="5" height="22" rx="2" fill="#c084fc" className="animate-pulse" />
                  <rect x="80" y="80" width="5" height="14" rx="2" fill="#c084fc" className="animate-pulse" />

                  <rect x="116" y="80" width="5" height="14" rx="2" fill="#c084fc" className="animate-pulse" />
                  <rect x="124" y="72" width="5" height="22" rx="2" fill="#c084fc" className="animate-pulse" />
                  <rect x="132" y="78" width="5" height="16" rx="2" fill="#c084fc" className="animate-pulse" />
                </>
              ) : actionMode === 'spin' ? (
                /* Fast Streamlines >> >> */
                <>
                  <path d="M66 80 L76 86 L66 92 M78 80 L88 86 L78 92" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M118 80 L128 86 L118 92 M130 80 L140 86 L130 92" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : state === 'speaking' ? (
                /* Joyful Cheerful Eyes */
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
              ) : actionMode === 'love' || actionMode === 'tickle' ? (
                <path
                  d="M84 107 C90 119 110 119 116 107"
                  stroke="#f43f5e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="#f43f5e"
                  fillOpacity="0.2"
                />
              ) : actionMode === 'hyper' ? (
                <path
                  d="M86 108 C92 118 108 118 114 108 Z"
                  fill="#fbbf24"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
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
            <circle
              cx="58"
              cy="103"
              r="6"
              fill={actionMode === 'love' ? '#f43f5e' : '#10b981'}
              fillOpacity={
                state === 'listening' || state === 'speaking' || actionMode !== 'idle' || isHovered
                  ? '0.5'
                  : '0.15'
              }
            />
            <circle
              cx="142"
              cy="103"
              r="6"
              fill={actionMode === 'love' ? '#f43f5e' : '#10b981'}
              fillOpacity={
                state === 'listening' || state === 'speaking' || actionMode !== 'idle' || isHovered
                  ? '0.5'
                  : '0.15'
              }
            />

            {/* Gradients & Clip Paths */}
            <defs>
              <clipPath id="visorClip">
                <rect x="46" y="54" width="108" height="74" rx="22" />
              </clipPath>
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

      {/* Voice Action Button below Sonic */}
      {state === 'idle' && onStartVoice && (
        <div className="flex items-center gap-1.5 mt-2 transition-all duration-300 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playListenStart();
              onStartVoice();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Start speaking"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Start Voice</span>
          </button>
        </div>
      )}

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
