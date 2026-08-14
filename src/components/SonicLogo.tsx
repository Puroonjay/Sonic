'use client';

import React from 'react';

interface SonicLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
}

export function SonicLogo({ size = 28, className = '', glow = true }: SonicLogoProps) {
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
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10B981" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Squircle Glass Background */}
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

        {/* Supersonic Waveform "S" Monogram */}
        {/* Upper supersonic wave arc */}
        <path
          d="M26 11.5C26 8.46 22.42 6.5 18 6.5C13.58 6.5 10 8.46 10 11.5C10 15 15.5 16 18 16.8C21.5 18 26 19.5 26 24.5C26 27.54 22.42 29.5 18 29.5C13.58 29.5 10 27.54 10 24.5"
          stroke="url(#sonic_grad_primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />

        {/* Core dynamic audio velocity pulses (Soundwave S) */}
        <g filter="url(#sonic_glow)">
          {/* Vertical acoustic velocity bars shaped into an ultra-fast S pulse */}
          <rect x="8.5" y="14" width="2" height="8" rx="1" fill="url(#sonic_grad_wave)" />
          <rect x="13" y="10" width="2.2" height="16" rx="1.1" fill="url(#sonic_grad_wave)" />
          <rect x="17.5" y="7" width="2.4" height="22" rx="1.2" fill="#FFFFFF" />
          <rect x="22.2" y="11" width="2.2" height="14" rx="1.1" fill="url(#sonic_grad_wave)" />
          <rect x="26.7" y="15" width="2" height="6" rx="1" fill="url(#sonic_grad_wave)" />

          {/* Central Supersonic Beam */}
          <path
            d="M9 18H28"
            stroke="url(#sonic_grad_primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="1 3"
          />
        </g>

        {/* Ultra-speed micro-sparkle point */}
        <circle cx="27" cy="9" r="1.2" fill="#67E8F9" className="animate-ping" style={{ animationDuration: '3s' }} />
      </svg>
    </div>
  );
}
