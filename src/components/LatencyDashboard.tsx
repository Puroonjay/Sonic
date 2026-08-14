'use client';

import React, { useState } from 'react';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Zap,
  Cpu,
  Database,
  ShieldCheck,
  Clock,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface LatencyDashboardProps {
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
  query_details?: Array<{
    query: string;
    total_ms: number;
    retrieval_ms: number;
    generation_ms: number;
    sub_200ms: boolean;
  }>;
}

export function LatencyDashboard({
  currentMetrics,
  history,
  httpBackendUrl = '',
}: LatencyDashboardProps) {
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkReport | null>(null);
  const [showQueryList, setShowQueryList] = useState(false);

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

  const runAutomatedBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const baseUrl = httpBackendUrl ? httpBackendUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/benchmark?sample_count=25`, {
        method: 'POST',
      });
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (err) {
      console.error('Benchmark Error:', err);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Compute stage proportions for visual progress bar
  const totalMs = currentMetrics ? currentMetrics.total_ms || 1 : 1;
  const sttPct = currentMetrics ? Math.round((currentMetrics.stt_ms / totalMs) * 100) : 0;
  const retrievalPct = currentMetrics ? Math.round((currentMetrics.retrieval_ms / totalMs) * 100) : 0;
  const guardrailPct = currentMetrics ? Math.round((currentMetrics.guardrail_ms / totalMs) * 100) : 0;
  const genPct = currentMetrics ? Math.max(5, 100 - sttPct - retrievalPct - guardrailPct) : 0;

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 md:p-6 font-mono text-xs text-zinc-300 space-y-5 shadow-2xl backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-zinc-100 font-bold tracking-wider text-xs">LATENCY TELEMETRY</h3>
            <p className="text-[10px] text-zinc-500">Live Statistical Performance Harness</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            TARGET: &lt; 200ms
          </span>
        </div>
      </div>

      {/* Percentiles Gauges Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* P50 (Median) */}
        <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P50 Median</span>
            <Clock className="w-3 h-3 text-zinc-500" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-lg md:text-xl font-extrabold tracking-tight ${
                p50 > 0 && p50 <= 200
                  ? 'text-emerald-400'
                  : p50 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p50 > 0 ? `${p50} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (200 / (p50 || 200)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">50% faster than this</span>
        </div>

        {/* P70 */}
        <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/30 transition-colors">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P70 Gauge</span>
            <TrendingUp className="w-3 h-3 text-zinc-500" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-lg md:text-xl font-extrabold tracking-tight ${
                p70 > 0 && p70 <= 250
                  ? 'text-emerald-400'
                  : p70 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p70 > 0 ? `${p70} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1 rounded-full overflow-hidden">
            <div
              className="bg-teal-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (250 / (p70 || 250)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">70% faster than this</span>
        </div>

        {/* P100 (Max) */}
        <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>P100 Peak</span>
            <AlertTriangle className="w-3 h-3 text-zinc-500" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-lg md:text-xl font-extrabold tracking-tight ${
                p100 > 0 && p100 <= 400
                  ? 'text-emerald-400'
                  : p100 === 0
                  ? 'text-zinc-500'
                  : 'text-amber-400'
              }`}
            >
              {p100 > 0 ? `${p100} ms` : '--'}
            </span>
          </div>
          <div className="w-full bg-zinc-850 h-1 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (400 / (p100 || 400)) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-1">Worst-case run</span>
        </div>
      </div>

      {/* Compliance Indicator Badge */}
      {benchmarkResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-[11px] animate-in fade-in">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sub-200ms Compliance:
          </span>
          <span className="font-bold text-emerald-300">
            {benchmarkResult.sub_200ms_compliance_rate}% ({benchmarkResult.total_queries} queries tested)
          </span>
        </div>
      )}

      {/* Stage-by-Stage Latency Breakdown */}
      {currentMetrics && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 font-bold uppercase tracking-wider">
              Pipeline Stage Breakdown
            </span>
            <span className="text-[10px] text-zinc-500">
              Total: <strong className="text-emerald-400">{currentMetrics.total_ms} ms</strong>
            </span>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            {sttPct > 0 && (
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${sttPct}%` }}
                title={`STT: ${currentMetrics.stt_ms}ms (${sttPct}%)`}
              />
            )}
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${retrievalPct}%` }}
              title={`LanceDB: ${currentMetrics.retrieval_ms}ms (${retrievalPct}%)`}
            />
            <div
              className="bg-cyan-400 h-full"
              style={{ width: `${guardrailPct}%` }}
              title={`Guardrails: ${currentMetrics.guardrail_ms}ms`}
            />
            <div
              className="bg-amber-400 h-full"
              style={{ width: `${genPct}%` }}
              title={`Groq: ${currentMetrics.generation_ms}ms (${genPct}%)`}
            />
          </div>

          {/* Legend Details List */}
          <div className="space-y-1.5">
            {currentMetrics.stt_ms > 0 && (
              <div className="flex justify-between items-center bg-zinc-950/70 px-3 py-2 rounded-lg border border-zinc-850">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  1. Speech-to-Text (Sarvam):
                </span>
                <span className="font-bold text-indigo-300">{currentMetrics.stt_ms} ms</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-zinc-950/70 px-3 py-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                2. Vector Search (LanceDB IVF-PQ):
              </span>
              <span className="font-bold text-emerald-400">{currentMetrics.retrieval_ms} ms</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-950/70 px-3 py-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                3. Multi-Tier Guardrails:
              </span>
              <span className="font-bold text-cyan-300">{currentMetrics.guardrail_ms} ms</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-950/70 px-3 py-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                4. LLM Generation (Groq LLaMA-3):
              </span>
              <span className="font-bold text-amber-300">{currentMetrics.generation_ms} ms</span>
            </div>

            <div className="flex justify-between items-center bg-emerald-950/30 px-3 py-2.5 rounded-lg border border-emerald-800/40">
              <span className="text-emerald-300 font-bold flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                TOTAL LATENCY:
              </span>
              <span className="text-sm font-extrabold text-emerald-400">{currentMetrics.total_ms} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Automated Benchmark Button */}
      <div className="pt-2">
        <button
          onClick={runAutomatedBenchmark}
          disabled={isRunningBenchmark}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-emerald-600 disabled:opacity-50 text-zinc-100 hover:text-white py-2.5 rounded-xl transition-all font-semibold border border-zinc-700/60 hover:border-emerald-500 shadow-md"
        >
          {isRunningBenchmark ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Running 25-Query Benchmark Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Run Automated 25-Query Benchmark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}