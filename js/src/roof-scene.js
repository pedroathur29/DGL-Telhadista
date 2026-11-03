/* DGL Telhadista · cena 3D realista do telhado (Three.js)
   - céu físico de fim de tarde (Sky) que também ilumina e reflete (PMREM)
   - materiais PBR com texturas geradas no próprio navegador: barro da telha, reboco, madeira, concreto e grama
   - telhas coloniais com espessura de verdade (capa e canal), cumeeira, testeira, calha e forro do beiral
   - árvores e arbustos procedurais (ez-tree, MIT) com folhas balançando ao vento e grama instanciada
   - oclusão de ambiente (GTAO), um brilho leve e antisserrilhado no computador
   As telhas saem de um palete no chão e voam em arco até o lugar delas. */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Tree } from './vendor/ez-tree/tree.js';

/* ---------- utilidades ---------- */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let seed = 1234567;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ruído de valor + fbm para as texturas
function makeNoise(s = 1) {
  const P = new Uint8Array(512); const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1 + 1) % 1 * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const g = (h, x, y) => { const v = h & 3; return (v & 1 ? -x : x) + (v & 2 ? -y : y); };
  const f = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const n2 = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = f(x), v = f(y), a = P[X] + Y, b = P[X + 1] + Y;
    const l1 = g(P[a], x, y) + u * (g(P[b], x - 1, y) - g(P[a], x, y));
    const l2 = g(P[a + 1], x, y - 1) + u * (g(P[b + 1], x - 1, y - 1) - g(P[a + 1], x, y - 1));
    return (l1 + v * (l2 - l1)) * 0.7 + 0.5;
  };
  return (x, y, oct = 5, per = 0.5, lac = 2) => { let a = 1, fr = 1, sum = 0, norm = 0; for (let o = 0; o < oct; o++) { sum += a * n2(x * fr, y * fr); norm += a; a *= per; fr *= lac; } return sum / norm; };
}

// gera textura de cor + mapa normal (a partir de uma altura) + rugosidade
function proceduralMaps(size, fn, { normalStrength = 2, repeat = [1, 1] } = {}) {
  const col = new Uint8ClampedArray(size * size * 4), hgt = new Float32Array(size * size), rgh = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x; const r = fn(x / size, y / size);
    col[i * 4] = r.c[0]; col[i * 4 + 1] = r.c[1]; col[i * 4 + 2] = r.c[2]; col[i * 4 + 3] = 255;
    hgt[i] = r.h; const rv = Math.round(r.r * 255); rgh[i * 4] = rv; rgh[i * 4 + 1] = rv; rgh[i * 4 + 2] = rv; rgh[i * 4 + 3] = 255;
  }
  const nrm = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h = (xx, yy) => hgt[((yy + size) % size) * size + ((xx + size) % size)];
    const dx = (h(x + 1, y) - h(x - 1, y)) * normalStrength, dy = (h(x, y + 1) - h(x, y - 1)) * normalStrength;
    const l = Math.hypot(dx, dy, 1); const i = (y * size + x) * 4;
    nrm[i] = (-dx / l * 0.5 + 0.5) * 255; nrm[i + 1] = (dy / l * 0.5 + 0.5) * 255; nrm[i + 2] = (1 / l * 0.5 + 0.5) * 255; nrm[i + 3] = 255;
  }
  const tex = (data, srgb) => { const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
  return { map: tex(col, true), normalMap: tex(nrm, false), roughnessMap: tex(rgh, false) };
}

const mix = (a, b, t) => a + (b - a) * t;
const mixC = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];

export function buildTextures(q) {
  const N = makeNoise(3), M = makeNoise(9);
  const S = q.texSize;
  // barro da telha: tom neutro-quente (a cor de cada telha vem da instância), poros e manchas
  const clay = proceduralMaps(S / 2, (u, v) => {
    const n = N(u * 6, v * 3, 5), fine = M(u * 60, v * 60, 2), streak = N(u * 2, v * 18, 3);
    const k = 0.78 + n * 0.28 - (fine > 0.72 ? 0.12 : 0) + (streak - 0.5) * 0.08;
    return { c: mixC([206, 96, 52], [232, 142, 92], clamp01(n)).map((x) => x * k), h: n * 0.6 + fine * 0.4, r: 0.6 + fine * 0.25 };
  }, { normalStrength: 3 });
  // reboco pintado: textura de massa, respingos e leve sujeira
  const plaster = proceduralMaps(S, (u, v) => {
    const n = N(u * 22, v * 22, 5), f = M(u * 180, v * 180, 2), blot = N(u * 2.5, v * 2.5, 3);
    const k = 0.965 + (n - 0.5) * 0.05 + (blot - 0.5) * 0.04;
    return { c: [240 * k, 229 * k, 210 * k], h: n * 0.35 + f * 0.65, r: 0.92 };
  }, { normalStrength: 1.6, repeat: [3, 2] });
  // madeira: veios
  const wood = proceduralMaps(S / 2, (u, v) => {
    const n = N(u * 3, v * 40, 4), ring = Math.sin((u * 30 + n * 6) * Math.PI) * 0.5 + 0.5;
    return { c: mixC([92, 58, 34], [148, 98, 60], ring * 0.7 + n * 0.3), h: ring, r: 0.7 };
  }, { normalStrength: 1.2 });
  // concreto da calçada
  const concrete = proceduralMaps(S / 2, (u, v) => {
    const n = N(u * 10, v * 10, 6), f = M(u * 90, v * 90, 2); const k = 0.82 + n * 0.22 - (f > 0.8 ? 0.1 : 0);
    return { c: [176 * k, 170 * k, 160 * k], h: n * 0.4 + f * 0.6, r: 0.92 };
  }, { normalStrength: 2, repeat: [4, 4] });
  // grama e terra
  const grass = proceduralMaps(S, (u, v) => {
    const n = N(u * 8, v * 8, 6), d = M(u * 3, v * 3, 4), f = N(u * 140, v * 140, 2);
    const dry = clamp01((d - 0.45) * 2.5);
    const earth = clamp01((M(u * 12, v * 12, 4) - 0.66) * 4);
    const c = mixC(mixC(mixC([62, 82, 36], [96, 112, 50], n), [134, 124, 76], dry * 0.55), [112, 92, 64], earth * 0.6);
    const k = 0.78 + f * 0.44;
    return { c: c.map((x) => x * k), h: f, r: 0.95 };
  }, { normalStrength: 2.4, repeat: [26, 26] });
  return { clay, plaster, wood, concrete, grass };
}

/* texturas já geradas (WebP embutido): sem custo de processamento ao abrir o site */
function loadBaked(baked) {
  const loader = new THREE.TextureLoader();
  const reps = { plaster: [3, 2], concrete: [4, 4], grass: [26, 26] };
  const out = {};
  for (const [name, maps] of Object.entries(baked)) {
    out[name] = {};
    for (const [slot, url] of Object.entries(maps)) {
      const t = loader.load(url); t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
      if (reps[name]) t.repeat.set(...reps[name]);
      if (slot === 'map') t.colorSpace = THREE.SRGBColorSpace;
      out[name][slot] = t;
    }
  }
  return out;
}

/* telha colonial com espessura: superfície externa, interna, bordas e pontas */
function tileGeometry({ len, r1, r2, thick, arc, segA, segL }) {
  const parts = [];
  const surface = (inner) => {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= segL; j++) {
      const t = j / segL; const r = mix(r1, r2, t) - (inner ? thick : 0);
      for (let i = 0; i <= segA; i++) {
        const a = -arc / 2 + arc * (i / segA);
        pos.push(r * (Math.cos(a) - Math.cos(arc / 2)) + (inner ? thick * Math.cos(arc / 2) : 0), (t - 0.5) * len, r * Math.sin(a));
        uv.push(i / segA, t);
      }
    }
    for (let j = 0; j < segL; j++) for (let i = 0; i < segA; i++) {
      const a = j * (segA + 1) + i, b = a + 1, c = a + segA + 1, d = c + 1;
      if (inner) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  parts.push(surface(false), surface(true));
  // bordas longas e pontas como faixas finas
  const strip = (pts) => {
    const pos = [], uv = [], idx = [];
    pts.forEach(([o, i], k) => { pos.push(...o, ...i); uv.push(k / (pts.length - 1), 0, k / (pts.length - 1), 1); });
    for (let k = 0; k < pts.length - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const P = (t, i, inner) => { const r = mix(r1, r2, t) - (inner ? thick : 0); const a = -arc / 2 + arc * i; return [r * (Math.cos(a) - Math.cos(arc / 2)) + (inner ? thick * Math.cos(arc / 2) : 0), (t - 0.5) * len, r * Math.sin(a)]; };
  [0, 1].forEach((side) => parts.push(strip([...Array(segL + 1).keys()].map((j) => [P(j / segL, side, false), P(j / segL, side, true)]))));
  [0, 1].forEach((end) => parts.push(strip([...Array(segA + 1).keys()].map((i) => [P(end, i / segA, false), P(end, i / segA, true)]))));
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  g.computeBoundingSphere();
  return g;
}

/* ---------- uma casa completa ---------- */
function buildHouse(opt, T, q) {
  const o = Object.assign({ w: 8, d: 10, h: 2.9, pitch: 30, over: 0.6, wall: '#efe4d2', tileStep: 0.27, rowStep: 0.37, windows: true }, opt);
  const g = new THREE.Group();
  const pitch = THREE.MathUtils.degToRad(o.pitch);
  const half = o.w / 2 + o.over;
  const slopeLen = half / Math.cos(pitch);
  const depth = o.d + o.over * 2;
  const ridgeY = o.h + (o.w / 2) * Math.tan(pitch) + 0.22;

  const plaster = new THREE.MeshStandardMaterial({ color: o.wall, ...T.plaster, roughness: 1, vertexColors: true });
  const wood = new THREE.MeshStandardMaterial({ ...T.wood, roughness: 1 });
  const woodPaint = new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.55 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.35, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#55636a', roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, transparent: true, opacity: 0.4, depthWrite: false });
  const concreteMat = new THREE.MeshStandardMaterial({ ...T.concrete, roughness: 1 });
  const gutterMat = new THREE.MeshStandardMaterial({ color: '#9aa0a3', roughness: 0.35, metalness: 0.85 });
  const interior = new THREE.MeshStandardMaterial({ color: '#2a1d14', emissive: '#ffb36b', emissiveIntensity: 0.0, roughness: 1 });
  const curtainMat = new THREE.MeshStandardMaterial({ color: '#efe3cf', emissive: '#ffcf96', emissiveIntensity: 0.35, roughness: 1, side: THREE.DoubleSide });

  // paredes subdivididas com sujeira perto do chão (cores por vértice)
  const wallGeo = new THREE.BoxGeometry(o.w, o.h, o.d, 1, 12, 1);
  const colors = []; const pa = wallGeo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) + o.h / 2; const k = 0.72 + 0.28 * smooth(clamp01(y / 0.9)); colors.push(k, k * 0.985, k * 0.97); }
  wallGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const walls = new THREE.Mesh(wallGeo, plaster); walls.position.y = o.h / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  // rodapé e calçada
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.04, 0.32, o.d + 0.04), new THREE.MeshStandardMaterial({ color: '#8d8274', roughness: 1, ...{ normalMap: T.plaster.normalMap } }));
  skirt.position.y = 0.16; skirt.receiveShadow = true; g.add(skirt);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(o.w + 1.8, 0.12, o.d + 1.8), concreteMat); walk.position.y = 0.06; walk.receiveShadow = true; g.add(walk);

  // oitões
  const gs = new THREE.Shape(); gs.moveTo(-o.w / 2, 0); gs.lineTo(o.w / 2, 0); gs.lineTo(0, (o.w / 2) * Math.tan(pitch)); gs.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gs, { depth: 0.22, bevelEnabled: false });
  const gUv = gableGeo.attributes.uv; for (let i = 0; i < gUv.count; i++) gUv.setXY(i, gUv.getX(i) * 0.12, gUv.getY(i) * 0.12);
  const gc = []; for (let i = 0; i < gableGeo.attributes.position.count; i++) gc.push(1, 0.985, 0.97); gableGeo.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
  [o.d / 2 - 0.22, -o.d / 2].forEach((z) => { const m = new THREE.Mesh(gableGeo, plaster); m.position.set(0, o.h, z); m.castShadow = m.receiveShadow = true; g.add(m); });

  // janelas: caixilho, vidro que reflete o céu, peitoril e interior quente
  const addWindow = (x, y, z, w, hh, rotY) => {
    const f = new THREE.Group();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), interior); back.position.z = -0.14; f.add(back);
    [-1, 1].forEach((sd) => { const cur = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.34, hh * 0.98), curtainMat); cur.position.set(sd * w * 0.33, 0, -0.08); f.add(cur); });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), glassMat); glass.position.z = 0.0; f.add(glass);
    const bar = (bw, bh, bx, by) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.06), frameMat); m.position.set(bx, by, 0.02); m.castShadow = true; f.add(m); };
    bar(w + 0.1, 0.06, 0, hh / 2); bar(w + 0.1, 0.06, 0, -hh / 2); bar(0.06, hh, -w / 2, 0); bar(0.06, hh, w / 2, 0); bar(0.04, hh, 0, 0);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.05, 0.18), concreteMat); sill.position.set(0, -hh / 2 - 0.05, 0.07); sill.castShadow = true; f.add(sill);
    f.position.set(x, y, z); f.rotation.y = rotY; g.add(f);
  };
  if (o.windows) {
    addWindow(-o.w * 0.28, 1.6, o.d / 2 + 0.01, 1.3, 1.15, 0);
    addWindow(o.w * 0.28, 1.6, o.d / 2 + 0.01, 1.3, 1.15, 0);
    const n = Math.max(1, Math.round(o.d / 4.2));
    for (let i = 0; i < n; i++) { const z = -o.d / 2 + (i + 0.5) * (o.d / n); addWindow(o.w / 2 + 0.01, 1.6, z, 1.15, 1.05, Math.PI / 2); addWindow(-o.w / 2 - 0.01, 1.6, z, 1.15, 1.05, -Math.PI / 2); }
    // porta de madeira com almofadas
    const door = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.12, 0.06), wood); leaf.castShadow = true; door.add(leaf);
    [[0.55], [-0.45]].forEach(([yy]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.72, 0.02), wood); p.position.set(0, yy, 0.04); door.add(p); });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), gutterMat); knob.position.set(0.38, 0, 0.07); door.add(knob);
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(1.14, 2.22, 0.04), woodPaint); jamb.position.z = -0.02; door.add(jamb);
    door.position.set(0, 1.18, o.d / 2 + 0.03); g.add(door);
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.7), concreteMat); step.position.set(0, 0.08, o.d / 2 + 0.35); step.castShadow = step.receiveShadow = true; g.add(step);
    // arandela
    const lamp = new THREE.Group();
    const lb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.1), new THREE.MeshStandardMaterial({ color: '#1f1c1a', roughness: 0.5, metalness: 0.6 })); lamp.add(lb);
    const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: '#ffd8a0', emissive: '#ffc070', emissiveIntensity: 2.4 })); lg.position.z = 0.02; lamp.add(lg);
    lamp.position.set(0.85, 2.15, o.d / 2 + 0.06); g.add(lamp);
    const pl = new THREE.PointLight('#ffb468', 2.2, 5, 2); pl.position.set(0.85, 2.05, o.d / 2 + 0.35); g.add(pl);
    // vasos com plantas
    const potMat = new THREE.MeshStandardMaterial({ color: '#8f4a2b', roughness: 0.85 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#3f5a2a', roughness: 0.8 });
    [[-0.95, 0], [0.95, 0]].forEach(([x]) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 20), potMat); pot.position.set(x, 0.32, o.d / 2 + 0.45); pot.castShadow = true; g.add(pot);
      for (let k = 0; k < 9; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.09 + rand() * 0.05, 10, 8), leafMat); lf.position.set(x + (rand() - 0.5) * 0.25, 0.6 + rand() * 0.3, o.d / 2 + 0.45 + (rand() - 0.5) * 0.25); lf.scale.y = 1.4; lf.castShadow = true; g.add(lf); }
    });
    // caminho até o portão
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 4.6), concreteMat); path.position.set(0, 0.04, o.d / 2 + 0.9 + 2.3); path.receiveShadow = true; g.add(path);
    // muro baixo na frente, com pilares, chapim e portão
    if (o.wall0 !== false) {
      const wz = o.d / 2 + 5.4, half = o.w / 2 + 3.2;
      const wallM = new THREE.MeshStandardMaterial({ color: '#e9dcc6', ...T.plaster, roughness: 1 });
      const seg = (x1, x2) => { const L = x2 - x1; const m = new THREE.Mesh(new THREE.BoxGeometry(L, 1.05, 0.16), wallM); m.position.set((x1 + x2) / 2, 0.525, wz); m.castShadow = m.receiveShadow = true; g.add(m); const cap = new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.05, 0.24), concreteMat); cap.position.set((x1 + x2) / 2, 1.075, wz); cap.castShadow = true; g.add(cap); };
      seg(-half, -0.75); seg(0.75, half);
      [-half, -0.75, 0.75, half].forEach((x) => { const pil = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.25, 0.3), wallM); pil.position.set(x, 0.625, wz); pil.castShadow = true; g.add(pil); const top = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.36), concreteMat); top.position.set(x, 1.28, wz); g.add(top); });
      const gateM = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.45, metalness: 0.7 });
      for (let k = 0; k < 11; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.0, 0.025), gateM); bar.position.set(-0.6 + k * 0.12, 0.6, wz); bar.castShadow = true; g.add(bar); }
      [0.14, 1.06].forEach((y) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.04), gateM); rail.position.set(0, y, wz); g.add(rail); });
    }
  }

  // as duas águas
  const ridge = new THREE.Vector3(0, ridgeY, 0);
  const sides = [1, -1].map((sx) => ({ sx, s: new THREE.Vector3(sx * Math.cos(pitch), -Math.sin(pitch), 0), n: new THREE.Vector3(sx * Math.sin(pitch), Math.cos(pitch), 0) }));
  const tmp = new THREE.Object3D();
  const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

  // madeiramento (caibros e ripas), forro do beiral, testeira e calha
  const rafterN = Math.ceil(depth / 0.55) + 1, battenN = Math.ceil(slopeLen / o.rowStep);
  const rafters = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.11, 1), wood, rafterN * 2); rafters.castShadow = true;
  const battens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.025, depth), wood, battenN * 2); battens.castShadow = true;
  let ri = 0, bi = 0;
  sides.forEach(({ s, n }) => {
    for (let i = 0; i < rafterN; i++) { tmp.position.copy(ridge).addScaledVector(s, slopeLen / 2).addScaledVector(n, -0.1); tmp.position.z = -depth / 2 + i * (depth / (rafterN - 1)); tmp.quaternion.setFromUnitVectors(Z, s); tmp.scale.set(1, 1, slopeLen); tmp.updateMatrix(); rafters.setMatrixAt(ri++, tmp.matrix); }
    for (let r = 0; r < battenN; r++) { tmp.position.copy(ridge).addScaledVector(s, 0.18 + r * o.rowStep).addScaledVector(n, -0.03); tmp.position.z = 0; tmp.quaternion.setFromUnitVectors(Y, n); tmp.scale.set(1, 1, 1); tmp.updateMatrix(); battens.setMatrixAt(bi++, tmp.matrix); }
    // testeira (tábua na ponta do beiral) e calha
    const eave = ridge.clone().addScaledVector(s, slopeLen);
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, depth + 0.04), woodPaint); fascia.position.copy(eave).addScaledVector(n, -0.12); fascia.quaternion.setFromUnitVectors(Y, n); fascia.castShadow = true; g.add(fascia);
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, depth + 0.1, 14, 1, true, Math.PI / 2, Math.PI), gutterMat); gutter.rotation.x = Math.PI / 2; gutter.position.copy(eave).add(new THREE.Vector3(s.x * 0.09, -0.06, 0)); g.add(gutter);
    const downH = eave.y - 0.15; const down = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, downH, 12), gutterMat); down.position.set(eave.x + s.x * 0.02, downH / 2, depth / 2 - o.over - 0.2); down.castShadow = true; g.add(down);
    // forro do beiral visto de baixo
    const soffitLen = o.over / Math.cos(pitch);
    const soffit = new THREE.Mesh(new THREE.PlaneGeometry(soffitLen, depth), woodPaint); soffit.position.copy(ridge).addScaledVector(s, slopeLen - soffitLen / 2).addScaledVector(n, -0.17); soffit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().negate()); soffit.rotateZ(Math.PI / 2); soffit.receiveShadow = true; g.add(soffit);
  });
  rafters.count = ri; battens.count = bi; g.add(rafters, battens);
  // tábuas de empena (beirada lateral do telhado)
  [depth / 2, -depth / 2].forEach((z) => sides.forEach(({ s, n }) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 1), woodPaint); b.position.copy(ridge).addScaledVector(s, slopeLen / 2).addScaledVector(n, -0.05); b.position.z = z; b.quaternion.setFromUnitVectors(Z, s); b.scale.z = slopeLen; b.rotateOnAxis(Z, Math.PI / 2); b.castShadow = true; g.add(b); }));

  // telhas: canal (mais larga, côncava) e capa (por cima, convexa)
  const r = o.tileStep * 0.5;
  const len = o.rowStep * 1.4;
  const clayMat = new THREE.MeshStandardMaterial({ ...T.clay, roughness: 1, metalness: 0, envMapIntensity: 0.7 });
  const canalGeo = tileGeometry({ len, r1: r * 0.98, r2: r * 0.86, thick: 0.013, arc: Math.PI * 0.78, segA: q.tileSegA, segL: q.tileSegL });
  const capaGeo = tileGeometry({ len, r1: r * 0.78, r2: r * 0.68, thick: 0.013, arc: Math.PI * 0.9, segA: q.tileSegA, segL: q.tileSegL });
  const cols = Math.floor(depth / o.tileStep), rows = Math.floor((slopeLen - 0.12) / o.rowStep);
  const maxN = cols * rows * 2;
  const canal = new THREE.InstancedMesh(canalGeo, clayMat, maxN), capa = new THREE.InstancedMesh(capaGeo, clayMat, maxN);
  [canal, capa].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; });
  const base = { canal: [], capa: [] };
  const up = new THREE.Vector3();
  sides.forEach(({ s, n }, side) => {
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) for (let kind = 0; kind < 2; kind++) {
      const z = -depth / 2 + o.tileStep * (col + 0.5) + (kind ? o.tileStep / 2 : 0);
      if (z > depth / 2 - o.tileStep * 0.25) continue;
      const along = o.rowStep * (rows - row - 0.55) + 0.08;
      const lift = kind ? r * 0.55 : 0.005;
      const p = ridge.clone().addScaledVector(s, along).addScaledVector(n, lift + row * 0.004); p.z = z;
      const xAxis = kind ? n.clone() : n.clone().negate();
      const yAxis = s.clone(); const zAxis = up.crossVectors(xAxis, yAxis).clone();
      const qn = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
      const tone = 0.9 + (rand() - 0.5) * 0.18;
      const color = new THREE.Color(tone, tone * (0.95 + rand() * 0.06), tone * (0.9 + rand() * 0.08));
      if (rand() < 0.06) color.multiplyScalar(0.82);
      const order = (rows - 1 - (rows - 1 - row)) ; // linha a partir do beiral
      base[kind ? 'capa' : 'canal'].push({ p, q: qn, n: n.clone(), s: s.clone(), color, side, row, col, kind, rowFromEave: rows - 1 - row, j: rand() });
    }
  });
  // ordem de assentamento: do beiral para a cumeeira, canal antes da capa, os dois lados intercalados
  const all = [...base.canal, ...base.capa];
  all.forEach((b) => { b.order = (b.rowFromEave + (b.kind ? 0.5 : 0) + b.side * 0.25) / rows * 0.78 + (b.col / cols) * 0.12 + b.j * 0.03; });
  const maxO = Math.max(...all.map((b) => b.order)); all.forEach((b) => { b.order = (b.order / maxO) * 0.9; b.colN = b.col / cols; b.rowN = b.row / rows; });
  canal.count = base.canal.length; capa.count = base.capa.length;
  g.add(canal, capa);

  // cumeeira
  const ridgeGeo = tileGeometry({ len: 0.46, r1: 0.2, r2: 0.18, thick: 0.015, arc: Math.PI * 0.82, segA: q.tileSegA, segL: 2 });
  const ridgeN = Math.ceil(depth / 0.4);
  const ridgeMesh = new THREE.InstancedMesh(ridgeGeo, clayMat, ridgeN); ridgeMesh.castShadow = true; ridgeMesh.frustumCulled = false;
  const ridgeBase = [];
  for (let i = 0; i < ridgeN; i++) {
    const qn = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Y.clone(), Z.clone(), new THREE.Vector3(1, 0, 0)));
    const tone = 0.86 + rand() * 0.12;
    ridgeBase.push({ p: new THREE.Vector3(0, ridgeY + r * 0.6, -depth / 2 + (i + 0.5) * (depth / ridgeN)), q: qn, color: new THREE.Color(tone, tone * 0.96, tone * 0.92), order: 0.9 + (i / ridgeN) * 0.09 });
  }
  g.add(ridgeMesh);

  return { group: g, canal, capa, base, ridgeMesh, ridgeBase, interior, dims: { w: o.w, d: o.d, h: o.h, ridgeY, depth } };
}

/* ---------- a cena ---------- */
export function createRoofScene(canvas, options = {}) {
  const opt = Object.assign({ pixelRatio: Math.min(window.devicePixelRatio || 1, 2), quality: 'high', houses: 'single', preset: 'hero', still: false }, options);
  const high = opt.quality === 'high';
  const q = { texSize: opt.texSize || (high ? 1024 : 512), tileSegA: high ? 10 : 7, tileSegL: high ? 4 : 2, shadow: high ? 4096 : 2048, grass: opt.grass !== undefined ? opt.grass : (high ? 40000 : 12000) };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: opt.still });
  renderer.setPixelRatio(opt.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.46;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // a sombra só é recalculada quando as telhas se mexem (e de vez em quando, pelo balanço das folhas)
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 2000);

  // céu físico e sol baixo
  const sky = new Sky(); sky.scale.setScalar(4000);
  const u = sky.material.uniforms;
  u.turbidity.value = 7.5; u.rayleigh.value = 2.9; u.mieCoefficient.value = 0.0065; u.mieDirectionalG.value = 0.86;
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 8.5), THREE.MathUtils.degToRad(24));
  u.sunPosition.value.copy(sunDir);
  scene.add(sky);
  // nuvens: planos com textura de ruído, iluminadas pelo sol baixo
  const cloudTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); const img = x.createImageData(512, 256); const N = makeNoise(17);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 512; i++) {
      const u = i / 512, v = j / 256; const n = N(u * 5, v * 3, 6, 0.55);
      const dx = (u - 0.5) * 2, dy = (v - 0.55) * 2.2; const edge = clamp01(1 - Math.pow(dx * dx + dy * dy, 0.9));
      const a = clamp01((n - 0.52) * 2.6) * edge * edge; const k = (i + j * 512) * 4;
      const lit = 1 - v * 0.35; img.data[k] = 255 * lit; img.data[k + 1] = 232 * lit; img.data[k + 2] = 214 * lit; img.data[k + 3] = a * 255;
    }
    x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const clouds = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = THREE.MathUtils.degToRad(180 + 45 + (rand() - 0.5) * 150), d = 420 + rand() * 380;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, color: new THREE.Color().setHSL(0.05 + rand() * 0.03, 0.55, 0.62 + rand() * 0.12), opacity: 0.55 + rand() * 0.35 }));
    const w = 220 + rand() * 300; m.scale.set(w, w * (0.35 + rand() * 0.25), 1);
    m.position.set(Math.sin(a) * d, 40 + rand() * 70, Math.cos(a) * d); m.lookAt(0, m.position.y * 0.6, 0); m.material.opacity *= 0.8; clouds.add(m);
  }
  scene.add(clouds);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(4000); Object.keys(u).forEach((k) => { sky2.material.uniforms[k].value = u[k].value; }); envScene.add(sky2);
  const groundCatch = new THREE.Mesh(new THREE.CircleGeometry(1500, 16), new THREE.MeshBasicMaterial({ color: '#4c4630' })); groundCatch.rotation.x = -Math.PI / 2; groundCatch.position.y = -2; envScene.add(groundCatch);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  scene.environmentIntensity = 0.42;
  scene.fog = new THREE.FogExp2('#b9b3a6', 0.0042);

  const sun = new THREE.DirectionalLight('#ffb97c', 6.4);
  sun.position.copy(sunDir).multiplyScalar(40); sun.castShadow = true;
  sun.shadow.mapSize.set(q.shadow, q.shadow); sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 5, far: 90 });
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#ffd7b5', '#2f2a1e', 0.22));

  const T = opt.baked ? loadBaked(opt.baked) : buildTextures(q);

  // terreno com grama
  const groundMat = new THREE.MeshStandardMaterial({ ...T.grass, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 64), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const houses = [];
  const place = (h, x, z, ry = 0) => { h.group.position.set(x, 0, z); h.group.rotation.y = ry; scene.add(h.group); houses.push(h); return h; };
  if (opt.houses === 'bairro') {
    place(buildHouse({ w: 7.4, d: 9 }, T, q), 0, 0, 0.1);
    place(buildHouse({ w: 6.6, d: 8, wall: '#e2cfb3', pitch: 28 }, T, q), -11, -5, 0.1);
    place(buildHouse({ w: 7.6, d: 9, wall: '#f1e9df', pitch: 32 }, T, q), 11, -6, 0.1);
    place(buildHouse({ w: 6.4, d: 8, wall: '#d8c3a6' }, T, q), -5, -18, 0.1);
    place(buildHouse({ w: 7, d: 8.5, wall: '#efe0cc', pitch: 30 }, T, q), 8, -20, 0.1);
  } else if (opt.houses === 'galpao') {
    place(buildHouse({ w: 15, d: 24, h: 5.4, pitch: 18, over: 0.8, wall: '#ddd6ca', tileStep: 0.3, rowStep: 0.42 }, T, q), 0, 0);
  } else {
    place(buildHouse({}, T, q), 0, 0);
  }
  const main = houses[0];

  // palete de telhas no chão (de onde elas saem voando)
  const pallet = new THREE.Group();
  const palletWood = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1), new THREE.MeshStandardMaterial({ ...T.wood, roughness: 1 })); palletWood.position.y = 0.07; palletWood.castShadow = true; pallet.add(palletWood);
  const stackMat = new THREE.MeshStandardMaterial({ ...T.clay, color: '#c9673f', roughness: 1 });
  // telhas em pé, encaixadas umas nas outras em fileiras, como chegam da olaria
  const stack = new THREE.InstancedMesh(main.canal.geometry, stackMat, 6 * 16); stack.castShadow = true; let si = 0;
  const sm = new THREE.Matrix4(), sq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), sp = new THREE.Vector3(), ss1 = new THREE.Vector3(1, 1, 1);
  for (let row = 0; row < 6; row++) for (let k = 0; k < 16; k++) { sp.set(-0.5 + row * 0.2, 0.14 + 0.26, -0.42 + k * 0.055); sm.compose(sp, sq, ss1); stack.setMatrixAt(si++, sm); }
  pallet.add(stack);
  pallet.position.set(main.dims.w / 2 + 2.6, 0, main.dims.d / 2 + 1.6);
  scene.add(pallet);
  const palletPos = pallet.position.clone().add(new THREE.Vector3(0, 0.6, 0));

  // árvores e arbustos (ez-tree): folhas balançam ao vento
  const trees = [];
  const addTree = (preset, seedN, x, z, s, ry = 0) => {
    const t = new Tree(); t.loadPreset(preset); t.options.seed = seedN; t.generate();
    t.scale.setScalar(s); t.position.set(x, 0, z); t.rotation.y = ry;
    t.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    scene.add(t); trees.push(t); return t;
  };
  if (opt.houses !== 'galpao') {
    addTree('Oak Medium', 11, -10.5, -3.5, 0.13, 0.4);
    addTree('Ash Medium', 21, 12.5, 4.5, 0.11, 1.3);
    addTree('Oak Large', 31, -16, -14, 0.11, 2.1);
    addTree('Ash Medium', 41, 17, -12, 0.12, 0.7);
    addTree('Bush 1', 51, -4.6, 6.4, 0.06, 0.2);
    addTree('Bush 2', 61, 4.9, 6.3, 0.055, 1.4);
    addTree('Bush 1', 71, -5.4, -4.5, 0.06, 2.4);
  } else {
    addTree('Ash Medium', 21, -14, 8, 0.12, 1.3);
    addTree('Oak Medium', 11, 16, 10, 0.13, 0.4);
  }

  // horizonte: morros suaves e árvores ao longe (geometria compartilhada, barato)
  const hillMat = new THREE.MeshStandardMaterial({ color: '#a4b47a', map: T.grass.map, roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.3, d = 150 + rand() * 50;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.set(90 + rand() * 70, 7 + rand() * 9, 60 + rand() * 40); hill.position.set(Math.cos(a) * d, -2, Math.sin(a) * d); hill.rotation.y = rand() * 3; scene.add(hill);
  }
  if (trees.length) {
    const src = trees.slice(0, 4);
    const far = high ? 34 : 12;
    for (let i = 0; i < far; i++) {
      const a = rand() * Math.PI * 2, d = 45 + Math.pow(rand(), 0.8) * 120; const t = src[i % src.length];
      const c = new THREE.Group(); t.children.forEach((m) => { if (m.isMesh) { const mm = new THREE.Mesh(m.geometry, m.material); mm.castShadow = false; c.add(mm); } });
      c.scale.setScalar(t.scale.x * (0.8 + rand() * 0.6)); c.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); c.rotation.y = rand() * 6; scene.add(c);
    }
  }

  // grama instanciada perto da casa
  if (q.grass) {
    const blade = new THREE.PlaneGeometry(0.026, 0.15, 1, 3); blade.translate(0, 0.075, 0);
    const bp = blade.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setX(i, bp.getX(i) * (1 - y / 0.34)); }
    const grassMat = new THREE.MeshStandardMaterial({ color: '#9aa45a', roughness: 0.9, side: THREE.DoubleSide });
    grassMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = { value: 0 }; grassMat.userData.shader = sh;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp = instanceMatrix * vec4(position, 1.0);
        float sway = sin(uTime * 1.6 + wp.x * 0.7 + wp.z * 0.5) * 0.06 + sin(uTime * 3.1 + wp.x * 2.3) * 0.02;
        transformed.x += sway * position.y * 3.0; transformed.z += sway * position.y * 1.5;`);
    };
    const grass = new THREE.InstancedMesh(blade, grassMat, q.grass); grass.receiveShadow = true;
    const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), c = new THREE.Color();
    let gi = 0;
    while (gi < q.grass) {
      const ang = rand() * Math.PI * 2, dist = 6 + Math.pow(rand(), 1.6) * 16;
      pp.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      if (Math.abs(pp.x) < main.dims.w / 2 + 1.4 && Math.abs(pp.z) < main.dims.d / 2 + 1.4) continue;
      qq.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.4, rand() * Math.PI, (rand() - 0.5) * 0.4));
      const sc = 0.6 + rand() * 0.9; ss.set(1, sc, 1); m.compose(pp, qq, ss); grass.setMatrixAt(gi, m);
      c.setHSL(0.17 + rand() * 0.07, 0.25 + rand() * 0.2, 0.26 + rand() * 0.16); grass.setColorAt(gi, c); gi++;
    }
    scene.add(grass);
    scene.userData.grassMat = grassMat;
  }

  /* ----- pós-processamento ----- */
  let composer = null, gtao = null;
  if (high) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 12 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.5, 0.92));
    composer.addPass(new OutputPass());
    composer.addPass(new SMAAPass(1, 1));
  }

  /* ----- estado animável ----- */
  const state = { build: 1, lift: 0, renew: 1, glow: 0, orbit: 0, mx: 0, my: 0, time: 0 };
  const OLD = new THREE.Color('#77695c'), NEW = new THREE.Color(1.12, 1.02, 0.95);
  const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), tp = new THREE.Vector3(), ts = new THREE.Vector3(), tc = new THREE.Color();
  const ctrl = new THREE.Vector3(), a1 = new THREE.Vector3(), a2 = new THREE.Vector3(), tq2 = new THREE.Quaternion(), AXZ = new THREE.Vector3(0, 0, 1);
  const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
  const liftSet = new Set(); main.base.capa.forEach((b, i) => { if (b.side === 0 && b.row > 2 && b.row < 10 && (b.col * 7 + b.row * 3) % 23 === 0) liftSet.add(i); });
  const worldInv = new THREE.Matrix4();

  function applyHouse(h) {
    worldInv.copy(h.group.matrixWorld).invert();
    const localPallet = palletPos.clone().applyMatrix4(worldInv);
    const B = state.build;
    for (const kindName of ['canal', 'capa']) {
      const mesh = h[kindName], list = h.base[kindName];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        let t = clamp01((B * 1.12 - b.order) / 0.16);
        // voo em arco do palete até o lugar
        if (t < 1) {
          const e = easeInOut(t);
          ctrl.copy(localPallet).lerp(b.p, 0.55); ctrl.y = Math.max(localPallet.y, b.p.y) + 2.2 + b.j * 1.2;
          a1.copy(localPallet).lerp(ctrl, e); a2.copy(ctrl).lerp(b.p, e); tp.copy(a1).lerp(a2, e);
          tq.copy(flat).slerp(b.q, smooth(t));
          const spin = (1 - t) * (b.j - 0.5) * 2.4; tq.multiply(tq2.setFromAxisAngle(AXZ, spin));
          ts.setScalar(t <= 0 ? 0 : 1);
        } else {
          tp.copy(b.p); tq.copy(b.q); ts.setScalar(1);
        }
        // manutenção: algumas capas sobem, giram e voltam novas
        if (h === main && kindName === 'capa' && liftSet.has(i) && state.lift > 0) {
          const L = smooth(state.lift); tp.addScaledVector(b.n, L * (0.9 + b.j * 0.6)); tp.addScaledVector(b.s, -L * 0.25);
          tq.multiply(tq2.setFromAxisAngle(AXZ, L * (b.j - 0.5) * 1.6));
        }
        tm.compose(tp, tq, ts); mesh.setMatrixAt(i, tm);
        // reforma: telhado envelhecido -> onda de telhas novas
        const wave = smooth(clamp01(state.renew * 2.3 - b.colN * 1.25 - b.rowN * 0.12));
        tc.copy(b.color).multiply(OLD).lerp(b.color, wave);
        if (h === main && kindName === 'capa' && liftSet.has(i)) tc.lerp(NEW, state.glow * 0.6);
        mesh.setColorAt(i, tc);
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    for (let i = 0; i < h.ridgeBase.length; i++) {
      const rb = h.ridgeBase[i]; const t = clamp01((B * 1.12 - rb.order) / 0.08);
      tp.copy(rb.p); tp.y += (1 - smooth(t)) * 1.6; ts.setScalar(t > 0 ? 1 : 0);
      tm.compose(tp, rb.q, ts); h.ridgeMesh.setMatrixAt(i, tm);
      tc.copy(rb.color).multiply(OLD).lerp(rb.color, smooth(clamp01(state.renew * 2.3 - 0.9))); h.ridgeMesh.setColorAt(i, tc);
    }
    h.ridgeMesh.instanceMatrix.needsUpdate = true; if (h.ridgeMesh.instanceColor) h.ridgeMesh.instanceColor.needsUpdate = true;
  }

  /* ----- câmera ----- */
  const shots = {
    hero: { pos: [15.5, 6.2, 17.5], look: [0, 3.0, 0] },
    construcao: { pos: [11.5, 8.8, 13.5], look: [0.5, 3.8, 0] },
    manutencao: { pos: [7.4, 8.1, 6.6], look: [1.8, 4.5, 0.2] },
    reforma: { pos: [-13.5, 7.6, 14], look: [0, 3.4, 0] },
    telhas: { pos: [6.0, 6.3, 3.2], look: [2.4, 4.6, -1.4] },
    cumeeira: { pos: [2.4, 7.3, 7.8], look: [0, 5.4, 1.0] },
    bairro: { pos: [21, 11, 25], look: [0, 2.4, -6] },
    galpao: { pos: [28, 11, 30], look: [0, 4, 0] },
    estrutura: { pos: [11, 7.8, 12.5], look: [0.5, 3.6, 0] }
  };
  const camState = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0 };
  const setShot = (name) => { const s = shots[name]; [camState.px, camState.py, camState.pz] = s.pos; [camState.lx, camState.ly, camState.lz] = s.look; };
  setShot(opt.preset in shots ? opt.preset : 'hero');
  const target = new THREE.Vector3();

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 0.8 ? 50 : 34; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
  }

  let lastKey = '', frameN = 0;
  function render(dt = 1 / 60) {
    state.time += dt;
    scene.updateMatrixWorld();
    const key = state.build.toFixed(4) + state.lift.toFixed(4) + state.renew.toFixed(4) + state.glow.toFixed(4);
    frameN++;
    if (key !== lastKey) { houses.forEach(applyHouse); lastKey = key; renderer.shadowMap.needsUpdate = true; }
    else if (frameN % 5 === 0) renderer.shadowMap.needsUpdate = true;
    pallet.visible = state.build < 0.995;
    trees.forEach((t) => t.update(state.time));
    if (scene.userData.grassMat && scene.userData.grassMat.userData.shader) scene.userData.grassMat.userData.shader.uniforms.uTime.value = state.time;
    houses.forEach((h) => { h.interior.emissiveIntensity = 0.22; });
    const ox = Math.sin(state.orbit) * 1.6 + state.mx * 0.9;
    camera.position.set(camState.px + ox, camState.py + state.my * 0.6, camState.pz - ox * 0.4);
    target.set(camState.lx, camState.ly, camState.lz); camera.lookAt(target);
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  // nível 1: sem pós-processamento; nível 2: também menos resolução e sombra menor
  function degrade(level) {
    if (level >= 1) composer = null;
    if (level >= 2) { renderer.setPixelRatio(1); sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  }

  return { THREE, renderer, scene, camera, state, camState, shots, setShot, resize, render, degrade, houses, main };
}
