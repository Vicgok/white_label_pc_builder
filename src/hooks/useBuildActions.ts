import { useState } from 'react';
import { useBrand } from '../config/brand';
import { useBuilderStore, snapshot } from '../store/builderStore';
import { serializeBuild } from '../domain/build-serialization';
import { buildText } from '../domain/enquiry';
import { copyText, useToast } from '../components/ui';
export function useBuildActions() {
  const brand = useBrand();
  const { toast } = useToast();
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const save = () => { try { useBuilderStore.getState().saveBuild(); toast('Build saved on this device.'); } catch { toast('Storage is unavailable. Share your build to keep a copy.'); } };
  const copy = async () => {
    const value = buildText(snapshot(useBuilderStore.getState()), brand);
    try { await copyText(value); toast('Configuration copied. Ready to send.'); } catch { setManualCopy(value); }
  };
  const share = async () => {
    const url = new URL('/builder', window.location.origin);
    url.searchParams.set('brand', brand.id); url.searchParams.set('shared', serializeBuild(snapshot(useBuilderStore.getState())));
    try { await copyText(url.toString()); toast('Build link copied. Anyone with it can open this build.'); } catch { setManualCopy(url.toString()); }
  };
  return { save, copy, share, manualCopy, setManualCopy };
}
