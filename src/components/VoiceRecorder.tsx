"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, duration: number, pauseData: number[]) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export function VoiceRecorder({ onTranscriptComplete, isListening, onListeningChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimesRef = useRef<number[]>([]);
  const lastSpeechTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Your browser doesn't support voice recognition. Please use Chrome or Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        startTimeRef.current = Date.now();
        lastSpeechTimeRef.current = Date.now();
        pauseTimesRef.current = [];
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const currentTime = Date.now();

        // Detect pause (if more than 500ms since last speech)
        if (currentTime - lastSpeechTimeRef.current > 500) {
          pauseTimesRef.current.push(currentTime - lastSpeechTimeRef.current);
        }
        lastSpeechTimeRef.current = currentTime;

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + " ";
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript((prev) => prev + finalTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Error: ${event.error}`);
        setIsRecording(false);
        onListeningChange(false);
      };

      recognition.onend = () => {
        if (isRecording) {
          // Restart if still should be recording
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not available");
      return;
    }

    setError("");
    setIsRecording(true);
    onListeningChange(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Error starting recognition:", err);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;

    setIsRecording(false);
    onListeningChange(false);
    recognitionRef.current.stop();

    // Calculate duration in seconds
    const duration = (Date.now() - startTimeRef.current) / 1000;

    // Pass data to parent
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim(), duration, pauseTimesRef.current);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            disabled={isListening}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Speaking
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-xl font-semibold text-red-600">Recording...</span>
            </div>

            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop & Submit
            </Button>
          </div>
        )}
      </div>

      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Your answer (live transcript):</div>
          <div className="text-gray-900">{transcript}</div>
        </div>
      )}
    </div>
  );
}
