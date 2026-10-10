import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { API_BASE_URL } from '../../config/api';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaPrompt: string;
  onMediaPromptChange: (prompt: string) => void;
  currentImageUrl?: string;
  onImageSelect: (url: string) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  mediaPrompt,
  onMediaPromptChange,
  currentImageUrl,
  onImageSelect,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(currentImageUrl || null);
  const [localPrompt, setLocalPrompt] = useState(mediaPrompt);

  useEffect(() => {
    setLocalPrompt(mediaPrompt);
  }, [mediaPrompt]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch(`${API_BASE_URL}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: localPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
      
      // Update the media prompt in the parent component
      onMediaPromptChange(localPrompt);
    } catch (error) {
      console.error('Error generating image:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setLocalPrompt(newPrompt);
  };

  const handleUseImage = () => {
    if (generatedImageUrl) {
      onImageSelect(generatedImageUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-[600px] max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Media Picker</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Media Description
              </label>
              <textarea
                value={localPrompt}
                onChange={handlePromptChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg resize-none"
                rows={4}
                placeholder="Describe the image you want to generate..."
              />
            </div>

            {generatedImageUrl && (
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt="Generated media"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !localPrompt.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-5 h-5" />
                  <span>{generatedImageUrl ? 'Regenerate' : 'Generate'}</span>
                </>
              )}
            </button>

            {generatedImageUrl && (
              <button
                onClick={handleUseImage}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm flex items-center justify-center"
              >
                Use This Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 