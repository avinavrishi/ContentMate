export enum MediaType {
  AUDIO = "audio",
  VIDEO = "video",
}

export enum GenerationStage {
  SAMPLE = "SAMPLE",
  DRAFT = "DRAFT",
  GENERATED = "GENERATED",
}

export interface Segment {
  id: number;
  speech: string;
  duration: number;
  mediaPrompt?: string; // Description/prompt for the media to be generated
  mediaUrls?: string[]; // Array of image URLs (single URL for type "image", multiple for "video")
  url?: string; // URL for the segment video
  sequenceId: number;
}

export interface MediaItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration: number; // Duration in seconds
  file_size: string;
  type: GenerationStage;
  mediaType: MediaType;
  file_url?: string;
  aspect_ratio?: string;
  createdAt: string;
  updated_at: string;
}
