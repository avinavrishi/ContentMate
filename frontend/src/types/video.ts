export interface VideoResponse {
  status: string;
  video_path: string;
  script: string;
}

export interface PromptAnalysis {
  tone: string[];
  purpose: string[];
  audience: string[];
}

export interface ScriptGenerationResult {
  segments: Array<{
    speech: string;
    duration: number;
    mediaPrompt: string;
  }>;
}

export interface VideoCustomizationOptions {
  stockMedia: boolean;
  aiMedia: boolean;
  aiMediaStyle?: string;
  aiAvatar: boolean;
  brandKit: boolean;
  bRoll: boolean;
  soundEffects: boolean;
  headings: boolean;
  subtitles: boolean;
}

export interface AudioCustomizationOptions {
  soundEffects: boolean;
}

export interface ScriptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (script: string) => void;
  onBack: () => void;
  initialScript: string;
}

export interface IdeaInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, duration: number, analysis?: any) => void;
  analyzing: boolean;
  setAnalyzing: (analyzing: boolean) => void;
}

export interface ToneSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    tone: string,
    purpose: string,
    audience: string,
    script: string,
    scriptResult: ScriptGenerationResult | null
  ) => void;
  onBack: () => void;
  suggestions: PromptAnalysis;
  prompt: string;
  duration: number;
  worker: Worker | null;
}

export interface VideoCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    aspectRatio: string;
    language: string;
    dialect: string;
    customizations: VideoCustomizationOptions;
  }) => void;
  onBack: () => void;
  loading: boolean;
}

export interface AudioCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    language: string;
    dialect: string;
    customizations: AudioCustomizationOptions;
  }) => void;
  onBack: () => void;
  loading: boolean;
}

export interface GenerationProgressModalProps {
  isOpen: boolean;
  type: "video" | "audio" | "design";
  progress?: {
    current: number;
    total: number;
    step: string;
  };
}

export interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  style: string;
  color: string;
  previewUrl: string;
  svgPath: string;
}

export interface VoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedVoice: Voice) => void;
  onBack: () => void;
}
