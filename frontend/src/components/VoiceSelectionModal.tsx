import { useState, useEffect, useRef } from "react";
import { VoiceSelectionModalProps } from "../types/video";
import {
  maleVoices,
  femaleVoices,
  VoiceOption,
  NationalityFlags,
} from "../utils/audio_options";
import { useKokoroTTS } from "../hooks/useKokoroTTS";

export function VoiceSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  onBack,
}: VoiceSelectionModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(
    femaleVoices[0]
  );
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [searchQuery, setSearchQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { status, message, progress, generateAudio, isReady } = useKokoroTTS();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  if (!isOpen) return null;

  const filteredFemaleVoices = femaleVoices.filter(
    (voice) =>
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.nationality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMaleVoices = maleVoices.filter(
    (voice) =>
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.nationality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    if (playingVoice === voice.id) {
      handleStopPreview();
    }
  };

  const handleSubmit = () => {
    if (selectedVoice) {
      handleStopPreview();
      onSubmit({
        id: selectedVoice.id,
        name: selectedVoice.name,
        gender: selectedVoice.nationality.toLowerCase().includes("female")
          ? "female"
          : "male",
        style: selectedVoice.nationality,
        previewUrl: selectedVoice.url,
        color:
          selectedVoice.nationality === "American"
            ? "bg-blue-500"
            : "bg-indigo-500",
        svgPath: "M12 14l9-5-9-5-9 5 9 5z",
      });
    }
  };

  const handlePreviewPlay = async (voice: VoiceOption) => {
    if (playingVoice === voice.id) {
      handleStopPreview();
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.src = voice.url;
        await audioRef.current.play();
        setPlayingVoice(voice.id);
      }
    } catch (error) {
      console.error("Error playing preview:", error);

      if (isReady) {
        try {
          const audioBuffer = await generateAudio(
            "Hello! This is a preview of my voice. How do I sound?",
            voice.id
          );
          const blob = new Blob([audioBuffer], { type: "audio/wav" });
          const url = URL.createObjectURL(blob);

          if (audioRef.current) {
            audioRef.current.src = url;
            await audioRef.current.play();
            setPlayingVoice(voice.id);
          }
        } catch (error) {
          console.error("Error generating audio:", error);
        }
      }
    }
  };

  const handleStopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingVoice(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const renderVoiceList = (voices: VoiceOption[], title: string) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-2 py-1.5 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-900/20 rounded-lg">
        <h3 className="text-base font-semibold text-violet-900 dark:text-violet-100">
          {title}
        </h3>
        <span className="text-xs text-violet-600 dark:text-violet-300">
          ({voices.length})
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {voices.map((voice) => (
          <div
            key={voice.id}
            onClick={() => handleVoiceSelect(voice)}
            className={`group relative p-2.5 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
              selectedVoice?.id === voice.id
                ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 shadow-lg shadow-violet-100 dark:shadow-none"
                : "border-transparent hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/30 dark:hover:bg-violet-900/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {voice.name}
                </h4>
                <div className="flex items-center mt-0.5 space-x-1">
                  <span className="text-[10px] leading-none">
                    {NationalityFlags[voice.nationality]}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                    {voice.nationality}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewPlay(voice);
                }}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  playingVoice === voice.id
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                    : "bg-violet-500 hover:bg-violet-600 text-white shadow-sm"
                }`}
              >
                {playingVoice === voice.id ? (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>
            </div>
            {selectedVoice?.id === voice.id && (
              <div className="absolute -top-1 -right-1">
                <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-5 w-5"
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
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Voice Selection
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M4 10v4m6-4v4m6-4v4"
                      />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search voices by name or accent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                    text-sm placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {status === "loading" && (
              <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-violet-900 dark:text-violet-100">
                      {message}
                    </div>
                    <div className="mt-1 w-full bg-violet-100 rounded-full h-1.5 dark:bg-violet-900/30">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <p>{message}</p>
              </div>
            )}

            <div className="space-y-6">
              {renderVoiceList(filteredFemaleVoices, "Female Voices")}
              {renderVoiceList(filteredMaleVoices, "Male Voices")}

              {/* Progress dots and action buttons */}
              <div className="flex flex-col space-y-4 pt-4">
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={onBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium 
                      text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-violet-500 dark:border-gray-600 dark:text-gray-300 
                      dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedVoice}
                    className={`px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium 
                      text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-violet-500 ${
                        !selectedVoice ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden audio element for preview */}
            <audio
              ref={audioRef}
              onEnded={() => setPlayingVoice(null)}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
