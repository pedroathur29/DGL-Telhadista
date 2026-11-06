// Versão reduzida do textures.js do ez-tree (MIT, Daniel Greenheck):
// só a casca de carvalho (Poly Haven, CC0) e as folhas de carvalho e freixo, para o site ficar leve.
import * as THREE from 'three';
import oakAo from './assets/oak_ao.webp';
import oakColor from './assets/oak_color.webp';
import oakNormal from './assets/oak_normal.webp';
import oakRoughness from './assets/oak_roughness.webp';
import ashLeaves from './assets/ash_leaves.webp';
import oakLeaves from './assets/oak_leaves.webp';
import oakAoLow from './assets/low/oak_ao.webp';
import oakColorLow from './assets/low/oak_color.webp';
import oakNormalLow from './assets/low/oak_normal.webp';
import ashLeavesLow from './assets/low/ash_leaves.webp';
import oakLeavesLow from './assets/low/oak_leaves.webp';

// DGL: texturas leves (metade da resolução) para a faixa baixa de qualidade; escolher antes de criar as árvores
let low = false;
export function useLowTextures(on) { low = !!on; }

const textureLoader = new THREE.TextureLoader();
const cache = new Map();
const loadTexture = (path, srgb = false) => {
  if (cache.has(path)) return cache.get(path);
  const texture = textureLoader.load(path);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.premultiplyAlpha = true;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(path, texture);
  return texture;
};

const bark = { ao: oakAo, color: oakColor, normal: oakNormal, roughness: oakRoughness };
const barkLow = { ao: oakAoLow, color: oakColorLow, normal: oakNormalLow, roughness: oakRoughness };
export function getBarkTexture(barkType, fileType, scale = { x: 1, y: 1 }) {
  const t = loadTexture((low ? barkLow : bark)[fileType], fileType === 'color').clone();
  t.repeat.x = scale.x; t.repeat.y = 1 / scale.y; t.needsUpdate = true;
  return t;
}
export function getLeafTexture(leafType = 'oak') {
  return loadTexture(leafType === 'ash' ? (low ? ashLeavesLow : ashLeaves) : (low ? oakLeavesLow : oakLeaves), true);
}
