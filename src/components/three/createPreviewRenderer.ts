import { WebGLRenderer } from 'three';
import type { GLProps } from '@react-three/fiber';
import type { PreviewQuality } from '../../domain/three/render-quality';

export type PreviewRendererDefaults = Parameters<Extract<GLProps, (defaults: never) => unknown>>[0];

export function createPreviewRenderer(defaults: PreviewRendererDefaults, quality: PreviewQuality, alpha: boolean) {
  const canvas = defaults.canvas as HTMLCanvasElement;
  const attributes: WebGLContextAttributes = {
    antialias: quality.antialias, alpha, depth: true, stencil: false,
    powerPreference: 'high-performance', preserveDrawingBuffer: false,
  };
  let context: WebGL2RenderingContext | null = null;
  // Use the actual Canvas; no disposable probe contexts or UA checks.
  // A phone may refuse the preferred GPU while allowing its default GPU.
  for (const preference of ['high-performance', 'default'] as const) {
    attributes.powerPreference = preference;
    try { context = canvas.getContext('webgl2', attributes); } catch { context = null; }
    if (context) break;
  }
  // Three r180 requires WebGL2; WebGL1 cannot render this viewer.
  if (!context) {
    const error = new Error('Unable to initialize the preview WebGL context');
    error.name = 'PreviewWebGLInitializationError';
    throw error;
  }
  if (context.isContextLost()) {
    const error = new Error('The preview WebGL context was lost during initialization');
    error.name = 'PreviewWebGLContextLostError';
    throw error;
  }
  try { return new WebGLRenderer({ ...defaults, ...attributes, canvas, context }); }
  catch (error) {
    context.getExtension('WEBGL_lose_context')?.loseContext();
    throw error;
  }
}
