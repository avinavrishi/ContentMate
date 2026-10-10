import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  VideoCameraIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import { sectionThemes } from "../config/theme";
import { MediaGrid } from "../components/files/MediaGrid";
import { MediaPreviewModal } from "../components/files/MediaPreviewModal";
import { MediaItem, GenerationStage, MediaType } from "../types/media";
import { mediaService } from "../services/mediaService";

export default function Files() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [videoItems, setVideoItems] = useState<MediaItem[]>([]);
  const [audioItems, setAudioItems] = useState<MediaItem[]>([]);
  const [sampleVideoItems, setSampleVideoItems] = useState<MediaItem[]>([]);
  const [sampleAudioItems, setSampleAudioItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial tab based on URL
  const getInitialTab = () => {
    if (location.pathname.includes('/files/audio')) return 1;
    if (location.pathname.includes('/files/video')) return 0;
    return 0; // Default to video tab
  };
  
  const [selectedTab, setSelectedTab] = useState(getInitialTab());

  // Update URL when tab changes
  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    if (index === 0) {
      navigate('/files/video');
      if (videoItems.length === 0) {
        fetchMediaByType('video');
      }
    } else if (index === 1) {
      navigate('/files/audio');
      if (audioItems.length === 0) {
        fetchMediaByType('audio');
      }
    }
  };

  // Initial load based on URL
  useEffect(() => {
    const tabIndex = getInitialTab();
    setSelectedTab(tabIndex);
    fetchMediaByType(tabIndex === 0 ? MediaType.VIDEO : MediaType.AUDIO);
  }, [location.pathname]);

  const fetchMediaByType = async (type: MediaType) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch actual media files for the selected type
      const mediaFiles = await mediaService.getMediaFiles(type);
      
      if (type === MediaType.VIDEO) {
        setVideoItems(mediaFiles);
        // If no videos, fetch sample videos
        if (mediaFiles.length === 0) {
          try {
            const sampleVideos = await mediaService.getSampleMediaFiles('video');
            setSampleVideoItems(sampleVideos);
          } catch (sampleErr) {
            console.error('Error loading sample videos:', sampleErr);
            // Don't show error for sample media failure
          }
        }
      } else {
        setAudioItems(mediaFiles);
        // If no audio files, fetch sample audio
        if (mediaFiles.length === 0) {
          try {
            const sampleAudio = await mediaService.getSampleMediaFiles(MediaType.AUDIO);
            setSampleAudioItems(sampleAudio);
          } catch (sampleErr) {
            console.error('Error loading sample audio:', sampleErr);
            // Don't show error for sample media failure
          }
        }
      }
    } catch (err) {
      // Only show error if it's a real API failure, not just empty results
      if (err instanceof Error && err.message === 'Failed to fetch media files') {
        setError('Failed to load media files. Please try again later.');
      }
      console.error('Error loading media files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (item: MediaItem) => {
    if (item.type === GenerationStage.DRAFT) {
      // For draft videos, navigate to VideoEditor
      if (item.mediaType === MediaType.VIDEO) {
        navigate(`/video/${item.id}`, { replace: true });
      }
    } else {
      // For generated videos, show preview modal
      setSelectedMedia(item);
    }
  };

  const handleDownload = (item: MediaItem) => {
    if (item.file_url) {
      window.open(item.file_url, "_blank");
    }
  };

  const handleDelete = async (item: MediaItem) => {
    // Don't allow deleting sample files
    if (item.type === GenerationStage.SAMPLE) {
      alert('Sample files cannot be deleted.');
      return;
    }

    try {
      await mediaService.deleteMediaFile(item.mediaType, item.id);
      // Update the state to remove the deleted item
      if (item.mediaType === MediaType.VIDEO) {
        setVideoItems(videos => videos.filter(v => v.id !== item.id));
        // If no videos left, fetch sample videos
        if (videoItems.length === 1) {
          const sampleVideos = await mediaService.getSampleMediaFiles('video');
          setSampleVideoItems(sampleVideos);
        }
      } else {
        setAudioItems(audio => audio.filter(a => a.id !== item.id));
        // If no audio files left, fetch sample audio
        if (audioItems.length === 1) {
          const sampleAudio = await mediaService.getSampleMediaFiles('audio');
          setSampleAudioItems(sampleAudio);
        }
      }
    } catch (err) {
      console.error('Error deleting media file:', err);
      alert('Failed to delete the file. Please try again later.');
    }
  };

  // Combine actual and sample items
  const allVideoItems = videoItems.length > 0 ? videoItems : sampleVideoItems;
  const allAudioItems = audioItems.length > 0 ? audioItems : sampleAudioItems;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-emerald-600 to-rose-600 dark:from-purple-400 dark:via-emerald-400 dark:to-rose-400 bg-clip-text text-transparent mb-8">
        My Files
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none
                ${
                  selected
                    ? "bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200"
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <VideoCameraIcon className="w-5 h-5" />
                <span>Video</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none
                ${
                  selected
                    ? "bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200"
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <MusicalNoteIcon className="w-5 h-5" />
                <span>Audio</span>
              </div>
            </Tab>
            <Tab
              className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed relative focus:outline-none`}
              disabled
            >
              <div className="flex items-center justify-center space-x-2">
                <PaintBrushIcon className="w-5 h-5" />
                <span>Design</span>
              </div>
              <div className="absolute -top-3 -right-1">
                <div className="bg-gray-600 text-white px-1 py-px font-bold text-[9px] rounded shadow-sm">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[7px]">★</span>
                    <span>COMING SOON</span>
                    <span className="text-[7px]">★</span>
                  </div>
                </div>
              </div>
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel
              className={`rounded-xl bg-gradient-to-br ${sectionThemes.video.bg.light} dark:${sectionThemes.video.bg.dark} p-6`}
            >
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
                </div>
              ) : allVideoItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No video files found.</p>
                </div>
              ) : (
                <>
                  {videoItems.length === 0 && (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                        These are sample videos. Create your own videos to see them here!
                      </Link>
                    </div>
                  )}
                  <MediaGrid
                    items={allVideoItems}
                    theme={sectionThemes.video}
                    onPlay={handlePlay}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel
              className={`rounded-xl bg-gradient-to-br ${sectionThemes.audio.bg.light} dark:${sectionThemes.audio.bg.dark} p-6`}
            >
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
                </div>
              ) : allAudioItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No audio files found.</p>
                </div>
              ) : (
                <>
                  {audioItems.length === 0 && (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                        These are sample audios. Create your own audios to see them here!
                      </Link>
                    </div>
                  )}
                  <MediaGrid
                    items={allAudioItems}
                    theme={sectionThemes.audio}
                    onPlay={handlePlay}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {/* Design content will be implemented later */}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {selectedMedia && (
        <MediaPreviewModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}
