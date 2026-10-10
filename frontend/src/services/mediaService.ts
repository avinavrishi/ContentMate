import { MediaItem, MediaType } from "../types/media";
import { API_CONFIG, getApiUrl, API_BASE_URL } from "../config/api";

interface VideoEditRequest {
  segments?: Array<{
    text: string;
    duration: number;
    type: string;
    mediaPrompt?: string;
    mediaUrls?: string[];
  }>;
  thumbnail_url?: string;
  aspect_ratio?: string;
  language?: string;
  dialect?: string;
  gap_between_scenes?: number;
}

export const mediaService = {
  async getMediaFiles(type?: MediaType): Promise<MediaItem[]> {
    try {
      const url = getApiUrl(
        API_CONFIG.ENDPOINTS.MEDIA.LIST + (type ? `?type=${type}` : "")
      );
      const response = await fetch(url);
      if (response.status === 404) {
        // No files found, return empty array
        return [];
      }
      if (!response.ok) {
        throw new Error("Failed to fetch media files");
      }
      const data = await response.json();

      // Log raw API response
      console.log("Raw API response:", data);

      // Transform the API response to match our MediaItem interface
      const transformedData = data.map((item: any) => {
        const transformed = {
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail_url || null,
          duration: parseInt(item.duration),
          url: item.file_url,
          createdAt: item.created_at,
          fileSize: item.file_size,
          type: item.type,
          mediaType: type || "video", // Default to video if type is not specified
        };
        console.log("Transformed item:", transformed);
        return transformed;
      });

      return transformedData;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Failed to fetch media files"
      ) {
        throw error;
      }
      // For network or other errors, return empty array and let the UI show sample media
      console.error("Error fetching media files:", error);
      return [];
    }
  },

  async getSampleMediaFiles(type?: "video" | "audio"): Promise<MediaItem[]> {
    try {
      const url = getApiUrl(
        API_CONFIG.ENDPOINTS.MEDIA.SAMPLE + (type ? `?type=${type}` : "")
      );
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch sample media files");
      }
      const data = await response.json();

      // Log raw API response
      console.log("Raw sample API response:", data);

      // Transform the API response to match our MediaItem interface
      const transformedData = data.map((item: any) => {
        const transformed = {
          id: `sample-${item.type}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          thumbnail: item.thumbnail_url || null,
          duration: parseInt(item.duration),
          url: item.file_url,
          createdAt: item.created_at,
          fileSize: item.file_size,
          type: "sample",
          mediaType: type || "video", // Default to video if type is not specified
        };
        console.log("Transformed sample item:", transformed);
        return transformed;
      });

      return transformedData;
    } catch (error) {
      console.error("Error fetching sample media files:", error);
      throw error;
    }
  },

  async deleteMediaFile(type: string, id: string): Promise<void> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.MEDIA.DELETE(type, id));
      const response = await fetch(url, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete media file");
      }
    } catch (error) {
      console.error("Error deleting media file:", error);
      throw error;
    }
  },

  async getMediaFile(id: string): Promise<MediaItem> {
    try {
      const url = getApiUrl(
        mediaService
          ? API_CONFIG.ENDPOINTS.MEDIA.GET_VIDEO(id)
          : API_CONFIG.ENDPOINTS.MEDIA.GET_AUDIO(id)
      );
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Media not found");
        }
        throw new Error("Failed to fetch media file");
      }

      const data = await response.json();

      // Log raw API response
      console.log("Raw API response:", data);

      // Transform the API response to match our MediaItem interface
      const transformed = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail_url || null,
        duration: parseInt(data.duration),
        url: data.file_url,
        createdAt: data.created_at,
        fileSize: data.file_size,
        type: data.type,
        mediaType: data.type, // Use the type from the response
        segments: data.segments,
      };
      console.log("Transformed item:", transformed);

      return transformed;
    } catch (error) {
      console.error("Error fetching media file:", error);
      throw error;
    }
  },

  async generateImage(prompt: string): Promise<string> {
    try {
      console.log("\n=== Generating Image ===");
      console.log("Input prompt:", prompt);

      if (!prompt || !prompt.trim()) {
        console.error("Error: Empty prompt");
        throw new Error("Prompt cannot be empty");
      }

      const requestData = { prompt: prompt.trim() };
      console.log("Request payload:", JSON.stringify(requestData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/image/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        const errorMessage = responseData.detail || "Failed to generate image";
        console.error("Request failed:", errorMessage);
        throw new Error(errorMessage);
      }

      if (!responseData.imageUrl) {
        console.error("Response missing imageUrl:", responseData);
        throw new Error("Invalid response format: missing imageUrl");
      }

      console.log("Successfully generated image URL:", responseData.imageUrl);
      return responseData.imageUrl;
    } catch (error) {
      console.error("Error in generateImage:", error);
      throw error;
    }
  },

  async editVideo(id: string, editData: VideoEditRequest): Promise<MediaItem> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.VIDEO.EDIT(id));
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Failed to edit video');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error editing video:', error);
      throw error;
    }
  },
};
