// Tokyo-skyline (dag/nacht) en seizoensblaadjes — overgenomen uit Danny's Planner/Puzzels zodat alle apps identiek ogen.
const now = () => new Date();
// ================= Tokyo-nacht (inlogscherm) =================
const rnd = (a, b) => a + Math.random() * (b - a);
function starsHTML(W) {
  let stars = '';
  for (let i = 0; i < 80 * W / 1600; i++) stars += `<circle class="tk-star" cx="${rnd(0, W).toFixed(0)}" cy="${rnd(0, 430).toFixed(0)}" r="${rnd(.6, 1.7).toFixed(1)}" fill="#fff" opacity="${rnd(.3, .8).toFixed(2)}" style="animation-delay:-${rnd(0, 4).toFixed(1)}s"/>`;
  return stars;
}
// skyline over breedte W; Skytree en Tokyo Tower staan in het midden (off = verschuiving t.o.v. de 1600-brede scène)
function cityHTML(W, off) {
  let s = '';
  const layer = (color, minH, maxH, windows) => {
    let x = -20;
    while (x < W + 20) {
      const w = rnd(42, 112), h = rnd(minH, maxH), top = 900 - h;
      s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" style="fill:${color}"/>`;
      if (Math.random() < .25) s += `<rect x="${(x + w / 2 - 1).toFixed(0)}" y="${(top - 18).toFixed(0)}" width="2" height="18" style="fill:${color}"/><circle class="tk-blink" cx="${(x + w / 2).toFixed(0)}" cy="${(top - 19).toFixed(0)}" r="2.4" fill="#ff4d4d" style="animation-delay:-${rnd(0, 1.6).toFixed(1)}s"/>`;
      if (windows) {
        for (let wy = top + 12; wy < 884; wy += 15) for (let wx = x + 8; wx < x + w - 10; wx += 12) {
          if (Math.random() < .3) {
            const r = Math.random();
            const c = r < .78 ? '#f6c978' : r < .9 ? '#ff6fa0' : '#6fd3ff';
            s += `<rect class="tk-win" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="7" fill="${c}" style="--d:${rnd(3, 9).toFixed(1)}s;--o:-${rnd(0, 9).toFixed(1)}s;--a:${rnd(.55, .95).toFixed(2)}"/>`;
          }
        }
      }
      x += w + rnd(2, 10);
    }
  };
  layer('var(--b1)', 220, 430, false);
  // Tokyo Skytree (dichter bij het midden zodat hij ook op een telefoon zichtbaar is)
  s += `<g transform="translate(${232 + off} 0)"><path d="M386 900 L397 300 L403 300 L414 900Z" fill="#2c3a5c"/>
    <rect x="384" y="560" width="32" height="16" rx="3" fill="#2c3a5c"/><rect x="384" y="566" width="32" height="3" fill="#9ad0ff" opacity=".8"/>
    <rect x="389" y="440" width="22" height="12" rx="3" fill="#2c3a5c"/><rect x="389" y="445" width="22" height="2" fill="#9ad0ff" opacity=".8"/>
    <rect x="399" y="170" width="2" height="132" fill="#2c3a5c"/><circle class="tk-blink" cx="400" cy="168" r="3" fill="#ff4d4d"/></g>`;
  // Tokyo Tower
  s += `<g transform="translate(${-240 + off} 0)"><path d="M1118 900 L1171 470 L1189 470 L1242 900Z" fill="#c8452f"/>
    <path d="M1142 900 L1176 590 L1184 590 L1218 900Z" style="fill:var(--b1)"/>
    <rect x="1150" y="600" width="60" height="12" fill="#f2efe8"/><rect x="1150" y="612" width="60" height="6" fill="#c8452f"/>
    <path d="M1169 480 L1180 300 L1191 480Z" fill="#c8452f"/>
    <rect x="1166" y="452" width="28" height="9" fill="#f2efe8"/>
    <rect x="1179" y="240" width="2" height="62" fill="#e86a4f"/><circle class="tk-blink" cx="1180" cy="238" r="3" fill="#ff4d4d" style="animation-delay:-.8s"/></g>`;
  layer('var(--b2)', 90, 280, true);
  s += `<rect x="0" y="884" width="${W}" height="16" style="fill:var(--b3)"/>`;
  return s;
}
function buildTokyo() {
  if (buildTokyo.done) return;
  buildTokyo.done = true;
  document.querySelector('#tkStars').innerHTML = starsHTML(1600);
  document.querySelector('#tkCity').innerHTML = cityHTML(1600, 0);
  applyScene();
}

// Tokyo verandert mee met de Nederlandse tijd
function sceneTime() {
  const h = now().getHours();
  return h >= 6 && h < 9 ? 'ochtend' : h >= 9 && h < 18 ? 'dag' : h >= 18 && h < 21 ? 'avond' : 'nacht';
}
function applyScene() {
  const t = sceneTime();
  document.querySelectorAll('.tokyo').forEach(svg => svg.setAttribute('data-time', t));
}
// panorama voor de kop: breder dan de inlogscène, zodat torenpunten, Fuji en daklijn ook op brede schermen helemaal in beeld zijn
function coverScene() {
  buildTokyo();
  const W = 5200, off = (W - 1600) / 2;
  const svg = document.querySelector('#tokyo').cloneNode(true);
  svg.removeAttribute('id');
  svg.setAttribute('viewBox', `0 140 ${W} 650`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.querySelector(':scope > rect').setAttribute('width', W);
  const mid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mid.setAttribute('transform', `translate(${off} 0)`);
  svg.querySelector('.tk-sunwrap').before(mid);
  [...svg.children].filter(n => n.matches('.tk-sunwrap, .tk-fuji, .tk-fuji + path, .tk-clouds')).forEach(n => mid.appendChild(n));
  svg.querySelector('#tkStars').innerHTML = starsHTML(W);
  svg.querySelector('#tkCity').innerHTML = cityHTML(W, off);
  return svg.outerHTML
    .replace(/ data-time="\w+"/, '')
    .replace(/tkSky/g, 'tkSky2').replace(/tkSun/g, 'tkSun2')
    .replace(/ id="tk(Stars|City)"/g, '')
    .replace('class="tokyo"', `class="tokyo" data-time="${sceneTime()}"`);
}
setInterval(applyScene, 60000);

// ================= seizoenen =================
const SEASONS = { lente: 'Lente · sakura', zomer: 'Zomer · vuurvliegjes', herfst: 'Herfst · momiji', winter: 'Winter · sneeuw' };
function autoSeason() {
  const m = now().getMonth() + 1;
  return m >= 3 && m <= 5 ? 'lente' : m >= 6 && m <= 8 ? 'zomer' : m >= 9 && m <= 11 ? 'herfst' : 'winter';
}
const season = () => (state.prefs?.season && state.prefs.season !== 'auto' ? state.prefs.season : autoSeason());

// omtrek van een momiji-blad (eenheidsgrootte, punt naar boven)
const MOMIJI = [[0, -1], [.13, -.5], [.52, -.72], [.36, -.27], [.95, -.12], [.44, .08], [.66, .55], [.16, .32], [0, .52], [-.16, .32], [-.66, .55], [-.44, .08], [-.95, -.12], [-.36, -.27], [-.52, -.72], [-.13, -.5]];

// seizoenseffect: sakura (lente), vuurvliegjes (zomer), momiji (herfst), sneeuw (winter)
const FX = {
  c: null, x: null, ps: [], target: 0, raf: 0, w: 0, h: 0, dpr: 1, kind: 'lente',
  reduce: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,
  init() {
    this.c = document.querySelector('#petals'); this.x = this.c.getContext('2d');
    const size = () => { this.dpr = Math.min(2, window.devicePixelRatio || 1); this.w = innerWidth; this.h = innerHeight; this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr; };
    size(); addEventListener('resize', size);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
  },
  make(burst, kind = this.kind) {
    const p = { kind, x: rnd(0, this.w), y: rnd(-60, -10), rot: rnd(0, 6.3), vr: rnd(-.03, .03), sw: rnd(.01, .03), ph: rnd(0, 6.3), burst, age: 0 };
    if (kind === 'lente') Object.assign(p, { r: rnd(4, 8), vx: rnd(-.3, .5), vy: rnd(.5, 1.3), col: Math.random() < .5 ? '#f6b7c4' : '#fbd3dc', a: rnd(.55, .9) });
    if (kind === 'herfst') Object.assign(p, { r: rnd(9, 14), vx: rnd(-.4, .6), vy: rnd(.6, 1.4), vr: rnd(-.05, .05), col: ['#c8452f', '#e0614a', '#e8893a', '#b8321f', '#d9a03a'][Math.floor(rnd(0, 5))], a: rnd(.7, .95) });
    if (kind === 'winter') Object.assign(p, { r: rnd(1.4, 3.4), vx: rnd(-.25, .25), vy: rnd(.35, 1), col: '#ffffff', a: rnd(.5, .9) });
    if (kind === 'zomer') Object.assign(p, { r: rnd(1.6, 2.8), x: rnd(0, this.w), y: rnd(this.h * .2, this.h), vx: rnd(-.3, .3), vy: rnd(-.3, .3), col: '#ffe680', a: 0 });
    // thema-deeltjes
    if (kind === 'ember') Object.assign(p, { r: rnd(1.2, 2.6), y: this.h + rnd(0, 40), vx: rnd(-.25, .25), vy: rnd(-.9, -.35), col: Math.random() < .7 ? '#ff9a3c' : '#ffd36b', a: rnd(.5, .9) });
    if (kind === 'coin') Object.assign(p, { r: rnd(8, 12), vx: rnd(-.2, .2), vy: rnd(.6, 1.2), col: '#f8c916', a: .95 });
    if (kind === 'leaf') Object.assign(p, { r: rnd(5, 9), vx: rnd(-.2, .7), vy: rnd(.5, 1.1), col: ['#6abf4b', '#4f9a3a', '#8fd16a'][Math.floor(rnd(0, 3))], a: rnd(.6, .9) });
    if (kind === 'firework') Object.assign(p, { r: rnd(1.6, 3), col: ['#ffd36b', '#ff9a3c', '#7fd0ff', '#ff6fa0', '#b6ff7a', '#ffffff'][Math.floor(rnd(0, 6))], a: 1 });
    if (kind === 'confetti') Object.assign(p, { r: rnd(4, 7), vr: rnd(-.2, .2), col: ['#d7261e', '#f5b400', '#111111', '#ffffff', '#1f6fd1'][Math.floor(rnd(0, 5))], a: 1 });
    if (kind === 'ball') Object.assign(p, { r: rnd(6, 10), vr: rnd(-.12, .12), a: 1 });
    if (kind === 'pball') Object.assign(p, { r: rnd(8, 13), vx: rnd(-.3, .3), vy: rnd(.6, 1.3), vr: rnd(-.05, .05), a: 1 });
    if (kind === 'sparkle') Object.assign(p, { r: rnd(2, 4.5), vx: rnd(-.15, .15), vy: rnd(.15, .5), col: Math.random() < .7 ? '#ffe9a8' : '#ffffff', a: rnd(.5, 1) });
    if (burst) {
      p.x = this.w / 2 + rnd(-60, 60); p.y = this.h * .38;
      const ang = rnd(0, 6.3), sp = rnd(2, 7); p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp - 2;
      if (kind === 'zomer') { p.a = 1; }
      if (kind === 'firework') { const a2 = rnd(0, 6.3), sp2 = rnd(1.5, 9); p.vx = Math.cos(a2) * sp2; p.vy = Math.sin(a2) * sp2 - 1; p.x = this.w / 2 + rnd(-20, 20); p.y = this.h * .35; }
    }
    return p;
  },
  setMode(n, kind) {
    if (kind && kind !== this.kind) { this.kind = kind; this.ps = this.ps.filter(p => p.burst); }
    this.target = this.reduce ? 0 : n;
    while (this.ps.filter(p => !p.burst).length < this.target) { const p = this.make(false); if (this.kind === 'ember') p.y = rnd(0, this.h); else if (this.kind !== 'zomer') p.y = rnd(-this.h, 0); this.ps.push(p); }
    this.kick();
  },
  burst(n = 60, kind) { if (this.reduce) return; const k = kind || this.burstKind || (this.kind === 'zomer' ? 'lente' : this.kind); for (let i = 0; i < n; i++) this.ps.push(this.make(true, k)); this.kick(); },
  kick() { if (!this.raf && this.ps.length && !document.hidden) this.raf = requestAnimationFrame(t => this.step(t)); },
  draw(p, t) {
    const x = this.x;
    x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = p.a; x.fillStyle = p.col;
    if (p.kind === 'lente') {
      x.beginPath(); x.ellipse(0, 0, p.r, p.r * .62, 0, 0, Math.PI * 2); x.fill();
      x.globalAlpha = p.a * .5; x.fillStyle = '#e88fa3'; x.beginPath(); x.ellipse(-p.r * .35, 0, p.r * .35, p.r * .2, 0, 0, Math.PI * 2); x.fill();
    } else if (p.kind === 'herfst') {
      // Japans esdoornblad (momiji): zeven slanke punten met steeltje
      x.beginPath();
      MOMIJI.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, px * p.r, py * p.r));
      x.closePath(); x.fill();
      x.globalAlpha = p.a * .55; x.strokeStyle = '#6e1f12'; x.lineWidth = .9;
      x.beginPath(); x.moveTo(0, p.r * .5); x.lineTo(0, p.r * 1.05);
      [[0, -.85], [.5, -.55], [.82, -.08], [.55, .45], [-.55, .45], [-.82, -.08], [-.5, -.55]].forEach(([vx, vy]) => { x.moveTo(0, p.r * .3); x.lineTo(vx * p.r * .8, vy * p.r * .8); });
      x.stroke();
    } else if (p.kind === 'winter') {
      x.beginPath(); x.arc(0, 0, p.r, 0, Math.PI * 2); x.fill();
    } else if (p.kind === 'ember' || p.kind === 'firework') {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, p.r * 3);
      g.addColorStop(0, p.col); g.addColorStop(.35, p.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, p.r * 3, 0, Math.PI * 2); x.fill();
    } else if (p.kind === 'coin') {
      // draaiende munt: breedte volgt een cosinus
      const sx = Math.max(.12, Math.abs(Math.cos(t / 260 + p.ph)));
      x.rotate(-p.rot); x.scale(sx, 1);
      x.beginPath(); x.ellipse(0, 0, p.r * .72, p.r, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#b07c00'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#fff3a8'; x.fillRect(-p.r * .1, -p.r * .55, p.r * .2, p.r * 1.1);
    } else if (p.kind === 'leaf') {
      x.beginPath(); x.ellipse(0, 0, p.r, p.r * .45, 0, 0, Math.PI * 2); x.fill();
      x.globalAlpha = p.a * .6; x.strokeStyle = '#2f6b25'; x.lineWidth = .8; x.beginPath(); x.moveTo(-p.r, 0); x.lineTo(p.r, 0); x.stroke();
    } else if (p.kind === 'confetti') {
      x.fillRect(-p.r, -p.r * .5, p.r * 2, p.r);
    } else if (p.kind === 'ball') {
      const r = p.r;
      x.fillStyle = '#ee1515'; x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, r, 0, Math.PI); x.fill();
      x.strokeStyle = '#111'; x.lineWidth = Math.max(1.2, r * .16); x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, r * .32, 0, Math.PI * 2); x.fill(); x.stroke();
    } else if (p.kind === 'pball') {
      // Pixar-bal: geel, blauwe band, rode ster
      const r = p.r;
      x.fillStyle = '#f5c518'; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
      x.save(); x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.clip(); x.fillStyle = '#2a63c6'; x.fillRect(-r, -r * .28, r * 2, r * .56); x.restore();
      x.fillStyle = '#d6322b'; x.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .2 : r * .45; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - r * .52); }
      x.closePath(); x.fill();
    } else if (p.kind === 'sparkle') {
      // vierpuntige ster die twinkelt
      const r = p.r * (.6 + .4 * Math.abs(Math.sin(t / 300 + p.ph)));
      x.globalAlpha = p.a * (.4 + .6 * Math.abs(Math.sin(t / 420 + p.ph)));
      x.beginPath(); x.moveTo(0, -r * 2.4); x.quadraticCurveTo(0, 0, r * 2.4, 0); x.quadraticCurveTo(0, 0, 0, r * 2.4); x.quadraticCurveTo(0, 0, -r * 2.4, 0); x.quadraticCurveTo(0, 0, 0, -r * 2.4); x.fill();
    } else if (p.kind === 'dust') {
      x.beginPath(); x.arc(0, 0, p.r, 0, Math.PI * 2); x.fill();
    } else {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, p.r * 4);
      g.addColorStop(0, 'rgba(255,240,150,1)'); g.addColorStop(.25, 'rgba(255,225,100,.55)'); g.addColorStop(1, 'rgba(255,220,90,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, p.r * 4, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
  step(t) {
    this.raf = 0;
    const x = this.x; x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); x.clearRect(0, 0, this.w, this.h);
    let normal = 0;
    this.ps = this.ps.filter(p => {
      if (p.burst) { p.vx *= .985; p.vy = p.vy * .985 + .06; } else normal++;
      if (p.kind === 'zomer' && !p.burst) {
        p.age++;
        p.vx = Math.max(-.5, Math.min(.5, p.vx + rnd(-.04, .04))); p.vy = Math.max(-.4, Math.min(.4, p.vy + rnd(-.04, .04)));
        p.x += p.vx; p.y += p.vy;
        p.a = Math.min(1, p.age / 60) * (.35 + .65 * Math.max(0, Math.sin(t / 600 + p.ph)));
        if (p.x < -20) p.x = this.w + 10; if (p.x > this.w + 20) p.x = -10;
        if (p.y < -20 || p.y > this.h + 20) { if (normal <= this.target) { Object.assign(p, this.make(false)); return true; } return false; }
        if (normal > this.target) return false;
      } else {
        p.x += p.vx + Math.sin(t * p.sw / 16 + p.ph) * (p.kind === 'winter' ? .35 : .6); p.y += p.vy; p.rot += p.vr;
        if (p.burst && p.kind === 'firework') { p.a *= .975; if (p.a < .05) return false; }
        const out = p.y > this.h + 20 || p.y < -60 || p.x < -40 || p.x > this.w + 40;
        if (out) { if (!p.burst && normal <= this.target) { Object.assign(p, this.make(false)); return true; } return false; }
      }
      this.draw(p, t);
      return true;
    });
    let extra = this.ps.filter(p => !p.burst).length - this.target;
    if (extra > 0) this.ps = this.ps.filter(p => p.burst || (p.kind !== 'zomer' && p.kind !== 'ember' && p.y > 0) || extra-- <= 0);
    if (this.ps.length) this.kick(); else x.clearRect(0, 0, this.w, this.h);
  }
};
FX.init();

const fxCount = () => ({ lente: 18, herfst: 12, winter: 40, zomer: 16 }[season()]);
function applyFx() { FX.setMode(fxCount(), season()); }
function tokyoTick() {
  const f = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' }).format(now());
  document.querySelector('#clocks').innerHTML = `<span><i style="background:var(--red)"></i><b>${f}</b></span><span>${SEASONS[season()]}</span>`;
}
setInterval(tokyoTick, 20000);
