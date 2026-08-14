'use client';

import { useState, useRef, useCallback } from 'react';

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
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [history, setHistory] = useState<RAGResponse[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const wsUrlWithLang = `${backendWsUrl}?language_code=${encodeURIComponent(languageCode)}`;
      wsRef.current = new WebSocket(wsUrlWithLang);

      wsRef.current.onopen = () => {
        setIsRecording(true);
        setIsProcessing(false);

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: RAGResponse = JSON.parse(event.data);
          setResponse(data);
          setHistory((prev) => [data, ...prev]);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
        setIsProcessing(false);
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('Microphone Access Error:', err);
    }
  }, [backendWsUrl, languageCode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsProcessing(true);

      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const fullAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          fullAudioBlob.arrayBuffer().then((buf) => {
            wsRef.current?.send(buf);
          });
        }
      }, 150);
    }
  }, [isRecording]);

  const sendTextQuery = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${httpBackendUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language_code: languageCode, bypass_stt: true }),
      });
      const data: RAGResponse = await res.json();
      setResponse(data);
      setHistory((prev) => [data, ...prev]);
    } catch (err) {
      console.error('API Query Error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [httpBackendUrl, languageCode]);

  return {
    isRecording,
    isProcessing,
    response,
    history,
    startRecording,
    stopRecording,
    sendTextQuery,
  };
}