'use client';

import { useState } from 'react';
import { RAGResponse } from '@/src/hooks/useVoiceRAG';
import { Play, CheckCircle2, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

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
}

export function LatencyDashboard({
  currentMetrics,
  history,
  httpBackendUrl = 'http://localhost:8000',
}: LatencyDashboardProps) {
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

  const runAutomatedBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch(`${httpBackendUrl}/api/benchmark?sample_count=30`, {
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

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 font-mono text-xs text-zinc-300 space-y-5 shadow-xl backdrop-blur-md">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-200 font-bold tracking-wider">LATENCY ANALYTICS HARNESS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
            TARGET: &lt; 200ms
          </span>
        </div>
      </div>

      {/* Percentiles Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* P50 */}
        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between">
          <span className="text-zinc-500 text-[11px]">P50 (Median)</span>
          <div className="mt-1">
            <span
              className={`text-xl font-bold ${
                p50 > 0 && p50 <= 200 ? 'text-emerald-400' : p50 === 0 ? 'text-zinc-500' : 'text-rose-400'
              }`}
            >
              {p50 > 0 ? `${p50} ms` : '--'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 mt-1">50% under this</span>
        </div>

        {/* P70 */}
        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between">
          <span className="text-zinc-500 text-[11px]">P70</span>
          <div className="mt-1">
            <span
              className={`text-xl font-bold ${
                p70 > 0 && p70 <= 200 ? 'text-emerald-400' : p70 === 0 ? 'text-zinc-500' : 'text-amber-400'
              }`}
            >
              {p70 > 0 ? `${p70} ms` : '--'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 mt-1">70% under this</span>
        </div>

        {/* P100 */}
        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between">
          <span className="text-zinc-500 text-[11px]">P100 (Max)</span>
          <div className="mt-1">
            <span
              className={`text-xl font-bold ${
                p100 > 0 && p100 <= 200 ? 'text-emerald-400' : p100 === 0 ? 'text-zinc-500' : 'text-amber-400'
              }`}
            >
              {p100 > 0 ? `${p100} ms` : '--'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 mt-1">Worst-case run</span>
        </div>
      </div>

      {/* Compliance Indicator */}
      {benchmarkResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
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
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <div className="text-zinc-400 font-semibold text-[11px] mb-2">STAGE-BY-STAGE LATENCY BREAKDOWN:</div>
          
          <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850">
            <span className="text-zinc-400">1. Speech-to-Text (Sarvam):</span>
            <span className="font-bold text-emerald-400">{currentMetrics.stt_ms} ms</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850">
            <span className="text-zinc-400">2. Vector Search (LanceDB):</span>
            <span className="font-bold text-emerald-400">{currentMetrics.retrieval_ms} ms</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850">
            <span className="text-zinc-400">3. Multi-Tier Guardrails:</span>
            <span className="font-bold text-emerald-400">{currentMetrics.guardrail_ms} ms</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-850">
            <span className="text-zinc-400">4. LLM Generation (Groq):</span>
            <span className="font-bold text-emerald-400">{currentMetrics.generation_ms} ms</span>
          </div>

          <div className="flex justify-between items-center bg-emerald-950/40 px-3 py-2.5 rounded-lg border border-emerald-800/40">
            <span className="text-emerald-300 font-bold">TOTAL END-TO-END:</span>
            <span className="text-base font-bold text-emerald-400">{currentMetrics.total_ms} ms</span>
          </div>
        </div>
      )}

      {/* Trigger Automated Benchmark Button */}
      <div className="pt-2">
        <button
          onClick={runAutomatedBenchmark}
          disabled={isRunningBenchmark}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 py-2.5 rounded-xl transition-colors font-semibold"
        >
          {isRunningBenchmark ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Running 30-Query Benchmark Suite...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              Run 30-Query Automated Benchmark
            </>
          )}
        </button>
      </div>
    </div>
  );
}