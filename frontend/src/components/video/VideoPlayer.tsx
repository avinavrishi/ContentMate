import React, { forwardRef, useRef, useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/solid';
import { API_BASE_URL } from '../../config/api';

interface VideoPlayerProps {
  aspectRatio: "16:9" | "1:1" | "9:16";
  onTimeUpdate: (time: number) => void;
  onEnded: () => void;
  isUpdating: boolean;
  error?: string | null;
  segments: Array<{ startTime: number; endTime: number; id: number; url: string }>;
  totalDuration: number;
  onSegmentChange: (segmentId: number) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  aspectRatio,
  onTimeUpdate,
  onEnded,
  isUpdating,
  error,
  segments,
  totalDuration,
  onSegmentChange
}, ref) => {
  const videoRef = ref as React.RefObject<HTMLVideoElement>;
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(totalDuration);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset state when segments change
  useEffect(() => {
    setCurrentSegmentIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsTransitioning(false);
  }, [segments]);

  // Find current segment based on time
  const currentSegment = segments.find(
    segment => currentTime >= segment.startTime && currentTime < segment.endTime
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle segment loading and playback
  useEffect(() => {
    if (!videoRef.current || !segments[currentSegmentIndex]) return;

    const video = videoRef.current;
    const fullUrl = `${API_BASE_URL}${segments[currentSegmentIndex].url}`;
    video.src = fullUrl;
    video.preload = "auto"; // Preload the current segment
    
    // Preload next segment if available
    if (segments[currentSegmentIndex + 1]) {
      const nextVideo = new Audio(`${API_BASE_URL}${segments[currentSegmentIndex + 1].url}`);
      nextVideo.preload = "auto";
    }
    
    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        video.play().catch(console.error);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSegmentIndex, segments, isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedMetadata = () => {
      setDuration(totalDuration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdateInternal = () => {
      if (isTransitioning) return;

      const currentVideoTime = video.currentTime;
      const segment = segments[currentSegmentIndex];
      const segmentDuration = segment.endTime - segment.startTime;
      
      // Calculate global time
      const globalTime = segment.startTime + currentVideoTime;
      setCurrentTime(globalTime);
      onTimeUpdate(globalTime);

      // Check if we need to switch to next segment
      if (currentVideoTime >= segmentDuration) {
        handleNextSegment();
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdateInternal);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdateInternal);
    };
  }, [videoRef, onTimeUpdate, currentSegmentIndex, segments, totalDuration, isTransitioning]);

  const handleNextSegment = async () => {
    if (!videoRef.current || isTransitioning) return;

    if (currentSegmentIndex < segments.length - 1) {
      setIsTransitioning(true);
      const nextIndex = currentSegmentIndex + 1;
      
      try {
        // Update the segment index first
        setCurrentSegmentIndex(nextIndex);
        onSegmentChange(segments[nextIndex].id);

        // Ensure we maintain the play state
        if (isPlaying) {
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error during segment transition:', error);
      } finally {
        setIsTransitioning(false);
      }
    } else {
      setIsPlaying(false);
      onEnded();
    }
  };

  const handlePreviousSegment = async () => {
    if (!videoRef.current || isTransitioning || currentSegmentIndex <= 0) return;

    setIsTransitioning(true);
    const prevIndex = currentSegmentIndex - 1;
    const wasPlaying = !videoRef.current.paused;

    try {
      setCurrentSegmentIndex(prevIndex);
      onSegmentChange(segments[prevIndex].id);

      if (wasPlaying) {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error during segment transition:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || isTransitioning) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const globalTime = percentage * totalDuration;
    
    // Find which segment this time belongs to
    let targetSegmentIndex = 0;
    let segmentTime = 0;
    
    for (let i = 0; i < segments.length; i++) {
      if (globalTime >= segments[i].startTime && globalTime < segments[i].endTime) {
        targetSegmentIndex = i;
        segmentTime = globalTime - segments[i].startTime;
        break;
      }
    }

    const wasPlaying = !videoRef.current.paused;

    // Switch to target segment if different from current
    if (targetSegmentIndex !== currentSegmentIndex) {
      setIsTransitioning(true);
      setCurrentSegmentIndex(targetSegmentIndex);
      
      // The source change will trigger the canplay event
      // which will handle setting the current time and resuming playback
      if (wasPlaying) {
        videoRef.current.play().catch(console.error);
      }
    } else {
      videoRef.current.currentTime = segmentTime;
      if (wasPlaying) {
        videoRef.current.play().catch(console.error);
      }
    }
    
    setCurrentTime(globalTime);
    onSegmentChange(segments[targetSegmentIndex].id);
  };

  const handlePlayPause = () => {
    if (!videoRef.current || isTransitioning) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current || isTransitioning) return;

    setIsTransitioning(true);
    setCurrentSegmentIndex(0);
    setCurrentTime(0);
    
    // The source change will trigger the canplay event
    // which will handle starting playback
    videoRef.current.play().catch(console.error).finally(() => {
      setIsTransitioning(false);
    });
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share video');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClass = (aspectRatio: "16:9" | "1:1" | "9:16") => {
    switch (aspectRatio) {
      case "1:1":
        return "aspect-square";
      case "9:16":
        return "aspect-[9/16]";
      default:
        return "aspect-video"; // 16:9
    }
  };

  return (
    <div className="w-full h-[600px] bg-black rounded-lg overflow-hidden relative">
      <div className="absolute inset-0 flex flex-col">
        {/* Video Container */}
        <div className="relative flex-1 bg-black">
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          )}

          <video
            ref={videoRef}
            src={segments[currentSegmentIndex]?.url ? `${API_BASE_URL}${segments[currentSegmentIndex].url}` : undefined}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
              aspectRatio === "16:9" ? "w-full h-full object-cover" :
              aspectRatio === "9:16" ? "h-full w-auto" :
              aspectRatio === "1:1" ? "h-full w-auto" : "w-full h-full object-cover"
            }`}
            playsInline
            preload="auto"
          />
        </div>

        {/* Video Controls */}
        <div className="bg-white px-4 py-2">
          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            className="relative w-full h-1 bg-gray-200 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            {/* Main progress */}
            <div 
              className="absolute h-full bg-pink-500 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />

            {/* Segment breakpoints */}
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{ 
                  left: `${(segment.startTime / totalDuration) * 100}%`,
                  display: index === 0 ? 'none' : 'block'
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>

              {/* Time Display */}
              <div className="text-gray-700 text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Previous Segment */}
              <button 
                onClick={handlePreviousSegment}
                disabled={currentSegmentIndex <= 0 || isTransitioning}
                className="text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUturnLeftIcon className="w-5 h-5" />
              </button>

              {/* Next Segment */}
              <button 
                onClick={handleNextSegment}
                disabled={currentSegmentIndex >= segments.length - 1 || isTransitioning}
                className="text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUturnRightIcon className="w-5 h-5" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}); 