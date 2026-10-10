import { useState } from "react";
import {
  AudioCustomizationModalProps,
  AudioCustomizationOptions,
} from "../types/video";
import {
  LANGUAGE_OPTIONS,
  DIALECT_OPTIONS,
  SupportedLanguage,
  SupportedDialect,
} from "../constants/languages";

export function AudioCustomizationModal({
  isOpen,
  onClose,
  onSubmit,
  onBack,
  loading,
}: AudioCustomizationModalProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("English");
  const [dialect, setDialect] = useState<SupportedDialect>("US");
  const [customizations, setCustomizations] =
    useState<AudioCustomizationOptions>({
      soundEffects: false,
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
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-xl">
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
              Customize Audio Settings
            </h2>

            <div className="space-y-6">
              {/* Language and Dialect */}
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
                    Dialect/Accent
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

              {/* Customizations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Customizations
                </label>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customizations.soundEffects}
                      onChange={(e) =>
                        setCustomizations((prev) => ({
                          ...prev,
                          soundEffects: e.target.checked,
                        }))
                      }
                      disabled={true}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                      Sound effects
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
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
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
