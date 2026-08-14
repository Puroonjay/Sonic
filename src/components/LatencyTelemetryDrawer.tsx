'use client';

import React from 'react';
import { SpeedStreakHud } from './SpeedStreakHud';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import { X, Activity, BarChart3, Zap } from 'lucide-react';
import { sounds } from '@/src/lib/soundEffects';

interface LatencyTelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMetrics?: RAGResponse['metrics'];
  history: RAGResponse[];
  httpBackendUrl: string;
}

export function LatencyTelemetryDrawer({
  isOpen,
  onClose,
  currentMetrics,
  history,
  httpBackendUrl,
}: LatencyTelemetryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full p-5 md:p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-4 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-bold text-sm font-mono">
                Telemetry & Analytics
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">Real-time benchmark evaluator</p>
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

        {/* Speed HUD Content */}
        <div className="flex-1">
          <SpeedStreakHud
            currentMetrics={currentMetrics}
            history={history}
            httpBackendUrl={httpBackendUrl}
          />
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-mono font-bold transition-colors"
          >
            Close Telemetry HUD
          </button>
        </div>
      </div>
    </div>
  );
}
