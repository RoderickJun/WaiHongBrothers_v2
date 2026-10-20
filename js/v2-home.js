/* Wai Hong Brothers v2 — homepage scenes.
   1. Dotted Malaysia map for "Select Your Region" (built immediately, so the
      i18n pass on DOMContentLoaded also translates its pin labels).
   2. Hero scroll scene: the drone footage plays on loop; scrolling pins the
      hero and zooms out from the Seri Kembangan HQ until the footage is only
      visible through a Malaysia-shaped window, then the map fills with brand
      blue and the trust metrics count up.
   3. Process timeline pin (same behaviour as v1), created after the hero pin
      so its start/end are measured against the final page height.
   Needs js/malaysia-map.js (WHB_MAP) loaded first. */
(function () {
  const MAP = window.WHB_MAP;
  if (!MAP) return;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mapPath = new Path2D(MAP.path);
  const probe = document.createElement('canvas').getContext('2d');

  // inverse of WHB_MAP.project (it is linear), so dots can be classified by real lon/lat
  const p0 = MAP.project(100, 0), p1 = MAP.project(101, 1);
  const ax = p1[0] - p0[0], ay = p1[1] - p0[1];
  const unproject = (x, y) => [100 + (x - p0[0]) / ax, (y - p0[1]) / ay];

  // dot lattice inside the country outline (shared by the region map and the hero texture)
  function latticeDots(step) {
    const dots = [];
    for (let y = step / 2; y < MAP.height; y += step) {
      for (let x = step / 2; x < MAP.width; x += step) {
        if (probe.isPointInPath(mapPath, x, y)) dots.push([x, y]);
      }
    }
    return dots;
  }

  /* Region membership by real coordinates — only the states each team lists:
     North = Perak / Penang / Kedah / Perlis, Johor = Johor,
     Central = KL / Selangor / Negeri Sembilan / Melaka / Pahang.
     Kelantan, Terengganu, Sabah and Sarawak are drawn but not assigned. */
  function regionOf(lon, lat) {
    if (lon > 104.6) return null;                          // East Malaysia
    if (lat < 2.6 && lon > 102.5) return 'johor';
    if (lon < 101.45 && lat > 3.75) return 'north';
    if (lat <= 3.75 && lon < 103.6) return 'klang-valley';
    if (lat < 4.75 && lon >= 101.45 && lon < 103.6) return 'klang-valley'; // Pahang
    return null;
  }

  /* ======================= 1. Dotted region map ======================= */
  const svg = document.getElementById('v2DotMap');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const PAD = 24;
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${MAP.width + PAD * 2} ${MAP.height + PAD * 2}`);
    const STEP = 7.2;
    const dots = latticeDots(STEP).map(([x, y]) => {
      const [lon, lat] = unproject(x, y);
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', 2.3);
      const region = regionOf(lon, lat);
      c.setAttribute('class', 'v2-dot' + (region ? ' is-region' : ''));
      // dots sweep in from west to east the first time the map scrolls into view
      c.style.transition = `opacity .6s ease ${Math.round(x * 1.1)}ms, fill .4s ease, r .25s ease`;
      svg.appendChild(c);
      return { el: c, x, y, region };
    });

    const PINS = [
      { area: 'klang-valley', at: [101.71, 3.02], key: 'v2.pinKlang', label: 'Klang Valley', dx: 14, dy: 4 },
      { area: 'johor', at: [103.76, 1.49], key: 'v2.pinJohor', label: 'Johor', dx: 14, dy: 4 },
      { area: 'north', at: [101.08, 4.6], key: 'v2.pinNorth', label: 'Ipoh · Penang · Kedah', dx: 14, dy: 4 }
    ];
    const pins = PINS.map(p => {
      const [x, y] = MAP.project(p.at[0], p.at[1]);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'v2-pin');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.dataset.area = p.area;
      g.innerHTML = `<circle class="v2-pin-ring" cx="${x}" cy="${y}" r="7"></circle>
        <circle class="v2-pin-core" cx="${x}" cy="${y}" r="5"></circle>
        <circle cx="${x}" cy="${y}" r="16" fill="transparent"></circle>
        <text class="v2-pin-label" x="${x + p.dx}" y="${y + p.dy}" data-i18n="${p.key}">${p.label}</text>`;
      svg.appendChild(g);
      return g;
    });

    const tabs = [...document.querySelectorAll('.area-tab')];
    const setActive = (area) => {
      dots.forEach(d => d.el.classList.toggle('is-active', d.region === area));
      pins.forEach(g => g.classList.toggle('is-active', g.dataset.area === area));
    };
    tabs.forEach(t => t.addEventListener('click', () => setActive(t.dataset.area)));
    pins.forEach(g => {
      const go = () => {
        const tab = tabs.find(t => t.dataset.area === g.dataset.area);
        if (tab) tab.click();
      };
      g.addEventListener('click', go);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    const initial = tabs.find(t => t.classList.contains('is-active'));
    setActive(initial ? initial.dataset.area : 'klang-valley');

    // reveal sweep
    dots.forEach(d => { d.el.style.opacity = 0; });
    const reveal = () => dots.forEach(d => { d.el.style.opacity = 1; });
    if (REDUCED || !('IntersectionObserver' in window)) reveal();
    else {
      const io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { reveal(); io.disconnect(); }
      }, { threshold: 0.25 });
      io.observe(svg);
    }

    // cursor spotlight: dots near the pointer light up
    if (!REDUCED && !matchMedia('(hover: none)').matches) {
      let raf = 0, mx = -999, my = -999, lit = [];
      const R = 34;
      const paint = () => {
        raf = 0;
        lit.forEach(d => { d.el.classList.remove('is-hot'); d.el.setAttribute('r', 2.3); });
        lit = dots.filter(d => Math.abs(d.x - mx) < R && Math.abs(d.y - my) < R && Math.hypot(d.x - mx, d.y - my) < R);
        lit.forEach(d => {
          const t = 1 - Math.hypot(d.x - mx, d.y - my) / R;
          d.el.setAttribute('r', (2.3 + t * 1.6).toFixed(2));
          if (t > 0.45) d.el.classList.add('is-hot');
        });
      };
      svg.addEventListener('mousemove', e => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = pt.matrixTransform(svg.getScreenCTM().inverse());
        mx = m.x; my = m.y;
        if (!raf) raf = requestAnimationFrame(paint);
      });
      svg.addEventListener('mouseleave', () => { mx = my = -999; if (!raf) raf = requestAnimationFrame(paint); });
    }
  }

  /* ======================= 2 + 3. Hero scene & process pin ======================= */
  window.addEventListener('load', function () {
    const hero = document.querySelector('.v2-hero');
    if (!hero) return;
    const stage = hero.querySelector('.v2-hero-stage');
    const fallbackImg = document.getElementById('heroFallbackImg');
    const frameCanvas = document.getElementById('heroSequenceCanvas');
    const maskCanvas = hero.querySelector('.v2-hero-mask');
    const opening = hero.querySelector('.v2-hero-opening');
    const cue = hero.querySelector('.v2-scroll-cue');
    const final = hero.querySelector('.v2-hero-final');
    const counters = [...hero.querySelectorAll('[data-v2-count]')];
    const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

    /* ---- looping drone footage, drawn from the 50 extracted frames ---- */
    const FRAME_COUNT = 50;
    const frames = [];
    let framesReady = false;
    const fctx = frameCanvas.getContext('2d');
    const loadFrames = () => new Promise(resolve => {
      let n = 0;
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = img.onerror = () => { if (++n === FRAME_COUNT) resolve(); };
        img.src = `images/hero-frames/frame-${String(i + 1).padStart(3, '0')}.jpg`;
        frames[i] = img;
      }
    });
    // ping-pong through the frames, cross-fading neighbours so the motion stays smooth
    const FPS = 9;
    const drawFootage = (now) => {
      const cycle = (FRAME_COUNT - 1) * 2;
      let pos = (now / 1000 * FPS) % cycle;
      if (pos > FRAME_COUNT - 1) pos = cycle - pos;
      const i = Math.floor(pos), t = pos - i;
      const a = frames[i], b = frames[Math.min(i + 1, FRAME_COUNT - 1)];
      if (!a || !a.naturalWidth) return;
      if (frameCanvas.width !== a.naturalWidth) { frameCanvas.width = a.naturalWidth; frameCanvas.height = a.naturalHeight; }
      fctx.globalAlpha = 1;
      fctx.drawImage(a, 0, 0);
      if (t > 0.01 && b && b.naturalWidth) { fctx.globalAlpha = t; fctx.drawImage(b, 0, 0); }
    };

    /* ---- the map mask ---- */
    const mctx = maskCanvas.getContext('2d');
    const HQ = MAP.project(101.71, 3.02);                 // Seri Kembangan HQ
    const textureDots = latticeDots(9);
    const GRADIENT = [[0, '#012863'], [0.42, '#1d5f94'], [0.68, '#2b7bb9'], [1, '#5aaee8']];
    let W = 0, H = 0, DPR = 1;
    const sizeMask = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      maskCanvas.width = Math.round(W * DPR);
      maskCanvas.height = Math.round(H * DPR);
    };
    const clamp01 = v => Math.max(0, Math.min(1, v));
    const range = (p, a, b) => clamp01((p - a) / (b - a));
    const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const drawMask = (p) => {
      const ctx = mctx;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const z = easeInOut(range(p, 0.06, 0.5));          // zoom out
      const fill = easeInOut(range(p, 0.5, 0.68));       // map fills with blue
      const tex = range(p, 0.6, 0.85);                   // dot texture on the final frame
      if (z <= 0) return;

      const narrow = W < 700;
      const fit = Math.min(W * (narrow ? 0.94 : 0.86) / MAP.width, H * 0.6 / MAP.height);
      const fitOx = W / 2 - MAP.width * fit / 2;
      const fitOy = H * (narrow ? 0.5 : 0.53) - MAP.height * fit / 2;
      const Z0 = 60;
      const scale = fit * Math.pow(Z0, 1 - z) * (1 + 0.06 * tex);
      const px = W / 2 + (fitOx + HQ[0] * fit - W / 2) * z;
      const py = H / 2 + (fitOy + HQ[1] * fit - H / 2) * z;
      const ox = px - HQ[0] * scale, oy = py - HQ[1] * scale;
      const m = new DOMMatrix([scale, 0, 0, scale, ox, oy]);
      const land = new Path2D();
      land.addPath(mapPath, m);

      // blue everywhere except inside the country outline
      const sea = new Path2D();
      sea.rect(0, 0, W, H);
      sea.addPath(land);
      // same navy → brand blue → sky gradient as the CSS blocks
      const grad = ctx.createLinearGradient(0, 0, W, H);
      GRADIENT.forEach(([at, col]) => grad.addColorStop(at, col));
      ctx.fillStyle = grad;
      ctx.fill(sea, 'evenodd');

      // the footage inside the outline gives way to blue
      if (fill > 0) {
        ctx.globalAlpha = fill;
        ctx.fill(land);
        ctx.globalAlpha = 1;
      }

      // crisp outline while the shape is forming, faint once filled
      const lineA = Math.min(z, 1) * (0.85 - 0.6 * fill);
      if (lineA > 0.01) {
        ctx.strokeStyle = `rgba(255,255,255,${lineA.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke(land);
      }

      // lighter dot lattice gives the final blue frame some depth
      if (tex > 0) {
        ctx.fillStyle = `rgba(255,255,255,${(0.22 * tex).toFixed(3)})`;
        const r = Math.max(0.9, scale * 0.9);
        textureDots.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(ox + x * scale, oy + y * scale, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };

    const fmt = n => Math.round(n).toLocaleString('en-US');
    const applyText = (p) => {
      const o = 1 - range(p, 0.36, 0.5);
      opening.style.opacity = o;
      opening.style.transform = `translateY(${(-40 * (1 - o)).toFixed(1)}px)`;
      opening.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
      if (cue) cue.style.opacity = 1 - range(p, 0, 0.06);
      const v = easeOut(range(p, 0.62, 0.8));
      final.style.opacity = v;
      final.style.transform = `translateY(${(40 * (1 - v)).toFixed(1)}px)`;
      final.style.visibility = v <= 0.001 ? 'hidden' : 'visible';
      const c = easeOut(range(p, 0.64, 0.8));
      counters.forEach(el => { el.textContent = fmt(+el.dataset.v2Count * c); });
    };

    /* ---- process timeline pin (unchanged from v1) ---- */
    const setupProcessSection = () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 860px)', () => {
        const steps = gsap.utils.toArray('.process-step');
        if (!steps.length) return;
        gsap.timeline({
          scrollTrigger: { trigger: '.process-section', start: 'top top+=84', end: '+=120%', pin: true, scrub: 1 }
        }).from(steps, { opacity: 0.2, y: 40, scale: 0.92, stagger: 0.5, ease: 'none' });
      });
    };

    loadFrames().then(() => {
      framesReady = frames.every(f => f.naturalWidth);
      if (framesReady && !REDUCED) {
        fallbackImg.style.display = 'none';
        frameCanvas.style.display = 'block';
      }

      if (!hasGsap || REDUCED) {
        // static layout: footage loops (unless reduced motion), metrics sit below as a blue block
        if (framesReady && !REDUCED) {
          const loop = (now) => { drawFootage(now); requestAnimationFrame(loop); };
          requestAnimationFrame(loop);
        }
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      hero.classList.add('is-enhanced');
      sizeMask();

      let target = 0, current = 0, last = -1;
      const header = document.querySelector('.site-header');
      const st = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=260%',
        pin: true,
        onToggle: self => { if (header) header.classList.toggle('is-over-hero', self.isActive); },
        onUpdate: self => { target = self.progress; },
        onRefresh: self => { sizeMask(); target = self.progress; last = -1; }
      });
      target = st.progress;
      current = target;
      if (header) header.classList.toggle('is-over-hero', st.isActive);

      const tick = (now) => {
        // a short ease toward the scroll position makes wheel steps glide
        current += (target - current) * 0.16;
        if (Math.abs(target - current) < 0.0005) current = target;
        if (current < 0.7) drawFootage(now);
        if (current !== last) { drawMask(current); applyText(current); last = current; }
        requestAnimationFrame(tick);
      };
      applyText(current);
      drawMask(current);
      requestAnimationFrame(tick);

      setupProcessSection();
      ScrollTrigger.refresh();
    });
  });
})();
