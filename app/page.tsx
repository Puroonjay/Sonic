'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVoiceRAG, RetrievedCitation } from '@/src/hooks/useVoiceRAG';
import { Sidebar } from '@/src/components/Sidebar';
import { ChatHeader } from '@/src/components/ChatHeader';
import { ChatInputBar } from '@/src/components/ChatInputBar';
import { MessageItem } from '@/src/components/MessageItem';
import { SourcesDrawer } from '@/src/components/SourcesDrawer';
import { LatencyTelemetryDrawer } from '@/src/components/LatencyTelemetryDrawer';
import { GameCharacterAvatar } from '@/src/components/GameCharacterAvatar';
import { CyberBackground } from '@/src/components/CyberBackground';
import { CharacterState } from '@/src/components/SonicCharacter';
import { sounds } from '@/src/lib/soundEffects';
import { ttsEngine } from '@/src/lib/ttsEngine';
import {
  Sparkles,
  Database,
  Layers,
  Zap,
  Mic,
  ArrowRight,
  ShieldCheck
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

export default function SonicProfessionalStudio() {
  const [wsUrl, setWsUrl] = useState<string>(
    process.env.NEXT_PUBLIC_WS_BACKEND_URL || 'ws://localhost:8000/ws/rag'
  );
  const HTTP_BACKEND_URL = process.env.NEXT_PUBLIC_HTTP_BACKEND_URL || '';

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_WS_BACKEND_URL && typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      setWsUrl(`${proto}//${window.location.host}/ws/rag`);
    }
  }, []);

  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeCitationModal, setActiveCitationModal] = useState<{
    citation: RetrievedCitation;
    index: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    isProcessing,
    audioLevel,
    response,
    history,
    startRecording,
    stopRecording,
    toggleRecording,
    sendTextQuery,
  } = useVoiceRAG(wsUrl, HTTP_BACKEND_URL, selectedLanguage);

  useEffect(() => {
    setMounted(true);
    ttsEngine.setBackendUrl(HTTP_BACKEND_URL);
  }, [HTTP_BACKEND_URL]);

  useEffect(() => {
    sounds.setMuted(!isAudioEnabled);
    if (!isAudioEnabled) {
      ttsEngine.stop();
    }
  }, [isAudioEnabled]);

  const lastSpokenAnswerRef = useRef<string>('');

  // Automatically narrate grounded answers out loud by default (strictly once per new answer)
  useEffect(() => {
    if (
      response?.answer &&
      isAudioEnabled &&
      !response.refused &&
      lastSpokenAnswerRef.current !== response.answer
    ) {
      lastSpokenAnswerRef.current = response.answer;
      ttsEngine.speak(response.answer, selectedLanguage);
    }
  }, [response, isAudioEnabled, selectedLanguage]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isProcessing]);

  // Determine dynamic character state
  let characterState: CharacterState = 'idle';
  if (isRecording) {
    characterState = 'listening';
  } else if (isProcessing) {
    characterState = 'thinking';
  } else if (response) {
    characterState = response.refused ? 'refusal' : 'speaking';
  }

  const sampleQueries = [
    { label: ' What is a Corporation?', text: 'What is a corporation definition?' },
    { label: ' Honesty vs Integrity', text: 'What is the definition of honesty or integrity?' },
    { label: ' Low Potassium Foods', text: 'Give a chart for foods low in potassium.' },
    { label: ' NHL Playoff Seeding', text: 'How does NHL playoff seeding work?' },
    { label: ' Off-Topic Guardrail Test', text: 'What is the price of Tesla stock right now?' },
    { label: ' Safety Guardrail Test', text: 'How to make a bomb and weapon?' },
  ];

  const handleNewChat = () => {
    window.location.reload();
  };

  const handleSelectHistoryItem = (transcript: string) => {
    sendTextQuery(transcript);
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>INITIALIZING PROFESSIONAL SONIC AI ENGINE...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* 60 FPS Ambient Cyber Background */}
      <CyberBackground isListening={isRecording} isProcessing={isProcessing} />

      {/* Left Collapsible Navigation Sidebar (ChatGPT/Perplexity Style) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        languages={SUPPORTED_LANGUAGES}
        history={history.map((h) => ({
          transcript: h.transcript,
          timestamp: 'Just now',
        }))}
        onSelectHistoryItem={handleSelectHistoryItem}
        onNewChat={handleNewChat}
        activeChatCount={history.length}
      />

      {/* Main Studio Arena */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header Bar */}
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleTelemetry={() => setIsTelemetryOpen((prev) => !prev)}
          isTelemetryOpen={isTelemetryOpen}
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={() => setIsAudioEnabled((prev) => !prev)}
          selectedLanguageLabel={selectedLangObj?.label || 'Hindi'}
        />

        {/* Scrollable Main Conversational Canvas */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8">
          {history.length === 0 ? (
            /* Empty / Hero Starting State (Gemini & Perplexity Style) */
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[68vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-400">
              
              {/* Interactive Sonic AI Companion in Hero */}
              <div className="relative">
                <GameCharacterAvatar
                  state={characterState}
                  transcript={response?.transcript}
                  responseAnswer={response?.answer}
                  languageCode={selectedLanguage}
                  isAudioPlaying={isAudioEnabled}
                  onAudioToggle={() => setIsAudioEnabled((prev) => !prev)}
                />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
                  Where knowledge meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">voice speed</span>.
                </h2>
                <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                  Sub-200ms grounded AI assistant on the <strong>MSMARCO-XI</strong> Indic benchmark with 4x multi-strategy vector retrieval & multi-tier guardrails.
                </p>
              </div>

              {/* Quick Suggestion Cards Grid (Perplexity / ChatGPT Style) */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {sampleQueries.slice(0, 6).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sounds.playBlip();
                      sendTextQuery(item.text);
                    }}
                    disabled={isProcessing}
                    className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/90 hover:border-emerald-500/40 text-left transition-all group shadow-sm hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-40"
                  >
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 flex items-center justify-between">
                      <span>{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1 font-mono">
                      "{item.text}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversational Feed */
            <div className="max-w-3xl mx-auto space-y-8 pb-4">
              {/* Mini Companion HUD at top of feed */}
              <div className="flex items-center justify-center py-2">
                <div className="scale-75 origin-center">
                  <GameCharacterAvatar
                    state={characterState}
                    transcript={response?.transcript}
                    responseAnswer={response?.answer}
                    languageCode={selectedLanguage}
                    isAudioPlaying={isAudioEnabled}
                    onAudioToggle={() => setIsAudioEnabled((prev) => !prev)}
                  />
                </div>
              </div>

              {/* Chronological Message Items (Reversed list for top-to-bottom timeline) */}
              {[...history].reverse().map((item, idx, arr) => (
                <MessageItem
                  key={idx}
                  response={item}
                  languageCode={selectedLanguage}
                  onOpenSourceModal={(citation, citIdx) =>
                    setActiveCitationModal({ citation, index: citIdx })
                  }
                  isLatest={idx === arr.length - 1}
                  isAudioPlaying={isAudioEnabled}
                  onToggleAudio={() => setIsAudioEnabled((prev) => !prev)}
                />
              ))}

              {/* Loading Indicator while processing */}
              {isProcessing && (
                <div className="flex items-center gap-3 max-w-3xl mr-auto animate-in fade-in duration-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 text-xs">
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Searching LanceDB vector store & synthesizing grounded answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Floating Input Dock (ChatGPT & Perplexity Signature Component) */}
        <ChatInputBar
          onSendMessage={sendTextQuery}
          isProcessing={isProcessing}
          isRecording={isRecording}
          audioLevel={audioLevel}
          onToggleRecording={toggleRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          sampleQueries={sampleQueries}
          selectedLanguage={selectedLanguage}
        />
      </div>

      {/* Slide-over Deep Citation Modal (Perplexity Sources Drawer) */}
      <SourcesDrawer
        citation={activeCitationModal?.citation || null}
        index={activeCitationModal?.index || 0}
        onClose={() => setActiveCitationModal(null)}
      />

      {/* Slide-over Telemetry HUD Drawer */}
      <LatencyTelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        currentMetrics={response?.metrics}
        history={history}
        httpBackendUrl={HTTP_BACKEND_URL}
      />
    </div>
  );
}