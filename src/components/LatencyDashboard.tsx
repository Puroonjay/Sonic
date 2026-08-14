'use client';

import { RAGResponse } from '@/hooks/useVoiceRAG';

interface LatencyDashboardProps {
  currentMetrics?: RAGResponse['metrics'];
  history: RAGResponse[];
}

export function LatencyDashboard({ currentMetrics, history }: LatencyDashboardProps) {
  const calculatePercentile = (percentile: number) => {
    if (history.length === 0) return 0;
    const sorted = [...history]
      .map((item) => item.metrics.total_ms)
      .sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)]);
  };

  const p50 = calculatePercentile(50);
  const p70 = calculatePercentile(70);
  const p100 = calculatePercentile(100);

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 font-mono text-xs text-zinc-300 space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <span className="text-zinc-400 font-bold">SONIC BENCHMARK HARNESS</span>
        <span className="text-emerald-400">TARGET: &lt;200ms</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="text-zinc-500 mb-1">P50 (Median)</div>
          <div className={`text-lg font-bold ${p50 <= 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {p50} ms
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="text-zinc-500 mb-1">P70</div>
          <div className={`text-lg font-bold ${p70 <= 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {p70} ms
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="text-zinc-500 mb-1">P100 (Worst Case)</div>
          <div className={`text-lg font-bold ${p100 <= 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {p100} ms
          </div>
        </div>
      </div>

      {currentMetrics && (
        <div className="space-y-1.5 pt-2">
          <div className="text-zinc-500 mb-2">LAST QUERY TIMINGS:</div>
          <div className="flex justify-between bg-zinc-950 px-3 py-1.5 rounded">
            <span>STT Engine:</span>
            <span className="text-emerald-400">{currentMetrics.stt_ms} ms</span>
          </div>
          <div className="flex justify-between bg-zinc-950 px-3 py-1.5 rounded">
            <span>Vector Retrieval:</span>
            <span className="text-emerald-400">{currentMetrics.retrieval_ms} ms</span>
          </div>
          <div className="flex justify-between bg-zinc-950 px-3 py-1.5 rounded">
            <span>Guardrails Check:</span>
            <span className="text-emerald-400">{currentMetrics.guardrail_ms} ms</span>
          </div>
          <div className="flex justify-between bg-zinc-950 px-3 py-1.5 rounded">
            <span>LLM Generation:</span>
            <span className="text-emerald-400">{currentMetrics.generation_ms} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}