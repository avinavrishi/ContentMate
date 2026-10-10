import { ArrowPathIcon } from '@heroicons/react/24/solid';

interface VideoPlayerOverlayProps {
  isUpdating: boolean;
}

export const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({ isUpdating }) => {
  if (!isUpdating) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="text-white flex flex-col items-center space-y-3">
        <ArrowPathIcon className="w-8 h-8 animate-spin" />
        <p className="text-lg font-medium">Regenerating video...</p>
      </div>
    </div>
  );
}; 