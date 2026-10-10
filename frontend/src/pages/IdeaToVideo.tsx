import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IdeaInputModal } from "../components/IdeaInputModal";
import { ToneSelectionModal } from "../components/ToneSelectionModal";
import { VideoCustomizationModal } from "../components/VideoCustomizationModal";
import { GenerationProgressModal } from "../components/GenerationProgressModal";
import { PromptAnalysis, VideoCustomizationOptions, ScriptGenerationResult, Voice } from "../types/video";
import { API_ENDPOINTS } from "../config/api";
import { useLoadDeepseekR1Model } from "../hooks/useLoadDeepseekR1Model";
import { ScriptPreviewModal } from "../components/ScriptPreviewModal";
import { VoiceSelectionModal } from "../components/VoiceSelectionModal";

export default function IdeaToVideo() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<
    "idea" | "tone" | "script" | "voice" | "customize" | "progress" | "download"
  >("idea");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [suggestions, setSuggestions] = useState<PromptAnalysis>({
    tone: [],
    purpose: [],
    audience: [],
  });
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [scriptResult, setScriptResult] = useState<ScriptGenerationResult | null>(null);
  const { worker } = useLoadDeepseekR1Model(true);
  const [generationProgress, setGenerationProgress] = useState<
    | {
        current: number;
        total: number;
        step: string;
      }
    | undefined
  >();

  const handleIdeaSubmit = async (
    promptText: string,
    durationValue: number,
    analysis: PromptAnalysis
  ) => {
    setPrompt(promptText);
    setDuration(durationValue);
    setSuggestions(analysis);
    setCurrentStep("tone");
  };

  const handleToneSubmit = (
    tone: string,
    purpose: string,
    audience: string,
    script: string,
    result: ScriptGenerationResult | null
  ) => {
    // If user skips, use first suggestion as default
    setSelectedTone(tone || suggestions.tone[0]);
    setSelectedPurpose(purpose || suggestions.purpose[0]);
    setSelectedAudience(audience || suggestions.audience[0]);
    setGeneratedScript(script);
    setScriptResult(result);
    setCurrentStep("script");
  };

  const handleToneBack = () => {
    setCurrentStep("idea");
  };

  const handleScriptSubmit = (script: string) => {
    setGeneratedScript(script);
    setCurrentStep("voice");
  };

  const handleScriptBack = () => {
    setCurrentStep("tone");
  };

  const handleVoiceSubmit = (voice: Voice) => {
    setSelectedVoice(voice);
    setCurrentStep("customize");
  };

  const handleVoiceBack = () => {
    setCurrentStep("script");
  };

  const handleCustomizationSubmit = async (data: {
    aspectRatio: string;
    language: string;
    dialect: string;
    customizations: VideoCustomizationOptions;
  }) => {
    setCurrentStep("progress");

    try {
      const response = await fetch(API_ENDPOINTS.CREATE_VIDEO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          duration,
          tone: selectedTone,
          purpose: selectedPurpose,
          audience: selectedAudience,
          script: generatedScript,
          scriptResult: scriptResult,
          voice: selectedVoice,
          aspectRatio: data.aspectRatio,
          language: data.language,
          dialect: data.dialect,
          customizations: data.customizations,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      navigate(`/video/${result.video_id}`);
      
    } catch (error) {
      console.error("Error generating video:", error);
      setCurrentStep("customize");
    }
  };

  return (
    <>
      <IdeaInputModal
        isOpen={currentStep === "idea"}
        onClose={() => navigate("/")}
        onSubmit={handleIdeaSubmit}
        analyzing={analyzing}
        setAnalyzing={setAnalyzing}
      />

      {analyzing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Analyzing your idea...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    We're finding the best tone and style for your video
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToneSelectionModal
        isOpen={currentStep === "tone"}
        onClose={() => navigate("/")}
        onSubmit={handleToneSubmit}
        onBack={handleToneBack}
        suggestions={suggestions}
        prompt={prompt}
        duration={duration}
        worker={worker}
      />

      <ScriptPreviewModal
        isOpen={currentStep === "script"}
        onClose={() => navigate("/")}
        onSubmit={handleScriptSubmit}
        onBack={handleScriptBack}
        initialScript={generatedScript}
      />

      <VoiceSelectionModal
        isOpen={currentStep === "voice"}
        onClose={() => navigate("/")}
        onSubmit={handleVoiceSubmit}
        onBack={handleVoiceBack}
      />

      <VideoCustomizationModal
        isOpen={currentStep === "customize"}
        onClose={() => navigate("/")}
        onSubmit={handleCustomizationSubmit}
        onBack={() => setCurrentStep("voice")}
        loading={false}
      />

      <GenerationProgressModal
        isOpen={currentStep === "progress"}
        type="video"
        progress={generationProgress}
      />
    </>
  );
}
