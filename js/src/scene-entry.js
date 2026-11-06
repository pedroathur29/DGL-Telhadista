/* Cena 3D da DGL (three.js e árvores). Carregada pelo js/app.js depois da página.
   As texturas ficam em js/tex/ como arquivos WebP separados (antes iam embutidas em base64,
   o que deixava este arquivo ~30% maior e impedia o navegador de baixá-las em paralelo).
   Há dois conjuntos: o completo e o leve (metade da resolução), escolhido pela faixa de qualidade (quality.js). */
import { createRoofScene } from './roof-scene.js';
import BAKED, { LOW } from './textures/index.js';
import { useLowTextures } from './vendor/ez-tree/textures.js';

// baixa e decodifica só o conjunto escolhido antes de mostrar a cena, para a casa não aparecer cinza
const preload = (set) => Promise.all(Object.values(set).flatMap((m) => Object.values(m)).map((u) => new Promise((ok) => {
  const img = new Image();
  img.onload = img.onerror = () => ok();
  img.src = u;
}))).then(() => true);

window.DGLScene = { createRoofScene, BAKED, LOW, preload, useLowTextures };
