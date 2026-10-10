import { useState, useRef, useEffect } from 'react';

// Import the worker
const DeepseekWorker = new URL('../workers/deepseek.worker.ts', import.meta.url);

// Global variable to track if model is loaded
let isModelLoaded = false;

interface UseLoadDeepseekR1ModelReturn {
  modelStatus: "idle" | "loading" | "ready" | "error";
  loadingMessage: string;
  loadingProgress: number;
  worker: Worker | null;
}

export function useLoadDeepseekR1Model(isOpen: boolean): UseLoadDeepseekR1ModelReturn {
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only load if modal is open
    if (!isOpen) {
      if (workerRef.current && !isModelLoaded) {
        console.log('Closing modal, terminating worker...');
        workerRef.current.terminate();
        workerRef.current = null;
        setModelStatus("idle");
      }
      return;
    }

    // If model is already loaded, set status to ready
    if (isModelLoaded && workerRef.current) {
      console.log('Model already loaded, using cached version');
      setModelStatus("ready");
      return;
    }

    // Prevent multiple simultaneous loading attempts
    if (loadingRef.current) {
      console.log('Already loading model...');
      return;
    }

    const loadModel = async () => {
      console.log('Starting model load...');
      try {
        loadingRef.current = true;
        setModelStatus("loading");
        setLoadingMessage("Loading AI model...");
        setLoadingProgress(0);

        // Create worker if it doesn't exist
        if (!workerRef.current) {
          console.log('Creating new worker...');
          workerRef.current = new Worker(DeepseekWorker, {
            type: "module",
          });

          // Set up message handler
          workerRef.current.addEventListener("message", (e) => {
            console.log('Worker message received:', e.data);
            const { status, data } = e.data;

            switch (status) {
              case "loading":
                setLoadingMessage(data);
                break;
              case "progress":
                if (data && typeof data === 'object' && 'progress' in data) {
                  setLoadingProgress(data.progress);
                }
                break;
              case "ready":
                console.log('Model ready!');
                setModelStatus("ready");
                setLoadingMessage("");
                isModelLoaded = true;
                loadingRef.current = false;
                break;
              case "error":
                console.error('Model error:', data);
                setModelStatus("error");
                setLoadingMessage(data);
                loadingRef.current = false;
                break;
            }
          });

          // Add error handler
          workerRef.current.addEventListener("error", (error) => {
            console.error('Worker error:', error);
            setModelStatus("error");
            setLoadingMessage(error.message);
            loadingRef.current = false;
          });
        }

        // Start loading the model
        console.log('Sending load message to worker...');
        workerRef.current.postMessage({ type: "load" });
      } catch (error) {
        console.error("Error loading model:", error);
        setModelStatus("error");
        setLoadingMessage(
          error instanceof Error ? error.message : "Failed to load model"
        );
        loadingRef.current = false;
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      if (!isModelLoaded && workerRef.current) {
        console.log('Cleaning up worker...');
        workerRef.current.terminate();
        workerRef.current = null;
        loadingRef.current = false;
      }
    };
  }, [isOpen]); // Only depend on isOpen

  return {
    modelStatus,
    loadingMessage,
    loadingProgress,
    worker: workerRef.current
  };
}
