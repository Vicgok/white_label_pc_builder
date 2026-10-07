import type { PreviewPart } from './scene-types';

export type PreviewEventName = '3d_preview_opened' | '3d_part_selected' | '3d_explode_used' |
  '3d_glass_toggled' | '3d_to_configure_clicked' | 'configure_to_3d_clicked';
export type PreviewEvent = {
  name: PreviewEventName; source: 'homepage' | 'builder'; part?: PreviewPart;
  progress?: number; hidden?: boolean;
};

// Future analytics can subscribe without adding a vendor or changing viewer code.
export function emitPreviewEvent(event: PreviewEvent) {
  window.dispatchEvent(new CustomEvent<PreviewEvent>('rigpilot:preview', { detail: event }));
}
