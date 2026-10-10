import { useState, useEffect, useRef, useCallback } from "react";

const KokoroWorker = new URL("../workers/kokoro.worker.ts", import.meta.url);

interface UseKokoroTTSReturn {
  status: "idle" | "loading" | "ready" | "generating" | "error";
  progress: number;
  message: string;
  generateAudio: (text: string, voiceId: string) => Promise<ArrayBuffer>;
  isReady: boolean;
}

export function useKokoroTTS(): UseKokoroTTSReturn {
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "generating" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: ArrayBuffer) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(KokoroWorker, { type: "module" });

      workerRef.current.addEventListener("message", (event) => {
        const {
          status: workerStatus,
          message: workerMessage,
          progress: workerProgress,
          audio,
        } = event.data;

        switch (workerStatus) {
          case "loading":
            setStatus("loading");
            setMessage(workerMessage);
            break;

          case "progress":
            setProgress(workerProgress);
            break;

          case "ready":
            setStatus("ready");
            setMessage("");
            break;

          case "generating":
            setStatus("generating");
            setMessage(workerMessage);
            break;

          case "complete":
            setStatus("ready");
            setMessage("");
            if (resolveRef.current) {
              resolveRef.current(audio);
              resolveRef.current = null;
            }
            break;

          case "error":
            setStatus("error");
            setMessage(workerMessage);
            if (rejectRef.current) {
              rejectRef.current(new Error(workerMessage));
              rejectRef.current = null;
            }
            break;
        }
      });

      // Initialize the worker
      workerRef.current.postMessage({ type: "init" });
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const generateAudio = useCallback(
    async (text: string, voiceId: string): Promise<ArrayBuffer> => {
      if (!workerRef.current) {
        throw new Error("Worker not initialized");
      }

      return new Promise((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;
        workerRef.current?.postMessage({
          type: "generate",
          data: { text, voiceId },
        });
      });
    },
    []
  );

  return {
    status,
    progress,
    message,
    generateAudio,
    isReady: status === "ready",
  };
}
