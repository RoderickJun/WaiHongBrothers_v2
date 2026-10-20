/* Wai Hong Brothers — multi-step quote request UI.
   On submit, the enquiry is emailed via FormSubmit.co's AJAX endpoint
   (a free service, no account/API key required — mail just goes straight
   to the configured address) and a WhatsApp deep-link is also offered on
   the success screen so the enquiry reaches the team through both
   channels. If the email send fails, we still surface the WhatsApp
   fallback rather than leaving the visitor stuck. */
const QUOTE_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/roderick.waihong@gmail.com';
document.addEventListener('DOMContentLoaded', () => {
  const quotePanel = document.querySelector('.quote-panel');
  if (!quotePanel) return;

  const steps = Array.from(quotePanel.querySelectorAll('.quote-step'));
  const indicators = Array.from(quotePanel.querySelectorAll('.quote-step-indicator'));
  let current = 0;

  const state = {
    need: '',
    state: '',
    name: '',
    company: '',
    phone: '',
    email: '',
    message: ''
  };

  const REGION_WHATSAPP = {
    'klang-valley': { number: '60109467118', label: 'Klang Valley / KL / Selangor / Seremban / Melaka / Pahang' },
    'johor': { number: '601131221778', label: 'Johor Bahru' },
    'north': { number: '601116770118', label: 'Ipoh / Penang / Kedah' }
  };

  /* Maps each individual state option to the regional team that covers it */
  const STATE_TO_REGION = {
    'kuala-lumpur': 'klang-valley',
    'selangor': 'klang-valley',
    'seremban': 'klang-valley',
    'melaka': 'klang-valley',
    'johor': 'johor',
    'ipoh': 'north',
    'penang': 'north'
  };

  function showStep(index) {
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    indicators.forEach((ind, i) => {
      ind.classList.toggle('is-active', i === index);
      ind.classList.toggle('is-done', i < index);
    });
    current = index;
  }

  quotePanel.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!validateStep(current)) return;
      if (current < steps.length - 1) showStep(current + 1);
    });
  });
  quotePanel.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => { if (current > 0) showStep(current - 1); });
  });

  quotePanel.querySelectorAll('.option-card[data-field]').forEach(card => {
    card.addEventListener('click', () => {
      const field = card.dataset.field;
      const group = quotePanel.querySelectorAll(`.option-card[data-field="${field}"]`);
      group.forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      state[field] = card.dataset.value;
      const notice = card.closest('.quote-step').querySelector('.field-required-notice');
      if (notice) notice.hidden = true;
    });
  });

  function validateStep(index) {
    const step = steps[index];
    if (step.dataset.step === 'need' && !state.need) {
      flashRequired(step); return false;
    }
    if (step.dataset.step === 'state' && !state.state) {
      flashRequired(step); return false;
    }
    if (step.dataset.step === 'contact') {
      const form = step.querySelector('form');
      if (!form.checkValidity()) { form.reportValidity(); return false; }
      state.name = form.name.value.trim();
      state.company = form.company.value.trim();
      state.phone = form.phone.value.trim();
      state.email = form.email.value.trim();
      state.message = form.message.value.trim();
    }
    return true;
  }

  function flashRequired(step) {
    step.style.animation = 'none';
    void step.offsetWidth;
    step.style.animation = 'fadeUp .3s ease';
    const notice = step.querySelector('.field-required-notice');
    if (notice) notice.hidden = false;
  }

  function labelFor(field, value) {
    const card = quotePanel.querySelector(`.option-card[data-field="${field}"][data-value="${value}"]`);
    return card ? card.textContent.trim() : value;
  }

  const form = quotePanel.querySelector('.quote-contact-form');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitBtnLabel = submitBtn ? submitBtn.innerHTML : '';
    const emailErrorNotice = form.querySelector('.form-error-notice');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      state.name = form.name.value.trim();
      state.company = form.company.value.trim();
      state.phone = form.phone.value.trim();
      state.email = form.email.value.trim();
      state.message = form.message.value.trim();

      const serviceLabel = labelFor('need', state.need);
      const stateLabel = labelFor('state', state.state);
      const regionKey = STATE_TO_REGION[state.state] || 'klang-valley';
      const region = REGION_WHATSAPP[regionKey];

      const lines = [
        `New site inspection request from waihongbrothers.com`,
        `Service: ${serviceLabel}`,
        `State: ${stateLabel}`,
        `Name: ${state.name}`,
        state.company ? `Company: ${state.company}` : null,
        `Phone: ${state.phone}`,
        state.email ? `Email: ${state.email}` : null,
        state.message ? `Message: ${state.message}` : null
      ].filter(Boolean);
      const waUrl = `https://wa.me/${region.number}?text=${encodeURIComponent(lines.join('\n'))}`;

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
      if (emailErrorNotice) emailErrorNotice.hidden = true;

      let emailSent = false;
      try {
        const res = await fetch(QUOTE_EMAIL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `New site inspection request — ${serviceLabel}`,
            _template: 'table',
            Service: serviceLabel,
            State: stateLabel,
            Name: state.name,
            Company: state.company || '(not provided)',
            Phone: state.phone,
            Email: state.email || '(not provided)',
            Message: state.message || '(not provided)'
          })
        });
        emailSent = res.ok;
      } catch (err) {
        emailSent = false;
      }

      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitBtnLabel; }

      if (!emailSent && emailErrorNotice) emailErrorNotice.hidden = false;

      showStep(steps.length - 1);
      const successPanel = quotePanel.querySelector('.quote-success');
      if (successPanel) {
        const waLink = successPanel.querySelector('.quote-success-whatsapp');
        if (waLink) waLink.href = waUrl;

  const heading = successPanel.querySelector('.quote-success-heading');
        const text = successPanel.querySelector('.quote-success-text');
        const lang = (window.WHB_I18N && (localStorage.getItem('whb_lang') || 'en')) || 'en';
        const dict = (window.WHB_I18N && window.WHB_I18N[lang]) || {};
        if (!emailSent) {
          if (heading) heading.textContent = dict['quote.failHeading'] || "Let's finish this on WhatsApp";
          if (text) text.textContent = dict['quote.failText'] || "We couldn't send the email just now, but your details are ready below — tap to send them on WhatsApp instead.";
        } else {
          if (heading) heading.textContent = dict['quote.successHeading'] || 'Thanks — your enquiry is on its way';
          if (text) text.textContent = dict['quote.successText'] || "We've emailed your details to our team. You can also tap below to send the same details on WhatsApp for a faster response.";
        }
      }
    });
  }

  showStep(0);
});
