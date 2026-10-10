import React, { useState, useEffect, useRef, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  LanguageIcon,
  PhotoIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";
import { SceneCard } from "../components/scenes/SceneCard";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { FancyLoader } from "../components/common/FancyLoader";
import { MediaItem, Segment } from "../types/media";
import { Scene } from "../types/scenes";
import { DragDropContext, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '../components/dnd/StrictModeDroppable';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { toggleSidebar } from "../store/slices/uiSlice";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaPrompt: string;
  onMediaPromptChange: (prompt: string) => void;
  currentImageUrl?: string;
  onImageSelect: (url: string) => void;
}

interface AddSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (description: string, duration: number) => void;
  isLoading: boolean;
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  mediaPrompt,
  onMediaPromptChange,
  currentImageUrl,
  onImageSelect,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [localPrompt, setLocalPrompt] = useState(mediaPrompt);

  useEffect(() => {
    setLocalPrompt(mediaPrompt);
  }, [mediaPrompt]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch(`${API_BASE_URL}/api/image/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: localPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setLocalPrompt(newPrompt);
    onMediaPromptChange(newPrompt);
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
                  <span>{generatedImageUrl ? "Regenerate" : "Generate"}</span>
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

const AddSceneModal: React.FC<AddSceneModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading
}) => {
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(5); // Default duration of 5 seconds

  const handleAdd = () => {
    if (description.trim()) {
      onAdd(description, duration);
      setDescription("");
      setDuration(5);
      // Don't close the modal here, let the parent handle it after successful creation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Creating scene...</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Scene</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Scene Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg resize-none disabled:opacity-50"
              rows={4}
              placeholder="Enter scene description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
              disabled={isLoading}
              min="1"
              max="60"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!description.trim() || isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Add Scene</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslucentOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 pointer-events-auto"></div>
);

// Add this CSS at the top of the file, after the imports
const scrollbarStyles = `
  .scene-list-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .scene-list-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scene-list-container::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }
  
  .scene-list-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);
  }

  .scene-list-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  }
`;

export default function VideoEditor() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<MediaItem | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [gapBetweenScenes, setGapBetweenScenes] = useState(0.5);
  const [concatenationError, setConcatenationError] = useState<string | null>(null);
  const isSidebarExpanded = useSelector((state: RootState) => state.ui.isSidebarExpanded);
  const dispatch = useDispatch();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [currentEditingScene, setCurrentEditingScene] = useState<Scene | null>(null);
  const [showAddSceneModal, setShowAddSceneModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideoData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        // Fetch video details
        const videoResponse = await fetch(`${API_BASE_URL}/api/video/${id}`);
        if (!videoResponse.ok) {
          throw new Error("Failed to fetch video details");
        }
        const videoData: MediaItem = await videoResponse.json();
        setVideo(videoData);

        // Fetch segments
        const segmentsResponse = await fetch(`${API_BASE_URL}/api/video/${id}/segments`);
        if (!segmentsResponse.ok) {
          throw new Error("Failed to fetch segments");
        }
        const segmentsData: Segment[] = await segmentsResponse.json();

        console.log(segmentsData);

        // Process segments into scenes and sort by sequenceId
        let currentStartTime = 0;
        const processedScenes = segmentsData
          .sort((a, b) => (a.sequenceId || 0) - (b.sequenceId || 0))
          .map((segment: Segment) => {
            const scene: Scene = {
              id: segment.id,
              speech: segment.speech || "",
              duration: segment.duration || 0,
              startTime: currentStartTime,
              endTime: currentStartTime + (segment.duration || 0),
              mediaPrompt: segment.mediaPrompt || "",
              mediaUrls: segment.mediaUrls || [],
              url: segment.url || "",
              sequenceId: segment.sequenceId || 0
            };
            currentStartTime += (segment.duration || 0) + gapBetweenScenes;
            return scene;
          });
        setScenes(processedScenes);

      } catch (error) {
        console.error("Error loading video:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoData();
  }, [id, gapBetweenScenes]);

  useEffect(() => {
    dispatch(toggleSidebar('close'));
  }, [dispatch]);

  const handleSceneUpdate = async (sceneId: number, description: string) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Call the segment edit API with speech update
      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speech: description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update segment');
      }

      // Refresh segments list
      await refreshSegments();
    } catch (error) {
      console.error('Error updating scene:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update scene');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddScene = async (description: string, duration: number) => {
    try {
      setIsUpdating(true); // Use existing isUpdating state for loader

      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speech: description,
          duration: duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add scene');
      }

      // Refresh segments list
      await refreshSegments();
      
      // Close the modal only after successful creation
      setShowAddSceneModal(false);
    } catch (error) {
      console.error('Error adding scene:', error);
      setError(error instanceof Error ? error.message : 'Failed to add scene');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
  };

  const handleSaveSettings = async () => {
    // TODO: Implement save settings functionality
  };

  const handleMediaPromptChange = async (sceneId: number, prompt: string) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Call the segment edit API with media prompt update
      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaPrompt: prompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update segment');
      }

      // Don't refresh segments yet as we haven't generated new image
      const updatedSegment = await response.json();
      
      // Update the scenes state with the new media prompt
      setScenes(prevScenes =>
        prevScenes.map(scene =>
          scene.id === sceneId
            ? {
                ...scene,
                mediaPrompt: updatedSegment.mediaPrompt
              }
            : scene
        )
      );
    } catch (error) {
      console.error('Error updating media prompt:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update media prompt');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageSelect = async (sceneId: number, imageUrl: string) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Call the segment edit API with new image URL
      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaUrls: [imageUrl]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update segment');
      }

      // Refresh segments list to get the updated video URL
      await refreshSegments();
    } catch (error) {
      console.error('Error updating image:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update image');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to refresh segments list
  const refreshSegments = async () => {
    try {
      const segmentsResponse = await fetch(`${API_BASE_URL}/api/video/${id}/segments`);
      if (!segmentsResponse.ok) {
        throw new Error("Failed to fetch segments");
      }
      const segmentsData: Segment[] = await segmentsResponse.json();

      // Process segments into scenes and sort by sequenceId
      let currentStartTime = 0;
      const processedScenes = segmentsData
        .sort((a, b) => (a.sequenceId || 0) - (b.sequenceId || 0))
        .map((segment: Segment) => {
          const scene: Scene = {
            id: segment.id,
            speech: segment.speech || "",
            duration: segment.duration || 0,
            startTime: currentStartTime,
            endTime: currentStartTime + (segment.duration || 0),
            mediaPrompt: segment.mediaPrompt || "",
            mediaUrls: segment.mediaUrls || [],
            url: segment.url || "",
            sequenceId: segment.sequenceId || 0
          };
          currentStartTime += (segment.duration || 0) + gapBetweenScenes;
          return scene;
        });
      setScenes(processedScenes);
    } catch (error) {
      console.error("Error refreshing segments:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handle video time update
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // Find the current scene based on time
    const currentScene = scenes.find(
      (scene) => time >= scene.startTime && time < scene.endTime
    );
    if (currentScene) {
      setSelectedSceneId(currentScene.id);
    }
  };

  // Handle segment end
  const handleSegmentEnd = () => {
    console.log('Segment ended, current index:', currentSegmentIndex);
    // Move to next segment if available
    if (currentSegmentIndex < scenes.length - 1) {
      const nextIndex = currentSegmentIndex + 1;
      console.log('Moving to next segment:', nextIndex);
      setCurrentSegmentIndex(nextIndex);
      if (scenes[nextIndex]?.url) {
        const nextUrl = `${API_BASE_URL}${scenes[nextIndex].url}`;
        // Reset video player state
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        }
      }
    }
  };

  // Calculate total duration of all segments
  const totalDuration = scenes.reduce((total, scene) => total + scene.duration, 0);

  // Handle segment change from video player
  const handleSegmentChange = (segmentId: number) => {
    const scene = scenes.find(s => s.id === segmentId);
    if (scene) {
      setCurrentSegmentIndex(segmentId - 1); // Adjust for 0-based index
    }
  };

  // Handle scene card click
  const handleSceneClick = (scene: Scene) => {
    if (videoRef.current) {
      videoRef.current.currentTime = scene.startTime;
      setCurrentSegmentIndex(scene.id - 1); // Adjust for 0-based index
      setSelectedSceneId(scene.id);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !id) return;

    const items = Array.from(scenes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence IDs
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequenceId: index + 1
    }));

    setScenes(updatedItems);

    // Save the new sequence to the backend
    try {
      const sequences = updatedItems.map(item => ({
        id: String(item.id),  // Convert id to string
        sequenceId: item.sequenceId
      }));

      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/sequence`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequences }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sequence');
      }

      // Refresh segments list to get the updated order
      await refreshSegments();
    } catch (error) {
      console.error('Error updating sequence:', error);
      // TODO: Show error toast
    }
  };

  const handleDuplicateScene = async (scene: Scene) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/${scene.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate scene');
      }

      // Refresh segments list to get the updated order
      await refreshSegments();
    } catch (error) {
      console.error('Error duplicating scene:', error);
      setError(error instanceof Error ? error.message : 'Failed to duplicate scene');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteScene = async (scene: Scene) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      const response = await fetch(`${API_BASE_URL}/api/video/${id}/segments/${scene.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scene');
      }

      // Refresh segments list to get the updated order
      await refreshSegments();
    } catch (error) {
      console.error('Error deleting scene:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete scene');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const response = await fetch(`${API_BASE_URL}/api/video/${id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: scenes.map(scene => ({
            id: scene.id,
            url: scene.url,
            duration: scene.duration
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export video');
      }

      const data = await response.json();
      
      // Create a download link for the exported video
      const downloadLink = document.createElement('a');
      downloadLink.href = `${API_BASE_URL}${data.url}`;
      downloadLink.download = `${video?.title || 'exported-video'}.mp4`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (error) {
      console.error('Error exporting video:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export video');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <FancyLoader message="Loading video..." />;
  }

  if (error || updateError || !video) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            {error || updateError || "Video not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      {isUpdating && <TranslucentOverlay />}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-300">Exporting video...</p>
          </div>
        </div>
      )}
      {exportError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 shadow-sm z-50">
          {exportError}
          <button 
            onClick={() => setExportError(null)}
            className="ml-2 text-red-500 hover:text-red-600"
          >
            <XMarkIcon className="w-4 h-4 inline" />
          </button>
        </div>
      )}
      <div className="flex h-screen">
        {/* Left Panel - Scenes - Now fixed width */}
        <div className="w-[500px] border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-screen">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-rose-600 bg-clip-text text-transparent">
              {video?.title}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddSceneModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group relative"
                title="Add new scene"
              >
                <PlusIcon className="w-5 h-5 text-purple-500" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Download"
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-purple-500" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowKebabMenu(!showKebabMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="More options"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5 text-purple-500" />
                </button>
                {showKebabMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <button
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowKebabMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-purple-500" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowTranslateModal(true);
                        setShowKebabMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LanguageIcon className="w-5 h-5 text-purple-500" />
                      <span>Translate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scene List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <StrictModeDroppable droppableId="scenes">
              {(provided: DroppableProvided) => (
                <div
                  className="scene-list-container flex-1 overflow-y-auto space-y-4 bg-white dark:bg-gray-800"
                  style={{
                    height: "calc(100vh - 73px)",
                    padding: "1rem 1rem 6rem 1rem",
                  }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {scenes.map((scene, index) => (
                    <Draggable key={scene.id} draggableId={String(scene.id)} index={index}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.5 : 1
                          }}
                        >
                          <SceneCard
                            index={index}
                            scene={scene}
                            onPlay={() => handleSceneClick(scene)}
                            onMediaClick={() => {
                              setCurrentEditingScene(scene);
                              setShowMediaPicker(true);
                              setSelectedSceneId(scene.id);
                            }}
                            onDescriptionChange={(description) =>
                              handleSceneUpdate(scene.id, description)
                            }
                            isCurrentScene={scene.id === selectedSceneId}
                            onFocus={() => handleSceneClick(scene)}
                            onDelete={() => handleDeleteScene(scene)}
                            onDuplicate={() => handleDuplicateScene(scene)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {/* Placeholder for drag and drop */}
                  <div aria-hidden="true">{provided.placeholder as ReactNode}</div>
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 ml-[500px] bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 min-h-screen">
          <div className="flex items-center justify-center p-8" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="w-full">
              {/* Export Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleExport}
                  disabled={isExporting || !scenes.length}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-5 h-5" />
                      <span>Export Video</span>
                    </>
                  )}
                </button>
              </div>

              <VideoPlayer
                aspectRatio={video?.aspect_ratio as "16:9" | "1:1" | "9:16"}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleSegmentEnd}
                isUpdating={isUpdating}
                error={concatenationError}
                ref={videoRef}
                segments={scenes}
                totalDuration={totalDuration}
                onSegmentChange={handleSegmentChange}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gap between scenes (seconds)
                  </label>
                  <input
                    type="number"
                    value={gapBetweenScenes}
                    onChange={(e) =>
                      setGapBetweenScenes(Number(e.target.value))
                    }
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTranslateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Translate</h2>
                <button
                  onClick={() => setShowTranslateModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Language
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dialect
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <option value="us">US</option>
                    <option value="uk">UK</option>
                    <option value="au">Australia</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowTranslateModal(false)}
                  className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Translate
                </button>
              </div>
            </div>
          </div>
        )}

        {showMediaPicker && currentEditingScene && (
          <MediaPickerModal
            isOpen={showMediaPicker}
            onClose={() => {
              setShowMediaPicker(false);
              setCurrentEditingScene(null);
            }}
            mediaPrompt={currentEditingScene?.mediaPrompt || ""}
            onMediaPromptChange={(prompt) => currentEditingScene && handleMediaPromptChange(currentEditingScene.id, prompt)}
            currentImageUrl={currentEditingScene?.mediaUrls?.[0] || ""}
            onImageSelect={(url) => currentEditingScene && handleImageSelect(currentEditingScene.id, url)}
          />
        )}

        {showAddSceneModal && (
          <AddSceneModal
            isOpen={showAddSceneModal}
            onClose={() => setShowAddSceneModal(false)}
            onAdd={handleAddScene}
            isLoading={isUpdating}
          />
        )}
      </div>
    </>
  );
}
