'use client';

import { useState, useRef, useCallback } from 'react';

export interface LatencyMetrics {
  stt_ms: number;
  retrieval_ms: number;
  guardrail_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface RAGResponse {
  transcript: string;
  answer: string;
  grounded: boolean;
  refused: boolean;
  refusal_reason?: string;
  metrics: LatencyMetrics;
}

export function useVoiceRAG(backendWsUrl: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [history, setHistory] = useState<RAGResponse[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      wsRef.current = new WebSocket(backendWsUrl);

      wsRef.current.onopen = () => {
        setIsRecording(true);
        setIsProcessing(false);

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        };

        mediaRecorder.start(100);
      };

      wsRef.current.onmessage = (event) => {
        const data: RAGResponse = JSON.parse(event.data);
        setResponse(data);
        setHistory((prev) => [data, ...prev]);
        setIsProcessing(false);
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('Microphone Access Error:', err);
    }
  }, [backendWsUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsProcessing(true);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'EOS' }));
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    response,
    history,
    startRecording,
    stopRecording,
  };
}