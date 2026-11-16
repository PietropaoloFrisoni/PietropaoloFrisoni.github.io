/*
 * Hero animation for the home page. One pool of particles re-forms into three scenes: a binary black hole on curved
 * spacetime, a compute cluster, and the quantum Fourier transform circuit. Each scene lists its nodes; particles are
 * matched to nodes by left-to-right order, so every morph flows sideways rather than scrambling.
 *
 * site.js creates the scene and wires up the field buttons; the scene reports every field change through onLens.
 */
class HeroScene {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.onLens = (options && options.onLens) || function () {};
    this.lens = 0;
    this.paused = false;
    this.auto = true;
    this.hCtx = null;
  }

  start() {
    this.startHero();
  }

  stop() {
    this.stopHero();
  }

  // Switch to field i (0 physics, 1 HPC, 2 quantum). A choice by the visitor stops the automatic cycling.
  setLens(i, fromUser) {
    this.hGo(i);
    this.lens = i;
    if (fromUser) this.auto = false;
    this.onLens(i);
  }

  setPaused(paused) {
    this.paused = paused;
  }

  theme() {
    return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
  }

  startHero() {
    const c = this.canvas;
    if (!c || !c.getContext) return;
    this.hCtx = c.getContext('2d');
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.hReduced = !!(mq && mq.matches);
    this.hTo = this.lens;
    this.hFrom = null;
    this.hFromForm = this.hTo;
    this.hT = 1;
    this.hP = null;
    this.hMouse = null;
    this.hPar = { x: 0, y: 0 };
    this.hTime = 0;
    this.hDt = 0;
    this.hSince = 0;
    this.hGRstart = 0;
    this.hLast = performance.now();
    this.hVisible = true;
    this.hResize(true);
    if (window.ResizeObserver) {
      this.hRO = new ResizeObserver(() => this.hResize());
      this.hRO.observe(c);
    }
    if (window.IntersectionObserver) {
      this.hIO = new IntersectionObserver((entries) => {
        this.hVisible = entries[entries.length - 1].isIntersecting;
      });
      this.hIO.observe(c);
    }
    this.hOnWin = () => this.hResize();
    window.addEventListener('resize', this.hOnWin);
    // The mouse (not touch, so scrolling on a phone doesn't push things around) gently repels the particles.
    const host = c.parentElement || c;
    this.hOnMove = (e) => {
      if (e.pointerType !== 'mouse' || !this.hW) return;
      const r = c.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.hMouse = { x: (e.clientX - r.left) * this.hW / r.width, y: (e.clientY - r.top) * this.hH / r.height };
    };
    this.hOnLeave = () => { this.hMouse = null; };
    host.addEventListener('pointermove', this.hOnMove);
    host.addEventListener('pointerleave', this.hOnLeave);
    const loop = (now) => {
      this.hRaf = requestAnimationFrame(loop);
      this.hFrame(now);
    };
    this.hRaf = requestAnimationFrame(loop);
  }

  stopHero() {
    if (this.hRaf) cancelAnimationFrame(this.hRaf);
    if (this.hRO) this.hRO.disconnect();
    if (this.hIO) this.hIO.disconnect();
    if (this.hOnWin) window.removeEventListener('resize', this.hOnWin);
    const host = this.canvas.parentElement || this.canvas;
    if (this.hOnMove) host.removeEventListener('pointermove', this.hOnMove);
    if (this.hOnLeave) host.removeEventListener('pointerleave', this.hOnLeave);
    this.hOnWin = null;
    this.hRaf = null;
    this.hRO = null;
    this.hIO = null;
    this.hCtx = null;
  }

  hResize(force) {
    const c = this.canvas;
    if (!c || !this.hCtx) return;
    const W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight), wide = W >= 1100;
    // On wide screens the scenes fit the part of the hero that's on screen, so the whole animation shows without
    // scrolling. On phones they sit faintly behind the text and follow the hero's own height, so the browser bar
    // sliding in and out while scrolling doesn't rebuild them.
    const vh = wide ? Math.min(H, window.innerHeight || H) : H;
    if (!force && W === this.hW && H === this.hH && vh === this.hVH) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.hW = W;
    this.hH = H;
    this.hVH = vh;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    this.hCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const zx = wide ? Math.max(W * 0.5, 680) : 24;
    const zw = wide ? Math.min(W - zx - 48, 760) : W - 48;
    const zy = wide ? 96 : 100;
    const zh = Math.max(260, vh - zy - (wide ? 56 : 40));
    this.hZone = { x: zx, y: zy, w: zw, h: zh, cx: zx + zw / 2, cy: zy + zh / 2 };
    this.hFaint = wide ? 1 : 0.3;
    this.hForms = [this.hBuildGR(this.hZone), this.hBuildCluster(this.hZone), this.hBuildQFT(this.hZone)];
    this.hM = Math.max.apply(null, this.hForms.map((F) => F.nodes.length));
    this.hForms.forEach((F) => this.hFinalize(F, this.hM));
    this.hParts = [];
    for (let i = 0; i < this.hM; i++) this.hParts.push({ ox: 0, oy: 0 });
    this.hStars = this.hMakeStars();
    this.hPackets = [];
    for (let k = 0; k < 12; k++) {
      const pk = {};
      this.hNewPacket(pk);
      pk.u = Math.random();
      this.hPackets.push(pk);
    }
    this.hFrom = null;
    this.hT = 1;
    this.hP = null;
  }

  hRng(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Particle i always takes the i-th node from the left; spare particles merge into a neighbour and fade out.
  hFinalize(F, M) {
    const n = F.nodes.length;
    const order = F.nodes.map((nd, j) => j).sort((a, b) => (F.nodes[a].x - F.nodes[b].x) || (F.nodes[a].y - F.nodes[b].y));
    F.rep = new Array(n);
    order.forEach((j, slot) => { F.rep[j] = Math.ceil(slot * M / n); });
    F.nodeOf = new Array(M);
    F.vis = new Array(M);
    for (let i = 0; i < M; i++) {
      const j = order[Math.floor(i * n / M)];
      F.nodeOf[i] = j;
      F.vis[i] = F.rep[j] === i;
    }
  }

  hMakeStars() {
    const rnd = this.hRng(23), out = [];
    const count = Math.round(this.hW * this.hH / 5000);
    for (let k = 0; k < count; k++) {
      const big = rnd() < 0.06;
      out.push({
        x: rnd() * this.hW,
        y: rnd() * this.hH,
        r: big ? 1.2 + rnd() * 0.6 : 0.35 + rnd() * 0.75,
        a: big ? 0.7 : 0.12 + rnd() * 0.5,
        f: 0.4 + rnd() * 1.6,
        ph: rnd() * 6.283,
        d: 0.3 + rnd() * 0.7
      });
    }
    return out;
  }

  // Scene 1: a binary black hole on a sheet of curved spacetime. Over a 10 s cycle the pair spirals in,
  // merges and rings down, and the sheet carries the gravitational waves outward at a finite speed.

  hBuildGR(z) {
    const GX = 17, GY = 11, nodes = [], lines = [];
    const F = {
      type: 'gr', cx: z.cx, cy: z.cy + z.h * 0.06, hw: z.w * 0.5, hh: z.h * 0.28, depth: z.h * 0.32,
      label: 'Binary black hole · gravitational waves', lx: z.x, ly: z.y, holes: [], tau: 0,
      phi0: 1.6 * (2 * Math.PI / 2.6) * 6.2,
      sx: z.x + z.w * 0.6, sy: z.y - 12, sw: z.w * 0.4, sh: 40
    };
    for (let r = 0; r < GY; r++) {
      for (let c = 0; c < GX; c++) {
        const u = -1 + 2 * c / (GX - 1), v = -1 + 2 * r / (GY - 1);
        const p = this.hProjGR(F, u, v, 0);
        nodes.push({ u, v, x: p.x, y: p.y, kind: 'g', a: 1 });
      }
    }
    for (let r = 0; r < GY; r++) {
      const idx = [];
      for (let c = 0; c < GX; c++) idx.push(r * GX + c);
      lines.push({ idx, a: 0.14 + 0.34 * r / (GY - 1) });
    }
    for (let c = 0; c < GX; c++) {
      const idx = [];
      for (let r = 0; r < GY; r++) idx.push(r * GX + c);
      lines.push({ idx, a: 0.26 });
    }
    F.nodes = nodes;
    F.lines = lines;
    F.live = nodes.map((n) => ({ x: n.x, y: n.y }));
    this.hPlaceGR(F, 0);
    return F;
  }

  hProjGR(F, u, v, zz) {
    const s = 0.7 + 0.3 * (v + 1) / 2;
    return { x: F.cx + u * F.hw * s, y: F.cy + v * F.hh - zz * F.depth };
  }

  // Height of the sheet: a well under each hole, plus the wave that left the centre r / 0.45 seconds ago.
  hSheet(u, v, F) {
    let zz = 0;
    for (const b of F.holes) {
      const du = u - b.u, dv = v - b.v;
      zz -= b.depth / (1 + (du * du + dv * dv) / b.w2);
    }
    const r = Math.sqrt(u * u + v * v), wv = this.hGRWave(F, F.tau - r / 0.45);
    if (wv) {
      const env = Math.min(1, Math.max(0, (r - 0.12) / 0.2)) * Math.min(1, Math.max(0, 1 - (r - 1) / 0.4));
      zz += wv.A * env / (0.5 + r) * Math.cos(2 * wv.ph - 2 * Math.atan2(v, u));
    }
    return zz;
  }

  // Cycle time: inspiral until 6.2 s, then merger and ringdown. Reduced motion shows a still from late in the inspiral.
  hGRTau() {
    return this.hReduced ? 4.6 : (this.hTime - (this.hGRstart || 0)) % 10;
  }

  // Wave amplitude and orbital phase of the signal emitted at cycle time te. The orbit shrinks as
  // (1 - te/tc)^(1/4), so frequency and amplitude climb into the chirp; after the merger it rings down.
  hGRWave(F, te) {
    const tc = 6.2;
    if (te < 0) return null;
    if (te < tc) {
      const x = 1 - te / tc;
      return { A: Math.min(0.1, 0.035 * Math.pow(x, -0.25)), ph: F.phi0 * (1 - Math.pow(x, 0.625)) };
    }
    const d = te - tc;
    return { A: 0.1 * Math.exp(-d / 0.35), ph: F.phi0 + 2 * Math.PI * 2.2 * d };
  }

  // The merged hole has 95% of the pair's mass (the rest leaves as gravitational waves) and a larger horizon.
  hGRHoles(F, tau) {
    const tc = 6.2, m = Math.min(1, tau / 0.8) * Math.min(1, Math.max(0, (10 - tau) / 0.6));
    if (tau >= tc) return [{ u: 0, v: 0, depth: 0.95 * m, w2: 0.055, r: 11, a: m, seed: 0 }];
    const x = 1 - tau / tc, rb = 0.26 * Math.pow(x, 0.25), ph = F.phi0 * (1 - Math.pow(x, 0.625));
    const c = Math.cos(ph) * rb, s = Math.sin(ph) * rb;
    return [
      { u: c, v: s, depth: 0.5 * m, w2: 0.04, r: 8, a: m, seed: 0 },
      { u: -c, v: -s, depth: 0.5 * m, w2: 0.04, r: 8, a: m, seed: 1.6 }
    ];
  }

  hPlaceGR(F, t) {
    F.tau = this.hGRTau();
    F.holes = this.hGRHoles(F, F.tau);
    for (let j = 0; j < F.nodes.length; j++) {
      const n = F.nodes[j], p = this.hProjGR(F, n.u, n.v, this.hSheet(n.u, n.v, F));
      F.live[j].x = p.x;
      F.live[j].y = p.y;
    }
    for (const b of F.holes) {
      const p = this.hProjGR(F, b.u, b.v, this.hSheet(b.u, b.v, F));
      b.x = p.x;
      b.y = p.y;
    }
    return F.live;
  }

  // Scene 2: four racks of eight compute nodes, a top-of-rack switch each, and two spine switches above.

  hBuildCluster(z) {
    const rw = Math.min(132, (z.w - 108) / 4), gap = Math.min(40, (z.w - 4 * rw) / 3);
    const pitch = Math.min(44, (z.h - 228) / 7);
    const totalW = 4 * rw + 3 * gap, totalH = 228 + 7 * pitch;
    const left = z.cx - totalW / 2, top = z.cy - totalH / 2;
    const F = {
      type: 'cluster', rw, bw: rw - 34, bh: 22, leafW: rw - 16, leafH: 22, spineW: Math.min(170, totalW * 0.3), spineH: 24,
      trayDX: rw / 2 - 12, label: 'Compute cluster · leaf–spine network', lx: z.x, ly: z.y
    };
    const nodes = [];
    nodes.push({ x: z.cx - totalW * 0.22, y: top + 12, kind: 'spine', a: 1 });
    nodes.push({ x: z.cx + totalW * 0.22, y: top + 12, kind: 'spine', a: 1 });
    for (let r = 0; r < 4; r++) nodes.push({ x: left + r * (rw + gap) + rw / 2, y: top + 130, kind: 'leaf', a: 1 });
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < 8; s++) nodes.push({ x: left + r * (rw + gap) + rw / 2 - 7, y: top + 176 + s * pitch, kind: 'blade', a: 1 });
    }
    F.nodes = nodes;
    return F;
  }

  // Node indices: 0-1 spines, 2-5 rack switches, 6-37 compute nodes (rack r, slot s at 6 + 8r + s).
  hNewPacket(pk) {
    const ra = Math.floor(Math.random() * 4), rb = (ra + 1 + Math.floor(Math.random() * 3)) % 4;
    pk.src = 6 + ra * 8 + Math.floor(Math.random() * 8);
    pk.dst = 6 + rb * 8 + Math.floor(Math.random() * 8);
    pk.la = 2 + ra;
    pk.lb = 2 + rb;
    pk.sp = Math.floor(Math.random() * 2);
    pk.u = 0;
    pk.v = 240 + Math.random() * 140;
  }

  hPacketPath(F, P, pk) {
    const at = (j) => P[F.rep[j]];
    const A = at(pk.src), LA = at(pk.la), S = at(pk.sp), LB = at(pk.lb), B = at(pk.dst);
    const ta = LA.x + F.trayDX, tb = LB.x + F.trayDX, lh = F.leafH / 2;
    return [
      { x: A.x + F.bw / 2, y: A.y }, { x: ta, y: A.y }, { x: ta, y: LA.y + lh }, { x: LA.x, y: LA.y },
      { x: S.x, y: S.y },
      { x: LB.x, y: LB.y }, { x: tb, y: LB.y + lh }, { x: tb, y: B.y }, { x: B.x + F.bw / 2, y: B.y }
    ];
  }

  hLength(pts) {
    let s = 0;
    for (let k = 1; k < pts.length; k++) s += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    return s;
  }

  hAlong(pts, d) {
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], L = Math.hypot(b.x - a.x, b.y - a.y);
      if (d <= L || k === pts.length - 1) {
        const f = L > 0 ? Math.min(1, Math.max(0, d / L)) : 0;
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
      d -= L;
    }
    return pts[0];
  }

  // Scene 3: the textbook 5-qubit quantum Fourier transform, read out by measuring every qubit. The final
  // qubit-reversal swaps are left out, as many diagrams do: at this size they read as clutter.

  hBuildQFT(z) {
    const Q = 5, ops = [];
    for (let q = 0; q < Q; q++) {
      ops.push({ t: 'H', q });
      for (let c = q + 1; c < Q; c++) ops.push({ t: 'R', q, c, k: c - q + 1 });
    }
    ops.push({ t: 'M' });
    const x0 = z.x + 64, x1 = z.x + z.w - 56, dx = (x1 - x0) / (ops.length - 1);
    const dy = Math.min(92, z.h * 0.7 / (Q - 1)), y0 = z.cy - dy * (Q - 1) / 2;
    const sub = ['₀', '₁', '₂', '₃', '₄', '₅'];
    const F = {
      type: 'qft', x0, x1, y0, dy, wy: [], kets: [], links: [], scale: Math.min(1, dx / 36),
      label: 'Quantum Fourier transform · 5 qubits', lx: z.x, ly: z.y
    };
    for (let q = 0; q < Q; q++) {
      F.wy.push(y0 + q * dy);
      F.kets.push('|x' + sub[q + 1] + '⟩');
    }
    const nodes = [];
    ops.forEach((op, col) => {
      const x = x0 + col * dx;
      if (op.t === 'H') {
        nodes.push({ x, y: F.wy[op.q], kind: 'H', label: 'H', a: 1 });
      } else if (op.t === 'R') {
        nodes.push({ x, y: F.wy[op.q], kind: 'R', label: 'R' + sub[op.k], a: 1 });
        nodes.push({ x, y: F.wy[op.c], kind: 'C', a: 1 });
        F.links.push([nodes.length - 1, nodes.length - 2]);
      } else {
        for (let q = 0; q < Q; q++) nodes.push({ x, y: F.wy[q], kind: 'M', a: 1 });
      }
    });
    F.nodes = nodes;
    return F;
  }

  hPlace(f, t) {
    const F = this.hForms[f];
    return F.type === 'gr' ? this.hPlaceGR(F, t) : F.nodes;
  }

  hEase(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  hWeight(f, e) {
    let w = 0;
    if (f === this.hTo) w += this.hFrom ? e : 1;
    if (this.hFrom && f === this.hFromForm) w += 1 - e;
    return w;
  }

  hGo(i) {
    if (!this.hForms || i === this.hTo) return;
    if (i === 0) this.hGRstart = this.hTime;
    if (!this.hP || this.hReduced) {
      this.hTo = i;
      this.hFrom = null;
      this.hT = 1;
      this.hSince = 0;
      return;
    }
    const e = this.hFrom ? this.hEase(this.hT) : 1;
    this.hFromForm = this.hFrom && e < 0.5 ? this.hFromForm : this.hTo;
    this.hFrom = this.hP.map((p) => ({ x: p.bx, y: p.by, a: p.a, kind: p.kind, label: p.label, c: p.col }));
    this.hTo = i;
    this.hT = 0;
    this.hSince = 0;
  }

  hPalette() {
    const theme = this.theme();
    if (this.hPal && this.hPal.theme === theme) return this.hPal;
    const hex = theme === 'light'
      ? ['#9A5B00', '#0A7276', '#6447D6', '#14171F', '#596070', '#F7F6F2', '#14171F']
      : ['#E8A33D', '#3CC4C9', '#A08BFF', '#ECEAE4', '#9AA3B2', '#0B0F17', '#000000'];
    const rgb = hex.map((x) => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]);
    this.hPal = { theme, forms: rgb.slice(0, 3), text: rgb[3], muted: rgb[4], bg: rgb[5], hole: rgb[6] };
    return this.hPal;
  }

  hRgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  hMix(a, b, e) {
    return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * e));
  }

  hBox(x, y, w, h, r) {
    const ctx = this.hCtx;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  hSmooth(pts) {
    const ctx = this.hCtx;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length - 1; k++) {
      ctx.quadraticCurveTo(pts[k].x, pts[k].y, (pts[k].x + pts[k + 1].x) / 2, (pts[k].y + pts[k + 1].y) / 2);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  hFrame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.hLast) / 1000));
    this.hLast = now;
    if (!this.hVisible || !this.hForms || !this.hCtx) return;
    const moving = !this.hReduced && !this.paused;
    this.hDt = moving ? dt : 0;
    this.hTime += this.hDt;
    if (this.hFrom) {
      this.hT = Math.min(1, this.hT + dt / 1.6);
      if (this.hT >= 1) this.hFrom = null;
    }
    if (moving && this.auto) {
      this.hSince += dt;
      // The black-hole scene stays long enough to show a whole inspiral, merger and ringdown.
      if (this.hSince > [9.5, 7, 8][this.hTo]) this.setLens((this.hTo + 1) % 3, false);
    }
    this.hDraw();
  }

  hDraw() {
    const ctx = this.hCtx, pal = this.hPalette(), t = this.hTime;
    const e = this.hFrom ? this.hEase(this.hT) : 1;
    ctx.clearRect(0, 0, this.hW, this.hH);
    const to = this.hForms[this.hTo], live = this.hPlace(this.hTo, t), from = this.hFrom;
    this.hBackground(pal, e, t);
    // The pointer bends spacetime freely but only nudges the hardware and the circuit.
    const push = 30 * [1, 0.25, 0.45].reduce((s, k, f) => s + k * this.hWeight(f, e), 0);
    const P = [];
    for (let i = 0; i < this.hM; i++) {
      const j = to.nodeOf[i], n = to.nodes[j], tg = live[j], f = from ? from[i] : null, part = this.hParts[i];
      const a1 = to.vis[i] ? n.a : 0;
      const bx = f ? f.x + (tg.x - f.x) * e : tg.x;
      const by = f ? f.y + (tg.y - f.y) * e : tg.y;
      let tx = 0, ty = 0;
      if (this.hMouse && !this.hReduced) {
        const dx = bx - this.hMouse.x, dy = by - this.hMouse.y, d = Math.hypot(dx, dy);
        if (d > 0.01 && d < 130) {
          const k = Math.pow(1 - d / 130, 2) * push;
          tx = dx / d * k;
          ty = dy / d * k;
        }
      }
      part.ox += (tx - part.ox) * 0.12;
      part.oy += (ty - part.oy) * 0.12;
      const late = !f || e >= 0.5;
      P.push({
        i, bx, by,
        x: bx + part.ox,
        y: by + part.oy,
        a: f ? f.a + (a1 - f.a) * e : a1,
        kind: late ? n.kind : f.kind,
        label: late ? n.label : f.label,
        pop: f ? 0.45 + 0.55 * Math.abs(1 - 2 * e) : 1,
        col: f ? this.hMix(f.c, pal.forms[this.hTo], e) : pal.forms[this.hTo]
      });
    }
    this.hP = P;
    const Fq = this.hForms[2];
    this.hPulseX = this.hWeight(2, e) > 0.01 && !this.hReduced
      ? Fq.x0 - 30 + ((t * 0.22) % 1) * (Fq.x1 - Fq.x0 + 60)
      : null;
    const ws = [0, 1, 2].map((f) => this.hWeight(f, e) * this.hFaint);
    for (let f = 0; f < 3; f++) if (ws[f] > 0.01) this.hDecor(f, P, ws[f], pal, 'under');
    for (const p of P) this.hNode(p, pal, t);
    for (let f = 0; f < 3; f++) if (ws[f] > 0.01) this.hDecor(f, P, ws[f], pal, 'over');
  }

  // Backdrop: a soft glow in the current field's colour, over stars (dark theme) or dot-grid paper (light theme).
  hBackground(pal, e, t) {
    const ctx = this.hCtx, z = this.hZone, dark = pal.theme !== 'light';
    const mix = [0, 0, 0];
    let tw = 0;
    for (let f = 0; f < 3; f++) {
      const w = this.hWeight(f, e);
      tw += w;
      for (let k = 0; k < 3; k++) mix[k] += pal.forms[f][k] * w;
    }
    const col = mix.map((v) => Math.round(v / (tw || 1)));
    const R = Math.max(z.w, z.h) * 0.8;
    const g = ctx.createRadialGradient(z.cx, z.cy, 0, z.cx, z.cy, R);
    g.addColorStop(0, this.hRgba(col, dark ? 0.17 : 0.1));
    g.addColorStop(1, this.hRgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.hW, this.hH);
    // The black holes lens whatever lies behind them: stars and grid dots nearby are pushed out towards
    // the Einstein ring and brightened.
    const wg = this.hWeight(0, e);
    const lenses = wg > 0.01 ? this.hForms[0].holes.filter((b) => b.a > 0.02) : [];
    if (dark) {
      const m = this.hReduced ? null : this.hMouse;
      const tx = m ? (m.x - this.hW / 2) * -0.02 : 0, ty = m ? (m.y - this.hH / 2) * -0.02 : 0;
      this.hPar.x += (tx - this.hPar.x) * 0.05;
      this.hPar.y += (ty - this.hPar.y) * 0.05;
      for (const s of this.hStars) {
        const k = this.hReduced ? 1 : 0.6 + 0.4 * Math.sin(t * s.f + s.ph);
        const p = this.hLens(s.x + this.hPar.x * s.d, s.y + this.hPar.y * s.d, lenses, wg);
        ctx.fillStyle = this.hRgba(pal.text, s.a * k * p.mu);
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = this.hRgba(pal.muted, 0.22);
      for (let y = 14; y < this.hH; y += 28) {
        for (let x = 14; x < this.hW; x += 28) {
          const p = lenses.length ? this.hLens(x, y, lenses, wg) : { x, y };
          ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
        }
      }
    }
  }

  // Point-lens image position and magnification, eased out at the edge of the lens's reach so nothing jumps.
  hLens(x, y, lenses, w) {
    let mu = 1;
    for (const b of lenses) {
      const dx = x - b.x, dy = y - b.y, beta = Math.hypot(dx, dy), thE = 17 * (b.r / 8) * b.a;
      if (beta > 0.01 && beta < 170) {
        const k = w * Math.min(1, (170 - beta) / 40);
        const th = (beta + Math.sqrt(beta * beta + 4 * thE * thE)) / 2;
        x += (b.x + dx / beta * th - x) * k;
        y += (b.y + dy / beta * th - y) * k;
        const u = beta / thE;
        mu *= 1 + (Math.min(3, (u * u + 2) / (2 * u * Math.sqrt(u * u + 4)) + 0.5) - 1) * k;
      }
    }
    return { x, y, mu };
  }

  hDecor(f, P, w, pal, layer) {
    const F = this.hForms[f], ctx = this.hCtx, col = pal.forms[f];
    const at = (j) => P[F.rep[j]];
    if (layer === 'under' && this.hFaint === 1) {
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.hRgba(pal.muted, 0.95 * w);
      ctx.fillText(F.label, F.lx, F.ly);
    }
    if (F.type === 'gr') {
      if (layer === 'under') {
        ctx.lineWidth = 1;
        for (const L of F.lines) {
          ctx.strokeStyle = this.hRgba(col, L.a * w);
          ctx.beginPath();
          this.hSmooth(L.idx.map(at));
          ctx.stroke();
        }
      } else {
        this.hGROver(F, col, pal, w);
      }
    } else if (F.type === 'cluster') {
      if (layer === 'under') this.hRacks(F, at, col, w);
      else this.hPacketsDraw(F, P, col, pal, w);
    } else if (layer === 'under') {
      this.hCircuit(F, at, col, pal, w);
    }
  }

  hGROver(F, col, pal, w) {
    const ctx = this.hCtx;
    for (const b of F.holes) this.hHole(b, col, pal, w, this.hTime);
    // A flash at the merger, flattened by the viewing angle like the sheet itself.
    const d = F.tau - 6.2;
    if (d >= 0 && d < 0.9 && F.holes.length === 1) {
      const b = F.holes[0], r = 12 + d * 170;
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.hRgba(pal.text, (1 - d / 0.9) * 0.8 * w);
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (this.hFaint === 1) this.hStrain(F, col, pal, w);
  }

  // Detector-style readout of the strain over the last 3 s: the rising chirp, the merger and the ringdown.
  hStrain(F, col, pal, w) {
    const ctx = this.hCtx, N = 140, mid = F.sy + F.sh / 2;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.hRgba(pal.muted, 0.95 * w);
    ctx.fillText('h(t)', F.sx - 10, mid);
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.hRgba(pal.muted, 0.35 * w);
    ctx.beginPath();
    ctx.moveTo(F.sx, mid);
    ctx.lineTo(F.sx + F.sw, mid);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.hRgba(col, 0.95 * w);
    ctx.beginPath();
    for (let k = 0; k <= N; k++) {
      const wv = this.hGRWave(F, F.tau - 3 * (1 - k / N));
      const h = wv ? wv.A / 0.1 * Math.cos(2 * wv.ph) : 0;
      const x = F.sx + F.sw * k / N, y = mid - h * (F.sh / 2 - 2);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  hHole(b, col, pal, w, t) {
    const a = w * b.a;
    if (a < 0.01) return;
    const ctx = this.hCtx, k = b.r / 8, R = 40 * k;
    const g = ctx.createRadialGradient(b.x, b.y, 6 * k, b.x, b.y, R);
    g.addColorStop(0, this.hRgba(col, 0.5 * a));
    g.addColorStop(1, this.hRgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.fill();
    // Far half of the accretion disk, then the horizon and photon ring, then the near half in front.
    this.hDisk(b, col, pal, a, k, t, true);
    ctx.fillStyle = this.hRgba(pal.hole, a);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = this.hRgba(col, 0.95 * a);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 0.8, 0, Math.PI * 2);
    ctx.stroke();
    this.hDisk(b, col, pal, a, k, t, false);
    ctx.lineWidth = 1;
  }

  // The disk is brighter on the side moving towards us (Doppler beaming) and carries clumps of orbiting gas.
  hDisk(b, col, pal, a, k, t, far) {
    const ctx = this.hCtx, rx = 19 * k, ry = 5.5 * k, tilt = -0.12, N = 16, start = far ? Math.PI : 0;
    ctx.lineWidth = 1.8;
    for (let s = 0; s < N; s++) {
      const a0 = start + Math.PI * s / N, a1 = a0 + Math.PI / N;
      ctx.strokeStyle = this.hRgba(col, a * (0.3 + 0.7 * (0.5 + 0.5 * Math.cos((a0 + a1) / 2))));
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, rx, ry, tilt, a0, a1);
      ctx.stroke();
    }
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let m = 0; m < 6; m++) {
      const ang = t * 2.4 / k + m * Math.PI / 3 + b.seed;
      if ((Math.sin(ang) < 0) !== far) continue;
      const ex = Math.cos(ang) * rx * 1.12, ey = Math.sin(ang) * ry * 1.12;
      ctx.fillStyle = this.hRgba(pal.text, 0.85 * a);
      ctx.beginPath();
      ctx.arc(b.x + ex * ct - ey * st, b.y + ex * st + ey * ct, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  hRacks(F, at, col, w) {
    const ctx = this.hCtx;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.hRgba(col, 0.32 * w);
    ctx.beginPath();
    for (let s = 0; s < 2; s++) {
      for (let r = 0; r < 4; r++) {
        const S = at(s), L = at(2 + r);
        ctx.moveTo(S.x, S.y + F.spineH / 2);
        ctx.lineTo(L.x, L.y - F.leafH / 2);
      }
    }
    ctx.stroke();
    for (let r = 0; r < 4; r++) {
      const L = at(2 + r), last = at(6 + r * 8 + 7), tx = L.x + F.trayDX;
      const top = L.y - F.leafH / 2 - 10, bottom = last.y + F.bh / 2 + 12;
      ctx.strokeStyle = this.hRgba(col, 0.3 * w);
      this.hBox(L.x - F.rw / 2, top, F.rw, Math.max(10, bottom - top), 6);
      ctx.stroke();
      // Cable tray down the side of the rack, with one cable per compute node.
      ctx.strokeStyle = this.hRgba(col, 0.42 * w);
      ctx.beginPath();
      ctx.moveTo(tx, L.y + F.leafH / 2);
      ctx.lineTo(tx, last.y);
      for (let s = 0; s < 8; s++) {
        const B = at(6 + r * 8 + s);
        ctx.moveTo(B.x + F.bw / 2, B.y);
        ctx.lineTo(tx, B.y);
      }
      ctx.stroke();
    }
  }

  hPacketsDraw(F, P, col, pal, w) {
    const ctx = this.hCtx;
    for (const pk of this.hPackets) {
      const pts = this.hPacketPath(F, P, pk), len = this.hLength(pts);
      if (len < 1) continue;
      pk.u += this.hDt * pk.v / len;
      if (pk.u >= 1) {
        this.hNewPacket(pk);
        continue;
      }
      const d = pk.u * len, trail = [];
      for (let k = 0; k <= 5; k++) trail.push(this.hAlong(pts, d - 42 + k * 8.4));
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.hRgba(col, 0.75 * w);
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let k = 1; k < trail.length; k++) ctx.lineTo(trail[k].x, trail[k].y);
      ctx.stroke();
      const head = trail[trail.length - 1];
      ctx.fillStyle = this.hRgba(pal.text, 0.95 * w);
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1;
  }

  hCircuit(F, at, col, pal, w) {
    const ctx = this.hCtx;
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    // After the measurements, classical (double) wires; once the sweep passes, the bits it read appear.
    const sweep = Math.floor(this.hTime * 0.22), read = this.hPulseX !== null && this.hPulseX > F.x1 + 8;
    for (let q = 0; q < F.wy.length; q++) {
      const y = F.wy[q];
      ctx.fillStyle = this.hRgba(pal.muted, 0.95 * w);
      ctx.fillText(F.kets[q], F.lx, y);
      ctx.strokeStyle = this.hRgba(col, 0.45 * w);
      ctx.beginPath();
      ctx.moveTo(F.lx + 44, y);
      ctx.lineTo(F.x1, y);
      ctx.moveTo(F.x1 + 12, y - 1.5);
      ctx.lineTo(F.x1 + 30, y - 1.5);
      ctx.moveTo(F.x1 + 12, y + 1.5);
      ctx.lineTo(F.x1 + 30, y + 1.5);
      ctx.stroke();
      if (read) {
        const bit = Math.abs(Math.sin((sweep + 1) * 12.9898 + q * 78.233) * 43758.5453) % 1;
        ctx.fillStyle = this.hRgba(pal.text, 0.95 * w);
        ctx.fillText(bit > 0.5 ? '1' : '0', F.x1 + 36, y);
      }
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.hRgba(col, 0.9 * w);
    ctx.beginPath();
    for (const l of F.links) {
      const a = at(l[0]), b = at(l[1]);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    if (this.hPulseX !== null) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.hRgba(col, 0.28 * w);
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(this.hPulseX, F.y0 - 30);
      ctx.lineTo(this.hPulseX, F.y0 + (F.wy.length - 1) * F.dy + 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.lineWidth = 1;
  }

  hNode(p, pal, t) {
    const a = p.a * this.hFaint;
    if (a < 0.02) return;
    const ctx = this.hCtx, s = p.pop, c = p.col, k = p.kind;
    if (k === 'g') {
      ctx.fillStyle = this.hRgba(c, 0.55 * a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4 * s, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (k === 'blade' || k === 'leaf' || k === 'spine') {
      this.hHardware(p, pal, t, a);
      return;
    }
    const q = s * this.hForms[2].scale;
    let glow = 0;
    if (this.hPulseX !== null) {
      const d = Math.abs(p.x - this.hPulseX);
      if (d < 30) glow = 1 - d / 30;
    }
    ctx.save();
    if (glow > 0) {
      ctx.shadowColor = this.hRgba(c, glow);
      ctx.shadowBlur = 16 * glow;
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.hRgba(c, a);
    ctx.fillStyle = this.hRgba(c, a);
    if (k === 'H' || k === 'R' || k === 'M') {
      const hw = (k === 'H' ? 11 : 13) * q, hh = 11 * q;
      ctx.fillStyle = this.hRgba(pal.bg, Math.min(1, a * 1.2));
      this.hBox(p.x - hw, p.y - hh, hw * 2, hh * 2, 3 * q);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (k === 'M') {
        // Measurement: the usual meter dial with its needle.
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4 * q, 7 * q, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 4 * q);
        ctx.lineTo(p.x + 5 * q, p.y - 5 * q);
        ctx.stroke();
      } else {
        ctx.fillStyle = this.hRgba(c, a);
        ctx.font = '600 ' + Math.max(6, Math.round(11 * q)) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label || '', p.x, p.y + 0.5);
      }
    } else if (k === 'C') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.8 * q, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  hHardware(p, pal, t, a) {
    const F = this.hForms[1], ctx = this.hCtx, c = p.col, s = p.pop;
    ctx.lineWidth = 1;
    if (p.kind === 'blade') {
      const w = F.bw * s, h = F.bh * s, x = p.x - w / 2, y = p.y - h / 2;
      ctx.fillStyle = this.hRgba(c, 0.09 * a);
      ctx.strokeStyle = this.hRgba(c, 0.6 * a);
      this.hBox(x, y, w, h, 3 * s);
      ctx.fill();
      ctx.stroke();
      // Power LED, a blinking activity LED, and a load bar that drifts with the work.
      const busy = Math.sin(t * (2.3 + (p.i % 7) * 0.9) + p.i * 1.7) > 0.55;
      ctx.fillStyle = this.hRgba(c, 0.9 * a);
      ctx.beginPath();
      ctx.arc(x + 8 * s, p.y, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = busy ? this.hRgba(pal.text, 0.95 * a) : this.hRgba(c, 0.25 * a);
      ctx.beginPath();
      ctx.arc(x + 15 * s, p.y, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      const load = 0.52 + 0.4 * Math.sin(t * (0.45 + (p.i % 5) * 0.18) + p.i * 2.1);
      const barX = x + 23 * s, barW = Math.max(0, w - 31 * s);
      ctx.fillStyle = this.hRgba(c, 0.16 * a);
      ctx.fillRect(barX, p.y - 2 * s, barW, 4 * s);
      ctx.fillStyle = this.hRgba(c, 0.85 * a);
      ctx.fillRect(barX, p.y - 2 * s, barW * load, 4 * s);
    } else {
      const spine = p.kind === 'spine', ports = spine ? 12 : 8;
      const w = (spine ? F.spineW : F.leafW) * s, h = (spine ? F.spineH : F.leafH) * s, x = p.x - w / 2, y = p.y - h / 2;
      ctx.fillStyle = this.hRgba(c, (spine ? 0.22 : 0.16) * a);
      ctx.strokeStyle = this.hRgba(c, 0.85 * a);
      this.hBox(x, y, w, h, 3 * s);
      ctx.fill();
      ctx.stroke();
      const pad = 10 * s, step = (w - 2 * pad) / (ports - 1);
      for (let q = 0; q < ports; q++) {
        const lit = Math.sin(t * 3.1 + q * 1.9 + p.i * 0.7) > 0.25;
        ctx.fillStyle = lit ? this.hRgba(pal.text, 0.85 * a) : this.hRgba(c, 0.35 * a);
        ctx.fillRect(x + pad + q * step - 1.5 * s, p.y - 1.5 * s, 3 * s, 3 * s);
      }
    }
  }
}

window.HeroScene = HeroScene;
