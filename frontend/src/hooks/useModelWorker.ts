import { create } from 'zustand';
import { ModelType } from '../types/model';
import { useLoadDeepseekR1Model } from './useLoadDeepseekR1Model';
import { useLoadLlama3dot2Model } from './useLoadLlama3dot2Model';
import { useEffect, useMemo } from 'react';

interface ModelWorkerState {
  selectedModel: ModelType;
  worker: Worker | null;
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  loadingMessage: string;
  loadingProgress: number;
  setSelectedModel: (model: ModelType) => void;
  setWorker: (worker: Worker | null) => void;
}

// Create a global store for model worker state
const useModelWorkerStore = create<ModelWorkerState>((set) => ({
  selectedModel: 'deepseek',
  worker: null,
  modelStatus: 'idle',
  loadingMessage: '',
  loadingProgress: 0,
  setSelectedModel: (model) => set({ selectedModel: model }),
  setWorker: (worker) => set({ worker }),
}));

// Define model loaders - add new models here
const MODEL_LOADERS = {
  deepseek: useLoadDeepseekR1Model,
  llama: useLoadLlama3dot2Model,
  // Add more models here following the same pattern:
  // modelId: useLoadModelHook,
} as const;

export function useModelWorker(isOpen: boolean) {
  const { 
    selectedModel, 
    setSelectedModel, 
    setWorker 
  } = useModelWorkerStore();

  // Get the loader for the selected model
  const selectedLoader = useMemo(() => {
    return MODEL_LOADERS[selectedModel as keyof typeof MODEL_LOADERS];
  }, [selectedModel]);

  // Load only the selected model
  const modelState = selectedLoader(isOpen);
  const { modelStatus, loadingMessage, loadingProgress, worker } = modelState;

  // Update worker in store when it changes
  useEffect(() => {
    setWorker(worker);
    // Cleanup when unmounting or changing models
    return () => {
      if (worker) {
        worker.terminate();
        setWorker(null);
      }
    };
  }, [worker, setWorker, selectedModel]);

  return {
    selectedModel,
    setSelectedModel,
    worker,
    modelStatus,
    loadingMessage,
    loadingProgress,
    getCurrentWorker: () => useModelWorkerStore.getState().worker,
  };
} 