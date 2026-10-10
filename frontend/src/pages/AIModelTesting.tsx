import { useState } from "react";
import {
  ModelSelector,
} from "../components/ai-model/ModelSelector";
import { actions, ActionType } from "../types/model";

export default function AIModelTesting() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>("video");

  const handleModelSelect = (selectedWorker: Worker | null) => {
    setWorker(selectedWorker);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            AI Model Testing
          </h1>

          {/* Action Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Action Type
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`p-4 rounded-lg border ${
                    selectedAction === action.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-300 dark:border-gray-700"
                  } hover:border-indigo-500 transition-colors`}
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <ModelSelector
              isOpen={true}
              onModelSelect={handleModelSelect}
              action={selectedAction}
            />
          </div>

          {/* Model Status */}
          <div className="mt-8 text-center">
            <p className="text-gray-700 dark:text-gray-300">
              {worker
                ? "Model loaded and ready"
                : "Select a model to begin testing"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
