// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert h-5 w-[100px]"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the{" "}
//             <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
//               page.tsx
//             </code>{" "}
//             file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert h-[14px] w-4"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={14}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

'use client';

import { useVoiceRAG } from '@/src/hooks/useVoiceRAG';
import { LatencyDashboard } from '@/src/components/LatencyDashboard';
import { Mic, Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function SonicStudioPage() {
  const WS_BACKEND_URL =
    process.env.NEXT_PUBLIC_WS_BACKEND_URL || 'ws://localhost:8000/ws/rag';

  const {
    isRecording,
    isProcessing,
    response,
    history,
    startRecording,
    stopRecording,
  } = useVoiceRAG(WS_BACKEND_URL);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Bar / Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-wider">SONIC RAG ENGINE</span>
          </div>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">DATASET: MSMARCO-XI</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>SUB-200MS HARNESS</span>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Voice Controller & Answer Box */}
        <div className="flex flex-col gap-6">
          
          {/* Audio Input Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-sm">
            
            {/* Ambient Background Glow on Record */}
            {isRecording && (
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
            )}

            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl ${
                isRecording
                  ? 'bg-rose-500 text-white scale-105 shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 hover:scale-105'
              }`}
            >
              <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
              <span className="font-mono text-[10px] font-bold mt-1 tracking-wider uppercase">
                {isRecording ? 'Listening' : 'Hold to Speak'}
              </span>
            </button>

            <p className="mt-5 font-mono text-xs text-zinc-400 max-w-xs">
              {isRecording ? (
                <span className="text-rose-400 animate-pulse">
                  Streaming audio to WebSocket... Release when done.
                </span>
              ) : isProcessing ? (
                <span className="text-amber-400">
                  Executing sub-200ms RAG pipeline...
                </span>
              ) : (
                'Hold down button to speak your query.'
              )}
            </p>
          </div>

          {/* Answer & Transcript Display */}
          {response && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
              
              {/* Guardrail Status Badge */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-mono text-xs text-zinc-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  GUARDRAIL EVALUATION
                </span>
                
                {response.refused ? (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    REFUSED (Off-Topic / Ungrounded)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    GROUNDED ANSWER
                  </span>
                )}
              </div>

              {/* Speech Transcript */}
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Transcript
                </span>
                <p className="text-zinc-300 italic text-sm mt-1 bg-zinc-950/60 p-3 rounded-lg border border-zinc-850">
                  "{response.transcript}"
                </p>
              </div>

              {/* Answer Output */}
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  RAG Output
                </span>
                <p className="text-zinc-100 font-medium text-sm mt-1 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-850">
                  {response.answer}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Latency Dashboard */}
        <div>
          <LatencyDashboard
            currentMetrics={response?.metrics}
            history={history}
          />
        </div>
      </div>
    </main>
  );
}