import React, { useRef, useEffect, useState } from "react";
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/solid";
import { MediaItem } from "../../types/media";
import { API_BASE_URL } from "../../config/api";

// Utility function to format duration from seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Utility function to format ISO date to Month DD, YYYY
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Return original string if parsing fails
  }
};

// Utility function to get full URL for media files
const getFullUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

interface MediaPreviewModalProps {
  item: MediaItem;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  item,
  onClose,
}) => {
  console.log("Item:", item);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRef = item.mediaType === "video" ? videoRef : audioRef;
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get full URLs for media and thumbnail
  const mediaUrl = getFullUrl(item.url);
  const thumbnailUrl = item.thumbnail ? getFullUrl(item.thumbnail) : undefined;

  useEffect(() => {
    setIsLoading(true);
    setMediaError(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);

    // Add event listeners for play and pause
    const media = mediaRef.current;
    if (media) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      media.addEventListener('play', handlePlay);
      media.addEventListener('pause', handlePause);
      media.addEventListener('ended', handleEnded);

      return () => {
        media.removeEventListener('play', handlePlay);
        media.removeEventListener('pause', handlePause);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, [item, mediaRef]);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play().catch((e) => {
          console.error("Play failed:", e);
          setMediaError(`Failed to play ${item.mediaType}. Please try again.`);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      const current = mediaRef.current.currentTime;
      const duration = mediaRef.current.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);

      // Check if we've reached the end
      if (current >= duration) {
        setIsPlaying(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setMediaDuration(mediaRef.current.duration);
      setIsLoading(false);
      // Only autoplay video, not audio
      if (item.mediaType === "video") {
        mediaRef.current.play().catch((e) => {
          console.error("Autoplay failed:", e);
          setMediaError(`Autoplay failed. Please click play to start the ${item.mediaType}.`);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleProgress = (event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    if (mediaRef.current) {
      mediaRef.current.currentTime = pos * mediaRef.current.duration;
    }
  };

  const handleMediaError = (
    e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>
  ) => {
    console.error(`${item.mediaType} error event:`, e);
    const mediaElement = e.target as HTMLVideoElement | HTMLAudioElement;
    console.error(`${item.mediaType} error details:`, {
      error: mediaElement.error,
      networkState: mediaElement.networkState,
      readyState: mediaElement.readyState,
      src: mediaElement.src
    });
    setMediaError(`Error loading ${item.mediaType}. URL: ${mediaUrl}`);
    setIsLoading(false);
  };

  const renderMediaPlayer = () => {
    const commonProps = {
      onError: handleMediaError,
      onTimeUpdate: handleTimeUpdate,
      onLoadedMetadata: handleLoadedMetadata,
      onLoadStart: () => setIsLoading(true),
      onCanPlay: () => setIsLoading(false),
      preload: "auto",
    };

    if (item.mediaType === "video") {
      return (
        <div className="relative pb-[56.25%]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          )}

          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            poster={thumbnailUrl}
            {...commonProps}
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="relative min-h-[200px] bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-lg flex flex-col items-center justify-center p-8">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 z-20 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          )}

          <div className={`transition-all duration-300 transform ${isPlaying ? 'scale-110' : 'scale-100'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
              <MusicalNoteIcon className={`w-24 h-24 text-emerald-500 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`} />
            </div>
          </div>

          <div className="mt-6 w-full max-w-md">
            <div className="text-center mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDuration(currentTime)} / {formatDuration(mediaDuration || Number(item.duration))}</p>
            </div>
          </div>

          <audio
            ref={audioRef}
            {...commonProps}
            className="hidden"
          >
            <source src={mediaUrl} type="audio/mpeg" />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title}.${item.mediaType === 'video' ? 'mp4' : 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(mediaUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-auto shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              {renderMediaPlayer()}

              {/* Media Controls */}
              <div className={`absolute bottom-0 left-0 right-0 ${item.mediaType === 'video' ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-black/10 backdrop-blur-sm'} p-4 z-10`}>
                {/* Progress Bar */}
                <div
                  className="w-full h-2 bg-gray-600/40 rounded-full mb-4 cursor-pointer group"
                  onClick={handleProgress}
                >
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-in-out group-hover:bg-emerald-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-6 h-6 text-white" />
                      ) : (
                        <PlayIcon className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
                  <p className="text-white text-sm bg-red-500/80 px-4 py-2 rounded-full backdrop-blur-sm">{mediaError}</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="w-5 h-5" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>{formatDuration(Number(item.duration))}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>{item.fileSize}</span>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-full hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
