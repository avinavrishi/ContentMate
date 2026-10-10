import { useState } from "react";
import { IdeaInputModalProps } from "../types/video";
import { useAnalyzePrompt } from "../hooks/useAnalyzePrompt";
import { ModelSelector } from "./ai-model/ModelSelector";
import { useModelWorker } from "../hooks/useModelWorker";

export function IdeaInputModal({
  isOpen,
  onClose,
  onSubmit,
  analyzing,
  setAnalyzing,
}: IdeaInputModalProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  
  // Use the model worker hook directly
  const { worker, modelStatus } = useModelWorker(isOpen);
  const { analyzePrompt } = useAnalyzePrompt();

  const handleSubmit = async () => {
    if (!worker) return;

    try {
      setAnalyzing(true);
      const analysis = await analyzePrompt(prompt, worker);
      console.log("Prompt analysis:", analysis);
      onSubmit(prompt, duration, analysis);
      setPrompt("");
      setDuration(5);
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      // You might want to show an error message to the user here
    } finally {
      setAnalyzing(false);
    }
  };

  const isDisabled = analyzing || !prompt || modelStatus !== 'ready';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-8 shadow-xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal header */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Create New Video
            </h2>

            <div className="space-y-6">
              {/* Model Selector */}
              <ModelSelector isOpen={isOpen} />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Idea prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Eg: Motivating video on the benefits of eating healthy diet and exercising"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Duration: {duration} seconds
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {analyzing
                    ? "Analyzing..."
                    : modelStatus !== 'ready'
                    ? "Loading Model..."
                    : !prompt
                    ? "Enter Prompt"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
