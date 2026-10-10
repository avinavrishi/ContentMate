import { GenerationProgressModalProps } from "../types/video";

export function GenerationProgressModal({
  isOpen,
  type,
  progress,
}: GenerationProgressModalProps) {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case "video":
        return "Generating Video";
      case "audio":
        return "Generating Audio";
      case "design":
        return "Creating Design";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
            <div className="text-center">
              {/* Title */}
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {getTitle()}
              </h2>

              {/* Loading Spinner - Only show when no progress */}
              {!progress && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20">
                      <div className="absolute w-full h-full border-4 border-indigo-200 rounded-full"></div>
                      <div className="absolute w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Information */}
              {progress ? (
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {progress.step}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Step {progress.current} of {progress.total}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                  Please wait while we process your request...
                </p>
              )}

              {/* Tips */}
              <div className="mt-8 text-left">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  While you wait:
                </h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  {type === "video" && (
                    <>
                      <li>• We're analyzing your content</li>
                      <li>• Generating engaging visuals</li>
                      <li>• Adding professional transitions</li>
                      <li>• Optimizing for your target audience</li>
                    </>
                  )}
                  {type === "audio" && (
                    <>
                      <li>• Processing your content</li>
                      <li>• Optimizing audio quality</li>
                      <li>• Adding background elements</li>
                      <li>• Fine-tuning the output</li>
                    </>
                  )}
                  {type === "design" && (
                    <>
                      <li>• Creating your design</li>
                      <li>• Optimizing layout</li>
                      <li>• Adding visual elements</li>
                      <li>• Finalizing the composition</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
