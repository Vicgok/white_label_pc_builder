import { useCallback, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { parseModelManifest } from '../../domain/three/model-manifest';
import { MANIFEST_URL, MODEL_URL, type ModelManifest } from '../../domain/three/scene-types';

export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export function usePreviewAsset() {
  const [manifest, setManifest] = useState<ModelManifest | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(MANIFEST_URL, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Manifest request failed');
      return response.json();
    }).then(value => { if (!controller.signal.aborted) setManifest(parseModelManifest(value)); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);
  const retry = useCallback(() => {
    useGLTF.clear(MODEL_URL); useGLTF.preload(MODEL_URL);
    setReady(false); setFailed(false); setManifest(null); setAttempt(value => value + 1);
  }, []);
  return { manifest, failed, attempt, ready, setReady, retry };
}
