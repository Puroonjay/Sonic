'use client';

import React, { useState, useEffect } from 'react';
import { SonicLogo } from './SonicLogo';
import { sounds } from '@/src/lib/soundEffects';

interface SonicSplashIntroProps {
  onComplete: () => void;
}

export function SonicSplashIntro({ onComplete }: SonicSplashIntroProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Play boot sound chime on load
    sounds.playBootSound();

    // After full animation cycle plays (S draws in, then speed lines oscillate), fade out smoothly
    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, 3200);

    // Complete handoff to active AI
    const timerDone = setTimeout(() => {
      onComplete();
    }, 3750);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 px-4 transition-all duration-700 select-none ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_65%)] pointer-events-none" />

      {/* Centered Minimalist Logo & Brand */}
      <div className="relative flex flex-col items-center z-10 space-y-5 animate-in fade-in zoom-in-95 duration-500">
        <SonicLogo size={90} glow={true} animated={true} />

        <h1 className="text-3xl md:text-4xl font-black font-mono tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          SONIC
        </h1>
      </div>
    </div>
  );
}
