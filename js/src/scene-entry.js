/* Cena 3D da DGL (three.js e árvores). Carregada pelo js/app.js depois da página.
   As texturas ficam em js/tex/ como arquivos WebP separados (antes iam embutidas em base64,
   o que deixava este arquivo ~30% maior e impedia o navegador de baixá-las em paralelo). */
import { createRoofScene } from './roof-scene.js';
import BAKED from './textures/index.js';

// baixa e decodifica as texturas antes de mostrar a cena, para a casa não aparecer cinza
const urls = Object.values(BAKED).flatMap((m) => Object.values(m));
const ready = Promise.all(urls.map((u) => new Promise((ok) => {
  const img = new Image();
  img.onload = img.onerror = () => ok();
  img.src = u;
}))).then(() => true);

window.DGLScene = { createRoofScene, BAKED, ready };
