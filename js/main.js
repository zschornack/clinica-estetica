/* Aurelle — Clínica Estética · scripts do template (vanilla JS, sem dependências) */
(function () {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } }
  };

  /* ---------- Menu mobile ---------- */
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  if (toggle && header) {
    const label = $('.menu-label', toggle);
    const setMenu = (open) => {
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Fechar' : 'Menu';
    };
    toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });
  }

  /* ---------- Dropdown (teclado / toque) ---------- */
  $$('.dropdown').forEach(dd => {
    const trigger = $('.nav-link', dd);
    trigger.addEventListener('click', (e) => {
      if (window.matchMedia('(hover: none)').matches && !dd.classList.contains('open')) {
        e.preventDefault();
        dd.classList.add('open');
      }
    });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dd.classList.remove('open'); trigger.focus(); } });
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) dd.classList.remove('open'); });
  });

  /* ---------- Reveal ao rolar ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const format = (n) => n.toLocaleString('pt-BR');
  const runCounter = (el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = format(target) + suffix; return; }
    const dur = 1600, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const co = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
      }, { threshold: 0.5 });
      counters.forEach(c => co.observe(c));
    } else counters.forEach(runCounter);
  }

  /* ---------- Filtro de tratamentos ---------- */
  const tabs = $$('.tab[data-filter]');
  const cards = $$('.t-card[data-cat]');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const f = tab.dataset.filter;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    cards.forEach(c => {
      const show = f === 'todos' || c.dataset.cat === f;
      c.hidden = !show;
      if (show) { c.classList.remove('is-visible'); requestAnimationFrame(() => c.classList.add('is-visible')); }
    });
  }));

  /* ---------- FAQ (acordeão) ---------- */
  $$('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const open = !item.classList.contains('open');
    const list = item.parentElement;
    $$('.faq-item.open', list).forEach(i => { i.classList.remove('open'); $('.faq-q', i).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('open', open);
    q.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- Slider de depoimentos ---------- */
  $$('[data-slider]').forEach(slider => {
    const slides = $$('.quote', slider);
    const dotsWrap = $('.dots', slider);
    let i = 0, timer;
    slides.forEach(() => dotsWrap.appendChild(document.createElement('span')));
    const dots = $$('span', dotsWrap);
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const auto = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(i + 1), 7000); };
    $('[data-prev]', slider).addEventListener('click', () => { go(i - 1); auto(); });
    $('[data-next]', slider).addEventListener('click', () => { go(i + 1); auto(); });
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', auto);
    go(0); auto();
  });

  /* ---------- Modal promocional (1x por visitante) ---------- */
  const modal = $('#promo');
  if (modal) {
    const KEY = 'aurelle-promo-visto';
    let lastFocus = null;
    const focusables = () => $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', modal);
    const open = () => {
      lastFocus = document.activeElement;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      const f = focusables(); if (f[0]) f[0].focus();
    };
    const close = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      store.set(KEY, '1');
      if (lastFocus) lastFocus.focus();
    };
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (!store.get(KEY)) setTimeout(open, 4500);
  }

  /* ---------- Formulário (placeholder: sem backend) ---------- */
  const form = $('#contato-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = $$('[required]', form).filter(f => !f.value.trim());
      $$('[required]', form).forEach(f => f.style.borderColor = '');
      if (invalid.length) { invalid.forEach(f => f.style.borderColor = 'oklch(55% .15 25)'); invalid[0].focus(); return; }
      // TODO: integrar com WhatsApp / e-mail / CRM
      form.classList.add('sent');
      form.reset();
    });
  }

  /* ---------- Ano no rodapé ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
