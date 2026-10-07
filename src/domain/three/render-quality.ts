export const PREVIEW_MOBILE_QUERY = '(max-width: 768px)';
export type PreviewQuality = {
  mode: 'desktop' | 'mobile'; dpr: [number, number]; antialias: boolean;
  shadows: boolean; physicalGlass: boolean; environmentResolution: number;
  fov: number; fitAspect: number; hideCables: boolean; explosionScale: number;
};

const desktop: PreviewQuality = {
  mode: 'desktop', dpr: [1, 1.5], antialias: true, shadows: true,
  physicalGlass: true, environmentResolution: 128, fov: 40, fitAspect: .9,
  hideCables: false, explosionScale: 1,
};
const mobile: PreviewQuality = {
  mode: 'mobile', dpr: [1, 1.15], antialias: false, shadows: false,
  physicalGlass: false, environmentResolution: 64, fov: 46, fitAspect: .78,
  hideCables: true, explosionScale: .65,
};
const mobileHero: PreviewQuality = { ...mobile, dpr: [1, 1], environmentResolution: 32 };

// Screen size chooses cost/quality only. Renderer initialization decides support.
export function previewQuality(isMobile: boolean, scene: 'builder' | 'hero' = 'builder') {
  return isMobile ? scene === 'hero' ? mobileHero : mobile : desktop;
}
