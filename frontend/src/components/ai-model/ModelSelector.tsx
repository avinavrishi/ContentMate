import { useState, useEffect } from 'react';
import { ActionType, ModelType } from '../../types/model';
import { useModelWorker } from '../../hooks/useModelWorker';

interface ModelSelectorProps {
  isOpen: boolean;
  onModelSelect?: (worker: Worker | null) => void;
  action?: ActionType;
  className?: string;
  showLabel?: boolean;
}

interface ModelOption {
  id: ModelType;
  name: string;
  recommendedFor: ActionType[];
  features: string[];
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek R1',
    recommendedFor: ['video', 'social'],
    features: [
      'Optimized for short-form content',
      'Fast response time',
      'Efficient resource usage',
      'Best for videos under 2 minutes'
    ]
  },
  {
    id: 'llama',
    name: 'Llama 3.2',
    recommendedFor: ['blog', 'presentation'],
    features: [
      'Advanced reasoning capabilities',
      'Better context understanding',
      'Handles complex topics well',
      'Ideal for detailed content'
    ]
  },
];

export function ModelSelector({ 
  isOpen, 
  onModelSelect, 
  action,
  className = '',
  showLabel = true
}: ModelSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelType | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const {
    selectedModel,
    setSelectedModel,
    worker,
    modelStatus,
    loadingMessage,
    loadingProgress
  } = useModelWorker(isOpen);

  useEffect(() => {
    if (!isDropdownOpen) {
      setHoveredModel(null);
      setTooltipPosition(null);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (action) {
      const recommendedModel = MODEL_OPTIONS.find(model => model.recommendedFor.includes(action));
      if (recommendedModel) {
        setSelectedModel(recommendedModel.id);
      }
    }
  }, [action, setSelectedModel]);

  const handleModelSelect = (modelType: ModelType) => {
    setSelectedModel(modelType);
    setIsDropdownOpen(false);
    setHoveredModel(null);
    setTooltipPosition(null);
    onModelSelect?.(worker);
  };

  const handleMouseEnter = (modelId: ModelType, event: React.MouseEvent) => {
    if (!isDropdownOpen) return;
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + window.scrollY,
      left: rect.right + window.scrollX + 8
    });
    setHoveredModel(modelId);
  };

  const handleMouseLeave = () => {
    setHoveredModel(null);
    setTooltipPosition(null);
  };

  const selectedModelOption = MODEL_OPTIONS.find(model => model.id === selectedModel);
  const sortedModels = action 
    ? [...MODEL_OPTIONS].sort((a, b) => {
        const aRecommended = a.recommendedFor.includes(action) ? 1 : 0;
        const bRecommended = b.recommendedFor.includes(action) ? 1 : 0;
        return bRecommended - aRecommended;
      })
    : MODEL_OPTIONS;

  return (
    <div className={`relative ${className}`} style={{ maxWidth: '200px' }}>
      <div className="mb-1">
        {showLabel && (
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
            AI Model
          </label>
        )}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={modelStatus === 'loading'}
            className="w-full flex justify-between items-center px-2 py-1 border border-violet-200 rounded-md shadow-sm text-xs bg-white dark:bg-gray-800 dark:border-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-violet-400 dark:hover:border-violet-400"
          >
            <span className="flex items-center space-x-1.5">
              {modelStatus === 'loading' && (
                <div className="animate-spin rounded-full h-2.5 w-2.5 border-1.5 border-violet-500 border-t-transparent" />
              )}
              <span className="block truncate font-medium text-violet-900 dark:text-violet-100">
                {selectedModelOption?.name || 'Select Model'}
              </span>
            </span>
            <svg
              className={`h-2.5 w-2.5 text-violet-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 max-h-36 overflow-auto focus:outline-none text-xs">
              <ul className="py-1">
                {sortedModels.map((option) => (
                  <li
                    key={option.id}
                    onMouseEnter={(e) => handleMouseEnter(option.id, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleModelSelect(option.id)}
                    className="relative cursor-pointer"
                  >
                    <div className="px-2 py-1 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-violet-900 dark:text-violet-100">
                          {option.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          {action && option.recommendedFor.includes(action) && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Recommended
                            </span>
                          )}
                          {selectedModel === option.id && (
                            <svg className="h-2.5 w-2.5 text-violet-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {modelStatus === 'loading' && (
        <div className="mt-1">
          <div className="flex justify-between text-[10px] text-violet-600 dark:text-violet-300 mb-0.5">
            <span>{loadingMessage}</span>
            <span>{loadingProgress}%</span>
          </div>
          <div className="w-full bg-violet-100 rounded-full h-0.5 dark:bg-violet-900/30">
            <div
              className="bg-violet-500 h-0.5 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {modelStatus === 'error' && (
        <div className="mt-1 p-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[10px]">
          <p>{loadingMessage}</p>
        </div>
      )}

      {isDropdownOpen && hoveredModel && tooltipPosition && (
        <div
          className="fixed z-50 w-48 transform transition-opacity duration-200"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="bg-violet-900 rounded-lg shadow-xl p-3 text-white backdrop-blur-sm bg-opacity-95">
            <div className="relative">
              <div className="absolute -left-1 top-3 w-0 h-0 border-t-6 border-r-6 border-b-6 border-violet-900 border-t-transparent border-b-transparent" />
              <div className="space-y-2">
                <h4 className="font-medium text-[10px] text-violet-200">
                  Features
                </h4>
                <ul className="space-y-1">
                  {MODEL_OPTIONS.find(m => m.id === hoveredModel)?.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-1.5 text-[10px]">
                      <span className="text-violet-300 mt-0.5">
                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-violet-100 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
