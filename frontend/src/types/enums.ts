// Navigation paths for each section
export enum VideoPath {
  FROM_IDEA = '/video/from-idea',
  FROM_SCRIPT = '/video/from-script',
  FROM_BLOG = '/video/from-blog',
  FROM_PRESENTATION = '/video/from-presentation',
  FROM_PRODUCT = '/video/from-product',
  FROM_RECORDING = '/video/from-recording',
  BLANK = '/video/blank',
}

export enum AudioPath {
  FROM_IDEA = '/audio/from-idea',
  FROM_SCRIPT = '/audio/from-script',
  FROM_BLOG = '/audio/from-blog',
  BLANK = '/audio/blank',
}

export enum DesignPath {
  THUMBNAIL = '/design/thumbnail',
  SOCIAL = '/design/social',
  PRESENTATION = '/design/presentation',
  BLANK = '/design/blank',
}

// Action types for each section
export enum VideoAction {
  TRANSFORM_FROM_IDEA = 'video-from-idea',
  TRANSFORM_FROM_SCRIPT = 'video-from-script',
  TRANSFORM_FROM_BLOG = 'video-from-blog',
  TRANSFORM_FROM_PRESENTATION = 'video-from-presentation',
  TRANSFORM_FROM_PRODUCT = 'video-from-product',
  TRANSFORM_FROM_RECORDING = 'video-from-recording',
  CREATE_BLANK = 'video-blank',
}

export enum AudioAction {
  TRANSFORM_FROM_IDEA = 'audio-from-idea',
  TRANSFORM_FROM_SCRIPT = 'audio-from-script',
  TRANSFORM_FROM_BLOG = 'audio-from-blog',
  CREATE_BLANK = 'audio-blank',
}

export enum DesignAction {
  CREATE_THUMBNAIL = 'design-thumbnail',
  CREATE_SOCIAL_POST = 'design-social',
  CREATE_PRESENTATION = 'design-presentation',
  CREATE_BLANK = 'design-blank',
}

// Mapping between actions and their corresponding paths
export const ActionToPath = {
  [VideoAction.TRANSFORM_FROM_IDEA]: VideoPath.FROM_IDEA,
  [VideoAction.TRANSFORM_FROM_SCRIPT]: VideoPath.FROM_SCRIPT,
  [VideoAction.TRANSFORM_FROM_BLOG]: VideoPath.FROM_BLOG,
  [VideoAction.TRANSFORM_FROM_PRESENTATION]: VideoPath.FROM_PRESENTATION,
  [VideoAction.TRANSFORM_FROM_PRODUCT]: VideoPath.FROM_PRODUCT,
  [VideoAction.TRANSFORM_FROM_RECORDING]: VideoPath.FROM_RECORDING,
  [VideoAction.CREATE_BLANK]: VideoPath.BLANK,

  [AudioAction.TRANSFORM_FROM_IDEA]: AudioPath.FROM_IDEA,
  [AudioAction.TRANSFORM_FROM_SCRIPT]: AudioPath.FROM_SCRIPT,
  [AudioAction.TRANSFORM_FROM_BLOG]: AudioPath.FROM_BLOG,
  [AudioAction.CREATE_BLANK]: AudioPath.BLANK,

  [DesignAction.CREATE_THUMBNAIL]: DesignPath.THUMBNAIL,
  [DesignAction.CREATE_SOCIAL_POST]: DesignPath.SOCIAL,
  [DesignAction.CREATE_PRESENTATION]: DesignPath.PRESENTATION,
  [DesignAction.CREATE_BLANK]: DesignPath.BLANK,
} as const; 