import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MediaItem } from '../types/media';
import { mediaService } from '../services/mediaService';
import { MediaPreviewModal } from '../components/files/MediaPreviewModal';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function AudioEditor() {
  const { id } = useParams<{ id: string }>();
  const [audio, setAudio] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchAudio = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await mediaService.getMediaFile(id);
        setAudio(data);
      } catch (err) {
        console.error('Error fetching audio:', err);
        setError('Failed to load audio. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudio();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error || 'Audio not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Audio Preview */}
        <div className="relative h-48 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div className="absolute inset-0 flex items-center justify-center">
            <MusicalNoteIcon className="w-24 h-24 text-emerald-400/50 dark:text-emerald-500/50" />
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MusicalNoteIcon className="w-8 h-8 text-white" />
            </div>
          </button>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {audio.title}
          </h1>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(audio.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Duration:</span>{' '}
              {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
            </div>
            <div>
              <span className="font-medium">File Size:</span> {audio.fileSize}
            </div>
            <div>
              <span className="font-medium">Type:</span>{' '}
              {audio.type === 'sample' ? 'Sample Audio' : 'Generated Audio'}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <MediaPreviewModal
          item={audio}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
} 