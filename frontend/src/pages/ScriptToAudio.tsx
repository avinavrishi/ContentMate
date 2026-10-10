import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScriptInputModal } from "../components/ScriptInputModal";
import { ToneSelectionModal } from "../components/ToneSelectionModal";
import { AudioCustomizationModal } from "../components/AudioCustomizationModal";
import { GenerationProgressModal } from "../components/GenerationProgressModal";
import { PromptAnalysis, AudioCustomizationOptions } from "../types/video";
import { API_ENDPOINTS, API_BASE_URL } from "../config/api";

export default function ScriptToAudio() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<"script" | "loading" | "tone" | "customize" | "progress" | "download">("script");
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(5);
  const [shouldSummarize, setShouldSummarize] = useState(false);
  const [suggestions, setSuggestions] = useState<PromptAnalysis>({
    tone: [],
    purpose: [],
    audience: [],
  });
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    step: string;
  } | undefined>();
  const [audioUrl, setAudioUrl] = useState<string>("");

  const handleScriptSubmit = async (
    scriptText: string,
    durationValue: number,
    summarize: boolean,
    resources?: File[]
  ) => {
    setScript(scriptText);
    setDuration(durationValue);
    setShouldSummarize(summarize);
    setCurrentStep("loading");

    try {
      // First, upload any resources if they exist
      let resourcePaths: string[] = [];
      if (resources && resources.length > 0) {
        const formData = new FormData();
        resources.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_RESOURCES, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload resources: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        resourcePaths = uploadResult.paths;
      }

      // Then proceed with the analyze request
      const response = await fetch(API_ENDPOINTS.ANALYZE_PROMPT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: scriptText,
          shouldSummarize,
          maxWords: 200,
          resources: resourcePaths
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data);
      // If script was summarized, update the script state
      if (shouldSummarize && data.summarizedScript) {
        setScript(data.summarizedScript);
      }
      setCurrentStep("tone");
    } catch (error) {
      console.error("Error analyzing script:", error);
      setCurrentStep("script");
    }
  };

  const handleToneSubmit = (tone: string, purpose: string, audience: string) => {
    // If user skips, use first suggestion as default
    setSelectedTone(tone || suggestions.tone[0]);
    setSelectedPurpose(purpose || suggestions.purpose[0]);
    setSelectedAudience(audience || suggestions.audience[0]);
    setCurrentStep("customize");
  };

  const handleToneBack = () => {
    setCurrentStep("script");
  };

  const handleCustomizationSubmit = async (data: {
    language: string;
    dialect: string;
    customizations: AudioCustomizationOptions;
  }) => {
    setCurrentStep("progress");

    try {
      const response = await fetch(API_ENDPOINTS.CREATE_AUDIO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: script,
          duration,
          tone: selectedTone,
          purpose: selectedPurpose,
          audience: selectedAudience,
          language: data.language,
          dialect: data.dialect,
          customizations: data.customizations,
          shouldSummarize,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Simulate progress updates
      let current = 0;
      const total = 2; // Reduced to 2 steps since we don't need script generation
      const steps = [
        shouldSummarize ? "Processing summarized script..." : "Processing script...",
        "Creating audio...",
      ];

      const interval = setInterval(() => {
        if (current < total) {
          current++;
          setGenerationProgress({
            current,
            total,
            step: steps[current - 1],
          });
        } else {
          clearInterval(interval);
          // Construct full URL for audio file
          setAudioUrl(`${API_BASE_URL}${result.audio_path}`);
          setCurrentStep("download");
        }
      }, 2000);
    } catch (error) {
      console.error("Error generating audio:", error);
      setCurrentStep("customize");
    }
  };

  const handleCustomizationBack = () => {
    setCurrentStep("tone");
  };

  return (
    <>
      <ScriptInputModal
        isOpen={currentStep === "script"}
        onClose={() => navigate("/")}
        onSubmit={handleScriptSubmit}
        type="audio"
      />

      {currentStep === "loading" && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Analyzing your script...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    We're finding the best tone and style for your audio
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
      />

      <AudioCustomizationModal
        isOpen={currentStep === "customize"}
        onClose={() => navigate("/")}
        onSubmit={handleCustomizationSubmit}
        onBack={handleCustomizationBack}
        loading={false}
      />

      <GenerationProgressModal
        isOpen={currentStep === "progress"}
        type="audio"
        progress={generationProgress}
      />

      {currentStep === "download" && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Audio Generated Successfully!
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-600 dark:text-gray-300">
                    Your audio has been generated successfully. You can download it now or find it later in your files.
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={() => navigate("/files/audio")}
                      className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Go to Files
                    </button>
                    <a
                      href={audioUrl}
                      download
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Download Audio
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 