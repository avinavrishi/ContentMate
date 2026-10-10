// Backend URL
export const API_BASE_URL = "http://localhost:8000";

// API Configuration
export const API_CONFIG = {
  BASE_URL: `${API_BASE_URL}/api`,
  ENDPOINTS: {
    MEDIA: {
      LIST: "/media",
      SAMPLE: "/media/sample",
      UPLOAD: "/media/upload",
      DELETE: (type: string, id: string) => `/media/${type}/${id}`,
      GET_VIDEO: (id: string) => `/media/video/${id}`,
      GET_AUDIO: (id: string) => `/media/audio/${id}`,
    },
    VIDEO: {
      ANALYZE_PROMPT: "/video/analyze-prompt",
      CREATE: "/video/create",
      UPLOAD_RESOURCE: "/video/upload-resource",
      EDIT: (id: string) => `/video/${id}/edit`,
    },
    AUDIO: {
      CREATE: "/audio/create",
    },
  },
};

export const API_ENDPOINTS = {
  ANALYZE_PROMPT: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO.ANALYZE_PROMPT}`,
  CREATE_VIDEO: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO.CREATE}`,
  CREATE_AUDIO: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUDIO.CREATE}`,
  UPLOAD_RESOURCES: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO.UPLOAD_RESOURCE}`,
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
