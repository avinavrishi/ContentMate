import { useState } from "react";
import {
  ToneSelectionModalProps,
  ScriptGenerationResult,
} from "../types/video";
import { useGenerateScript } from "../hooks/useGenerateScript";
import { ScriptPreviewModal } from "./ScriptPreviewModal";

export function ToneSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  onBack,
  suggestions,
  prompt,
  duration,
  worker,
}: ToneSelectionModalProps) {
  const [tone, setTone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [scriptResult, setScriptResult] =
    useState<ScriptGenerationResult | null>(null);
  const { generateScript } = useGenerateScript();

  if (!isOpen) return null;

  const hasSelection = tone !== "" || purpose !== "" || audience !== "";

  const handleSubmit = async () => {
    // If skipping (no selections), use first suggestions
    const selectedTone = tone || suggestions.tone[0];
    const selectedPurpose = purpose || suggestions.purpose[0];
    const selectedAudience = audience || suggestions.audience[0];

    try {
      if (!worker) {
        throw new Error("Model not ready");
      }

      setGenerating(true);

      // Generate script first
      const result = await generateScript(
        {
          prompt,
          duration,
          tone: selectedTone,
          purpose: selectedPurpose,
          audience: selectedAudience,
          language: "english", // You might want to make this configurable
        },
        worker
      );

      console.log("Generated script:", result);

      // Store the full script result
      setScriptResult(result);

      // Format the script text with segment durations
      const formattedScript = result.segments
        .map((segment, index) => {
          return `[Segment ${index + 1} - ${segment.duration}s]\n${
            segment.speech
          }\n\nVisual Description:\n${segment.mediaPrompt}`;
        })
        .join("\n\n---\n\n");

      setGeneratedScript(formattedScript);
    } catch (error) {
      console.error("Error generating script:", error);
      // You might want to show an error message to the user here
    } finally {
      setGenerating(false);
    }
  };

  const handleScriptSubmit = (finalScript: string) => {
    // Pass both the formatted script and the full script result
    const selectedTone = tone || suggestions.tone[0];
    const selectedPurpose = purpose || suggestions.purpose[0];
    const selectedAudience = audience || suggestions.audience[0];
    onSubmit(
      selectedTone,
      selectedPurpose,
      selectedAudience,
      finalScript,
      scriptResult
    );
  };

  const handleScriptBack = () => {
    setGeneratedScript(null);
  };

  const isDisabled = generating || !worker;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-8 shadow-xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Modal header */}
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Video Style
              </h2>

              {!worker && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                  <p>Model not ready. Please try again.</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.tone.map((option) => (
                      <button
                        key={option}
                        onClick={() => setTone(tone === option ? "" : option)}
                        className={`px-4 py-2 rounded-full border ${
                          tone === option
                            ? "bg-indigo-600 text-white"
                            : "border-gray-300 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Purpose
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.purpose.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setPurpose(purpose === option ? "" : option)
                        }
                        className={`px-4 py-2 rounded-full border ${
                          purpose === option
                            ? "bg-indigo-600 text-white"
                            : "border-gray-300 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Audience
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.audience.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setAudience(audience === option ? "" : option)
                        }
                        className={`px-4 py-2 rounded-full border ${
                          audience === option
                            ? "bg-indigo-600 text-white"
                            : "border-gray-300 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={onBack}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {generating
                      ? "Generating Script..."
                      : !worker
                      ? "Model Not Ready"
                      : hasSelection
                      ? "Next"
                      : "Use Suggestions"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Generation Loading Modal */}
      {generating && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Generating Script...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    We're creating the perfect script for your video
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Script Preview Modal */}
      <ScriptPreviewModal
        isOpen={!!generatedScript}
        onClose={onClose}
        onSubmit={handleScriptSubmit}
        onBack={handleScriptBack}
        initialScript={generatedScript || ""}
      />
    </>
  );
}
