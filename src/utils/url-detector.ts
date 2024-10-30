// ... (previous imports remain the same)

// Platform-specific URL patterns
const URL_PATTERNS = {
    YOUTUBE: {
      STANDARD: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      SHORT: /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      MOBILE: /^(?:https?:\/\/)?(?:www\.)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      EMBED: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      SHORTS: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    },
    TWITTER: {
      STANDARD: /^(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/,
      MOBILE: /^(?:https?:\/\/)?(?:www\.)?mobile\.twitter\.com\/\w+\/status\/(\d+)/,
      X: /^(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/(\d+)/
    },
    INSTAGRAM: {
      POST: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
      REEL: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/reels?\/([a-zA-Z0-9_-]+)/,
      STORIES: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/([a-zA-Z0-9_-]+)/
    }
  };
  
  type Platform = 'youtube' | 'twitter' | 'instagram' | 'unknown';
  type VideoType = 'video' | 'short' | 'reel' | 'story' | 'unknown';
  
  interface PlatformInfo {
    platform: Platform;
    type: VideoType;
    id: string | null;
    isValid: boolean;
    url: string;
    normalizedUrl?: string;
  }
  
  class URLDetector {
    /**
     * Detects the platform and extracts information from a given URL
     * @param url The URL to analyze
     * @returns PlatformInfo object containing platform details
     */
    static detectPlatform(url: string): PlatformInfo {
      // Clean and normalize the URL
      const cleanUrl = url.trim().toLowerCase();
  
      // Check YouTube
      for (const [type, pattern] of Object.entries(URL_PATTERNS.YOUTUBE)) {
        const match = cleanUrl.match(pattern);
        if (match) {
          const videoId = match[1];
          return {
            platform: 'youtube',
            type: type === 'SHORTS' ? 'short' : 'video',
            id: videoId,
            isValid: true,
            url: cleanUrl,
            normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`
          };
        }
      }
  
      // Check Twitter
      for (const [type, pattern] of Object.entries(URL_PATTERNS.TWITTER)) {
        const match = cleanUrl.match(pattern);
        if (match) {
          const tweetId = match[1];
          return {
            platform: 'twitter',
            type: 'video',
            id: tweetId,
            isValid: true,
            url: cleanUrl,
            normalizedUrl: `https://twitter.com/i/status/${tweetId}`
          };
        }
      }
  
      // Check Instagram
      for (const [type, pattern] of Object.entries(URL_PATTERNS.INSTAGRAM)) {
        const match = cleanUrl.match(pattern);
        if (match) {
          const postId = match[1];
          const videoType = type === 'POST' ? 'video' 
                         : type === 'REEL' ? 'reel' 
                         : 'story';
          return {
            platform: 'instagram',
            type: videoType,
            id: postId,
            isValid: true,
            url: cleanUrl,
            normalizedUrl: `https://www.instagram.com/${type.toLowerCase()}/${postId}`
          };
        }
      }
  
      // No match found
      return {
        platform: 'unknown',
        type: 'unknown',
        id: null,
        isValid: false,
        url: cleanUrl
      };
    }
  
    /**
     * Validates if a URL is supported for video download
     * @param url The URL to validate
     * @returns boolean indicating if the URL is supported
     */
    static isValidVideoUrl(url: string): boolean {
      const info = this.detectPlatform(url);
      return info.isValid;
    }
  
    /**
     * Extracts video ID from a supported URL
     * @param url The URL to extract from
     * @returns string | null The video ID or null if not found
     */
    static extractVideoId(url: string): string | null {
      const info = this.detectPlatform(url);
      return info.id;
    }
  
    /**
     * Normalizes a URL to its standard format
     * @param url The URL to normalize
     * @returns string | null The normalized URL or null if invalid
     */
    static normalizeUrl(url: string): string | null {
      const info = this.detectPlatform(url);
      return info.normalizedUrl || null;
    }
  }
  export { URLDetector, PlatformInfo };