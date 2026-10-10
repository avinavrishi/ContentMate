import { Segment } from "./media";

export interface Scene {
  id: number;
  speech: string;
  duration: number;
  startTime: number;
  endTime: number;
  mediaPrompt: string;
  mediaUrls: string[];
  url: string;
  sequenceId: number;
} 