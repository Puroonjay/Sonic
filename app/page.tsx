'use client';

import { useState, useEffect } from 'react';
import { useVoiceRAG } from '@/src/hooks/useVoiceRAG';
import { LatencyDashboard } from '@/src/components/LatencyDashboard';
import {
  Mic,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  Send,
  Sparkles,
  Database,
  Languages
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: '🇮🇳 Hindi (हिन्दी)' },
  { code: 'en-IN', label: '🌐 English (Indian)' },
  { code: 'ta-IN', label: '🇮🇳 Tamil (தமிழ்)' },
  { code: 'te-IN', label: '🇮🇳 Telugu (తెలుగు)' },
  { code: 'bn-IN', label: '🇮🇳 Bengali (বাংলা)' },
  { code: 'mr-IN', label: '🇮🇳 Marathi (मराठी)' },
  { code: 'gu-IN', label: '🇮🇳 Gujarati (ગુજરાતી)' },
  { code: 'kn-IN', label: '🇮🇳 Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', label: '🇮🇳 Malayalam (മലയാളം)' },
  { code: 'pa-IN', label: '🇮🇳 Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'od-IN', label: '🇮🇳 Odia (ଓଡ଼ିଆ)' },
];

export default function SonicStudioPage() {
  const WS_BACKEND_URL =
    process.env.NEXT_PUBLIC_WS_BACKEND_URL || 'ws://localhost:8000/ws/rag';
  const HTTP_BACKEND_URL =
    process.env.NEXT_PUBLIC_HTTP_BACKEND_URL || 'http://localhost:8000';

  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [mounted, setMounted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedCitationIndex, setSelectedCitationIndex] = useState(0);

  const {
    isRecording,
    isProcessing,
    response,
    history,
    startRecording,
    stopRecording,
    sendTextQuery,
  } = useVoiceRAG(WS_BACKEND_URL, HTTP_BACKEND_URL, selectedLanguage);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    sendTextQuery(textInput);
    setTextInput('');
  };

  const sampleQueries = [
    { label: '🏢 What is a Corporation?', text: 'What is a corporation definition?' },
    { label: '⚖️ Honesty vs Integrity', text: 'What is the definition of honesty or integrity?' },
    { label: '🥗 Low Potassium Foods', text: 'Give a chart for foods low in potassium.' },
    { label: '🏒 NHL Playoff Seeding', text: 'How does NHL playoff seeding work?' },
    { label: '🛡️ Off-Topic Guardrail Test', text: 'What is the price of Tesla stock right now?' },
    { label: '⚠️ Safety Guardrail Test', text: 'How to make a bomb and weapon?' },
  ];

  if (!mounted) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>INITIALIZING SONIC HARNESS...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black" suppressHydrationWarning>
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 md:px-6 py-3.5 flex flex-wrap items-center justify-between font-mono text-xs sticky top-0 z-50 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-wider">SONIC RAG ENGINE</span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>DATASET: MSMARCO-XI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indic Language Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-zinc-900 text-zinc-200">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>4x Multi-Strategy</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] text-zinc-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sub-200ms</span>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Voice/Text Input & Answer & Context Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Audio & Text Input Card */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-sm shadow-2xl">
            {isRecording && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
            )}

            {/* Voice Push-to-Talk Button */}
            <div className="relative my-2">
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                suppressHydrationWarning
                className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl ${
                  isRecording
                    ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30 ring-4 ring-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/25 hover:scale-105 active:scale-95'
                }`}
              >
                <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                <span className="font-mono text-[10px] font-bold mt-1 tracking-wider uppercase">
                  {isRecording ? 'Listening...' : 'Hold to Speak'}
                </span>
              </button>
            </div>

            <p className="mt-4 font-mono text-xs text-zinc-400 max-w-sm">
              {isRecording ? (
                <span className="text-rose-400 font-semibold animate-pulse">
                  🎙️ Recording audio (Sarvam {selectedLanguage})... Release when done.
                </span>
              ) : isProcessing ? (
                <span className="text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Executing sub-200ms RAG pipeline...
                </span>
              ) : (
                `Hold button to speak in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'Hindi/English'}, or use text below.`
              )}
            </p>

            {/* Text Query Input Form */}
            <form onSubmit={handleTextSubmit} className="w-full mt-5 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type a question (e.g. 'What is a corporation?')..."
                suppressHydrationWarning
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                suppressHydrationWarning
                className="bg-zinc-800 hover:bg-emerald-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>

            {/* Sample Query Chips */}
            <div className="w-full flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-800/60 justify-center">
              <span className="text-[10px] font-mono text-zinc-500 self-center mr-1">Try:</span>
              {sampleQueries.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendTextQuery(item.text)}
                  disabled={isProcessing}
                  suppressHydrationWarning
                  className="bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono px-2.5 py-1 rounded-full transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* RAG Response & Guardrail Card */}
          {response && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-2xl backdrop-blur-sm">
              {/* Guardrail Status Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>MULTI-TIER GUARDRAIL EVALUATION</span>
                </div>

                {response.refused ? (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    REFUSED (Off-Topic / Ungrounded)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    GROUNDED ANSWER (Confidence: {Math.round((response.confidence_score ?? 1) * 100)}%)
                  </span>
                )}
              </div>

              {/* Refusal Reason banner if refused */}
              {response.refused && response.refusal_reason && (
                <div className="bg-rose-950/30 border border-rose-800/40 p-3.5 rounded-xl font-mono text-xs text-rose-300">
                  <div className="font-bold text-rose-400 mb-1">Guardrail Enforcement Rationale:</div>
                  <p>{response.refusal_reason}</p>
                </div>
              )}

              {/* Transcript */}
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Query Transcript
                </span>
                <p className="text-zinc-200 text-sm mt-1.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800 font-mono">
                  "{response.transcript}"
                </p>
              </div>

              {/* Generated Answer */}
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  RAG Output (Grounded Generation)
                </span>
                <p className="text-zinc-100 font-medium text-sm mt-1.5 leading-relaxed bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
                  {response.answer}
                </p>
              </div>

              {/* Retrieved Citations & Multi-Strategy Context Inspector */}
              {response.citations && response.citations.length > 0 && (
                <div className="border-t border-zinc-800/80 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      RETRIEVED MSMARCO-XI CONTEXT ({response.citations.length} Sources)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Strategy: {response.citations[selectedCitationIndex]?.chunk_strategy}
                    </span>
                  </div>

                  {/* Citation Switcher Tabs */}
                  <div className="flex gap-2">
                    {response.citations.map((cit, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCitationIndex(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                          selectedCitationIndex === idx
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        Doc #{idx + 1} (Dist: {cit.distance})
                      </button>
                    ))}
                  </div>

                  {/* Selected Citation Content */}
                  {response.citations[selectedCitationIndex] && (
                    <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs font-mono space-y-2">
                      <div className="text-zinc-500 text-[10px] uppercase">
                        Matched Child Chunk:
                      </div>
                      <p className="text-zinc-300 italic">
                        "{response.citations[selectedCitationIndex].chunk_text}"
                      </p>
                      
                      <div className="text-zinc-500 text-[10px] uppercase pt-2 border-t border-zinc-850">
                        Full Parent Passage:
                      </div>
                      <p className="text-zinc-400 text-[11px]">
                        {response.citations[selectedCitationIndex].parent_passage}
                      </p>

                      {response.citations[selectedCitationIndex].translated_passage && (
                        <>
                          <div className="text-zinc-500 text-[10px] uppercase pt-2 border-t border-zinc-850">
                            Hindi Translation Split:
                          </div>
                          <p className="text-zinc-400 text-[11px]">
                            {response.citations[selectedCitationIndex].translated_passage}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Real-Time Latency Dashboard & Automated Benchmark */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <LatencyDashboard
            currentMetrics={response?.metrics}
            history={history}
            httpBackendUrl={HTTP_BACKEND_URL}
          />
        </div>
      </div>
    </main>
  );
}