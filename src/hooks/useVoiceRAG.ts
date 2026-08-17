'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface LatencyMetrics {
  stt_ms: number;
  retrieval_ms: number;
  guardrail_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface RetrievedCitation {
  chunk_text: string;
  parent_passage: string;
  translated_passage?: string;
  chunk_strategy: string;
  distance: number;
  query_id: string;
}

export interface RAGResponse {
  transcript: string;
  answer: string;
  grounded: boolean;
  refused: boolean;
  refusal_reason?: string;
  confidence_score?: number;
  citations?: RetrievedCitation[];
  metrics: LatencyMetrics;
  model_used?: string;
}

export function useVoiceRAG(
  backendWsUrl?: string,
  httpBackendUrl: string = '',
  languageCode: string = 'en-IN'
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [history, setHistory] = useState<RAGResponse[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false);

  // Send audio payload via direct HTTP endpoint with strict timeout safeguards
  const processAudioBlob = useCallback(
    async (blob: Blob) => {
      setIsProcessing(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setIsProcessing(false);
      }, 9000);

      try {
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        formData.append('language_code', languageCode);

        const baseUrl = httpBackendUrl ? httpBackendUrl.replace(/\/$/, '') : '';
        const res = await fetch(`${baseUrl}/api/voice`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data: RAGResponse = await res.json();
        setResponse(data);
        if (data.transcript || data.answer) {
          setHistory((prev) => [data, ...prev]);
        }
      } catch (err: unknown) {
        console.error('Voice Processing Error:', err);
        const errMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Query timed out. Please verify your backend server is responding.'
            : 'Could not connect to the backend server. Please verify FastAPI is running on port 8000.';

        const fallbackResponse: RAGResponse = {
          transcript: 'Audio Query',
          answer: errMessage,
          grounded: false,
          refused: false,
          confidence_score: 0.0,
          citations: [],
          metrics: {
            stt_ms: 0,
            retrieval_ms: 0,
            guardrail_ms: 0,
            generation_ms: 0,
            total_ms: 0,
          },
        };
        setResponse(fallbackResponse);
      } finally {
        clearTimeout(timeoutId);
        setIsProcessing(false);
      }
    },
    [httpBackendUrl, languageCode]
  );

  const stopRecording = useCallback(() => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }

    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setLiveTranscript('');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current || isRecording) return;
    isStartingRef.current = true;

    try {
      audioChunksRef.current = [];
      setLiveTranscript('');
      hasSpokenRef.current = false;
      lastSpeechTimeRef.current = Date.now();

      // Start continuous interval VAD ticker (polls every 100ms)
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
      }
      silenceIntervalRef.current = setInterval(() => {
        const timeSinceActivity = Date.now() - lastSpeechTimeRef.current;
        if (hasSpokenRef.current) {
          // 2.5s thinking buffer: auto-sends when user pauses for 2500ms
          if (timeSinceActivity >= 2500) {
            stopRecording();
          }
        } else {
          // 2.5s no-speech timeout: auto-closes if nothing is spoken for 2.5s
          if (timeSinceActivity >= 2500) {
            stopRecording();
          }
        }
      }, 100);

      // Start Google Assistant-style speech recognition (single-turn query mode)
      if (typeof window !== 'undefined') {
        const SpeechRec =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.continuous = false; // Google Assistant mode: auto-detects sentence completion
            rec.interimResults = true;
            rec.lang = languageCode;

            rec.onresult = (event: any) => {
              let textAccumulator = '';
              let isFinalSentence = false;
              for (let i = 0; i < event.results.length; ++i) {
                textAccumulator += event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  isFinalSentence = true;
                }
              }
              if (textAccumulator.trim()) {
                setLiveTranscript(textAccumulator.trim());
                hasSpokenRef.current = true;
                lastSpeechTimeRef.current = Date.now();

                // Clear previous finalize timer and set 2.5s thinking grace period
                if (finalizeTimerRef.current) {
                  clearTimeout(finalizeTimerRef.current);
                }
                finalizeTimerRef.current = setTimeout(() => {
                  stopRecording();
                }, 2500);
              }
            };

            // Speech-End detection with 2.5s thinking grace period
            rec.onspeechend = () => {
              if (hasSpokenRef.current) {
                if (finalizeTimerRef.current) {
                  clearTimeout(finalizeTimerRef.current);
                }
                finalizeTimerRef.current = setTimeout(() => {
                  stopRecording();
                }, 2500);
              }
            };

            rec.onend = () => {
              if (hasSpokenRef.current) {
                if (finalizeTimerRef.current) {
                  clearTimeout(finalizeTimerRef.current);
                }
                finalizeTimerRef.current = setTimeout(() => {
                  stopRecording();
                }, 2500);
              }
            };

            rec.onerror = () => {};
            rec.start();
            recognitionRef.current = rec;
          } catch (e) {
            // SpeechRecognition is optional / progressive enhancement
          }
        }
      }

      // Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio Volume Meter & Adaptive Energy VAD
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let sampleCount = 0;
        let ambientFloor = 0.08;

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const currentLevel = Math.min(1, avg / 75);
          setAudioLevel(currentLevel);

          // Calibrate ambient noise floor during first 20 frames
          if (sampleCount < 20) {
            ambientFloor = Math.max(0.05, Math.min(0.25, currentLevel));
            sampleCount++;
          }

          // Distinguish actual speech from ambient microphone noise
          const speechThreshold = Math.max(0.30, ambientFloor + 0.15);
          if (currentLevel > speechThreshold) {
            hasSpokenRef.current = true;
            lastSpeechTimeRef.current = Date.now();
          }

          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {
        // Meter setup failure is non-fatal
      }

      // Pick supported MIME type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (silenceIntervalRef.current) {
          clearInterval(silenceIntervalRef.current);
          silenceIntervalRef.current = null;
        }

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        setAudioLevel(0);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        if (audioBlob.size > 100) {
          processAudioBlob(audioBlob);
        } else {
          setIsProcessing(false);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('Mic Access Error:', err);
      setIsRecording(false);
      setIsProcessing(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [isRecording, languageCode, processAudioBlob, stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const sendTextQuery = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setIsProcessing(false);
      }, 9000);

      try {
        const baseUrl = httpBackendUrl ? httpBackendUrl.replace(/\/$/, '') : '';
        const res = await fetch(`${baseUrl}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language_code: languageCode,
            bypass_stt: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data: RAGResponse = await res.json();
        setResponse(data);
        setHistory((prev) => [data, ...prev]);
      } catch (err: unknown) {
        console.error('API Query Error:', err);
        const errMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Query timed out. Please verify your backend server is responding.'
            : 'Could not connect to the backend server. Please verify FastAPI is running on port 8000.';

        const fallbackResponse: RAGResponse = {
          transcript: text,
          answer: errMessage,
          grounded: false,
          refused: false,
          confidence_score: 0.0,
          citations: [],
          metrics: {
            stt_ms: 0,
            retrieval_ms: 0,
            guardrail_ms: 0,
            generation_ms: 0,
            total_ms: 0,
          },
        };
        setResponse(fallbackResponse);
      } finally {
        clearTimeout(timeoutId);
        setIsProcessing(false);
      }
    },
    [httpBackendUrl, languageCode]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
      }
      if (finalizeTimerRef.current) {
        clearTimeout(finalizeTimerRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
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
  };
}