import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { componentById } from '../data/components';
import { isBuildSnapshot } from '../domain/build-serialization';
import type { BuildSnapshot, ComponentCategory, Resolution, UseCase } from '../types';

export const newBuildId = () => `PC-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
const initialBuild = (): BuildSnapshot => ({ buildId: newBuildId(), useCase: 'gaming', budget: 125000, resolution: '1440p', selectedComponents: {}, savedAt: null });
type BuilderStore = BuildSnapshot & {
  started: boolean;
  setUseCase: (useCase: UseCase) => void; setBudget: (budget: number) => void; setResolution: (resolution: Resolution) => void;
  selectComponent: (category: ComponentCategory, id: string) => void; removeComponent: (category: ComponentCategory) => void;
  loadBuild: (build: BuildSnapshot) => void; resetBuild: () => void; startBuild: () => void; saveBuild: () => void;
};
export function snapshot(state: BuildSnapshot): BuildSnapshot {
  const { buildId, useCase, budget, resolution, selectedComponents, savedAt } = state;
  return { buildId, useCase, budget, resolution, selectedComponents, savedAt };
}
export const useBuilderStore = create<BuilderStore>()(persist((set, get) => ({
  ...initialBuild(), started: false,
  setUseCase: useCase => set({ useCase, savedAt: null }), setBudget: budget => set({ budget, savedAt: null }), setResolution: resolution => set({ resolution, savedAt: null }),
  selectComponent: (category, id) => { if (componentById.get(id)?.category === category) set(state => ({ selectedComponents: { ...state.selectedComponents, [category]: id }, savedAt: null })); },
  removeComponent: category => set(state => { const parts = { ...state.selectedComponents }; delete parts[category]; return { selectedComponents: parts, savedAt: null }; }),
  loadBuild: build => { if (isBuildSnapshot(build)) set({ ...snapshot(build), started: true }); },
  resetBuild: () => set({ ...initialBuild(), started: false }), startBuild: () => set({ started: true }),
  saveBuild: () => {
    const build = { ...snapshot(get()), savedAt: new Date().toISOString() };
    localStorage.setItem('pc-builder-saved', JSON.stringify(build));
    set({ savedAt: build.savedAt });
  },
}), { name: 'pc-builder-draft', version: 1, partialize: state => ({ ...snapshot(state), started: state.started }), merge: (persisted, current) => {
  if (!isBuildSnapshot(persisted)) return current;
  return { ...current, ...snapshot(persisted), started: !!(persisted as BuildSnapshot & { started?: boolean }).started };
} }));
