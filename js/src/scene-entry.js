/* Cena 3D da DGL (three.js, árvores e texturas). Carregada pelo js/app.js depois da página. */
import { createRoofScene } from './roof-scene.js';
import BAKED from './textures/index.js';
window.DGLScene = { createRoofScene, BAKED };
