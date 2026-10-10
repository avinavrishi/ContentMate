import { useState } from "react";
import { VideoCustomizationModalProps, VideoCustomizationOptions } from "../types/video";
import { LANGUAGE_OPTIONS, DIALECT_OPTIONS, SupportedLanguage, SupportedDialect } from "../constants/languages";

export function VideoCustomizationModal({
  isOpen,
  onClose,
  onSubmit,
  onBack,
  loading
}: VideoCustomizationModalProps) {
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [language, setLanguage] = useState<SupportedLanguage>("English");
  const [dialect, setDialect] = useState<SupportedDialect>("US");
  const [customizations, setCustomizations] = useState<VideoCustomizationOptions>({
    stockMedia: false,
    aiMedia: false,
    aiMediaStyle: "Cinematic",
    aiAvatar: false,
    brandKit: false,
    bRoll: false,
    soundEffects: false,
    headings: false,
    subtitles: true,
  });

  if (!isOpen) return null;

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    // Reset dialect to first option of new language
    const dialects = DIALECT_OPTIONS[newLanguage];
    setDialect(dialects[0].value);
  };

  const handleSubmit = () => {
    onSubmit({
      aspectRatio,
      language,
      dialect,
      customizations,
    });
  };

  // Get available dialects for current language
  const availableDialects = DIALECT_OPTIONS[language];

  return (
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
              Customize Video
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Size (aspect ratio)
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 p-4 border rounded-lg ${
                      aspectRatio === "9:16"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="w-12 h-20 mx-auto bg-gray-200 rounded"></div>
                    <p className="mt-2 text-sm text-center">9:16 (portrait)</p>
                  </button>
                  <button
                    onClick={() => setAspectRatio("1:1")}
                    className={`flex-1 p-4 border rounded-lg ${
                      aspectRatio === "1:1"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded"></div>
                    <p className="mt-2 text-sm text-center">1:1 (square)</p>
                  </button>
                  <button
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex-1 p-4 border rounded-lg ${
                      aspectRatio === "16:9"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="w-20 h-12 mx-auto bg-gray-200 rounded"></div>
                    <p className="mt-2 text-sm text-center">16:9 (landscape)</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Dialect
                  </label>
                  <select
                    value={dialect}
                    onChange={(e) => setDialect(e.target.value as SupportedDialect)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {availableDialects.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.flag} {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Customizations
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50 cursor-not-allowed">
                    <span className="text-gray-700 dark:text-gray-200">Stock Media</span>
                    <button
                      disabled
                      className="w-12 h-6 rounded-full bg-gray-200"
                    >
                      <span className="block w-4 h-4 ml-1 rounded-full bg-white" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50 cursor-not-allowed">
                    <div>
                      <span className="text-gray-700 dark:text-gray-200">AI Media</span>
                      <select
                        disabled
                        className="ml-4 rounded-md border-gray-300 shadow-sm dark:bg-gray-700"
                      >
                        <option value="Cinematic">Cinematic</option>
                      </select>
                    </div>
                    <button
                      disabled
                      className="w-12 h-6 rounded-full bg-gray-200"
                    >
                      <span className="block w-4 h-4 ml-1 rounded-full bg-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center opacity-50 cursor-not-allowed">
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                        B-roll
                      </label>
                    </div>
                    <div className="flex items-center opacity-50 cursor-not-allowed">
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                        Sound effects
                      </label>
                    </div>
                    <div className="flex items-center opacity-50 cursor-not-allowed">
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                        Headings
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customizations.subtitles}
                        onChange={(e) =>
                          setCustomizations((prev) => ({
                            ...prev,
                            subtitles: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                        Subtitles
                      </label>
                    </div>
                  </div>
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
                  disabled={loading}
                  className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Generating..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 