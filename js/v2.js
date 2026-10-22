/* Wai Hong Brothers v2 — site-wide design behaviour (every page).
   Pill navigation with a sliding highlight, plus the decorative footer wordmark.
   Purely presentational: nothing here changes content or links. */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Pill nav: mark the current page, slide a highlight under it ---------- */
  const list = document.querySelector('.main-nav ul');
  if (list) {
    const links = [...list.querySelectorAll('a')];
    const page = location.pathname.split('/').pop() || 'index.html';
    // detail pages light up their parent section
    const parent = page.startsWith('service-') ? 'services.html'
      : page.startsWith('news-') ? 'news.html'
      : page.startsWith('article-') ? 'articles.html'
      : page;
    let current = links.find(a => {
      const href = a.getAttribute('href');
      return href === parent || (parent === 'index.html' && (href === '#home' || href === 'index.html'));
    });
    if (current) current.classList.add('is-current');

    const indicator = document.createElement('span');
    indicator.className = 'v2-nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    list.appendChild(indicator);

    const moveTo = (a) => {
      if (!a || getComputedStyle(indicator).display === 'none') { indicator.style.opacity = 0; return; }
      const li = a.parentElement;
      indicator.style.width = li.offsetWidth + 'px';
      indicator.style.transform = `translateX(${li.offsetLeft}px)`;
      indicator.style.opacity = 1;
    };
    links.forEach(a => {
      a.addEventListener('mouseenter', () => { links.forEach(l => l.classList.remove('is-hover')); a.classList.add('is-hover'); moveTo(a); });
    });
    list.addEventListener('mouseleave', () => { links.forEach(l => l.classList.remove('is-hover')); moveTo(current); });
    // fonts change link widths, and the language toggle swaps the labels
    const reset = () => moveTo(current);
    window.addEventListener('load', reset);
    window.addEventListener('resize', reset);
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => setTimeout(reset, 30)));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reset);
    reset();
  }

  /* ---------- Certificate viewer: click a certificate to open it in a window on the same page ---------- */
  const certCards = [...document.querySelectorAll('.cert-gallery .cert-card')];
  if (certCards.length) {
    const box = document.createElement('div');
    box.className = 'v2-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;
    box.innerHTML = `
      <button type="button" class="v2-lightbox-close" aria-label="Close">&times;</button>
      <button type="button" class="v2-lightbox-nav is-prev" aria-label="Previous">&#8249;</button>
      <figure class="v2-lightbox-frame">
        <img alt="">
        <figcaption></figcaption>
      </figure>
      <button type="button" class="v2-lightbox-nav is-next" aria-label="Next">&#8250;</button>
      <span class="v2-lightbox-count"></span>`;
    document.body.appendChild(box);
    const img = box.querySelector('img');
    const cap = box.querySelector('figcaption');
    const count = box.querySelector('.v2-lightbox-count');
    let index = 0, lastFocus = null;

    const show = (i) => {
      index = (i + certCards.length) % certCards.length;
      const src = certCards[index].querySelector('img');
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      // caption follows the current language, since it is read from the page each time
      cap.textContent = certCards[index].querySelector('figcaption').textContent;
      count.textContent = `${index + 1} / ${certCards.length}`;
    };
    const open = (i) => {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add('is-open'));
      document.documentElement.style.overflow = 'hidden';
      box.querySelector('.v2-lightbox-close').focus();
    };
    const close = () => {
      box.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      setTimeout(() => { box.hidden = true; }, 250);
      if (lastFocus) lastFocus.focus();
    };

    certCards.forEach((card, i) => {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.addEventListener('click', () => open(i));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    box.querySelector('.v2-lightbox-close').addEventListener('click', close);
    box.querySelector('.is-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.is-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    // swipe on phones
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- Oversized footer wordmark ---------- */
  const footer = document.querySelector('.site-footer');
  if (footer && !footer.querySelector('.v2-footer-wordmark')) {
    const mark = document.createElement('div');
    mark.className = 'v2-footer-wordmark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = 'Wai Hong Brothers';
    footer.appendChild(mark);
  }
});
