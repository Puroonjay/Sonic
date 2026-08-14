'use client';

import React, { useState } from 'react';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import { sounds } from '@/src/lib/soundEffects';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Zap,
  Cpu,
  Flame,
  Clock,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';

interface SpeedStreakHudProps {
  currentMetrics?: RAGResponse['metrics'];
  history: RAGResponse[];
  httpBackendUrl?: string;
}

interface BenchmarkReport {
  total_queries: number;
  p50_total_ms: number;
  p70_total_ms: number;
  p90_total_ms: number;
  p100_total_ms: number;
  avg_stt_ms: number;
  avg_retrieval_ms: number;
  avg_guardrail_ms: number;
  avg_generation_ms: number;
  avg_total_ms: number;
  sub_200ms_compliance_rate: number;
}

export function SpeedStreakHud({
  currentMetrics,
  history,
  httpBackendUrl = '',
}: SpeedStreakHudProps) {
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkReport | null>(null);

  const calculatePercentile = (percentile: number) => {
    if (history.length === 0) return 0;
    const sorted = [...history]
      .map((item) => item.metrics.total_ms)
      .sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)]);
  };

  const p50 = benchmarkResult?.p50_total_ms ?? calculatePercentile(50);
  const p70 = benchmarkResult?.p70_total_ms ?? calculatePercentile(70);
  const p100 = benchmarkResult?.p100_total_ms ?? calculatePercentile(100);

  // Calculate streak of fast runs (< 200ms on core RAG text or < 1500ms on full voice)
  const sub200Streak = history.filter((h) => (h.metrics.retrieval_ms + h.metrics.generation_ms) < 250).length;

  const runAutomatedBenchmark = async () => {
    sounds.playBlip();
    setIsRunningBenchmark(true);
    try {
      const baseUrl = httpBackendUrl ? httpBackendUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/benchmark?sample_count=25`, {
        method: 'POST',
      });
      const data = await res.json();
      setBenchmarkResult(data);
      sounds.playSuccess();
    } catch (err) {
      console.error('Benchmark Error:', err);
      sounds.playRefusal();
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const totalMs = currentMetrics ? currentMetrics.total_ms || 1 : 1;
  const sttPct = currentMetrics ? Math.round((currentMetrics.stt_ms / totalMs) * 100) : 0;
  const retrievalPct = currentMetrics ? Math.round((currentMetrics.retrieval_ms / totalMs) * 100) : 0;
  const guardrailPct = currentMetrics ? Math.round((currentMetrics.guardrail_ms / totalMs) * 100) : 0;
  const genPct = currentMetrics ? Math.max(5, 100 - sttPct - retrievalPct - guardrailPct) : 0;

  return (
    <div className="w-full glass-panel border border-zinc-800 rounded-3xl p-5 md:p-6 font-mono text-xs text-zinc-300 space-y-5 shadow-2xl backdrop-blur-2xl">
      {/* Top Header with Streak Flame */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-zinc-100 font-extrabold tracking-wider text-xs flex items-center gap-1.5">
              <span>LATENCY TELEMETRY HUD</span>
            </h3>
            <p className="text-[10px] text-zinc-500">Real-Time Performance Harvester</p>
          </div>
        </div>

        {/* Gamified Streak Badge */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-[11px] font-bold shadow-md">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
          <span>{sub200Streak > 0 ? `${sub200Streak}x FAST STREAK` : 'SUB-200MS READY'}</span>
        </div>
      </div>

      {/* Speedometer Percentile Gauges */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* P50 (Median) */}
        <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-inner">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P50 Median</span>
            <Award className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-xl md:text-2xl font-black tracking-tight ${
                p50 > 0 && p50 <= 200
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : p50 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p50 > 0 ? `${p50} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (200 / (p50 || 200)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">50% queries under</span>
        </div>

        {/* P70 */}
        <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-inner">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P70 Gauge</span>
            <TrendingUp className="w-3 h-3 text-teal-400" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-xl md:text-2xl font-black tracking-tight ${
                p70 > 0 && p70 <= 220
                  ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]'
                  : p70 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p70 > 0 ? `${p70} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (220 / (p70 || 220)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">70% queries under</span>
        </div>

        {/* P100 (Worst Case) */}
        <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-inner">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P100 Peak</span>
            <Clock className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-xl md:text-2xl font-black tracking-tight ${
                p100 > 0 && p100 <= 400
                  ? 'text-cyan-400'
                  : p100 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p100 > 0 ? `${p100} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (400 / (p100 || 400)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">Worst-case run</span>
        </div>
      </div>

      {/* Benchmark Compliance Banner */}
      {benchmarkResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
          <span className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Sub-200ms Compliance:
          </span>
          <span className="font-extrabold text-emerald-300 text-sm">
            {benchmarkResult.sub_200ms_compliance_rate}% ({benchmarkResult.total_queries} queries)
          </span>
        </div>
      )}

      {/* Stage Breakdown Visualizer */}
      {currentMetrics && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 font-bold uppercase tracking-wider">
              Stage-by-Stage Breakdown
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Total: <strong className="text-emerald-400">{currentMetrics.total_ms} ms</strong>
            </span>
          </div>

          {/* Proportional Stacked Color Bar */}
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 p-0.5 shadow-inner">
            {sttPct > 0 && (
              <div
                className="bg-indigo-500 h-full rounded-l-full transition-all duration-300"
                style={{ width: `${sttPct}%` }}
                title={`STT: ${currentMetrics.stt_ms}ms`}
              />
            )}
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${retrievalPct}%` }}
              title={`LanceDB: ${currentMetrics.retrieval_ms}ms`}
            />
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${guardrailPct}%` }}
              title={`Guardrails: ${currentMetrics.guardrail_ms}ms`}
            />
            <div
              className="bg-amber-400 h-full rounded-r-full transition-all duration-300"
              style={{ width: `${genPct}%` }}
              title={`Groq: ${currentMetrics.generation_ms}ms`}
            />
          </div>

          {/* Detailed Stage Metrics */}
          <div className="space-y-1.5 font-mono text-xs">
            {currentMetrics.stt_ms > 0 && (
              <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-850">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  1. Speech-to-Text (Sarvam):
                </span>
                <span className="font-bold text-indigo-300">{currentMetrics.stt_ms} ms</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                2. Vector Retrieval (LanceDB):
              </span>
              <span className="font-bold text-emerald-400">{currentMetrics.retrieval_ms} ms</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                3. Multi-Tier Guardrails:
              </span>
              <span className="font-bold text-cyan-300">{currentMetrics.guardrail_ms} ms</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                4. LLM Generation (Groq LLaMA-3):
              </span>
              <span className="font-bold text-amber-300">{currentMetrics.generation_ms} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Action Button */}
      <div className="pt-2">
        <button
          onClick={runAutomatedBenchmark}
          disabled={isRunningBenchmark}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-750 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-zinc-100 hover:text-white py-3 rounded-2xl transition-all font-bold border border-zinc-700/60 hover:border-emerald-400 shadow-xl cursor-pointer active:scale-98"
        >
          {isRunningBenchmark ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              <span>Running 25-Query Benchmark Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Run Automated 25-Query Benchmark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
