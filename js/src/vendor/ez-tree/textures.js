// Versão reduzida do textures.js do ez-tree (MIT, Daniel Greenheck):
// só a casca de carvalho (Poly Haven, CC0) e as folhas de carvalho e freixo, para o site ficar leve.
import * as THREE from 'three';
import oakAo from './assets/oak_ao.jpg';
import oakColor from './assets/oak_color.jpg';
import oakNormal from './assets/oak_normal.jpg';
import oakRoughness from './assets/oak_roughness.jpg';
import ashLeaves from './assets/ash_leaves.webp';
import oakLeaves from './assets/oak_leaves.webp';

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
export function getBarkTexture(barkType, fileType, scale = { x: 1, y: 1 }) {
  const t = loadTexture(bark[fileType], fileType === 'color').clone();
  t.repeat.x = scale.x; t.repeat.y = 1 / scale.y; t.needsUpdate = true;
  return t;
}
export function getLeafTexture(leafType = 'oak') {
  return loadTexture(leafType === 'ash' ? ashLeaves : oakLeaves, true);
}
