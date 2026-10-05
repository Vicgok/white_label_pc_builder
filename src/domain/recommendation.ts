import { getComponents } from '../data/components';
import { validateBuild } from './compatibility';
import { estimatePower } from './power';
import type { BuildParts, Resolution, SelectedComponents, UseCase } from '../types';

export type RecommendationResult = { status: 'success'; selectedComponents: SelectedComponents; total: number; explanation: string } | { status: 'budget-too-low'; minimumBudget: number; message: string };
export function recommendBuild({ budget, useCase, resolution = '1440p' }: { budget: number; useCase: UseCase; resolution?: Resolution }): RecommendationResult {
  let winner: { parts: BuildParts; total: number; score: number } | undefined;
  let minimumBudget = Infinity;
  for (const cpu of getComponents('cpu')) {
    for (const motherboard of getComponents('motherboard').filter(m => m.socket === cpu.socket)) {
      for (const gpu of useCase === 'office' ? [undefined] : getComponents('gpu').filter(g => useCase !== 'ai' || g.chip === 'NVIDIA')) {
        if (!gpu && !cpu.integratedGraphics) continue;
        for (const memory of getComponents('memory').filter(m => m.memoryType === motherboard.memoryType && cpu.memoryType.includes(m.memoryType))) {
          for (const storage of getComponents('storage')) {
            const base = { cpu, motherboard, gpu, memory, storage };
            const required = estimatePower(base).recommendedPsuWattage;
            const psu = getComponents('psu').filter(p => p.wattage >= required).sort((a, b) => a.price - b.price)[0];
            const cooling = getComponents('cooling').filter(c => c.supportedSockets.includes(cpu.socket) && c.maxTdp >= cpu.tdp).sort((a, b) => a.price - b.price)[0];
            if (!psu || !cooling) continue;
            const enclosure = getComponents('case').filter(c => c.supportedFormFactors.includes(motherboard.formFactor) && c.maxGpuLengthMm >= (gpu?.lengthMm || 0) && (cooling.type === 'air' ? c.maxCoolerHeightMm >= cooling.heightMm : c.maxRadiatorMm >= (cooling.radiatorMm || 0))).sort((a, b) => a.price - b.price)[0];
            if (!enclosure) continue;
            const parts: BuildParts = { ...base, psu, cooling, case: enclosure };
            const total = Object.values(parts).reduce((sum, p) => sum + (p?.price || 0), 0);
            minimumBudget = Math.min(minimumBudget, total);
            if (total > budget) continue;
            const gpuTier = gpu?.performanceTier || 0;
            const ram = Math.min(memory.capacityGb, useCase === 'gaming' || useCase === 'office' ? 32 : 64) / 8;
            const disk = Math.min(storage.capacityGb, useCase === 'editing' || useCase === 'rendering' ? 2000 : 1000) / 500;
            const weights: Record<UseCase, number> = { gaming: resolution === '1080p' ? 13 : 17, editing: 9, streaming: 12, rendering: 12, ai: 8, office: 0 };
            const cpuTier = useCase === 'office' ? Math.min(cpu.tier, 3) : cpu.tier;
            let score = gpuTier * weights[useCase] + cpuTier * (useCase === 'office' ? 7 : useCase === 'editing' ? 9 : 6) + ram * (useCase === 'gaming' ? 2 : 4) + disk * 3;
            if (useCase === 'office') score -= cpu.tdp / 30;
            if (useCase === 'ai') score += (gpu?.vramGb || 0) * 5;
            if (useCase === 'streaming' && gpu?.chip === 'NVIDIA') score += 5;
            // Price breaks ties; unnecessary premium SKUs never win purely by spending more.
            score -= total / 100000;
            if (!winner || score > winner.score) winner = { parts, total, score };
          }
        }
      }
    }
  }
  if (!winner) return { status: 'budget-too-low', minimumBudget, message: `A complete ${useCase === 'office' ? 'office' : 'dedicated-graphics'} PC in this sample catalog needs a little more budget. Increase your budget or choose parts manually.` };
  const validation = validateBuild(winner.parts);
  if (!validation.complete || validation.issues.length) throw new Error('Recommendation must be complete and compatible');
  const selectedComponents = Object.fromEntries(Object.entries(winner.parts).filter(([, p]) => p).map(([category, p]) => [category, p!.id])) as SelectedComponents;
  const explanations: Record<UseCase, string> = { gaming: 'Graphics performance first, with a balanced CPU and memory platform.', editing: 'CPU and memory headroom, with room for source files and GPU acceleration.', streaming: 'A balance of gaming graphics, multitasking and encoder support.', rendering: 'GPU and CPU capability balanced for mixed 3D workloads.', ai: 'NVIDIA graphics and VRAM take priority, with memory for local experiments.', office: 'An efficient platform with integrated graphics; no dedicated GPU required.' };
  return { status: 'success', selectedComponents, total: winner.total, explanation: explanations[useCase] };
}
