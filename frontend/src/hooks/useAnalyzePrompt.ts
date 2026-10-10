import { useCallback } from 'react';
import { PromptAnalysis } from '../types/video';

interface UseAnalyzePromptReturn {
  analyzePrompt: (prompt: string, worker: Worker) => Promise<PromptAnalysis>;
}

export function useAnalyzePrompt(): UseAnalyzePromptReturn {
  const analyzePrompt = useCallback(async (prompt: string, worker: Worker): Promise<PromptAnalysis> => {
    if (!worker) {
      throw new Error("Worker not available");
    }

    try {
      const response = await new Promise<string>((resolve, reject) => {
        // Set up one-time message handler for this analysis
        const handleMessage = (e: MessageEvent) => {
          const { status, output, data } = e.data;
          if (status === "complete" && Array.isArray(output) && output.length > 0) {
            worker.removeEventListener("message", handleMessage);
            resolve(output[0]); // Get the first (and should be only) response
          } else if (status === "error") {
            worker.removeEventListener("message", handleMessage);
            reject(new Error(data));
          }
        };

        worker.addEventListener("message", handleMessage);

        // Send the analysis request
        worker.postMessage({
          type: "generate",
          data: [{
            role: "user",
            content: `Analyze the following content and suggest appropriate options for:
            - Tone (e.g., humorous, whimsical, energetic, etc.)
            - Purpose (e.g., social media, advertisement, brand awareness, etc.)
            - Target audience (e.g., pet lovers, cyclists, families, etc.)
            
            Content: ${prompt}
            
            Format your response as a JSON object with the following structure:
            {
              "tone": ["suggested_tone1", "suggested_tone2", "suggested_tone3"],
              "purpose": ["suggested_purpose1", "suggested_purpose2", "suggested_purpose3"],
              "audience": ["suggested_audience1", "suggested_audience2", "suggested_audience3"]
            }
            
            Make sure each category has exactly 3 relevant suggestions. Only return the JSON object.`
          }]
        });
      });

      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error("Could not find JSON in response");
      }

      // Parse the extracted JSON
      const result = JSON.parse(jsonMatch[1]);

      // Validate the response structure
      if (!result.tone || !result.purpose || !result.audience ||
          !Array.isArray(result.tone) || !Array.isArray(result.purpose) || !Array.isArray(result.audience)) {
        throw new Error("Invalid analysis response format");
      }

      // Ensure exactly 3 suggestions per category
      const analysis: PromptAnalysis = {
        tone: result.tone.slice(0, 3),
        purpose: result.purpose.slice(0, 3),
        audience: result.audience.slice(0, 3)
      };

      return analysis;
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      throw error;
    }
  }, []);

  return {
    analyzePrompt
  };
} 