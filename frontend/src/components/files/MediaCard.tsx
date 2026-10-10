import React, { useState } from "react";
import {
  PlayIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrashIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/solid";
import { MediaItem, GenerationStage, MediaType } from "../../types/media";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface MediaCardProps {
  item: MediaItem;
  theme: any;
  onPlay: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

// Utility function to format duration from seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Utility function to format ISO date to Month DD, YYYY
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; // Return original string if parsing fails
  }
};

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  theme,
  onPlay,
  onDownload,
  onDelete,
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on a button or its children, don't navigate
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Only navigate for video items
    if (item.mediaType === MediaType.VIDEO) {
      navigate(`/video/${item.id}`, { replace: true });
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(item);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      onDelete(item);
    }
  };

  const handleThumbnailError = () => {
    console.error('Thumbnail failed to load:', {
      thumbnail: item.thumbnail,
      title: item.title,
      type: item.type
    });
    setThumbnailError(true);
  };

  const renderThumbnail = () => {
    if (item.mediaType === MediaType.VIDEO) {
      const thumbnailAvailable = item.thumbnail && !thumbnailError;
      return (
        <div className="w-full h-48 bg-gradient-to-br from-purple-500/5 to-rose-500/5 relative">
          {thumbnailAvailable ? (
            <img
              src={`${API_BASE_URL}${item.thumbnail}`}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={handleThumbnailError}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoCameraIcon className="w-12 h-12 text-purple-400/50 dark:text-purple-500/50" />
            </div>
          )}
        </div>
      );
    } else if (item.mediaType === MediaType.AUDIO) {
      return (
        <div className="w-full h-48 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <MusicalNoteIcon className="w-12 h-12 text-emerald-400/50 dark:text-emerald-500/50" />
          </div>
        </div>
      );
    }
    
    // Default fallback (should never happen given our type system)
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-500/5 to-gray-500/5 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayIcon className="w-12 h-12 text-gray-400/50 dark:text-gray-500/50" />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden
        border border-gray-200 dark:border-gray-700 transition-all duration-200
        ${theme.border.light} dark:${theme.border.dark} ${theme.shadow.light} dark:${theme.shadow.dark}
        hover:ring-1 hover:shadow-lg cursor-pointer`}
      onClick={handleCardClick}
    >
      <div className="relative">
        {renderThumbnail()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              onClick={handlePlayClick}
            >
              <PlayIcon className="w-6 h-6 text-white" />
            </button>
            {/* Only show download button for GENERATED and SAMPLE videos */}
            {item.type !== GenerationStage.DRAFT && (
              <button
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                onClick={handleDownload}
              >
                <ArrowDownTrayIcon className="w-6 h-6 text-white" />
              </button>
            )}
            {/* Only show delete button for DRAFT and GENERATED videos */}
            {item.type !== GenerationStage.SAMPLE && (
              <button
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-red-500/30 transition-colors"
                onClick={handleDelete}
              >
                <TrashIcon className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-md px-2 py-1">
            <p className="text-white text-sm font-medium">{formatDuration(Number(item.duration))}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h3>
          {/* Type indicator badge */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            item.type === GenerationStage.SAMPLE 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : item.type === GenerationStage.DRAFT
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {item.type.toLowerCase()}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{formatDate(item.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDuration(Number(item.duration))}</span>
            </div>
          </div>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {item.file_size}
          </span>
        </div>
      </div>
    </div>
  );
};
