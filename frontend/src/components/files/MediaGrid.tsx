import React from "react";
import { MediaCard } from "./MediaCard";
import { MediaItem } from "../../types/media";

interface MediaGridProps {
  items: MediaItem[];
  theme: any;
  onPlay: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  theme,
  onPlay,
  onDownload,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          theme={theme}
          onPlay={onPlay}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
