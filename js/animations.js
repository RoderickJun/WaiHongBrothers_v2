/* Wai Hong Brothers — small entrance polish, kept separate from main.js
   so interaction logic and presentation timing stay decoupled. */

const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Hero rain canvas ----------
   A lightweight 2D-canvas rain effect (not three.js — a full WebGL library
   is unnecessary weight for a few dozen falling lines; canvas keeps the
   hero's file cost near zero while still nodding to the waterproofing
   brand story). Skipped entirely under prefers-reduced-motion. */
function initHeroRain() {
  const canvas = document.querySelector('.hero-rain');
  if (!canvas || PREFERS_REDUCED_MOTION) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero-media');
  let drops = [];
  let width, height, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((width * height) / 22000);
    drops = Array.from({ length: count }, createDrop);
  }

  function createDrop() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      len: 14 + Math.random() * 22,
      speed: 5 + Math.random() * 6,
      opacity: 0.08 + Math.random() * 0.16
    };
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#bcdcf5';
    ctx.lineWidth = 1;
    drops.forEach(d => {
      ctx.globalAlpha = d.opacity;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      d.x -= 0.6;
      if (d.y > height) { d.y = -d.len; d.x = Math.random() * width; }
    });
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(tick);
}

/* ---------- Soft 3D tilt on cards (liquid-glass depth cue) ---------- */
function initCardTilt() {
  if (PREFERS_REDUCED_MOTION || matchMedia('(hover: none)').matches) return;
  const cards = document.querySelectorAll('.service-card, .project-card, .iso-card');
  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroRain();
  initCardTilt();
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    requestAnimationFrame(() => heroContent.classList.add('is-ready'));
  }

  /* Active nav-link highlight based on scroll position */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(section => navIO.observe(section));
  }
});
