import { useCallback } from "react";
import { ScriptGenerationResult } from "../types/video";

interface ScriptSegment {
  speech: string;
  duration: number;
  mediaPrompt: string;
}

interface GenerateScriptParams {
  prompt: string;
  duration: number;
  tone?: string;
  purpose?: string;
  audience?: string;
  language?: string;
}

interface UseGenerateScriptReturn {
  generateScript: (
    params: GenerateScriptParams,
    worker: Worker
  ) => Promise<ScriptGenerationResult>;
}

export function useGenerateScript(): UseGenerateScriptReturn {
  const calculateOptimalSegments = (duration: number): number => {
    // For durations up to 30 seconds, use 1 segment per 10 seconds
    if (duration <= 30) {
      return Math.max(1, Math.ceil(duration / 10));
    }
    // For durations up to 2 minutes, use 1 segment per 15 seconds
    if (duration <= 120) {
      return Math.max(3, Math.ceil(duration / 15));
    }
    // For longer durations, use 1 segment per 20 seconds
    return Math.max(8, Math.ceil(duration / 20));
  };

  const generateScript = useCallback(
    async (
      params: GenerateScriptParams,
      worker: Worker
    ): Promise<ScriptGenerationResult> => {
      return new Promise((resolve, reject) => {
        let fullResponse = "";

        const handleMessage = (event: MessageEvent) => {
          const { status, output } = event.data;

          if (status === "error") {
            worker.removeEventListener("message", handleMessage);
            reject(new Error(output || "Failed to generate script"));
            return;
          }

          if (status === "update") {
            fullResponse += output;
          }

          if (status === "complete") {
            worker.removeEventListener("message", handleMessage);
            try {
              // Try to find JSON in the response
              const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                // If no JSON found, try to structure the response
                const recommendedSegments = calculateOptimalSegments(params.duration);
                const segments = fullResponse
                  .split("\n\n")
                  .filter((segment) => segment.trim())
                  .slice(0, recommendedSegments)
                  .map((segment, index, array) => {
                    const segmentDuration = index === array.length - 1
                      ? params.duration - (Math.floor(params.duration / array.length) * (array.length - 1))
                      : Math.floor(params.duration / array.length);
                    
                    return {
                      speech: segment.trim(),
                      duration: segmentDuration,
                      mediaPrompt: `Create a visual representation for: ${segment.trim()}`
                    };
                  });

                if (segments.length === 0) {
                  throw new Error("No valid content found in response");
                }

                resolve({ segments });
                return;
              }

              // Try to parse the JSON
              try {
                const jsonResponse = JSON.parse(jsonMatch[0]);
                if (!Array.isArray(jsonResponse.segments)) {
                  throw new Error("Invalid response format");
                }

                // Ensure each segment has a mediaPrompt and valid duration
                const totalSegments = jsonResponse.segments.length;
                const segmentBaseDuration = Math.floor(params.duration / totalSegments);
                const remainingTime = params.duration - (segmentBaseDuration * totalSegments);

                const processedSegments = jsonResponse.segments.map((segment: any, index: number) => {
                  // Add extra time to the last segment if there's remaining time
                  const segmentDuration = index === totalSegments - 1 
                    ? segmentBaseDuration + remainingTime 
                    : segmentBaseDuration;

                  return {
                    speech: segment.speech,
                    duration: segmentDuration,
                    mediaPrompt: segment.mediaPrompt || `Create a compelling visual that represents: ${segment.speech}`
                  };
                });

                resolve({ segments: processedSegments });
              } catch (parseError) {
                // If JSON parsing fails, use the fallback format with optimal segments
                const recommendedSegments = calculateOptimalSegments(params.duration);
                const segments = fullResponse
                  .split("\n\n")
                  .filter((segment) => segment.trim())
                  .slice(0, recommendedSegments)
                  .map((segment, index, array) => {
                    const segmentDuration = index === array.length - 1
                      ? params.duration - (Math.floor(params.duration / array.length) * (array.length - 1))
                      : Math.floor(params.duration / array.length);

                    return {
                      speech: segment.trim(),
                      duration: segmentDuration,
                      mediaPrompt: `Create a visual representation for: ${segment.trim()}`
                    };
                  });

                if (segments.length === 0) {
                  throw new Error("No valid content found in response");
                }

                resolve({ segments });
              }
            } catch (error) {
              reject(new Error("Failed to parse script response"));
            }
          }
        };

        worker.addEventListener("message", handleMessage);

        // Calculate recommended number of segments
        const recommendedSegments = calculateOptimalSegments(params.duration);

        // Prepare the prompt for script generation
        const prompt = `Generate a video script based on the following parameters:
Prompt: ${params.prompt}
Duration: ${params.duration} seconds
${params.tone ? `Tone: ${params.tone}` : ""}
${params.purpose ? `Purpose: ${params.purpose}` : ""}
${params.audience ? `Audience: ${params.audience}` : ""}
${params.language ? `Language: ${params.language}` : ""}

Please format your response as a JSON object with the following structure:
{
  "segments": [
    {
      "speech": "The text to be spoken in this segment",
      "duration": number_of_seconds,
      "mediaPrompt": "Detailed description for generating a visual that matches this segment"
    }
  ]
}

Requirements:
1. Create approximately ${recommendedSegments} segments (based on ${params.duration} seconds duration)
2. Each segment should be concise and naturally spoken
3. Total duration must exactly match ${params.duration} seconds
4. Each segment should be between 5-20 seconds for optimal pacing
5. Ensure smooth transitions between segments
6. Keep the language natural and conversational

For each segment's mediaPrompt:
- Be specific and descriptive about the visual scene
- Include style, mood, and composition details
- Focus on visual elements that support the speech
- Avoid text or words in the visuals
- Consider the tone and audience when describing visuals
- Specify camera angles and movements if relevant
- Include lighting and color palette suggestions`;

        // Send the generation request
        worker.postMessage({
          type: "generate",
          data: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });
      });
    },
    []
  );

  return { generateScript };
}
