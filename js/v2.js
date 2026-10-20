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
