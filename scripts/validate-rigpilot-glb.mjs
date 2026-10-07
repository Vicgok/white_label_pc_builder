/** Dependency-free validation of the actual exported GLB and manifest. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder = resolve(root, 'public/assets/3d');
const glbPath = process.argv[2] ? resolve(process.argv[2]) : resolve(folder, 'rigpilot-demo-pc.glb');
const manifestPath = process.argv[3] ? resolve(process.argv[3]) : resolve(folder, 'rigpilot-demo-pc.manifest.json');
const required = [
  'Case_Chassis', 'Case_FrontGlass', 'Case_SideGlass', 'Case_RearPanel', 'Case_TopPanel',
  'Motherboard', 'GPU', 'RAM_01', 'RAM_02', 'AIO_Radiator', 'AIO_Pump', 'AIO_Tube_A',
  'AIO_Tube_B', 'AIO_Fan_01', 'AIO_Fan_02', 'AIO_Fan_03', 'PSU', 'SSD_M2',
  'SideFan_01', 'SideFan_02', 'SideFan_03', 'BottomFan_01', 'BottomFan_02', 'BottomFan_03', 'RearFan_01',
];
assert(existsSync(glbPath), `Missing GLB: ${glbPath}`);
assert(existsSync(manifestPath), `Missing manifest: ${manifestPath}`);
const bytes = readFileSync(glbPath);
assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'GLB magic');
assert.equal(bytes.readUInt32LE(4), 2, 'glTF 2.0');
assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB declared byte length');
assert(bytes.length <= 20 * 1024 * 1024, 'GLB exceeds 20 MiB');
let json, bin;
for (let p = 12; p < bytes.length;) {
  const length = bytes.readUInt32LE(p);
  const type = bytes.readUInt32LE(p + 4);
  assert.equal(length % 4, 0, 'Chunk alignment');
  assert(p + 8 + length <= bytes.length, 'Truncated chunk');
  const data = bytes.subarray(p + 8, p + 8 + length);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
  if (type === 0x004e4942) bin = data;
  p += 8 + length;
}
assert(json && bin, 'JSON and BIN chunks required');
assert.equal(json.asset.version, '2.0');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.version, 1);
assert.equal(manifest.units, 'meters');
assert.equal(manifest.asset, 'rigpilot-demo-pc.glb');
const nodes = json.nodes;
assert(!nodes.some(n => /^(Cube(?:\.\d+)?|Object\d*|Mesh_\d+)$/.test(n.name)), 'Accidental generic object name');
assert(!nodes.some(n => n.camera !== undefined || n.extensions?.KHR_lights_punctual), 'Studio objects must not ship');
assert.equal(json.buffers.length, 1);
assert(!json.buffers[0].uri, 'GLB must be self-contained');
assert(json.buffers[0].byteLength <= bin.length);
assert(!(json.images ?? []).some(i => i.uri), 'No external image dependency');
assert(!(json.extensionsRequired ?? []).some(n => /draco|meshopt/i.test(n)), 'Unexpected geometry decoder requirement');
const names = new Map();
nodes.forEach((n, i) => {
  if (n.name) {
    assert(!names.has(n.name), `Duplicate scene node name: ${n.name}`);
    names.set(n.name, i);
  }
});
const reachable = new Set();
function visit(i) {
  assert(!reachable.has(i), 'Scene hierarchy contains a cycle or multiple parents');
  reachable.add(i);
  (nodes[i].children ?? []).forEach(visit);
}
json.scenes[json.scene ?? 0].nodes.forEach(visit);
const close = (a, b, tolerance = 1e-6) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
const normalizedQ = q => Math.abs(Math.hypot(...q) - 1) < 1e-5;
for (const name of required) {
  assert(names.has(name), `Missing interactive object: ${name}`);
  const index = names.get(name);
  assert(reachable.has(index), `Object outside active scene: ${name}`);
  const node = nodes[index];
  assert(node.mesh !== undefined, `Required part has no geometry: ${name}`);
  const entry = manifest.parts[name];
  assert(entry, `Missing manifest entry: ${name}`);
  assert(entry.productId && entry.category);
  assert(entry.explodedOffset.length === 3 && entry.explodedOffset.every(Number.isFinite));
  assert(close(node.translation ?? [0, 0, 0], entry.installedTransform.translation), `${name}: installed position mismatch`);
  const q = node.rotation ?? [0, 0, 0, 1];
  const eq = entry.installedTransform.rotation;
  assert(normalizedQ(q) && normalizedQ(eq), `${name}: quaternion`);
  assert(close(q, eq) || close(q, eq.map(v => -v)), `${name}: installed rotation mismatch`);
  assert(close(node.scale ?? [1, 1, 1], entry.installedTransform.scale), `${name}: installed scale mismatch`);
  assert(close(entry.explodedTransform.translation, entry.installedTransform.translation.map((v, i) => v + entry.explodedOffset[i])), `${name}: exploded transform mismatch`);
  assert(nodes.some(n => n.name === entry.parent && n.children?.includes(index)), `${name}: parent mismatch`);
}

// Check positions, indices, bounds, alignment, and triangle totals in exported data.
const sizeOf = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function accessorValues(index) {
  const a = json.accessors[index], view = json.bufferViews[a.bufferView];
  assert(a && view && !a.sparse, `Unsupported accessor ${index}`);
  const count = components[a.type], size = sizeOf[a.componentType];
  assert(count && size, 'Accessor type');
  const stride = view.byteStride ?? count * size;
  const start = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
  assert(start + (a.count - 1) * stride + count * size <= (view.byteOffset ?? 0) + view.byteLength);
  assert((view.byteOffset ?? 0) + view.byteLength <= bin.length);
  const read = a.componentType === 5126 ? 'readFloatLE' : a.componentType === 5125 ? 'readUInt32LE' : a.componentType === 5123 ? 'readUInt16LE' : 'readUInt8';
  return Array.from({ length: a.count }, (_, i) => Array.from({ length: count }, (_, k) => bin[read](start + i * stride + k * size)));
}
let uniqueTriangles = 0;
const meshTriangles = [];
for (const [mi, mesh] of json.meshes.entries()) {
  let total = 0;
  for (const primitive of mesh.primitives) {
    assert.equal(primitive.mode ?? 4, 4, 'Triangles only');
    const vertices = accessorValues(primitive.attributes.POSITION);
    assert(vertices.length > 0 && vertices.every(v => v.every(Number.isFinite)), 'Nonfinite position');
    const a = json.accessors[primitive.attributes.POSITION];
    for (let k = 0; k < 3; k++) {
      let min = Infinity, max = -Infinity;
      for (const v of vertices) { min = Math.min(min, v[k]); max = Math.max(max, v[k]); }
      assert(Math.abs(a.min[k] - min) < 1e-6 && Math.abs(a.max[k] - max) < 1e-6, 'Position bounds');
    }
    const indices = accessorValues(primitive.indices).flat();
    assert(indices.length % 3 === 0 && indices.every(i => i >= 0 && i < vertices.length), 'Invalid indices');
    total += indices.length / 3;
  }
  uniqueTriangles += total;
  meshTriangles[mi] = total;
}
const triangles = [...reachable].reduce((sum, i) => sum + (meshTriangles[nodes[i].mesh] ?? 0), 0);
assert(triangles <= 500_000, 'Scene triangle budget');
assert.equal(triangles, manifest.statistics.triangles, 'Manifest scene triangle count');
assert.equal(bytes.length, manifest.statistics.fileBytes, 'Manifest asset size');

// Transform exported accessor corners to world; include GPU descendants.
function transformed(v, n) {
  const s = n.scale ?? [1, 1, 1], q = n.rotation ?? [0, 0, 0, 1], t = n.translation ?? [0, 0, 0];
  const p = v.map((c, i) => c * s[i]);
  const [x, y, z, w] = q;
  const dot = x*p[0] + y*p[1] + z*p[2];
  const cross = [y*p[2]-z*p[1], z*p[0]-x*p[2], x*p[1]-y*p[0]];
  return p.map((c, i) => 2*dot*q[i] + (w*w-x*x-y*y-z*z)*c + 2*w*cross[i] + t[i]);
}
const parents = new Map();
nodes.forEach((n, i) => (n.children ?? []).forEach(c => parents.set(c, i)));
function world(v, index) {
  for (let i = index; i !== undefined; i = parents.get(i)) v = transformed(v, nodes[i]);
  return v;
}
function bounds(name, children = false) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  function collect(index) {
    const n = nodes[index];
    if (n.mesh !== undefined) for (const p of json.meshes[n.mesh].primitives) {
      const a = json.accessors[p.attributes.POSITION];
      for (let mask = 0; mask < 8; mask++) {
        const point = world(a.min.map((v, k) => mask & (1 << k) ? a.max[k] : v), index);
        point.forEach((v, k) => { min[k] = Math.min(min[k], v); max[k] = Math.max(max[k], v); });
      }
    }
    if (children) (n.children ?? []).forEach(collect);
  }
  collect(names.get(name));
  return { min, max, size: max.map((v, i) => v - min[i]) };
}
const gpuBounds = bounds('GPU', true);
assert(close(gpuBounds.size, [.110, .050, .282], .003), `GPU envelope: ${gpuBounds.size}`);
assert(close(bounds('AIO_Radiator').size, [.120, .038, .398], .001), 'Radiator dimensions');
assert(close(bounds('PSU').size, [.086, .150, .140], .003), 'PSU dimensions');
assert(close(bounds('SSD_M2').size.slice(1), [.024, .085], .003), 'M.2 footprint including socket');
const mbMesh = json.meshes[nodes[names.get('Motherboard')].mesh];
const pcbPrimitive = mbMesh.primitives.find(p => json.materials[p.material].name === 'PCB_Charcoal');
const pcbBounds = json.accessors[pcbPrimitive.attributes.POSITION];
assert(close(pcbBounds.max.map((v, k) => v - pcbBounds.min[k]), [.0016, .305, .244], .00001), 'ATX PCB footprint');
assert(bounds('PSU').min[0] > .04, 'PSU must be in secondary chamber');
assert(bounds('GPU', true).max[1] < bounds('AIO_Pump').min[1], 'GPU/pump clearance');
const fanNames = required.filter(n => /^(AIO_Fan_|SideFan_|BottomFan_|RearFan_)/.test(n));
assert.equal(fanNames.length, 10);
assert.equal(new Set(fanNames.map(n => nodes[names.get(n)].mesh)).size, 2, 'Reuse two fan geometry variants');
for (let i = 1; i <= 3; i++) {
  const alias = `TopFan_0${i}`, target = `AIO_Fan_0${i}`;
  assert(nodes[names.get(target)].children?.includes(names.get(alias)), `${alias}: fan alias`);
  assert(nodes[names.get(alias)].mesh === undefined, 'Alias must not duplicate visible fan');
}
for (const glass of ['Case_FrontGlass', 'Case_SideGlass']) {
  const primitives = json.meshes[nodes[names.get(glass)].mesh].primitives;
  assert(primitives.some(p => json.materials[p.material].extensions?.KHR_materials_transmission?.transmissionFactor >= .9), `${glass}: transmission`);
}
assert.equal(manifest.parts.SSD_M2.subModel, null, 'Do not invent an SSD sub-model');
console.log(`PASS: ${required.length} interactive objects; 10 airflow fans; ${triangles.toLocaleString()} triangles (${uniqueTriangles.toLocaleString()} unique); ${(bytes.length / 1024 / 1024).toFixed(2)} MiB.`);
console.log('PASS: meter scale, component envelopes, hierarchy, installed/exploded transforms, shared fan meshes, transparent glass, self-contained glTF 2.0.');
