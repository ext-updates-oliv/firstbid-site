/*
 * FirstBid — a abertura animada do logo.
 *
 * UM motor, dois usos:
 *   FirstBid-Site/intro.js                  (data-boot="site": versão longa + scroll pro site)
 *   FirstBid app/dashboard/public/intro.js  (data-boot="app":  versão curta sobre a dashboard)
 * A cópia do app ainda NÃO foi instalada (26/09: o dono pediu pra esperar). Quando
 * for, é cópia idêntica deste arquivo: mudou aqui, copie pro outro.
 *
 * A tese é a do DESIGN.md do site: todo preço que o vendedor configurou já existe,
 * apagado; o pedido que chega acende exatamente um. Os dígitos desse um viram o logo.
 * O valor aceso e o lugar dele na matriz são sorteados a cada abertura ($20–$90).
 * Regra do mundo: o valor faz SNAP, nunca tween; o que desliza é a câmera.
 *
 * Tem que ser carregado como o PRIMEIRO filho do <body>, síncrono (sem defer):
 * a abertura entra antes da primeira pintura, senão a página pisca por baixo.
 */
(() => {
  const script = document.currentScript;
  const boot = script && script.dataset.boot;
  const html = document.documentElement;

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* sem storage: toca de novo, e tudo bem */ } }
  };
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ paleta
  const THEMES = {
    site: {
      ground: '#070b14', ghost: '#1a2334', ghostLit: '#2b3a55', ghostHot: '#3a4b6b',
      bone: '#ece6d9', boneDim: '#93a0b6', scanRGB: '147,160,182',
      disc: ['#162033', '#0c121e', '#080c16'], vig: '4,7,14', gauze: true
    },
    // A dashboard é preta e neutra: a abertura precisa terminar na MESMA cor, sem flash.
    app: {
      ground: '#000000', ghost: '#1c1c1c', ghostLit: '#2b2b2b', ghostHot: '#3d3d3d',
      bone: '#ece6d9', boneDim: '#949494', scanRGB: '160,160,160',
      disc: ['#1d1d1d', '#111111', '#0a0a0a'], vig: '0,0,0', gauze: false
    }
  };
  const GLOW = '#ffc950', CORE = '#fff0c8', DECAY = '#9c7434', GLOW_RGB = '255,201,80';

  // ----------------------------------------------------------------- tempos
  const TIMELINES = {
    full: {
      scan0: 0.9, scan1: 1.7, match: 1.8, in0: 1.85, in1: 2.45, burst: 2.7, back0: 2.75, back1: 3.95,
      spread: 0.38, dur0: 1.0, durR: 0.35, dim0: 3.0, dim1: 4.2, pf0: 4.3, pf1: 4.95,
      stroke0: 3.95, stroke1: 4.65, fill0: 4.05, fill1: 4.7, drop0: 4.72, impact: 5.0,
      word0: 5.35, lstep: 0.075, lflick: 0.24, url: 6.2, ustep: 0.028, end: 6.9
    },
    short: {
      scan0: null, match: 0.2, burst: 0.45, back1: 1.6,
      spread: 0.2, dur0: 0.62, durR: 0.2, dim0: 0.5, dim1: 1.4, pf0: 1.28, pf1: 1.7,
      stroke0: 1.12, stroke1: 1.52, fill0: 1.18, fill1: 1.6, drop0: 1.56, impact: 1.78,
      word0: 1.92, lstep: 0.045, lflick: 0.14, url: 2.3, ustep: 0.018, end: 2.7
    }
  };

  // Geometria do logo, traçada do logo.png (px do master de 512, centrada na marca).
  const OUT = [[0, -65], [58.5, -21], [37, 66], [-37, 66], [-58.5, -21]];
  const AP = [0, -43.5], TL = [-36.5, -15.5], TR = [36.5, -15.5], BR = [24.5, 51.5], BL = [-24.5, 51.5], BC = [0, 51.5];
  const CHAIN_L = [AP, TL, BL, BC], CHAIN_R = [AP, TR, BR, BC], VERT = [AP, BC];
  const CROSS_L = [[0, -15.5], TL], CROSS_R = [[0, -15.5], TR];
  const FACET = [[0, -36], [-20, 51.5], [20, 51.5]];
  const RING_OFF = 15, RING_R = 174, DISC_R = 188;

  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
  const eOutCubic = k => 1 - Math.pow(1 - k, 3);
  const eInOutCubic = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eInOutQuart = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2;
  const eInQuad = k => k * k;
  const fract = x => x - Math.floor(x);

  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const plen = pts => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  function samplePath(pts, step) {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let j = 0; j < n; j++) out.push([lerp(x0, x1, j / n), lerp(y0, y1, j / n)]);
    }
    return out;
  }
  function inPoly(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const LEN = { l: plen(CHAIN_L), r: plen(CHAIN_R), v: plen(VERT), c: plen(CROSS_L) };
  const POOL = '0123456789$.';
  const MONO = "'Chivo Mono', ui-monospace, Consolas, monospace";
  const DISPLAY = "'Big Shoulders Display', Impact, 'Arial Narrow', sans-serif";

  // ------------------------------------------------------------------ estilo
  function injectStyle() {
    if (document.getElementById('fbi-style')) return;
    const st = document.createElement('style');
    st.id = 'fbi-style';
    st.textContent = `
.fbi{position:relative;z-index:5;width:100%;height:100vh;height:100svh;overflow:hidden;background:var(--fbi-ground);color:#ece6d9;font-family:${MONO}}
.fbi--fixed{position:fixed;inset:0;height:auto;z-index:2147483000;transition:opacity .38s cubic-bezier(.16,1,.3,1)}
.fbi--out{opacity:0;pointer-events:none}
.fbi-c{position:absolute;inset:0;width:100%;height:100%;display:block}
.fbi-gauze{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(156,116,52,.055) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(156,116,52,.055) 0 1px,transparent 1px 3px)}
.fbi-hud{position:absolute;top:calc(env(safe-area-inset-top,0px) + 18px);left:16px;right:16px;display:grid;gap:6px;font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:lowercase;color:var(--fbi-dim);pointer-events:none}
.fbi-hud div{opacity:0;transform:translateY(-2px);transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbi-hud div.on{opacity:1;transform:none}
.fbi-hud b{color:#ece6d9;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.fbi-hud .hot{color:${GLOW}}
.fbi-cur{display:inline-block;width:.6em;height:1em;vertical-align:-2px;background:var(--fbi-dim);margin-left:4px;animation:fbi-blink 1s steps(1) infinite}
@keyframes fbi-blink{50%{opacity:0}}
.fbi-skip{position:absolute;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);font:500 11px/1 ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--fbi-dim);background:transparent;border:0;box-shadow:inset 0 0 0 1px var(--fbi-line);padding:10px 13px;border-radius:2px;cursor:pointer;opacity:0;transition:opacity .5s cubic-bezier(.16,1,.3,1),color .2s,box-shadow .2s}
.fbi-skip.on{opacity:1}
.fbi-skip:hover{color:#ece6d9;box-shadow:inset 0 0 0 1px ${DECAY}}
.fbi-skip:focus-visible{outline:1px solid ${GLOW};outline-offset:3px}
html.fbi-lock{overflow:hidden}
html.fbi-hidenav .nav{transform:translateY(-100%)}
html.fbi-nav .nav{transition:transform .8s cubic-bezier(.16,1,.3,1)}
@media (max-width:480px){.fbi-hud{font-size:10px}}`;
    (document.head || html).appendChild(st);
  }

  // ------------------------------------------------------------------ motor
  function createIntro({ mode, theme, placement, parent, skipLabel, onSkip, onDone }) {
    const C = THEMES[theme];
    const T = TIMELINES[mode];
    const full = mode === 'full';

    const sec = document.createElement('section');
    sec.className = `fbi fbi--${placement}`;
    sec.setAttribute('aria-label', 'FirstBid');
    sec.style.setProperty('--fbi-ground', C.ground);
    sec.style.setProperty('--fbi-dim', C.boneDim);
    sec.style.setProperty('--fbi-line', C.ghostLit);
    sec.innerHTML =
      `<canvas class="fbi-c" role="img" aria-label="FirstBid"></canvas>` +
      (C.gauze ? `<div class="fbi-gauze" aria-hidden="true"></div>` : '') +
      (full ? `<div class="fbi-hud" aria-hidden="true">
        <div class="on"><b>FirstBid</b>&nbsp; listening<span class="fbi-cur"></span></div>
        <div data-h="1">› new order · valorant · duo · gold 2 → platinum 1</div>
        <div data-h="2"></div>
        <div data-h="3" class="hot">› offer sent</div></div>` : '') +
      `<button class="fbi-skip" type="button">${skipLabel}</button>`;
    parent.insertBefore(sec, parent.firstChild);

    const cv = sec.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const wc = document.createElement('canvas');
    const wctx = wc.getContext('2d');
    const skipBtn = sec.querySelector('.fbi-skip');
    const hudLines = [...sec.querySelectorAll('[data-h]')];

    // Sorteio desta abertura: o valor ($20–$90, de 50 em 50 centavos) e o lugar.
    const matchVal = '$' + (20 + Math.round(Math.random() * 140) / 2).toFixed(2);
    let pick = null;

    let W = 0, H = 0, dpr = 1, u = 1, O, M, cells = [], match, parts = [], word;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = sec.clientWidth || innerWidth; H = sec.clientHeight || innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      u = Math.min(W * 0.84 / 376, H * 0.76 / 490);
      const top = (H - 490 * u) / 2 - 6;
      O = { x: W / 2, y: top + 188 * u };
      M = { x: O.x, y: O.y - RING_OFF * u };

      const rnd = mulberry32(20260926);
      const cw = 88, ch = 30;
      cells = [];
      const cols = Math.ceil((W + 200) / cw), rows = Math.ceil((H + 200) / ch);
      const x0 = W / 2 - (cols - 1) * cw / 2, y0 = H / 2 - (rows - 1) * ch / 2;
      const price = () => '$' + (5 + Math.floor(rnd() * 34) * 2.5).toFixed(2);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        cells.push({
          x: x0 + c * cw + (r % 2 ? cw / 2 : 0), y: y0 + r * ch, r, c,
          val: price(), alt: price(), lit: rnd() < .14, cand: rnd() < .075,
          per: 7 + rnd() * 16, ph: rnd() * 30
        });
      }

      // Onde o match pode cair: dentro do quadro que a câmera mostra na hora do
      // acendimento, longe do HUD, do botão e do disco que vai abrir no centro.
      const zv = 1.2, hw = W / 2 / zv, hh = H / 2 / zv;
      const inFrame = c => Math.abs(c.x - W / 2) < hw - 50 && c.y > H / 2 - hh + (full ? 80 : 30) && c.y < H / 2 + hh - 56;
      let ok = cells.filter(c => inFrame(c) && Math.hypot(c.x - O.x, c.y - O.y) > DISC_R * u + 50);
      if (!ok.length) ok = cells.filter(inFrame);
      if (!ok.length) ok = cells;
      if (!pick) {
        const c = ok[Math.floor(Math.random() * ok.length)];
        pick = { fx: c.x / W, fy: c.y / H };
      }
      const px = pick.fx * W, py = pick.fy * H;
      match = ok.reduce((a, c) => Math.hypot(c.x - px, c.y - py) < Math.hypot(a.x - px, a.y - py) ? c : a);
      match.val = matchVal;
      match.cand = false;

      const targets = [];
      for (const path of [CHAIN_L, CHAIN_R, VERT, [TL, TR]]) for (const p of samplePath(path, 3.2)) targets.push({ p, edge: true });
      for (const p of samplePath([...OUT, OUT[0]], 5)) targets.push({ p, edge: false });
      let n = 0;
      while (n < 150) {
        const x = -60 + rnd() * 120, y = -66 + rnd() * 134;
        if (inPoly(x, y, OUT)) { targets.push({ p: [x, y], edge: false }); n++; }
      }
      parts = targets.map(({ p, edge }) => {
        const ox = match.x + (rnd() - .5) * 44, oy = match.y + (rnd() - .5) * 9;
        const tx = M.x + p[0] * u, ty = M.y + p[1] * u;
        const a = rnd() * Math.PI * 2, R = (full ? 60 : 40) + rnd() * (full ? 200 : 140);
        return {
          ox, oy, tx, ty, edge,
          cx: ox + Math.cos(a) * R + (tx - ox) * .3,
          cy: oy + Math.sin(a) * R + (ty - oy) * .3,
          start: T.burst + rnd() * T.spread,
          dur: T.dur0 + rnd() * T.durR,
          tw: rnd() * 6.28
        };
      });

      const fs = Math.round(78 * u);
      const font = `900 ${fs}px ${DISPLAY}`;
      ctx.font = font;
      const letters = 'FIRSTBID'.split('');
      const track = fs * .035;
      const ws = letters.map(l => ctx.measureText(l).width);
      const total = ws.reduce((a, b) => a + b, 0) + track * (letters.length - 1);
      let x = -total / 2;
      const slots = letters.map((l, i) => { const s = { l, x: x + ws[i] / 2, bid: i >= 5 }; x += ws[i] + track; return s; });
      const pad = Math.ceil(fs * .5);
      word = {
        fs, font, slots, total, pad,
        base: top + 376 * u + 30 * u + fs * .82,
        ow: Math.ceil(total + pad * 2), oh: Math.ceil(fs * 1.4)
      };
      wc.width = Math.ceil(word.ow * dpr); wc.height = Math.ceil(word.oh * dpr);
      word.url = { text: 'firstbid.xyz', fs: Math.max(11, Math.round(12.5 * u)), y: word.base + Math.max(24, 32 * u) };

      if (hudLines[1]) hudLines[1].innerHTML = `› match · <span class="hot">${matchVal}</span> · row ${match.r + 1} · col ${match.c + 1}`;
    }

    // Câmera: a única coisa que desliza.
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    function camera(t) {
      const cx0 = W / 2, cy0 = H / 2;
      let x = cx0, y = cy0, z;
      if (full) {
        if (t < T.in0) return { x, y, z: lerp(1.3, 1.2, eOutCubic(prog(t, 0, T.in0))) };
        if (t < T.back0) {
          const k = eInOutQuart(prog(t, T.in0, T.in1));
          return { x: lerp(cx0, match.x, k), y: lerp(cy0, match.y, k), z: lerp(1.2, 2.5, k) + prog(t, T.in1, T.back0) * .08 };
        }
        const k = eInOutCubic(prog(t, T.back0, T.back1));
        x = lerp(match.x, cx0, k); y = lerp(match.y, cy0, k); z = lerp(2.58, 1, k);
        const idle = prog(t, T.back1, T.back1 + 1.2);
        x += ptr.sx * 14 * idle; y += ptr.sy * 10 * idle;
        z += Math.sin(t * .6) * .004 * idle;
      } else {
        z = lerp(1.16, 1, eOutCubic(prog(t, 0, T.back1)));
      }
      const sk = prog(t, T.impact, T.impact + .3);
      if (t > T.impact && sk < 1) {
        const a = (1 - sk) * (1 - sk) * 3.2;
        x += Math.sin(t * 91) * a; y += Math.cos(t * 77) * a;
      }
      return { x, y, z };
    }
    function applyCam(cam, dx = 0, dy = 0) {
      ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (W / 2 - (cam.x + dx) * cam.z), dpr * (H / 2 - (cam.y + dy) * cam.z));
    }

    function drawField(t, cam) {
      const idle = full ? prog(t, T.back1, T.back1 + 1.2) : 0;
      applyCam(cam, ptr.sx * 16 * idle, ptr.sy * 11 * idle);
      const fa = eOutCubic(prog(t, 0, full ? .7 : .25)) * lerp(1, .55, eInOutCubic(prog(t, T.dim0, T.dim1)));
      const vh = H / cam.z, vw = W / cam.z;
      const vTop = cam.y - vh / 2, vL = cam.x - vw / 2;
      const scanning = T.scan0 != null && t > T.scan0 && t < T.scan1 + .1;
      const scanY = scanning ? lerp(vTop - 20, vTop + vh + 20, prog(t, T.scan0, T.scan1)) : 0;

      ctx.font = `500 12px ${MONO}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      // A linha e a coluna do match: a consulta à matriz, visível.
      const hitA = prog(t, T.match, T.match + .05) * (1 - prog(t, T.burst, T.burst + .5));
      if (hitA > 0) {
        ctx.globalAlpha = hitA * .9 * fa;
        ctx.fillStyle = C.ghost;
        ctx.fillRect(vL - 50, match.y - 13, vw + 100, 26);
        ctx.fillRect(match.x - 42, vTop - 50, 84, vh + 100);
      }

      for (const c of cells) {
        if (c === match) continue;
        if (c.x < vL - 60 || c.x > vL + vw + 60 || c.y < vTop - 20 || c.y > vTop + vh + 20) continue;
        let col = c.lit ? C.ghostLit : C.ghost, a = 1, v = c.val;
        if (scanning) {
          const d = Math.abs(c.y - scanY);
          if (d < 26) col = d < 10 ? C.ghostHot : C.ghostLit;
          if (c.cand) {
            const ct = lerp(T.scan0, T.scan1, clamp((c.y - vTop + 20) / (vh + 40)));
            const k = (t - ct) / .55;
            if (k >= 0 && k < 1) { col = DECAY; a = 1 - k * .7; v = c.alt; }
          }
        }
        if (hitA > 0 && (c.r === match.r || c.c === match.c)) col = C.ghostHot;
        if (t > T.end - .6) {
          const k = fract((t + c.ph) / c.per) * c.per;
          if (k < .6) { col = k < .08 ? C.boneDim : C.ghostLit; v = c.alt; }
        }
        ctx.globalAlpha = a * fa;
        ctx.fillStyle = col;
        ctx.fillText(v, c.x, c.y);
      }

      if (scanning) {
        const g = ctx.createLinearGradient(0, scanY - 60, 0, scanY);
        g.addColorStop(0, `rgba(${C.scanRGB},0)`);
        g.addColorStop(1, `rgba(${C.scanRGB},.10)`);
        ctx.globalAlpha = fa;
        ctx.fillStyle = g;
        ctx.fillRect(vL - 50, scanY - 60, vw + 100, 60);
        ctx.fillStyle = `rgba(${C.scanRGB},.35)`;
        ctx.fillRect(vL - 50, scanY, vw + 100, 1 / cam.z);
      }

      const m = match;
      if (t < T.match) {
        ctx.globalAlpha = fa; ctx.fillStyle = m.lit ? C.ghostLit : C.ghost;
        ctx.fillText(m.val, m.x, m.y);
      } else {
        const since = t - T.match;
        const gone = prog(t, T.burst, T.burst + .9);
        ctx.save();
        if (t < T.burst) {
          ctx.shadowColor = `rgba(${GLOW_RGB},.9)`;
          ctx.shadowBlur = 12 * cam.z * dpr;
          ctx.fillStyle = since < .09 ? CORE : GLOW;
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = DECAY;
          ctx.globalAlpha = (1 - gone) * .8;
        }
        ctx.fillText(m.val, m.x, m.y);
        ctx.restore();
        const ba = (1 - gone) * (since < .09 ? 1 : .75);
        if (ba > 0) {
          ctx.globalAlpha = ba;
          ctx.strokeStyle = GLOW; ctx.lineWidth = 1.2 / cam.z;
          const bw = 34, bh = 11, L = 5;
          ctx.beginPath();
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const x = m.x + sx * bw, y = m.y + sy * bh;
            ctx.moveTo(x - sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * L);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    const bez = (p, s) => {
      const i = 1 - s;
      return [i * i * p.ox + 2 * i * s * p.cx + s * s * p.tx, i * i * p.oy + 2 * i * s * p.cy + s * s * p.ty];
    };

    function drawParticles(t, cam) {
      if (t < T.burst || t > T.impact) return;
      applyCam(cam);
      const fade = 1 - prog(t, T.pf0, T.pf1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const r0 = Math.max(.8, u * .9);
      for (const p of parts) {
        if (t < p.start) continue;
        const s = eInOutCubic(prog(t, p.start, p.start + p.dur));
        const [x, y] = bez(p, s);
        const flying = s < 1;
        const a = (p.edge ? 1 : .55) * fade;
        if (flying) {
          const [x0, y0] = bez(p, eInOutCubic(prog(t - (full ? .05 : .035), p.start, p.start + p.dur)));
          ctx.globalAlpha = 1;
          ctx.strokeStyle = p.edge ? `rgba(${GLOW_RGB},${.55 * a})` : `rgba(156,116,52,${.6 * a})`;
          ctx.lineWidth = (p.edge ? 1.6 : 1.1) / Math.sqrt(cam.z);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.fillStyle = p.edge ? GLOW : DECAY;
        ctx.globalAlpha = a * (flying ? 1 : .75 + .25 * Math.sin(t * 18 + p.tw));
        const r = (p.edge ? 1.5 : 1.1) * r0;
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    const polyPath = pts => {
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    };

    function drawDisc(t, cam) {
      if (t < T.impact) return;
      applyCam(cam);
      const k = prog(t, T.impact, T.impact + .85);
      const r = RING_R * eOutExpo(k);
      ctx.save();
      ctx.translate(O.x, O.y); ctx.scale(u, u);

      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, Math.min(DISC_R, r * 1.08 + 2), 0, Math.PI * 2);
      ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 50 * u * cam.z * dpr; ctx.shadowOffsetY = 10 * u * dpr;
      const g = ctx.createRadialGradient(-50, -70, 10, 0, 0, DISC_R);
      g.addColorStop(0, C.disc[0]); g.addColorStop(.55, C.disc[1]); g.addColorStop(1, C.disc[2]);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();

      ctx.lineWidth = 1.15;
      ctx.strokeStyle = `rgba(${GLOW_RGB},${lerp(.95, .55, prog(t, T.impact + .3, T.impact + 1.1))})`;
      ctx.beginPath(); ctx.arc(0, 0, Math.max(.1, r), 0, Math.PI * 2); ctx.stroke();
      if (k < 1) {
        ctx.strokeStyle = `rgba(${GLOW_RGB},${(1 - k) * .35})`;
        ctx.lineWidth = 2.5 * (1 - k) + .5;
        ctx.beginPath(); ctx.arc(0, 0, r + 70 * eOutCubic(k), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }

    function drawMark(t, cam) {
      if (t < T.stroke0 - .05) return;
      applyCam(cam);
      ctx.save();
      ctx.translate(M.x, M.y); ctx.scale(u, u);
      const blur = 11 * u * cam.z * dpr;

      const fk = eOutCubic(prog(t, T.fill0, T.fill1));
      if (fk > 0) {
        const g = ctx.createLinearGradient(0, -65, 0, 66);
        g.addColorStop(0, `rgba(${GLOW_RGB},${.25 * fk})`);
        g.addColorStop(1, `rgba(${GLOW_RGB},${.17 * fk})`);
        polyPath(OUT); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        polyPath(FACET); ctx.closePath();
        const fg = ctx.createLinearGradient(0, -36, 0, 51.5);
        fg.addColorStop(0, `rgba(${GLOW_RGB},${.2 * fk})`); fg.addColorStop(1, `rgba(${GLOW_RGB},${.06 * fk})`);
        ctx.fillStyle = fg; ctx.fill();
      }

      // Brilho ocioso: uma faixa de luz quente cruzando os traços.
      let stroke = GLOW;
      if (t > T.end) {
        const g = fract((t - T.end) / 5.5);
        if (g < .22) {
          const p = g / .22 * 1.4 - .2;
          const gr = ctx.createLinearGradient(-70, -70, 70, 70);
          gr.addColorStop(0, GLOW);
          if (p - .14 > 0 && p - .14 < 1) gr.addColorStop(p - .14, GLOW);
          if (p > 0 && p < 1) gr.addColorStop(p, CORE);
          if (p + .14 > 0 && p + .14 < 1) gr.addColorStop(p + .14, GLOW);
          gr.addColorStop(1, GLOW);
          stroke = gr;
        }
      }

      ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
      ctx.shadowColor = `rgba(${GLOW_RGB},.55)`; ctx.shadowBlur = blur;
      ctx.strokeStyle = stroke;
      const draw = (pts, len, k, w) => {
        if (k <= 0) return;
        ctx.lineWidth = w;
        ctx.setLineDash(k >= 1 ? [] : [len * k, len + 10]);
        polyPath(pts); ctx.stroke();
      };
      const span = T.stroke1 - T.stroke0;
      const sk = eInOutCubic(prog(t, T.stroke0, T.stroke1));
      draw(CHAIN_L, LEN.l, sk, 3);
      draw(CHAIN_R, LEN.r, sk, 3);
      draw(VERT, LEN.v, eInOutCubic(prog(t, T.stroke0 + span * .2, T.stroke1 + span * .15)), 2.2);
      ctx.globalAlpha = .8;
      const ck = eOutCubic(prog(t, T.stroke0 + span * .5, T.stroke1 + span * .2));
      draw(CROSS_L, LEN.c, ck, 1.6);
      draw(CROSS_R, LEN.c, ck, 1.6);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      // O lance cai no ápice.
      if (t >= T.drop0) {
        const k = eInQuad(prog(t, T.drop0, T.impact));
        const y = lerp(AP[1] - 300, AP[1], k);
        if (k < 1) {
          const tail = 60 * k + 10;
          const lg = ctx.createLinearGradient(0, y - tail, 0, y);
          lg.addColorStop(0, `rgba(${GLOW_RGB},0)`); lg.addColorStop(1, CORE);
          ctx.strokeStyle = lg; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, y - tail); ctx.lineTo(0, y); ctx.stroke();
        }
        const since = t - T.impact;
        const pulse = t > T.end ? .5 + .5 * Math.sin((t - T.end) * 2.2) : 0;
        ctx.shadowBlur = blur * (1.2 + pulse * .8);
        ctx.shadowColor = `rgba(${GLOW_RGB},${.7 + pulse * .3})`;
        ctx.fillStyle = since >= 0 && since < .1 ? CORE : GLOW;
        ctx.beginPath(); ctx.arc(0, y, 5.3, 0, Math.PI * 2); ctx.fill();

        if (since >= 0 && since < .45) {
          const f = since / .45;
          ctx.shadowBlur = 0;
          const rg = ctx.createRadialGradient(0, AP[1], 0, 0, AP[1], 20 + 90 * eOutCubic(f));
          rg.addColorStop(0, `rgba(255,240,200,${(1 - f) ** 2 * .9})`);
          rg.addColorStop(1, 'rgba(255,201,80,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rg;
          ctx.fillRect(-120, AP[1] - 120, 240, 240);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.restore();
    }

    function drawWord(t, cam) {
      if (t < T.word0) return;
      const { fs, font, slots, ow, oh, pad, total } = word;
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wctx.clearRect(0, 0, ow, oh);
      wctx.font = font;
      wctx.textAlign = 'center'; wctx.textBaseline = 'alphabetic';
      const by = fs;
      slots.forEach((s, i) => {
        const t0 = T.word0 + i * T.lstep;
        if (t < t0) return;
        const x = pad + total / 2 + s.x;
        wctx.save();
        if (t < t0 + T.lflick) {
          wctx.fillStyle = DECAY; wctx.globalAlpha = .9;
          wctx.fillText(POOL[Math.floor(t * 30 + i * 7) % POOL.length], x, by);
        } else {
          const since = t - t0 - T.lflick;
          if (s.bid) { wctx.shadowColor = `rgba(${GLOW_RGB},.45)`; wctx.shadowBlur = 16 * u * dpr; }
          wctx.fillStyle = since < .07 ? CORE : s.bid ? GLOW : C.bone;
          wctx.fillText(s.l, x, by);
        }
        wctx.restore();
      });
      // A malha de bronze morde a letra acesa (só em display grande, como no site).
      wctx.globalCompositeOperation = 'destination-out';
      wctx.fillStyle = 'rgba(0,0,0,.42)';
      for (let y = 0; y < oh; y += 3) wctx.fillRect(0, y, ow, 1);
      wctx.globalCompositeOperation = 'source-over';

      applyCam(cam);
      ctx.drawImage(wc, W / 2 - total / 2 - pad, word.base - by, ow, oh);

      if (t >= T.url) {
        const U = word.url;
        const n = Math.min(U.text.length, Math.floor((t - T.url) / T.ustep) + 1);
        ctx.font = `300 ${U.fs}px ${MONO}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        const sp = U.fs * .42;
        const cw = ctx.measureText('m').width + sp;
        const tot = U.text.length * cw - sp;
        ctx.fillStyle = C.boneDim;
        for (let i = 0; i < n; i++) ctx.fillText(U.text[i], W / 2 - tot / 2 + i * cw + (cw - sp) / 2, U.y);
      }
    }

    function render(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 0, W, H);
      const cam = camera(t);
      drawField(t, cam);
      drawDisc(t, cam);
      drawParticles(t, cam);
      drawMark(t, cam);
      drawWord(t, cam);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.hypot(W, H) / 2;
      const g = ctx.createRadialGradient(W / 2, H / 2, r * .35, W / 2, H / 2, r);
      g.addColorStop(0, `rgba(${C.vig},0)`);
      g.addColorStop(1, `rgba(${C.vig},.88)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // ---- relógio
    let t = 0, last = 0, raf = 0, ready = false, alive = true, doneSent = false;
    const hold = full ? 1.0 : 0.25;
    function tick(now) {
      if (!alive) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
      last = now;
      ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 3);
      ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 3);
      // Janela escondida (o app abre na bandeja) não gasta a abertura.
      if (document.visibilityState === 'visible') t += dt;
      render(t);
      hudLines.forEach((el, i) => el.classList.toggle('on', t >= [T.scan0, T.match, T.impact][i]));
      if (t > .8) skipBtn.classList.add('on');
      if (!doneSent && t >= T.end + hold) { doneSent = true; onDone(); }
      raf = requestAnimationFrame(tick);
    }

    let lastW = 0, lastH = 0;
    function onResize() {
      if (!ready) return;
      const w = sec.clientWidth, h = sec.clientHeight;
      // A barra de endereço do celular mexe na altura o tempo todo: só refaz em mudança real.
      if (w === lastW && Math.abs(h - lastH) < 120) return;
      lastW = w; lastH = h;
      layout();
    }
    const onMove = e => { ptr.x = (e.clientX / (W || 1) - .5) * 2; ptr.y = (e.clientY / (H || 1) - .5) * 2; };
    addEventListener('resize', onResize);
    addEventListener('pointermove', onMove, { passive: true });
    skipBtn.addEventListener('click', () => onSkip());

    const fontsReady = document.fonts && document.fonts.load
      ? Promise.race([
          Promise.all([
            document.fonts.load(`900 78px ${DISPLAY}`),
            document.fonts.load(`500 12px ${MONO}`),
            document.fonts.load(`300 12px ${MONO}`)
          ]).catch(() => {}),
          new Promise(r => setTimeout(r, 1500))
        ])
      : Promise.resolve();
    fontsReady.then(() => {
      if (!alive) return;
      layout();
      lastW = sec.clientWidth; lastH = sec.clientHeight;
      ready = true;
      raf = requestAnimationFrame(tick);
    });

    return {
      el: sec,
      // Pular: o valor faz snap direto pro logo pronto.
      jumpToEnd() { t = Math.max(t, T.end); },
      // Pra conferir um quadro exato (a timeline é determinística a partir de t).
      seek(v) { t = v; },
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        removeEventListener('resize', onResize);
        removeEventListener('pointermove', onMove);
        sec.remove();
      }
    };
  }

  // -------------------------------------------------------------------- site
  // Versão longa, como um bloco no topo da página. No fim a página rola sozinha
  // até o site, e a abertura é REMOVIDA: rolar pra cima não traz ela de volta.
  function bootSite() {
    const KEY = 'fb-intro';
    // `?intro` força (ignora a sessão e o "reduzir movimento" do sistema): é como
    // se vê a abertura num PC com as animações do Windows desligadas.
    const force = /[?&]intro\b/.test(location.search);
    if (!force && (reduced || navigator.webdriver || location.hash || /[?&]nointro\b/.test(location.search) || store.get(KEY))) return;
    store.set(KEY, '1');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    injectStyle();
    html.classList.add('fbi-lock', 'fbi-hidenav');
    let handing = false;

    const intro = createIntro({
      mode: 'full', theme: 'site', placement: 'block', parent: document.body,
      skipLabel: 'Skip intro',
      onSkip: () => { intro.jumpToEnd(); handoff(); },
      onDone: () => handoff()
    });

    const skipKeys = /^( |Enter|Escape|ArrowDown|ArrowUp|PageDown|PageUp|End|Home)$/;
    const onWheel = e => { e.preventDefault(); intro.jumpToEnd(); handoff(); };
    const onTouch = e => { e.preventDefault(); intro.jumpToEnd(); handoff(); };
    const onKey = e => { if (skipKeys.test(e.key)) { e.preventDefault(); intro.jumpToEnd(); handoff(); } };
    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('touchmove', onTouch, { passive: false });
    addEventListener('keydown', onKey);

    function handoff() {
      if (handing) return;
      handing = true;
      removeEventListener('wheel', onWheel);
      removeEventListener('touchmove', onTouch);
      removeEventListener('keydown', onKey);
      // Durante a rolagem automática, qualquer gesto do visitante é engolido.
      const swallow = e => e.preventDefault();
      addEventListener('wheel', swallow, { passive: false });
      addEventListener('touchmove', swallow, { passive: false });

      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto'; // o CSS do site tem scroll-behavior: smooth
      html.classList.add('fbi-nav');

      const dist = intro.el.offsetHeight;
      const D = 1400;
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / D);
        window.scrollTo(0, dist * eInOutQuart(k));
        // A nav desce quando o site já está chegando, não por cima do logo.
        if (k > .5) html.classList.remove('fbi-hidenav');
        if (k < 1) { requestAnimationFrame(step); return; }
        // Mesmo quadro: tira a abertura e volta o scroll pra 0. O site não se mexe na tela.
        intro.destroy();
        window.scrollTo(0, 0);
        html.classList.remove('fbi-lock');
        html.style.scrollBehavior = prevBehavior;
        removeEventListener('wheel', swallow);
        removeEventListener('touchmove', swallow);
        setTimeout(() => html.classList.remove('fbi-nav'), 900);
        window.dispatchEvent(new Event('scroll'));
      };
      requestAnimationFrame(step);
    }
  }

  // --------------------------------------------------------------------- app
  // Versão curta, por cima da dashboard, uma vez por abertura da janela
  // (sessionStorage do Electron vive enquanto a janela vive; recarregar a
  // dashboard depois de salvar não toca de novo).
  function bootApp() {
    const KEY = 'fb-intro-app';
    if (reduced || store.get(KEY)) return;
    store.set(KEY, '1');
    injectStyle();
    const lang = (html.lang || 'en').slice(0, 2);
    const label = { pt: 'Pular', es: 'Saltar', fr: 'Passer', ru: 'Пропустить' }[lang] || 'Skip';
    let leaving = false;
    const leave = () => {
      if (leaving) return;
      leaving = true;
      removeEventListener('keydown', leave);
      intro.el.removeEventListener('pointerdown', leave);
      intro.el.classList.add('fbi--out');
      setTimeout(() => intro.destroy(), 420);
    };
    const intro = createIntro({
      mode: 'short', theme: 'app', placement: 'fixed', parent: document.body,
      skipLabel: label, onSkip: leave, onDone: leave
    });
    addEventListener('keydown', leave);
    intro.el.addEventListener('pointerdown', leave);
  }

  window.FirstBidIntro = { create: opts => { injectStyle(); return createIntro(opts); } };
  if (boot === 'site') bootSite();
  else if (boot === 'app') bootApp();
})();
