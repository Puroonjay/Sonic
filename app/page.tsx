'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVoiceRAG, RetrievedCitation } from '@/src/hooks/useVoiceRAG';
import { Sidebar } from '@/src/components/Sidebar';
import { ChatHeader } from '@/src/components/ChatHeader';
import { ChatInputBar } from '@/src/components/ChatInputBar';
import { MessageItem } from '@/src/components/MessageItem';
import { SourcesDrawer } from '@/src/components/SourcesDrawer';
import { GameCharacterAvatar } from '@/src/components/GameCharacterAvatar';
import { CyberBackground } from '@/src/components/CyberBackground';
import { CharacterState } from '@/src/components/SonicCharacter';
import { SonicLogo } from '@/src/components/SonicLogo';
import { SonicSplashIntro } from '@/src/components/SonicSplashIntro';
import { sounds } from '@/src/lib/soundEffects';
import { ttsEngine } from '@/src/lib/ttsEngine';
import {
  Sparkles,
  Database,
  Layers,
  Zap,
  Mic,
  ShieldCheck
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (Indian)' },
  { code: 'hi-IN', label: '🇮🇳 Hindi (हिन्दी)' },
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

  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    liveTranscript,
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


  const handleNewChat = () => {
    window.location.reload();
  };

  const handleSelectHistoryItem = (transcript: string) => {
    sendTextQuery(transcript);
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);

  if (!mounted) {
    return <SonicSplashIntro onComplete={() => {}} />;
  }

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Dynamic Animated Startup Logo Intro */}
      {showIntro && (
        <SonicSplashIntro onComplete={() => setShowIntro(false)} />
      )}

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
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={() => setIsAudioEnabled((prev) => !prev)}
          selectedLanguageLabel={selectedLangObj?.label || 'English (Indian)'}
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
                  onTriggerQuery={(q) => sendTextQuery(q)}
                  onStartVoice={startRecording}
                />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
                  Where knowledge meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">voice speed</span>.
                </h2>
                <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                  Ultra-fast grounded AI assistant on the <strong>MSMARCO-XI</strong> Indic benchmark with 4x multi-strategy vector retrieval & multi-tier guardrails.
                </p>
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
                    onTriggerQuery={(q) => sendTextQuery(q)}
                    onStartVoice={startRecording}
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

        {/* Bottom Floating Input Dock */}
        <ChatInputBar
          onSendMessage={sendTextQuery}
          isProcessing={isProcessing}
          isRecording={isRecording}
          audioLevel={audioLevel}
          liveTranscript={liveTranscript}
          onToggleRecording={toggleRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          selectedLanguage={selectedLanguage}
        />
      </div>

      {/* Slide-over Deep Citation Modal (Perplexity Sources Drawer) */}
      <SourcesDrawer
        citation={activeCitationModal?.citation || null}
        index={activeCitationModal?.index || 0}
        onClose={() => setActiveCitationModal(null)}
      />
    </div>
  );
}