import { useState } from "react";

interface ScriptInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    script: string,
    duration: number,
    shouldSummarize: boolean,
    resources?: File[]
  ) => void;
  type: "video" | "audio";
}

export function ScriptInputModal({
  isOpen,
  onClose,
  onSubmit,
  type,
}: ScriptInputModalProps) {
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(5);
  const [shouldSummarize, setShouldSummarize] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [resources, setResources] = useState<File[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const characterCount = script.length;
  const isValidLength = characterCount >= 200 || resources.length > 0;
  const isEmpty = characterCount === 0 && resources.length === 0;

  if (!isOpen) return null;

  const processFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const wordCount = content.trim().split(/\s+/).length;
        
        if (wordCount < 200) {
          reject(new Error(`File "${file.name}" contains less than 200 words (found ${wordCount} words)`));
          return;
        }
        
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file "${file.name}"`));
      };
      
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    setShowWarning(false);
    
    try {
      // Process only the first file
      const file = files[0];
      
      // Validate file type
      const validExtensions = ['.txt', '.doc', '.docx', '.pdf'];
      const validMimeTypes = [
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];

      const isValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      const isValidMimeType = validMimeTypes.includes(file.type);

      if (!isValidExtension && !isValidMimeType) {
        throw new Error(`Invalid file type. Please upload ${validExtensions.join(', ')} files.`);
      }

      // Process file content
      const content = await processFileContent(file);
      
      // Set the processed content as the script
      setScript(content);
      setResources([file]);
      if (showWarning) setShowWarning(false);
    } catch (error) {
      setWarningMessage(error instanceof Error ? error.message : 'Failed to process file');
      setShowWarning(true);
      setResources([]);
      setScript("");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    setShowWarning(false);
    
    try {
      // Process only the first file
      const file = files[0];
      
      // Validate file type
      const validExtensions = ['.txt', '.doc', '.docx', '.pdf'];
      const validMimeTypes = [
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];

      const isValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      const isValidMimeType = validMimeTypes.includes(file.type);

      if (!isValidExtension && !isValidMimeType) {
        throw new Error(`Invalid file type. Please upload ${validExtensions.join(', ')} files.`);
      }

      // Process file content
      const content = await processFileContent(file);
      
      // Set the processed content as the script
      setScript(content);
      setResources([file]);
      if (showWarning) setShowWarning(false);
    } catch (error) {
      setWarningMessage(error instanceof Error ? error.message : 'Failed to process file');
      setShowWarning(true);
      setResources([]);
      setScript("");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    if (isEmpty) {
      setWarningMessage("Please either provide a script or upload resources.");
      setShowWarning(true);
      return;
    }
    
    if (!resources.length && characterCount < 200) {
      setWarningMessage(`Please lengthen this text to 200 characters or more (you are currently using ${characterCount} characters).`);
      setShowWarning(true);
      return;
    }

    onSubmit(script, duration, shouldSummarize, resources);
    setScript("");
    setDuration(5);
    setShowWarning(false);
    setResources([]);
  };

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
              Script to {type}
            </h2>

            {/* Script input */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Script
                </label>
                <textarea
                  value={script}
                  onChange={(e) => {
                    setScript(e.target.value);
                    if (showWarning) setShowWarning(false);
                  }}
                  placeholder="Paste your script here"
                  className="w-full h-40 px-3 py-2 text-gray-700 dark:text-gray-200 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
                {showWarning && (
                  <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{warningMessage}</span>
                  </div>
                )}
              </div>

              {/* Summarize checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="summarize"
                  checked={shouldSummarize}
                  onChange={(e) => setShouldSummarize(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="summarize"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-200"
                >
                  Summarize
                </label>
              </div>

              {/* Additional options shown only when summarize is checked */}
              {shouldSummarize && (
                <>
                  {/* Duration slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Duration: {duration} seconds
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Additional resources */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Add additional resources (optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label 
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 hover:bg-gray-100"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOCX, TXT, DOC
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.txt,.doc"
                          onChange={handleFileChange}
                          multiple
                        />
                      </label>
                    </div>
                    {resources.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Selected files:
                        </p>
                        <ul className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {resources.map((file, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span>{file.name}</span>
                              <button
                                onClick={() => setResources(resources.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isProcessingFile && (
                <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing file...</span>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
