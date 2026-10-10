import { useState, useRef, useEffect } from 'react';

// Import the worker
const LlamaWorker = new URL('../workers/llama.worker.ts', import.meta.url);

// Global variable to track if model is loaded
let isModelLoaded = false;

interface UseLoadLlama3dot2ModelReturn {
  modelStatus: "idle" | "loading" | "ready" | "error";
  loadingMessage: string;
  loadingProgress: number;
  worker: Worker | null;
}

export function useLoadLlama3dot2Model(isOpen: boolean): UseLoadLlama3dot2ModelReturn {
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    console.log('useLoadLlama3dot2Model effect triggered:', { isOpen, modelStatus, isModelLoaded });
    
    // Only load if modal is open and model isn't already loaded
    if (!isOpen || modelStatus !== "idle") {
      console.log('Early return:', { isOpen, modelStatus });
      return;
    }

    // If model is already loaded, set status to ready
    if (isModelLoaded) {
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
      console.log('Starting Llama model load...');
      try {
        loadingRef.current = true;
        setModelStatus("loading");
        setLoadingMessage("Loading AI model...");
        setLoadingProgress(0);

        // Check if WebGPU is supported
        if (!navigator.gpu) {
          console.error('WebGPU not supported');
          throw new Error("WebGPU is not supported in this browser. Please use a browser that supports WebGPU.");
        }

        // Create worker if it doesn't exist
        if (!workerRef.current) {
          console.log('Creating new Llama worker...');
          workerRef.current = new Worker(LlamaWorker, {
            type: "module",
          });

          // Set up message handler
          workerRef.current.addEventListener("message", (e) => {
            console.log('Llama worker message received:', e.data);
            const { status, data } = e.data;

            switch (status) {
              case "loading":
                console.log('Llama loading status:', data);
                setLoadingMessage(data);
                break;
              case "progress":
                if (data && typeof data === 'object' && 'progress' in data) {
                  console.log('Llama loading progress:', data.progress);
                  setLoadingProgress(data.progress);
                }
                break;
              case "ready":
                console.log('Llama model ready!');
                setModelStatus("ready");
                setLoadingMessage("");
                isModelLoaded = true;
                loadingRef.current = false;
                break;
              case "error":
                console.error('Llama model error:', data);
                setModelStatus("error");
                setLoadingMessage(data);
                loadingRef.current = false;
                break;
            }
          });

          // Add error handler
          workerRef.current.addEventListener("error", (error) => {
            console.error('Llama worker error:', error);
            setModelStatus("error");
            setLoadingMessage(error.message);
            loadingRef.current = false;
          });
        }

        // Start loading the model
        console.log('Sending load message to Llama worker...');
        workerRef.current.postMessage({ type: "check" });
        workerRef.current.postMessage({ type: "load" });
      } catch (error) {
        console.error("Error loading Llama model:", error);
        setModelStatus("error");
        setLoadingMessage(
          error instanceof Error ? error.message : "Failed to load model"
        );
        loadingRef.current = false;
      }
    };

    loadModel();

    // Cleanup function - only terminate if modal is closed and we're not caching
    return () => {
      if (!isModelLoaded && workerRef.current) {
        console.log('Cleaning up Llama worker...');
        workerRef.current.terminate();
        workerRef.current = null;
        loadingRef.current = false;
      }
    };
  }, [isOpen, modelStatus]); // Add modelStatus to dependencies

  return {
    modelStatus,
    loadingMessage,
    loadingProgress,
    worker: workerRef.current
  };
} 