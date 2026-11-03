/* DGL Telhadista · animações e interações
   GSAP + ScrollTrigger + SplitText para o movimento, Lenis para a rolagem suave
   e Three.js (roof-scene.js) para o telhado em 3D. Empacotado com esbuild em dois arquivos:
   js/app.js (página e animações, carrega primeiro) e js/scene.js (cena 3D, carregada em seguida). */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const WHATSAPP = '5519993101979';
const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceMotion = (() => { try { return /[?&]animar\b/.test(location.search) || localStorage.getItem('dgl-animar') === '1'; } catch (e) { return /[?&]animar\b/.test(location.search); } })();
const reduce = systemReduce && !forceMotion;
if (forceMotion) document.documentElement.classList.add('force-motion');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;

/* ---------- rolagem suave ---------- */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (hash) => {
  const el = hash === '#topo' ? 0 : $(hash);
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { offset: hash === '#topo' ? 0 : -70, duration: 1.4 });
  else if (el === 0) window.scrollTo(0, 0);
  else el.scrollIntoView();
};
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const hash = a.getAttribute('href');
  if (hash.length < 2) return;
  e.preventDefault();
  scrollToTarget(hash);
  if (hash !== '#topo') { const alvo = $(hash); if (alvo) setTimeout(() => { alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); }, 900); }
}));

/* ---------- cena 3D: o arquivo pesado (three.js e texturas) carrega depois da página ---------- */
const want3D = !reduce && !/sem3d/.test(location.search);
const sceneReady = new Promise((resolve) => {
  if (!want3D) return resolve(null);
  if (window.DGLScene) return resolve(window.DGLScene);
  root.classList.add('scene-wait');
  const me = document.querySelector('script[src*="js/app.js"]');
  const s = document.createElement('script');
  s.src = me ? me.getAttribute('src').replace('app.js', 'scene.js') : 'js/scene.js';
  s.async = true;
  s.onload = () => resolve(window.DGLScene || null);
  s.onerror = () => resolve(null);
  document.head.appendChild(s);
});
// imagens de reserva da história: só baixam se o 3D não for usado
const loadFallbacks = () => $$('[data-fb][data-src]').forEach((img) => { img.srcset = img.dataset.srcset; img.src = img.dataset.src; img.removeAttribute('data-src'); });
let introDone = false;
/* ---------- cena 3D ---------- */
const story = $('[data-story]');
const canvas = $('[data-canvas]');
let roof = null;
const isMobile = window.innerWidth < 760;
if (reduce) story.classList.add('is-static');
function initRoof(scene) {
  if (reduce) return;
  if (!scene) { root.classList.add('no-webgl'); root.classList.remove('scene-wait'); loadFallbacks(); return; }
  const { createRoofScene, BAKED } = scene;
  try {
    // ?qualidade=baixa força a versão leve (útil para testar em máquinas sem placa de vídeo)
    const forcedLow = /qualidade=baixa/.test(location.search);
    roof = createRoofScene(canvas, { pixelRatio: forcedLow ? 1 : Math.min(window.devicePixelRatio || 1, 1.5), quality: isMobile || forcedLow ? 'medium' : 'high', baked: BAKED, grass: forcedLow ? 0 : undefined });
    roof.state.build = 0;
  } catch (err) {
    roof = null;
  }
  if (!roof) { root.classList.add('no-webgl'); root.classList.remove('scene-wait'); loadFallbacks(); return; }
  if (introDone) gsap.to(roof.state, { build: 1, duration: 3.2, ease: 'power2.out' });

  const resize = () => roof.resize(canvas.clientWidth, canvas.clientHeight);
  resize();
  window.addEventListener('resize', resize);
  // telas estreitas: câmera um pouco mais afastada para a casa caber
  // e alvo mais baixo, para a casa subir na tela e ficar acima dos textos e dos cartões de serviço
  if (isMobile) Object.entries(roof.shots).forEach(([k, s]) => { s.pos = s.pos.map((v, i) => (i === 1 ? v * 1.15 : v * 1.3)); s.look = s.look.slice(); s.look[1] -= k === 'hero' ? 0.8 : 1.9; });
  roof.setShot('hero');

  // paralaxe com o mouse e uma órbita bem lenta
  const pointer = { x: 0, y: 0 };
  if (fine) window.addEventListener('pointermove', (e) => { pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(story);
  // qualidade adaptativa: se o aparelho não sustentar a cena, reduz efeitos e resolução
  let frames = 0, slow = 0, degraded = 0;
  gsap.ticker.add((time, deltaMs) => {
    if (!visible) return;
    roof.state.mx += (pointer.x * 2 - roof.state.mx) * 0.05;
    roof.state.my += (-pointer.y * 1.4 - roof.state.my) * 0.05;
    roof.state.orbit = Math.sin(time * 0.12) * 0.35;
    roof.render(Math.min(deltaMs, 50) / 1000);
    if (root.classList.contains('scene-wait')) root.classList.remove('scene-wait');
    frames++; if (deltaMs > 34) slow++;
    if (frames === 90) {
      if (slow > 45 && degraded < 2) { roof.degrade(++degraded); resize(); }
      frames = 0; slow = 0;
    }
  });
}

/* ---------- carregamento e entrada da abertura ---------- */
const loader = $('[data-loader]');
const count = $('[data-loader-count]');
const heroLines = $$('.hero__line');
let heroChars = [];
const splitHero = () => {
  heroLines.forEach((line) => {
    const s = new SplitText(line, { type: 'chars', charsClass: 'char' });
    const mask = document.createElement('span'); mask.className = 'line-mask';
    line.parentNode.insertBefore(mask, line); mask.appendChild(line);
    heroChars.push(...s.chars);
  });
};

function intro() {
  document.body.classList.remove('is-loading');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(heroChars, { yPercent: 115, rotate: 6, duration: 1.4, stagger: 0.035 }, 0)
    .from('[data-hero-fade]', { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.1 }, 0.35)
    .from('.header', { y: -30, autoAlpha: 0, duration: 1, clearProps: 'transform' }, 0.4);
  if (roof) tl.to(roof.state, { build: 1, duration: 3.2, ease: 'power2.out' }, 0.1);
  introDone = true;
}

function runLoader() {
  if (reduce) { loader.remove(); document.body.classList.remove('is-loading'); if (roof) roof.state.build = 1; return; }
  splitHero();
  gsap.set('[data-hero-fade], .header', { autoAlpha: 1 });
  const tiles = $$('.loader__tiles img, .loader__tiles svg');
  const n = { v: 0 };
  const tl = gsap.timeline();
  tl.to(tiles, { y: 0, rotate: 0, opacity: 1, duration: 0.6, stagger: 0.14, ease: 'back.out(2)' }, 0)
    .to(n, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(n.v); } }, 0)
    .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=0.15')
    .add(intro, '-=0.55')
    .add(() => loader.remove());
}
const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
fontsReady.then(() => {
  runLoader();
  // a cena 3D é montada logo depois que a tela de carregamento aparece
  setTimeout(() => sceneReady.then((scene) => { initRoof(scene); setupStory(); ScrollTrigger.refresh(); }), 120);
});

/* ---------- a história: o telhado em 3D conta os serviços ---------- */
const chapters = $$('[data-chapter]');
const rail = $('[data-rail]');
function setupStory() {
  if (reduce) return;
  const fallbacks = Object.fromEntries($$('[data-fb]').map((img) => [img.dataset.fb, img]));
  const showFallback = (key) => Object.entries(fallbacks).forEach(([k, img]) => img.classList.toggle('is-on', k === key));
  showFallback('hero');

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: story, start: 'top top', end: 'bottom bottom', scrub: 1.1,
      onUpdate: (self) => {
        const p = self.progress;
        showFallback(p < 0.14 ? 'hero' : p < 0.42 ? 'construcao' : p < 0.7 ? 'manutencao' : 'reforma');
      }
    }
  });
  const cam = (shot, at, dur = 0.12) => {
    if (!roof) return;
    const s = roof.shots[shot];
    tl.to(roof.camState, { px: s.pos[0], py: s.pos[1], pz: s.pos[2], lx: s.look[0], ly: s.look[1], lz: s.look[2], duration: dur }, at);
  };
  const cardIn = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: 'power3.out' }, at);
  const cardOut = (el, at) => tl.to(el, { autoAlpha: 0, y: -50, duration: 0.05, ease: 'power2.in' }, at);

  // abertura sai
  tl.to('[data-hero]', { autoAlpha: 0, y: -80, duration: 0.08, ease: 'power2.in' }, 0.04)
    .to('.chapters__rail', { autoAlpha: 1, duration: 0.04 }, 0.1)
    .fromTo(rail, { scaleY: 0 }, { scaleY: 1, duration: 0.88, ease: 'none' }, 0.1);

  // construção: o telhado é desmontado e volta a ser montado com a rolagem
  cam('construcao', 0.06, 0.12);
  if (roof) tl.to(roof.state, { build: 0.18, duration: 0.08, ease: 'power1.in' }, 0.08).to(roof.state, { build: 1, duration: 0.24, ease: 'none' }, 0.17);
  cardIn(chapters[0], 0.14); cardOut(chapters[0], 0.4);

  // manutenção: algumas telhas saem, ganham cor nova e voltam ao lugar
  cam('manutencao', 0.4, 0.1);
  if (roof) tl.to(roof.state, { lift: 1, duration: 0.1 }, 0.46).to(roof.state, { glow: 1, duration: 0.06 }, 0.5).to(roof.state, { lift: 0, duration: 0.1 }, 0.58).to(roof.state, { glow: 0, duration: 0.06 }, 0.66);
  cardIn(chapters[1], 0.44); cardOut(chapters[1], 0.68);

  // reforma: o telhado envelhece e uma onda de telhas novas passa por ele
  cam('reforma', 0.68, 0.1);
  if (roof) tl.to(roof.state, { renew: 0, duration: 0.05 }, 0.7).to(roof.state, { renew: 1, duration: 0.2, ease: 'none' }, 0.76);
  cardIn(chapters[2], 0.72);
  cam('hero', 0.92, 0.08);
  tl.to({}, { duration: 0.02 }, 0.98);
}

/* ---------- faixas que correm (velocidade acompanha a rolagem) ---------- */
$$('[data-marquee]').forEach((row) => {
  const track = $('.marquee__track', row);
  const dir = Number(row.dataset.marquee);
  track.parentNode.appendChild(track.cloneNode(true)).setAttribute('aria-hidden', 'true');
  const tracks = $$('.marquee__track', row);
  if (reduce) return;
  const loop = gsap.to(tracks, { xPercent: -100, duration: 52, ease: 'none', repeat: -1 });
  if (dir < 0) { loop.progress(0.5); loop.timeScale(-1); }
  ScrollTrigger.create({
    trigger: row, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity() / 600;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v), 1.8)), duration: 0.4, overwrite: true,
        onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' }) });
      gsap.to(tracks, { skewX: gsap.utils.clamp(-3, 3, -v * 1.2), duration: 0.5, overwrite: 'auto',
        onComplete: () => gsap.to(tracks, { skewX: 0, duration: 0.8 }) });
    }
  });
});

/* ---------- textos ---------- */
if (!reduce) {
  // títulos de seção: linhas sobem de trás de uma máscara
  $$('[data-split-lines]').forEach((h) => {
    SplitText.create(h, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 85%', once: true } })
    });
  });
  // frase dos diferenciais: as palavras acendem conforme a rolagem
  const statement = $('[data-words]');
  if (statement) {
    const s = new SplitText(statement, { type: 'words', wordsClass: 'word' });
    gsap.to(s.words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 40%', scrub: true } });
  }
  // entradas em lote
  gsap.set('[data-reveal]', { opacity: 0, y: 40 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 })
  });
  // imagens: a moldura abre e a foto assenta
  $$('[data-reveal-img]').forEach((fig) => {
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .to(fig, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.out' })
      .to($('img', fig), { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });
  // paralaxe
  $$('[data-parallax]').forEach((img) => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('figure'), start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('[data-parallax-strong]').forEach((img) => gsap.fromTo(img, { yPercent: -10, scale: 1.08 }, { yPercent: 10, scale: 1, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));
}

/* ---------- valores em rolagem lateral (computador) ---------- */
const mm = gsap.matchMedia();
mm.add(forceMotion ? '(min-width: 56em)' : '(min-width: 56em) and (prefers-reduced-motion: no-preference)', () => {
  const pin = $('[data-hscroll-pin]');
  const track = $('[data-hscroll-track]');
  const distance = () => track.scrollWidth - window.innerWidth;
  const tween = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
  });
  const bar = $('[data-hscroll-bar]');
  if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true } });
  $$('.value', track).forEach((card) => {
    gsap.fromTo($('img', card), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    gsap.from($('.value__body', card), { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 85%', once: true } });
  });
});
mm.add(forceMotion ? '(max-width: 55.99em)' : '(max-width: 55.99em), (prefers-reduced-motion: reduce)', () => { $('[data-hscroll]').classList.add('no-hscroll'); return () => $('[data-hscroll]').classList.remove('no-hscroll'); });

/* ---------- cartões que inclinam e botões magnéticos ---------- */
if (fine && !reduce) {
  $$('[data-tilt]').forEach((el) => {
    const target = $('.card__link', el) || el;
    const rx = gsap.quickTo(target, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(target, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(target, { transformPerspective: 1000 });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28); y((e.clientY - r.top - r.height / 2) * 0.35);
      el.style.setProperty('--x', `${e.clientX - r.left}px`); el.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerenter', (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--x', `${e.clientX - r.left}px`); el.style.setProperty('--y', `${e.clientY - r.top}px`); });
    el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }); });
  });

}

/* ---------- cabeçalho, progresso e botão flutuante ---------- */
const header = $('[data-header]');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', self.direction === 1 && y > 600 && !document.body.classList.contains('menu-open'));
    gsap.set('[data-progress]', { scaleX: self.progress });
  }
});
const float = $('[data-float]');
const zones = ['.story', '.quote', '.footer'].map((s) => $(s));
const inZone = new Set();
new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target)));
  const show = inZone.size === 0;
  float.classList.toggle('is-hidden', !show);
  float.tabIndex = show ? 0 : -1;
}, { rootMargin: '-20% 0px -20% 0px' }).observe(zones[0]);
zones.slice(1).forEach((z) => new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target)));
  const show = inZone.size === 0; float.classList.toggle('is-hidden', !show); float.tabIndex = show ? 0 : -1;
}, { rootMargin: '-20% 0px -20% 0px' }).observe(z));
float.classList.add('is-hidden'); float.tabIndex = -1;

/* ---------- menu do celular ---------- */
const burger = $('[data-burger]');
const menu = $('[data-menu]');
const menuLinks = $$('[data-menu-link] span');
let menuTl = null;
const buildMenu = () => gsap.timeline({ paused: true })
  .set(menu, { visibility: 'visible' })
  .fromTo(menu, { clipPath: 'circle(0% at calc(100% - 44px) 40px)' }, { clipPath: 'circle(150% at calc(100% - 44px) 40px)', duration: reduce ? 0.01 : 0.9, ease: 'expo.inOut' })
  .from(menuLinks, { yPercent: 110, duration: reduce ? 0.01 : 0.8, stagger: 0.06, ease: 'expo.out' }, reduce ? 0 : 0.35)
  .from('[data-menu-foot]', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'expo.out' }, reduce ? 0 : 0.6);
const setMenu = (open) => {
  if (!menuTl) menuTl = buildMenu();
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.setAttribute('aria-hidden', String(!open));
  if (open) { lenis && lenis.stop(); menuTl.timeScale(1).play(); setTimeout(() => { const a = $('a', menu); if (a) a.focus(); }, 450); }
  else { lenis && lenis.start(); menuTl.timeScale(1.6).reverse(); }
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' && e.key !== 'Tab') return;
  if (burger.getAttribute('aria-expanded') !== 'true') return;
  if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
  const f = [burger, ...$$('a', menu)]; const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
});

/* ---------- perguntas: acordeão com altura animada ---------- */
const qas = $$('.qa');
const toggleQa = (qa, open) => {
  const btn = $('.qa__q', qa); const panel = $('.qa__a', qa);
  btn.setAttribute('aria-expanded', String(open));
  gsap.killTweensOf(panel);
  if (open) {
    panel.hidden = false;
    gsap.fromTo(panel, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: reduce ? 0 : 0.7, ease: 'expo.out', onComplete: () => { panel.style.height = ''; ScrollTrigger.refresh(); } });
    gsap.fromTo($('p', panel), { y: reduce ? 0 : -12 }, { y: 0, duration: 0.7, ease: 'expo.out' });
  } else {
    gsap.to(panel, { height: 0, opacity: 0, duration: reduce ? 0 : 0.45, ease: 'expo.inOut', onComplete: () => { panel.hidden = true; panel.style.height = ''; ScrollTrigger.refresh(); } });
  }
};
qas.forEach((qa) => $('.qa__q', qa).addEventListener('click', () => {
  const open = $('.qa__q', qa).getAttribute('aria-expanded') !== 'true';
  if (open) qas.forEach((o) => { if (o !== qa && $('.qa__q', o).getAttribute('aria-expanded') === 'true') toggleQa(o, false); });
  toggleQa(qa, open);
}));

/* ---------- orçamento: prévia da conversa e validação na hora ---------- */
const form = $('#form');
if (form) {
  const nome = $('#f-nome'), tel = $('#f-tel');
  const out = Object.fromEntries($$('[data-out]').map((b) => [b.dataset.out, b]));
  const preview = $('[data-preview]'), typing = $('[data-typing]'), ok = $('[data-ok]');
  const padrao = { nome: '…', telefone: '…', servico: 'um serviço', perfil: 'a minha residência' };
  const valor = (n) => (n === 'nome' ? nome.value.trim() : n === 'telefone' ? tel.value.trim() : (form.querySelector(`input[name="${n}"]:checked`) || {}).value || '');
  let typingTimer;
  const atualizar = () => {
    Object.entries(out).forEach(([k, el]) => { const v = valor(k); el.textContent = v || padrao[k]; el.classList.toggle('is-empty', !v); });
    typing.classList.add('is-on');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { typing.classList.remove('is-on'); preview.classList.remove('pop'); void preview.offsetWidth; preview.classList.add('pop'); }, 550);
  };
  const regras = {
    nome: [nome, () => nome.value.trim().length > 1, 'Escreva o seu nome para a DGL saber com quem fala.'],
    telefone: [tel, () => tel.value.replace(/\D/g, '').length >= 10, 'Escreva um telefone com DDD, por exemplo (19) 99999-9999.'],
    servico: [null, () => !!valor('servico'), 'Escolha construção, manutenção ou reformas.']
  };
  const marcar = (k, mostrar) => {
    const [input, teste, msg] = regras[k];
    const box = input ? input.closest('.field') : form.querySelector('fieldset.chips');
    const err = box.querySelector('.field__err');
    const valido = teste();
    box.classList.toggle('is-valid', valido);
    if (mostrar || box.classList.contains('is-invalid')) {
      box.classList.toggle('is-invalid', !valido);
      if (input) input.setAttribute('aria-invalid', String(!valido));
      err.textContent = valido ? '' : msg;
    }
    return valido;
  };
  [nome, tel].forEach((i) => {
    i.addEventListener('input', () => { atualizar(); marcar(i === nome ? 'nome' : 'telefone', false); });
    i.addEventListener('blur', () => { if (i.value.trim()) marcar(i === nome ? 'nome' : 'telefone', true); });
  });
  $$('input[type="radio"]', form).forEach((r) => r.addEventListener('change', () => { atualizar(); if (r.name === 'servico') marcar('servico', false); }));
  // escolher um público nos cartões já marca no formulário
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    const map = { 'Residência': 'a minha residência', 'Profissional autônomo': 'uma obra (sou profissional autônomo)', 'Empresa': 'a minha empresa' };
    const radio = form.querySelector(`input[name="perfil"][value="${map[a.dataset.pick]}"]`);
    if (radio) { radio.checked = true; atualizar(); }
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = ['nome', 'telefone', 'servico'].map((k) => [k, marcar(k, true)]);
    const erro = res.find(([, v]) => !v);
    if (erro) {
      const [input] = regras[erro[0]];
      const box = input ? input.closest('.field') : form.querySelector('fieldset.chips');
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      (input || form.querySelector('input[name="servico"]')).focus();
      return;
    }
    const texto = `Olá, DGL! Vim pelo site da DGL Telhadista.\n\nMeu nome é ${valor('nome')}. Preciso de ${valor('servico')} para ${valor('perfil')}. Meu telefone é ${valor('telefone')}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    ok.textContent = 'Pronto! Abrimos o WhatsApp com a sua mensagem.';
  });
  Object.entries(out).forEach(([k, el]) => el.classList.toggle('is-empty', !valor(k)));
}

/* ---------- rodapé: os números do telefone fazem uma onda ---------- */
const wave = $('[data-wave]');
if (wave && !reduce) {
  const s = new SplitText(wave, { type: 'chars', charsClass: 'char' });
  const big = wave.closest('a');
  big.addEventListener('pointerenter', () => gsap.fromTo(s.chars, { y: 0 }, { y: -18, duration: 0.3, ease: 'power2.out', stagger: 0.03, yoyo: true, repeat: 1 }));
  gsap.from(s.chars, { yPercent: 60, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.025, scrollTrigger: { trigger: wave, start: 'top 95%', once: true } });
  gsap.fromTo('.footer__word', { xPercent: 8 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* recalcula as posições quando as imagens terminam de carregar */
window.addEventListener('load', () => ScrollTrigger.refresh());

/* ---------- aviso para quem está com "reduzir movimento" ligado no aparelho ---------- */
if (systemReduce) {
  const t = document.querySelector('[data-motion-toggle]');
  if (t) {
    t.hidden = false;
    t.textContent = forceMotion ? 'Desligar animações' : 'Ver com animações';
    t.addEventListener('click', () => {
      try { forceMotion ? localStorage.removeItem('dgl-animar') : localStorage.setItem('dgl-animar', '1'); } catch (e) {}
      const u = new URL(location.href);
      forceMotion ? u.searchParams.delete('animar') : u.searchParams.set('animar', '');
      location.href = u.toString().replace('animar=', 'animar');
    });
  }
}
