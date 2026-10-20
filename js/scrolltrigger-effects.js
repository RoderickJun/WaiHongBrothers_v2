/* Wai Hong Brothers — GSAP ScrollTrigger effects (homepage only).
   Loaded after gsap.min.js + ScrollTrigger.min.js from cdnjs. Entirely additive:
   if the CDN scripts fail to load, this file no-ops and the existing
   [data-reveal] IntersectionObserver system (js/main.js) still handles every
   section's basic fade-up, so the page never depends on this for usability.

   Setup is deliberately deferred to window 'load' (not run immediately, and
   not just DOMContentLoaded) — the hero photo has no explicit width/height,
   so before it finishes loading the page is shorter than its final height.
   Creating ScrollTrigger positions against that pre-image layout computed a
   much-too-small pin range, which made the scrub proxy immediately animate
   to its end state (hero text opacity 0) before the real scroll position
   caught up — i.e. the hero text was invisible from the very first paint.
   Waiting for 'load' means every image has already settled into its final
   layout size before any ScrollTrigger start/end math happens.

   IMPORTANT ordering rule for this whole file: every ScrollTrigger on this
   page is created in one guaranteed sequence — hero first (after its 50
   frames finish preloading), THEN the Process section — never in parallel.
   The hero's pin-spacer changes the document's total height once it's
   inserted; any ScrollTrigger created BEFORE that insertion calculates its
   start/end against the shorter pre-hero-pin layout, and nothing after
   reliably un-breaks it (a `ScrollTrigger.refresh()` call afterwards was
   tried and made no measurable difference — the Process section's pin
   still left a blank gap exactly at its old, now-wrong `end` position).
   Creating the Process section's trigger only once the hero's is already
   in place avoids the stale-measurement problem at its source instead of
   trying to patch it after the fact. */
window.addEventListener('load', function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---- Hero: image-sequence scrub, text is never touched ----------------
     The headline ("We Know Everything About Roof Repair.") and the rest of
     .hero-content are NOT animated at all here — they stay permanently
     visible exactly as they render in plain HTML, both for the visitor and
     for crawlers (this is the same text the SEO/AEO work made sure is
     readable on first paint; nothing here should ever hide it again).

     This is a photo-sequence scrub, not a <video> currentTime scrub — 50
     still JPEGs (images/hero-frames/frame-001.jpg..frame-050.jpg, extracted
     from the user's source video) are preloaded into memory, then drawn to
     a <canvas> one at a time as the visitor scrolls. Swapping a pre-decoded
     image into a canvas is instant and frame-accurate on every scroll tick,
     unlike seeking a compressed video's currentTime (which stutters between
     keyframes) — the user explicitly asked for the photo-sequence approach
     after finding the video-scrub version wasn't smooth enough. The hero
     is pinned for the duration of the sequence (end: '+=100%') — scrolling
     down holds the page in place until all 50 frames have played through,
     then releases into the Trust section; scrolling up while still pinned
     plays the sequence in reverse. Unlike the earlier pin attempt that
     animated .hero-content's opacity, nothing here ever touches
     .hero-content, so that specific stuck-at-0 bug class doesn't apply.
     #heroFallbackImg (frame-001.jpg, same image the canvas starts on) stays
     the visible element and the canvas stays hidden until every frame has
     finished preloading, so there's never a blank/half-loaded background. */
  function setupHero() {
    return new Promise((resolve) => {
      const hero = document.querySelector('.hero');
      const heroFallbackImg = document.getElementById('heroFallbackImg');
      const heroCanvas = document.getElementById('heroSequenceCanvas');
      if (!hero || !heroFallbackImg || !heroCanvas) { resolve(); return; }

      const FRAME_COUNT = 50;
      const framePath = (i) => `images/hero-frames/frame-${String(i + 1).padStart(3, '0')}.jpg`;
      const ctx = heroCanvas.getContext('2d');
      const images = new Array(FRAME_COUNT);
      let loadedCount = 0;
      let currentDrawnIndex = -1;

      const drawFrame = (index) => {
        const img = images[index];
        if (!img || !img.complete || currentDrawnIndex === index) return;
        currentDrawnIndex = index;
        if (heroCanvas.width !== img.naturalWidth || heroCanvas.height !== img.naturalHeight) {
          heroCanvas.width = img.naturalWidth;
          heroCanvas.height = img.naturalHeight;
        }
        ctx.drawImage(img, 0, 0);
      };

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === FRAME_COUNT) {
            drawFrame(0);
            heroFallbackImg.style.display = 'none';
            heroCanvas.style.display = 'block';

            gsap.to({ frame: 0 }, {
              frame: FRAME_COUNT - 1,
              ease: 'none',
              snap: 'frame',
              onUpdate: function () { drawFrame(Math.round(this.targets()[0].frame)); },
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: '+=100%',
                pin: true,
                scrub: true
              }
            });

            resolve();
          }
        };
        img.src = framePath(i);
        images[i] = img;
      }
    });
  }

  /* ---- Process timeline: pin + scroll-scrubbed step reveal --------------
     Desktop only — the 6-column grid wraps to fewer columns on narrow
     screens (see css/responsive.css), where a pinned scrub reads awkwardly.
     On mobile these steps simply render at full opacity with no animation
     (data-reveal was intentionally removed from them in index.html so the
     two systems never fight over the same opacity/transform properties).
     Deliberately created AFTER the hero's ScrollTrigger exists (see the
     ordering note at the top of this file) so its start/end math is based
     on the page's real, final height, not a shorter pre-hero-pin one. */
  function setupProcessSection() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 860px)', () => {
      const steps = gsap.utils.toArray('.process-step');
      if (!steps.length) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: '.process-section',
          start: 'top top+=84',
          end: '+=120%',
          pin: true,
          scrub: 1
        }
      }).from(steps, {
        opacity: 0.2,
        y: 40,
        scale: 0.92,
        stagger: 0.5,
        ease: 'none'
      });
    });
  }

  setupHero().then(() => {
    setupProcessSection();
    ScrollTrigger.refresh();
  });
});
