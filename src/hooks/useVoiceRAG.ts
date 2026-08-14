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
}

export function useVoiceRAG(
  backendWsUrl: string,
  httpBackendUrl: string = 'http://localhost:8000',
  languageCode: string = 'hi-IN'
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [history, setHistory] = useState<RAGResponse[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);

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

        const res = await fetch(`${httpBackendUrl}/api/voice`, {
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

  const startRecording = useCallback(async () => {
    if (isStartingRef.current || isRecording) return;
    isStartingRef.current = true;

    try {
      audioChunksRef.current = [];

      // Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio Volume Meter
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
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1, avg / 75));
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
  }, [isRecording, processAudioBlob]);

  const stopRecording = useCallback(() => {
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
        const res = await fetch(`${httpBackendUrl}/api/query`, {
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
    response,
    history,
    startRecording,
    stopRecording,
    toggleRecording,
    sendTextQuery,
  };
}