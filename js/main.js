/* Wai Hong Brothers — core interactions */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-mobile-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mainNav.classList.remove('is-mobile-open');
      navToggle.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = 1600;
    const start = performance.now();
    const isInt = Number.isInteger(target);

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = isInt ? Math.round(value).toLocaleString() : value.toFixed(1);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = isInt ? target.toLocaleString() : target.toFixed(1);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterIO.observe(el));
  } else {
    counters.forEach(el => el.textContent = el.dataset.count);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-answer').style.maxHeight = null;
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Before / After slider ---------- */
  const baSlider = document.querySelector('.ba-slider');
  if (baSlider) {
    const beforeWrap = baSlider.querySelector('.ba-before-wrap');
    const beforeImage = baSlider.querySelector('.ba-before');
    const handle = baSlider.querySelector('.ba-handle');

    const setPosition = (percent) => {
      const clamped = Math.max(2, Math.min(98, percent));
      beforeWrap.style.width = clamped + '%';
      handle.style.left = clamped + '%';
    };

    const getPercentFromEvent = (clientX) => {
      const rect = baSlider.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };

    // Keep the before image at the full slider width. The reveal wrapper
    // clips it during drag, rather than re-scaling the image as it narrows.
    const syncBeforeImage = () => {
      beforeImage.style.width = baSlider.getBoundingClientRect().width + 'px';
    };

    let dragging = false;
    const start = () => dragging = true;
    const end = () => dragging = false;
    const move = (clientX) => { if (dragging) setPosition(getPercentFromEvent(clientX)); };

    baSlider.addEventListener('mousedown', (e) => { start(); setPosition(getPercentFromEvent(e.clientX)); });
    window.addEventListener('mouseup', end);
    window.addEventListener('mousemove', (e) => move(e.clientX));

    baSlider.addEventListener('touchstart', (e) => { start(); setPosition(getPercentFromEvent(e.touches[0].clientX)); }, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });

    syncBeforeImage();
    setPosition(50);
    window.addEventListener('resize', syncBeforeImage);
  }

  /* ---------- Project filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;
      projectCards.forEach(card => {
        const categories = card.dataset.category.split(' ');
        const match = filter === 'all' || categories.includes(filter);
        card.hidden = !match;
      });
    });
  });

  /* ---------- Service area tabs ---------- */
  const areaTabs = document.querySelectorAll('.area-tab');
  const areaPanels = document.querySelectorAll('.area-panel');
  const areaBgPhotos = document.querySelectorAll('.areas-bg-photo');
  areaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      areaTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.area;
      areaPanels.forEach(panel => { panel.hidden = panel.dataset.area !== target; });
      areaBgPhotos.forEach(bg => { bg.classList.toggle('is-active', bg.dataset.bg === target); });
    });
  });

});
