/* Qualidade gráfica adaptativa do 3D: um só lugar com os níveis, a detecção do aparelho e o ajuste em tempo real.
   Toda cena 3D do site lê os parâmetros daqui (hoje é a cena do telhado, em roof-scene.js).

   Três faixas, cada uma com dois degraus para a troca ser gradual:
     alta  (0, 1)  efeitos de luz e sombra completos (0) ou mais leves (1), resolução maior, texturas completas
     média (2, 3)  sem efeitos de pós-processamento, sombra menor e mais econômica no 3, metade da grama no 3
     baixa (4, 5)  texturas leves, resolução reduzida, sombra simples, pouca ou nenhuma grama solta
   O telhado, a casa, as árvores e todas as animações existem em todos os níveis. */

export const LEVELS = [
  // dpr: limite da resolução de renderização; shadow: 'base' (2048 ou 4096) ou o tamanho do mapa de sombra
  // shadowEvery: a cada quantos quadros a sombra das folhas é refeita (0 = só quando as telhas se mexem)
  // shadowMove: com as telhas em movimento, a sombra é refeita a cada N quadros
  // dprM: o mesmo limite no celular. A tela do celular tem poucos pixels de largura, então o celular bom aguenta
  //   desenhar perto da resolução real (imagem nítida); o fraco fica com resolução baixa para a rolagem não travar
  // grass: fração da grama solta; blur: desfoque do fundo no cabeçalho e nos cartões sobre o 3D
  { tier: 'alta', post: 'full', dpr: 1.5, dprM: 2, shadow: 'base', shadowEvery: 5, shadowMove: 1, grass: 1, blur: true, softShadow: true, textures: 'full' },
  { tier: 'alta', post: 'lite', dpr: 1.25, dprM: 2, shadow: 'base', shadowEvery: 5, shadowMove: 1, grass: 1, blur: true, softShadow: true, textures: 'full' },
  { tier: 'média', post: 'none', dpr: 1.25, dprM: 1.75, shadow: 'base', shadowEvery: 5, shadowMove: 1, grass: 1, blur: false, softShadow: true, textures: 'full' },
  { tier: 'média', post: 'none', dpr: 1, dprM: 1.25, shadow: 1024, shadowEvery: 0, shadowMove: 3, grass: 0.5, blur: false, softShadow: true, textures: 'full' },
  { tier: 'baixa', post: 'none', dpr: 0.75, dprM: 0.85, shadow: 1024, shadowEvery: 0, shadowMove: 3, grass: 0.25, blur: false, softShadow: false, textures: 'low' },
  { tier: 'baixa', post: 'none', dpr: 0.6, dprM: 0.6, shadow: 512, shadowEvery: 0, shadowMove: 3, grass: 0, blur: false, softShadow: false, textures: 'low' }
];
export const MAX = LEVELS.length - 1;
export const tierOf = (n) => LEVELS[n].tier;

const NAMED = { alta: 0, media: 2, 'média': 2, baixa: 4 };

/* ---------- detecção ----------
   Soma pontos pela capacidade real: núcleos, memória, recursos da placa de vídeo pelo WebGL, quantidade de pixels
   da tela e o tipo de placa. O nome da placa só pesa como um dos itens (nunca o modelo do celular), e qualquer dado
   que o navegador não informe vale zero (configuração segura). Depois, o monitor de quadros corrige pelo real. */
export function detect({ mobile }) {
  const q = location.search.match(/qualidade=(alta|m[eé]dia|baixa|[0-5])/);
  if (q) return { level: q[1] in NAMED ? NAMED[q[1]] : +q[1], forced: true, score: null, info: {} };

  const info = { cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, gl2: false, maxTex: 0, gpu: '' };
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (gl) {
      info.gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      info.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      info.gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    } else return { level: MAX, score: null, info, noGL: true };
  } catch (e) { /* sem WebGL detalhado: segue com o resto */ }

  // sem placa de vídeo (o navegador desenha pelo processador, a 1 a 3 quadros por segundo): o site mostra as imagens
  // da casa no lugar do 3D, como quando não há WebGL. Acontece em máquinas virtuais, PCs sem driver e nos testes
  // automáticos de velocidade (PageSpeed). Com ?qualidade=..., o 3D roda mesmo assim (para testes).
  if (/SwiftShader|llvmpipe|softpipe|Software|Microsoft Basic/i.test(info.gpu)) return { level: MAX, score: null, info, software: true };
  // economia de dados ligada: o mais leve
  const save = navigator.connection && navigator.connection.saveData;
  if (save) return { level: MAX, score: null, info };

  const g = info.gpu;
  let s = 0;
  // no celular, 8 núcleos não querem dizer aparelho forte (os de entrada também têm): contam só 1 ponto
  if (info.cores) s += info.cores >= 8 ? (mobile ? 1 : 2) : info.cores >= 6 ? 1 : info.cores <= 2 ? -2 : info.cores <= 4 ? -1 : 0;
  if (info.mem) s += info.mem >= 8 ? 2 : info.mem >= 6 ? 1 : info.mem <= 2 ? -2 : info.mem <= 4 ? -1 : 0;
  if (!info.gl2) s -= 2;
  if (info.maxTex >= 16384) s += 1; else if (info.maxTex && info.maxTex <= 4096) s -= 1;
  // classe da placa (um item entre vários)
  if (/NVIDIA|GeForce|RTX|Quadro|Radeon (RX|Pro)|Apple M\d/i.test(g)) s += 3;
  else if (/Apple GPU/i.test(g)) s += 2;
  // celulares: placas de entrada (Adreno 600 a 613), topo de linha (Adreno 7xx em diante, Mali-G7xx, Immortalis, Xclipse)
  else if (/Adreno \(TM\) 6(0\d|1[0-3])/i.test(g)) s -= 1;
  else if (/Adreno \(TM\) [7-9]\d\d|Mali-G7\d\d|Immortalis|Xclipse/i.test(g)) s += 2;
  else if (/Adreno \(TM\) 6\d\d|Mali-G6\d\d|Mali-G(71|72|76|77|78)/i.test(g)) s += 1;
  else if (/Intel.*(UHD|HD Graphics)/i.test(g)) s -= 3;
  else if (/Intel.*(Iris|Arc)/i.test(g)) s -= 1;
  else if (/Mali-(4|T|G[3-5]\d)|Adreno \(TM\) [1-5]\d\d|PowerVR|IMG/i.test(g)) s -= 2;
  // muitos pixels para desenhar (tela grande com densidade alta) pesam mais
  const px = (screen.width || 0) * (screen.height || 0) * Math.pow(window.devicePixelRatio || 1, 2);
  if (px > 8e6) s -= 1;
  // celular e tablet: bateria e aquecimento limitam o desempenho contínuo
  if (mobile) s -= 3;

  let level = s >= 5 ? 0 : s >= 3 ? 1 : s >= 1 ? 2 : s >= -1 ? 3 : s >= -4 ? 4 : 5;
  // celular topo de linha: continua sem pós-processamento, mas desenha na resolução mais alta (ver dprM)
  const top = !!mobile && s >= 3;
  if (mobile) level = Math.max(level, 2); // no celular, sem pós-processamento (gasta bateria e esquenta)
  return { level, score: s, info, top };
}

/* ---------- ajuste em tempo real ----------
   Desce rápido quando o quadro passa do tempo; sobe devagar, só depois de vários períodos de rolagem com folga,
   um degrau por vez. Nos 15 s depois de subir, o degrau novo fica em teste: se a rolagem cair abaixo de ~50 quadros
   por segundo, volta ao anterior e esse degrau fica bloqueado. Depois de dois bloqueios, o sistema para de subir.
   Assim a qualidade não fica alternando. */
export function createMonitor({ start, minUp, setLevel, getLevel, onStall }) {
  let frames = 0, slow = 0, verySlow = 0, stall = 0;
  let busyTicks = 0, goodTicks = 0, goodWindows = 0, lastTick = 0;
  let lastChange = performance.now(), upAt = 0, upTo = -1, probeN = 0, probeSlow = 0;
  const locked = new Set();
  const change = (n, now) => {
    const before = getLevel();
    const after = setLevel(Math.max(minUp, Math.min(MAX, n)));
    if (after !== before) { lastChange = now; goodWindows = 0; frames = slow = verySlow = 0; busyTicks = goodTicks = 0; }
    return after !== before;
  };
  return {
    // a cada chamada do relógio de animação (desenhando ou não): mede a folga para poder subir
    tick(now, busy) {
      const gap = lastTick ? now - lastTick : 0; lastTick = now;
      if (!busy || !gap || gap > 250) return;
      busyTicks++; if (gap <= 18.5) goodTicks++;
      if (busyTicks < 120) return;
      goodWindows = goodTicks / busyTicks >= 0.95 ? goodWindows + 1 : 0;
      busyTicks = goodTicks = 0;
      const lvl = getLevel(), next = lvl - 1;
      if (goodWindows >= 3 && next >= minUp && !locked.has(next) && locked.size < 2 && now - lastChange > 8000) {
        if (change(next, now)) { upAt = now; upTo = next; probeN = probeSlow = 0; }
      }
    },
    // a cada quadro desenhado: intervalo desde o anterior; se mais da metade de 40 quadros passou do tempo, desce
    frame(now, gap, cap30) {
      if (!gap || gap > 1000) return;
      const lvl0 = getLevel();
      // teste do degrau que acabou de subir (só no ritmo cheio, rolando)
      if (upTo === lvl0 && now - upAt < 15000 && !cap30) {
        probeN++; if (gap > 20) probeSlow++;
        if (probeN >= 60) {
          if (probeSlow > 30) { locked.add(lvl0); upTo = -1; change(lvl0 + 1, now); probeN = probeSlow = 0; return; }
          probeN = probeSlow = 0;
        }
      }
      frames++; if (gap > (cap30 ? 40 : 34)) slow++; if (gap > 50) verySlow++;
      if (frames < 40) return;
      const lvl = getLevel();
      // já no nível mais leve e ainda abaixo de ~25 quadros por segundo por 4 medições seguidas: o aparelho não
      // aguenta o 3D. Avisa a página, que troca a cena pelas imagens da casa (rolagem lisa em vez de 3D travando).
      if (lvl === MAX && slow > 20 && now - lastChange > 1500) { if (++stall >= 4 && onStall) { stall = 0; onStall(); } }
      else stall = 0;
      if (lvl < MAX && slow > 20 && now - lastChange > 1500) {
        if (upTo === lvl && now - upAt < 15000) locked.add(lvl);
        change(lvl + (verySlow > 20 ? 2 : 1), now);
      }
      frames = slow = verySlow = 0;
    },
    start,
    stallNow() { if (onStall) onStall(); } // para testes (?debug)
  };
}
