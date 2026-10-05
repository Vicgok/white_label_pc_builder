import { describe, expect, it } from 'vitest';
import { componentById, getComponents, resolveParts } from '../data/components';
import { readyBuilds } from '../data/builds';
import { resolveBrand } from '../config/brand';
import { brands } from '../config/brands';
import { checkCpuMotherboardCompatibility, checkMemoryCompatibility, checkCaseCompatibility, checkCoolerCompatibility, checkPsuCompatibility, validateBuild } from './compatibility';
import { estimatePower } from './power';
import { recommendBuild } from './recommendation';
import { calculateBuildTotal } from './pricing';
import { serializeBuild, deserializeBuild, isBuildSnapshot } from './build-serialization';
import { buildText, whatsappUrl } from './enquiry';
import { estimateSuitability } from './suitability';
import { useCases } from '../utils/catalog';
import type { BuildSnapshot } from '../types';

const selected = readyBuilds[1].components;
const parts = resolveParts(selected);
const snapshot: BuildSnapshot = { buildId: 'PC-7F42', useCase: 'gaming', budget: 150000, resolution: '1440p', selectedComponents: selected, savedAt: null };

describe('modeled hardware compatibility', () => {
  it('accepts matching sockets and rejects a mismatched platform', () => {
    expect(checkCpuMotherboardCompatibility(parts)).toEqual([]);
    expect(checkCpuMotherboardCompatibility({ ...parts, motherboard: getComponents('motherboard').find(m => m.socket === 'AM4') })).toMatchObject([{ severity: 'error', code: 'socket', category: 'motherboard' }]);
  });
  it('requires memory to match both motherboard and CPU support', () => {
    const memory = getComponents('memory').find(m => m.memoryType === 'DDR4');
    expect(checkMemoryCompatibility({ ...parts, memory })[0].code).toBe('memory');
    expect(checkMemoryCompatibility({ cpu: parts.cpu, memory })[0].code).toBe('cpu-memory');
    expect(checkMemoryCompatibility(parts)).toEqual([]);
  });
  it('checks board form factor and graphics card length', () => {
    const enclosure = getComponents('case').find(c => c.id === 'case-compact');
    expect(checkCaseCompatibility({ ...parts, case: enclosure }).map(i => i.code)).toEqual(['form-factor', 'gpu-length']);
    expect(checkCaseCompatibility(parts)).toEqual([]);
  });
  it('checks air cooler height, socket and thermal headroom', () => {
    const cooling = { ...parts.cooling!, heightMm: 190, supportedSockets: ['AM4'] as const, maxTdp: 20 };
    expect(checkCoolerCompatibility({ ...parts, cooling: { ...cooling, supportedSockets: [...cooling.supportedSockets] } }).map(i => i.code)).toEqual(['cooler-socket', 'cooler-height', 'cooler-capacity']);
  });
  it('models radiator fit independently of tower height', () => {
    const cooling = getComponents('cooling').find(c => c.id === 'cool-360');
    expect(checkCoolerCompatibility({ ...parts, cooling }).map(i => i.code)).toContain('radiator');
  });
  it('estimates draw with transparent 25% headroom and GPU minimum', () => {
    expect(estimatePower(parts)).toEqual({ estimatedPower: 385, recommendedPsuWattage: 650 });
    expect(estimatePower({})).toEqual({ estimatedPower: 0, recommendedPsuWattage: 0 });
    expect(checkPsuCompatibility({ ...parts, psu: getComponents('psu').find(p => p.wattage === 450) })).toMatchObject([{ code: 'psu-headroom', severity: 'warning' }]);
    expect(checkPsuCompatibility({ ...parts, gpu: getComponents('gpu').find(g => g.id === 'rtx-5090'), psu: getComponents('psu').find(p => p.wattage === 450) })).toMatchObject([{ code: 'psu-insufficient', severity: 'error' }]);
  });
  it('reports incomplete builds honestly and permits integrated graphics', () => {
    expect(validateBuild({}).complete).toBe(false);
    expect(validateBuild({}).missing).toHaveLength(8);
    expect(validateBuild({ ...parts, gpu: undefined }).complete).toBe(true);
    expect(validateBuild({ ...parts, gpu: undefined, cpu: getComponents('cpu').find(c => c.id === 'r5-5600') }).missing).toContain('gpu');
  });
  it.each(readyBuilds)('$name is complete and compatible', build => {
    const result = validateBuild(resolveParts(build.components));
    expect(result.complete).toBe(true); expect(result.issues).toEqual([]);
  });
});

describe('recommendation and pricing', () => {
  it.each(useCases)('provides complete, compatible %s builds within budget', useCase => {
    for (const budget of [50000, 75000, 100000, 150000, 250000, 400000]) {
      const result = recommendBuild({ budget, useCase, resolution: '1440p' });
      if (result.status === 'budget-too-low') {
        expect(budget).toBeLessThan(result.minimumBudget);
        expect(budget).toBe(50000);
        continue;
      }
      expect(result.total).toBeLessThanOrEqual(budget);
      expect(calculateBuildTotal(result.selectedComponents)).toBe(result.total);
      expect(validateBuild(resolveParts(result.selectedComponents))).toMatchObject({ complete: true, compatible: true, issues: [] });
      if (useCase === 'ai') expect(resolveParts(result.selectedComponents).gpu?.chip).toBe('NVIDIA');
      if (useCase === 'office') expect(resolveParts(result.selectedComponents).cpu?.integratedGraphics).toBe(true);
    }
  });
  it('returns a useful low-budget result and deterministic output', () => {
    const low = recommendBuild({ budget: 10000, useCase: 'gaming' });
    expect(low).toMatchObject({ status: 'budget-too-low' });
    if (low.status === 'budget-too-low') expect(recommendBuild({ budget: low.minimumBudget, useCase: 'gaming' }).status).toBe('success');
    expect(recommendBuild({ budget: 125000, useCase: 'gaming' })).toEqual(recommendBuild({ budget: 125000, useCase: 'gaming' }));
  });
  it('does not spend a workstation budget on unnecessary office hardware', () => {
    const result = recommendBuild({ budget: 400000, useCase: 'office' });
    expect(result.status).toBe('success');
    if (result.status !== 'success') return;
    expect(result.total).toBeLessThan(100000);
    expect(resolveParts(result.selectedComponents).cpu!.tdp).toBeLessThanOrEqual(120);
    expect(result.selectedComponents.gpu).toBeUndefined();
  });
  it('sums only valid parts belonging to their category', () => {
    expect(calculateBuildTotal(selected)).toBe(Object.values(selected).reduce((sum, id) => sum + componentById.get(id!)!.price, 0));
    expect(calculateBuildTotal({ cpu: 'missing', gpu: 'r7-9700x' })).toBe(0);
    expect(calculateBuildTotal({})).toBe(0);
  });
  it('avoids suitability claims for incomplete or mismatched builds', () => {
    expect(estimateSuitability({}).every(([, label]) => label === 'Needs complete build')).toBe(true);
    expect(estimateSuitability({ ...selected, memory: 'd4-32' }).every(([, label]) => label === 'Needs review')).toBe(true);
    expect(estimateSuitability(selected).map(([, label]) => label)).toContain('Excellent');
  });
});

describe('sharing, brands and enquiries', () => {
  it('round-trips IDs, parts and context', () => { expect(deserializeBuild(serializeBuild(snapshot))).toEqual(snapshot); });
  it('rejects corrupt, unknown and wrong-category shared builds', () => {
    expect(deserializeBuild('not-base64')).toBeNull();
    expect(deserializeBuild(btoa(JSON.stringify({ version: 1, ...snapshot, selectedComponents: { cpu: 'rtx-5070' } })))).toBeNull();
    expect(deserializeBuild(btoa(JSON.stringify({ version: 9, ...snapshot })))).toBeNull();
    expect(isBuildSnapshot({ ...snapshot, budget: -1 })).toBe(false);
    expect(isBuildSnapshot({ ...snapshot, selectedComponents: { extra: 'r5-7600' } })).toBe(false);
    expect(isBuildSnapshot({ ...snapshot, selectedComponents: [] })).toBe(false);
    expect(isBuildSnapshot({ ...snapshot, savedAt: 'invalid-date' })).toBe(false);
  });
  it('resolves query before environment, then default; invalid brand is explicit', () => {
    expect(resolveBrand('?brand=satnam', 'itfixer').brand.id).toBe('satnam');
    expect(resolveBrand('', 'itfixer').brand.id).toBe('itfixer');
    expect(resolveBrand('', '').brand.id).toBe('byos');
    expect(resolveBrand('?brand=unknown', 'itfixer').missing).toBe('unknown');
  });
  it('generates complete enquiries with configured WhatsApp only', () => {
    const message = buildText(snapshot, brands.satnam);
    expect(message).toContain('Hi Satnam Computers,'); expect(message).toContain('PC-7F42');
    expect(message).toContain('Ryzen 7 9700X'); expect(message).toContain('Target: 1440p');
    expect(message).toContain('sample pricing');
    expect(whatsappUrl(brands.satnam, message)).toBeNull();
    // A reserved fictional test number; never added to retailer configuration.
    const testBrand = { ...brands.satnam, contact: { whatsapp: '+1 (202) 555-0142' } };
    expect(whatsappUrl(testBrand, message)).toBe(`https://wa.me/12025550142?text=${encodeURIComponent(message)}`);
  });
});
