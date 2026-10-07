import { useState } from "react";
import { useBuilderStore, snapshot } from "../store/builderStore";
import { buildText, buildShareUrl } from "../domain/enquiry";
import type { BuildSnapshot } from "../types";
import { copyText, useToast } from "../components/ui";
export function useBuildActions(buildOverride?: BuildSnapshot) {
  const { toast } = useToast();
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const save = () => {
    try {
      useBuilderStore.getState().saveBuild();
      toast("Build saved on this device.");
    } catch {
      toast("Storage is unavailable. Share your build to keep a copy.");
    }
  };
  const copy = async () => {
    const value = buildText(buildOverride || snapshot(useBuilderStore.getState()));
    try {
      await copyText(value);
      toast("Configuration copied. Ready to send.");
    } catch {
      setManualCopy(value);
    }
  };
  const share = async () => {
    const url = buildShareUrl(buildOverride || snapshot(useBuilderStore.getState()), window.location.origin);
    try {
      await copyText(url);
      toast("Build link copied. Anyone with it can open this build.");
    } catch {
      setManualCopy(url);
    }
  };
  return { save, copy, share, manualCopy, setManualCopy };
}
