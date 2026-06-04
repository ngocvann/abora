/**
 * Utilities for resolving image URLs and providing fallback placeholders
 * that match Abora's premium Galaxy theme.
 */

// Generate a deterministic HSL color based on string hash
const getDeterministicColors = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  return {
    color1: `hsl(${hue1}, 75%, 60%)`,
    color2: `hsl(${hue2}, 85%, 45%)`,
  };
};

/**
 * Returns a data URI SVG for a beautiful default avatar with initials.
 */
export const getDefaultAvatar = (username?: string): string => {
  const name = username || 'User';
  const firstLetter = name.charAt(0).toUpperCase();
  const { color1, color2 } = getDeterministicColors(name);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="avatar-grad-${name.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#avatar-grad-${name.replace(/[^a-zA-Z0-9]/g, '')})" />
    <text x="50" y="54" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="40">${firstLetter}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Returns a data URI SVG for a premium themed book cover placeholder.
 */
export const getDefaultCover = (title?: string): string => {
  const displayTitle = title || 'Abora';
  const shortTitle = displayTitle.slice(0, 2).toUpperCase();
  const { color1, color2 } = getDeterministicColors(displayTitle);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="200" height="300">
    <defs>
      <linearGradient id="cover-grad-${displayTitle.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="50%" stop-color="${color2}" />
        <stop offset="100%" stop-color="#09090b" />
      </linearGradient>
    </defs>
    <rect width="200" height="300" fill="url(#cover-grad-${displayTitle.replace(/[^a-zA-Z0-9]/g, '')})" />
    
    <!-- Decorative cosmic elements -->
    <circle cx="100" cy="110" r="45" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    <circle cx="100" cy="110" r="30" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <path d="M 50 110 L 150 110" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
    
    <!-- Title Text -->
    <text x="100" y="115" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="32" letter-spacing="2">${shortTitle}</text>
    
    <rect x="20" y="240" width="160" height="2" fill="rgba(255,255,255,0.3)" />
    <text x="100" y="265" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" letter-spacing="3">ABORA</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Resolves any image URL from backend relative path to fully qualified URL,
 * or handles Cloudinary / remote URLs correctly, falling back to matching placeholders if empty.
 */
export const getImageUrl = (
  path: string | null | undefined,
  type: 'avatar' | 'cover' | 'general' = 'general',
  fallbackSeed?: string
): string => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return type === 'avatar' 
      ? getDefaultAvatar(fallbackSeed) 
      : type === 'cover' 
        ? getDefaultCover(fallbackSeed) 
        : 'https://placehold.co/600x400/1a1a24/6b21a8?text=Abora';
  }

  const trimmed = path.trim();
  
  // Return directly if it's already an absolute or base64 URL
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Prepend backend host base URL
  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
  return `${backendBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
