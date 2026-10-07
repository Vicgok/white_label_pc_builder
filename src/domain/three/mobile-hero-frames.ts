// Image metadata only: this module must never import Three.js.
export const MOBILE_HERO_FRAME_ROOT = '/assets/hero/mobile-pc/';
export type MobileHeroFrames = { frameCount: number; width: number; height: number; format: 'webp'; frames: string[] };

export function parseMobileHeroFrames(value: unknown): MobileHeroFrames {
  const data = value as MobileHeroFrames | null;
  if (!data || !Number.isInteger(data.frameCount) || data.frameCount < 18 || data.frameCount > 24 ||
    !Number.isInteger(data.width) || data.width < 1 || data.width > 1024 ||
    !Number.isInteger(data.height) || data.height < 1 || data.height > 1280 || data.format !== 'webp' ||
    !Array.isArray(data.frames) || data.frames.length !== data.frameCount ||
    !data.frames.every((frame, index) => frame === `frame-${String(index + 1).padStart(2, '0')}.webp`)) {
    throw new Error('Invalid mobile hero frame manifest');
  }
  return data;
}

export function mobileHeroFrameIndex(progress: number, frameCount: number) {
  return Math.round(Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0)) * (frameCount - 1));
}
