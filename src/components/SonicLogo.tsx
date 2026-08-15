'use client';

import React from 'react';

interface SonicLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

export function SonicLogo({
  size = 28,
  className = '',
  glow = true,
  animated = true,
}: SonicLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-cyan-500/30 blur-md -z-10 animate-pulse" />
      )}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sonic_grad_primary" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="sonic_grad_wave" x1="6" y1="18" x2="30" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>
          <linearGradient id="sonic_bg_grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="50%" stopColor="#022C22" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>
          <filter id="sonic_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10B981" floodOpacity="0.5" />
          </filter>

          {/* 3.4s Sequence: First ONLY S Animates -> Then Lines Emerge Above S */}
          <style>{`
            /* 1. S Phase (0% to 45%): Draws in and glows with electricity */
            @keyframes sonic_s_solo {
              0% {
                stroke-dasharray: 60;
                stroke-dashoffset: 60;
                opacity: 0.2;
                stroke-width: 2.2;
              }
              22% {
                opacity: 1;
                stroke-width: 3.2;
                filter: drop-shadow(0 0 4px #10B981);
              }
              42% {
                stroke-dashoffset: 0;
                opacity: 1;
                stroke-width: 2.6;
              }
              48%, 92% {
                stroke-dashoffset: 0;
                opacity: 0.45;
                stroke-width: 2.2;
                filter: none;
              }
              100% {
                stroke-dashoffset: 0;
                opacity: 0.2;
                stroke-width: 2.2;
              }
            }

            @keyframes sonic_s_spark_solo {
              0% {
                stroke-dashoffset: 60;
                opacity: 0;
              }
              15% {
                opacity: 1;
              }
              38% {
                stroke-dashoffset: 0;
                opacity: 1;
              }
              46%, 100% {
                stroke-dashoffset: -30;
                opacity: 0;
              }
            }

            /* 2. Lines Master Container (0% to 45% = 100% HIDDEN, 48% to 92% = VISIBLE & ACTIVE ABOVE S) */
            @keyframes sonic_bars_master {
              0%, 45% {
                opacity: 0;
                transform: scaleY(0);
                visibility: hidden;
              }
              50% {
                opacity: 1;
                transform: scaleY(1.2);
                visibility: visible;
              }
              55%, 88% {
                opacity: 1;
                transform: scaleY(1);
                visibility: visible;
              }
              95%, 100% {
                opacity: 0;
                transform: scaleY(0);
                visibility: hidden;
              }
            }

            /* Individual Bar Oscillations within active window (50% to 90%) */
            @keyframes sonic_bar_osc_1 {
              0%, 48% { transform: scaleY(0); }
              55% { transform: scaleY(1.35); }
              65% { transform: scaleY(0.6); }
              78% { transform: scaleY(1.4); }
              88% { transform: scaleY(0.8); }
              94%, 100% { transform: scaleY(0); }
            }
            @keyframes sonic_bar_osc_2 {
              0%, 48% { transform: scaleY(0); }
              56% { transform: scaleY(1.4); }
              68% { transform: scaleY(0.5); }
              80% { transform: scaleY(1.3); }
              88% { transform: scaleY(0.7); }
              94%, 100% { transform: scaleY(0); }
            }
            @keyframes sonic_bar_osc_3 { /* Center white peak bar */
              0%, 48% { transform: scaleY(0); }
              54% { transform: scaleY(1.6); }
              66% { transform: scaleY(0.7); }
              76% { transform: scaleY(1.5); }
              88% { transform: scaleY(0.9); }
              94%, 100% { transform: scaleY(0); }
            }
            @keyframes sonic_bar_osc_4 {
              0%, 48% { transform: scaleY(0); }
              57% { transform: scaleY(1.3); }
              69% { transform: scaleY(0.55); }
              82% { transform: scaleY(1.25); }
              88% { transform: scaleY(0.75); }
              94%, 100% { transform: scaleY(0); }
            }
            @keyframes sonic_bar_osc_5 {
              0%, 48% { transform: scaleY(0); }
              58% { transform: scaleY(1.45); }
              70% { transform: scaleY(0.5); }
              84% { transform: scaleY(1.35); }
              88% { transform: scaleY(0.7); }
              94%, 100% { transform: scaleY(0); }
            }

            @keyframes sonic_beam_osc {
              0%, 48% { opacity: 0; stroke-dashoffset: 0; }
              55% { opacity: 1; stroke-dashoffset: 2; }
              88% { opacity: 0.8; stroke-dashoffset: 8; }
              94%, 100% { opacity: 0; }
            }

            .sonic-s-base {
              animation: sonic_s_solo 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .sonic-s-pulse {
              stroke-dasharray: 14 36;
              animation: sonic_s_spark_solo 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .sonic-bars-group {
              transform-box: fill-box;
              transform-origin: center;
              animation: sonic_bars_master 3.4s ease-in-out infinite;
            }
            .sonic-bar {
              transform-box: fill-box;
              transform-origin: center;
              transition: transform 0.15s ease;
            }
            .sonic-bar-1 { animation: sonic_bar_osc_1 3.4s ease-in-out infinite; }
            .sonic-bar-2 { animation: sonic_bar_osc_2 3.4s ease-in-out infinite; }
            .sonic-bar-3 { animation: sonic_bar_osc_3 3.4s ease-in-out infinite; }
            .sonic-bar-4 { animation: sonic_bar_osc_4 3.4s ease-in-out infinite; }
            .sonic-bar-5 { animation: sonic_bar_osc_5 3.4s ease-in-out infinite; }
            .sonic-beam { animation: sonic_beam_osc 3.4s linear infinite; }
          `}</style>
        </defs>

        {/* 1. Squircle Glass Background */}
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="9"
          fill="url(#sonic_bg_grad)"
          stroke="url(#sonic_grad_primary)"
          strokeWidth="1.2"
          className="transition-all duration-300"
        />

        {/* 2. Supersonic Waveform "S" Monogram Layer (Rendered FIRST) */}
        <path
          d="M26 11.5C26 8.46 22.42 6.5 18 6.5C13.58 6.5 10 8.46 10 11.5C10 15 15.5 16 18 16.8C21.5 18 26 19.5 26 24.5C26 27.54 22.42 29.5 18 29.5C13.58 29.5 10 27.54 10 24.5"
          stroke="url(#sonic_grad_primary)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'sonic-s-base' : 'opacity-85'}
        />

        {/* Supersonic Waveform "S" Monogram (Electric Spark) */}
        {animated && (
          <path
            d="M26 11.5C26 8.46 22.42 6.5 18 6.5C13.58 6.5 10 8.46 10 11.5C10 15 15.5 16 18 16.8C21.5 18 26 19.5 26 24.5C26 27.54 22.42 29.5 18 29.5C13.58 29.5 10 27.54 10 24.5"
            stroke="#A7F3D0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sonic-s-pulse"
          />
        )}

        {/* 3. Core Equalizer Bars (Rendered AFTER the S, so they appear ON TOP / ABOVE it) */}
        <g
          filter="url(#sonic_glow)"
          className={animated ? 'sonic-bars-group' : 'opacity-100'}
        >
          {/* Vertical acoustic velocity bars */}
          <rect
            x="8.5"
            y="14"
            width="2"
            height="8"
            rx="1"
            fill="url(#sonic_grad_wave)"
            className={animated ? 'sonic-bar sonic-bar-1' : ''}
          />
          <rect
            x="13"
            y="10"
            width="2.2"
            height="16"
            rx="1.1"
            fill="url(#sonic_grad_wave)"
            className={animated ? 'sonic-bar sonic-bar-2' : ''}
          />
          <rect
            x="17.5"
            y="7"
            width="2.4"
            height="22"
            rx="1.2"
            fill="#FFFFFF"
            className={animated ? 'sonic-bar sonic-bar-3' : ''}
          />
          <rect
            x="22.2"
            y="11"
            width="2.2"
            height="14"
            rx="1.1"
            fill="url(#sonic_grad_wave)"
            className={animated ? 'sonic-bar sonic-bar-4' : ''}
          />
          <rect
            x="26.7"
            y="15"
            width="2"
            height="6"
            rx="1"
            fill="url(#sonic_grad_wave)"
            className={animated ? 'sonic-bar sonic-bar-5' : ''}
          />

          {/* Central Supersonic Beam */}
          <path
            d="M9 18H28"
            stroke="url(#sonic_grad_primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="1 3"
            className={animated ? 'sonic-beam' : ''}
          />
        </g>
      </svg>
    </div>
  );
}
