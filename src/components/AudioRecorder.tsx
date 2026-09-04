import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Loader2, AlertCircle, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  language: "tw" | "en";
}

export default function AudioRecorder({ onTranscriptionComplete, disabled, language }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio visualization state
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 40, 60, 30, 70, 50, 30, 40, 20]);
  const [volume, setVolume] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up audio context and timers on unmount
  useEffect(() => {
    return () => {
      stopAudioVisualization();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startAudioVisualization = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        const barCount = 9;
        const step = Math.max(1, Math.floor(bufferLength / barCount));
        const levels: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          // Scale height percentage between 15% and 100%
          const heightPct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
          levels.push(heightPct);
        }

        const avgVolume = sum / (bufferLength || 1);
        setVolume(avgVolume / 255);
        setAudioLevels(levels);

        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (e) {
      console.warn("Audio visualization setup failed:", e);
    }
  };

  const stopAudioVisualization = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToBackend(audioBlob);
        
        // Stop all tracks on the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start Web Audio API visualizer
      startAudioVisualization(stream);

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to access microphone:", err);
      const isEnglish = language === "en";
      setErrorMessage(
        isEnglish
          ? "Microphone access denied or unsupported. Please check your browser permissions."
          : "Yɛntumi nnya microphone tumi. Yɛserɛ wo ma ho kwan."
      );
    }
  };

  const stopRecording = () => {
    stopAudioVisualization();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopAudioVisualization();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach((track) => track.stop());
      
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const sendAudioToBackend = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("language", language);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.transcript && data.transcript.trim()) {
        onTranscriptionComplete(data.transcript);
      } else {
        const isEnglish = language === "en";
        setErrorMessage(
          isEnglish
            ? "Nothing was heard. Please speak clearly."
            : "Anye hwee firi nsa no mu. Meserɛ wo kasa mprepren."
        );
      }
    } catch (err: any) {
      console.error("ASR transcription failed:", err);
      const isEnglish = language === "en";
      setErrorMessage(
        isEnglish
          ? "Speech recognition failed. Try speaking again or typing your message."
          : "Speech recognition failed. Try speaking again or typing your message."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isEnglish = language === "en";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 dark:bg-zinc-900 border border-red-500/30 shadow-xl max-w-md w-full"
          >
            {/* Real-time Status & Live Pulse Indicator */}
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-400 font-mono tracking-wider">
                  {isEnglish ? "LIVE VOICE INPUT" : "EKYERE WO KASA (RECORDING)"}
                </span>
              </div>

              <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* REAL-TIME DYNAMIC EQUALIZER WAVEFORM BARS */}
            <div className="flex items-center justify-center gap-1.5 h-12 w-full px-4 py-2 bg-zinc-950/80 rounded-xl border border-zinc-800/80 overflow-hidden">
              {audioLevels.map((lvl, idx) => (
                <motion.div
                  key={idx}
                  className="w-1.5 sm:w-2 bg-gradient-to-t from-[#FF5A36] via-red-500 to-amber-400 rounded-full"
                  animate={{ height: `${lvl}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ minHeight: "15%" }}
                />
              ))}
            </div>

            {/* Action Buttons with Radial Audio Pulse Rings */}
            <div className="flex items-center gap-4 mt-1">
              {/* Cancel Button */}
              <button
                onClick={cancelRecording}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all active:scale-95 cursor-pointer border border-zinc-700/80"
                title={isEnglish ? "Cancel Recording" : "Popae (Cancel)"}
                id="cancel-rec-btn"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Pulsing Stop & Send Button */}
              <div className="relative flex items-center justify-center">
                {/* Dynamic voice volume pulse ring 1 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500/30"
                  animate={{
                    scale: [1, 1.25 + volume * 0.5, 1],
                    opacity: [0.6, 0.2, 0.6]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Dynamic voice volume pulse ring 2 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#FF5A36]/40"
                  animate={{
                    scale: [1, 1.5 + volume * 0.7, 1],
                    opacity: [0.4, 0, 0.4]
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                />

                <button
                  onClick={stopRecording}
                  className="relative z-10 p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  title={isEnglish ? "Stop & Transcribe" : "Gyae na kyere ase (Stop & Send)"}
                  id="stop-rec-btn"
                >
                  <Square className="h-5 w-5 fill-current" />
                </button>
              </div>

              {/* Live Signal Indicator */}
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>{volume > 0.05 ? (isEnglish ? "Audio detected" : "Audio detected") : (isEnglish ? "Listening..." : "Mereyɛ aso...")}</span>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center"
          >
            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              className={`p-4 rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer ${
                disabled || isProcessing
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-[#FF5A36] text-white hover:bg-[#E54E2E] shadow-lg shadow-[#FF5A36]/25 hover:scale-105"
              }`}
              title={isEnglish ? "Speak in English" : "Kasa wo Twi mu (Speak in Twi)"}
              id="start-rec-btn"
            >
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isProcessing && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse font-medium text-center">
          {isEnglish 
            ? "Transcribing your voice input..." 
            : "Yɛre kyerɛ wo kasa no ase gu Twi nkyerɛwee mu... (Transcribing your speech...)"}
        </span>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 max-w-xs text-center font-sans">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

