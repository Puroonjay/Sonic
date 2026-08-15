'use client';

/**
 * Universal Indic Text-to-Speech Engine with strict de-duplication
 * Priority 1: High-Fidelity Server-Side Audio Stream (/api/tts - gTTS Indic Engine)
 * Priority 2: Native Web Speech API with explicit Indic voice resolution
 */
class UniversalIndicTTSEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private backendUrl: string = process.env.NEXT_PUBLIC_HTTP_BACKEND_URL || '';
  private lastSpokenText: string = '';
  private lastSpokenTimestamp: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public setBackendUrl(url: string) {
    this.backendUrl = url;
  }

  public stop() {
    // 1. Stop any HTML5 audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // 2. Stop browser speech synthesis
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public async speak(
    text: string,
    langCode: string = 'en-IN',
    onEnd?: () => void,
    onError?: () => void,
    force: boolean = false
  ) {
    if (!text.trim()) return;

    const trimmed = text.trim();
    const now = Date.now();

    // Prevent duplicate triggers of the exact same utterance within 3.5 seconds
    if (!force && this.lastSpokenText === trimmed && now - this.lastSpokenTimestamp < 3500) {
      return;
    }

    this.lastSpokenText = trimmed;
    this.lastSpokenTimestamp = now;

    this.stop();

    // Strategy A: Server-side Indic TTS via /api/tts (Crystal clear Hindi, Tamil, Telugu, Marathi, etc.)
    try {
      const baseUrl = this.backendUrl ? this.backendUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          language_code: langCode,
        }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.fallbackBrowserSpeech(trimmed, langCode, onEnd, onError);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Server TTS unavailable, trying browser synthesis fallback:', e);
    }

    // Strategy B: Browser Web Speech API fallback
    this.fallbackBrowserSpeech(trimmed, langCode, onEnd, onError);
  }

  private fallbackBrowserSpeech(
    text: string,
    langCode: string,
    onEnd?: () => void,
    onError?: () => void
  ) {
    if (!this.synth) {
      if (onError) onError();
      return;
    }

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voices.length === 0) {
        this.loadVoices();
      }

      const primaryCode = langCode.toLowerCase().split('-')[0];
      const matchingVoice = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(primaryCode) ||
          v.name.toLowerCase().includes(primaryCode) ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi')
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        utterance.lang = matchingVoice.lang;
      } else {
        utterance.lang = langCode;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Browser Speech warning:', e);
        if (onError) onError();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.error('Browser TTS fallback error:', err);
      if (onError) onError();
    }
  }
}

export const ttsEngine = new UniversalIndicTTSEngine();
