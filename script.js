(function bootSite() {
  'use strict';

  const config = window.SITE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<p class="config-error">CONFIG OFFLINE // 未找到 config.js</p>';
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.textContent = value;
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  };

  const displayValue = (value) => {
    if (Array.isArray(value)) return value.join(' / ');
    if (value && typeof value === 'object') return Object.values(value).join(' / ');
    return String(value ?? '—');
  };

  const setMultilineText = (element, value) => {
    if (!element) return;
    const lines = String(value || '').split('\n');
    lines.forEach((line, index) => {
      if (index) element.appendChild(document.createElement('br'));
      element.appendChild(document.createTextNode(line));
    });
  };

  const setExternalLink = (anchor, url) => {
    anchor.href = url || '#';
    if (url && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('#')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  };

  function applyMetadata() {
    document.title = config.meta?.title || `${config.player.callsign} // Tactical Profile`;
    const description = $('meta[name="description"]');
    if (description && config.meta?.description) description.content = config.meta.description;
  }

  function renderIdentity() {
    setText('brand-mark', config.brand?.mark);
    setText('brand-name', config.brand?.name);
    setText('player-callsign', config.player?.callsign);
    setText('player-role', config.player?.role);
    setText('player-tagline', config.player?.tagline);
    setText('current-focus', config.player?.focus);
    setText('avatar-initials', config.player?.initials);
    setText('signature-name', config.player?.name);
    setText('footer-brand', config.brand?.name);
    setText('footer-year', new Date().getFullYear());
    setText('profile-heading', '');
    setMultilineText(document.getElementById('profile-heading'), config.profile?.heading);
    setText('contact-heading', '');
    setMultilineText(document.getElementById('contact-heading'), config.contact?.heading);
    setText('contact-message', config.contact?.message);

    const cardIndex = $('.card-index');
    if (cardIndex) cardIndex.textContent = config.player?.id || 'PX-01';
    const status = $('.player-card-meta strong');
    if (status) {
      status.replaceChildren(createElement('i'), document.createTextNode(` ${config.player?.status || 'ONLINE'}`));
    }

    if (config.player?.avatar) {
      const frame = $('.avatar-frame');
      const image = createElement('img', 'player-avatar');
      image.src = config.player.avatar;
      image.alt = `${config.player.name || config.player.callsign} 的照片`;
      image.addEventListener('error', () => image.remove(), { once: true });
      frame?.prepend(image);
    }
  }

  function renderNavigation() {
    const nav = document.getElementById('site-nav');
    (config.navigation || []).forEach((item, index) => {
      const link = createElement('a', index === 0 ? 'active' : '', item.label);
      link.href = `#${item.target}`;
      link.dataset.target = item.target;
      nav.appendChild(link);
    });
  }

  function renderStats() {
    const stats = document.getElementById('quick-stats');
    Object.entries(config.stats || {}).forEach(([label, value]) => {
      const item = createElement('div');
      item.append(createElement('dt', '', label), createElement('dd', '', displayValue(value)));
      stats.appendChild(item);
    });
  }

  function renderProfile() {
    const bio = document.getElementById('profile-bio');
    (config.profile?.bio || []).forEach((paragraph) => bio.appendChild(createElement('p', '', paragraph)));

    const fields = document.getElementById('profile-fields');
    Object.entries(config.profile?.fields || {}).forEach(([label, value], index) => {
      const item = createElement('div', 'dossier-item');
      const indexLabel = createElement('span', 'dossier-index', String(index + 1).padStart(2, '0'));
      const term = createElement('dt', '', label);
      const description = createElement('dd', '', displayValue(value));
      item.append(indexLabel, term, description);
      fields.appendChild(item);
    });
  }

  function renderLoadout() {
    const grid = document.getElementById('loadout-grid');
    (config.loadout || []).forEach((category) => {
      const card = createElement('article', 'loadout-card');
      const header = createElement('header');
      header.append(createElement('span', '', category.name), createElement('small', '', category.code));
      const list = createElement('div', 'loadout-list');

      (category.items || []).forEach((skill) => {
        const level = Math.max(0, Math.min(100, Number(skill.level) || 0));
        const row = createElement('div', 'loadout-item');
        const label = createElement('div', 'loadout-label');
        label.append(createElement('span', '', skill.name), createElement('strong', '', `${level}%`));
        const meter = createElement('div', 'loadout-meter');
        const fill = createElement('i');
        fill.style.setProperty('--level', `${level}%`);
        meter.appendChild(fill);
        row.append(label, meter);
        list.appendChild(row);
      });

      card.append(header, list);
      grid.appendChild(card);
    });
  }

  function renderOperations() {
    const list = document.getElementById('operations-list');
    (config.operations || []).forEach((operation, index) => {
      const card = createElement('article', 'operation-card');
      const lead = createElement('div', 'operation-lead');
      lead.append(createElement('span', 'operation-number', String(index + 1).padStart(2, '0')));
      const titleGroup = createElement('div');
      titleGroup.append(createElement('small', '', `${operation.code} // ${operation.type}`), createElement('h3', '', operation.name));
      lead.appendChild(titleGroup);

      const body = createElement('div', 'operation-body');
      body.appendChild(createElement('p', '', operation.description));
      const tags = createElement('div', 'operation-tags');
      (operation.stack || []).forEach((tech) => tags.appendChild(createElement('span', '', tech)));
      body.appendChild(tags);

      const actions = createElement('div', 'operation-actions');
      const status = createElement('span', `operation-status ${String(operation.status).toLowerCase()}`, operation.status);
      actions.appendChild(status);
      [
        ['SOURCE ↗', operation.source],
        ['LIVE VIEW ↗', operation.demo]
      ].forEach(([label, url]) => {
        if (!url) return;
        const link = createElement('a', '', label);
        setExternalLink(link, url);
        actions.appendChild(link);
      });

      card.append(lead, body, actions);
      list.appendChild(card);
    });
  }

  function renderContact() {
    const links = document.getElementById('contact-links');
    (config.contact?.links || []).forEach((contact) => {
      const link = createElement('a');
      setExternalLink(link, contact.url);
      link.append(createElement('span', '', contact.label), createElement('strong', '', contact.value), createElement('i', '', '↗'));
      links.appendChild(link);
    });
  }

  function initClock() {
    const clock = document.getElementById('system-clock');
    const update = () => {
      clock.textContent = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(new Date());
    };
    update();
    window.setInterval(update, 1000);
  }

  function initNavigation() {
    const menu = document.getElementById('menu-toggle');
    const nav = document.getElementById('site-nav');
    menu.addEventListener('click', () => {
      const isOpen = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!isOpen));
      nav.classList.toggle('open', !isOpen);
    });
    nav.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    });

    const sections = [...document.querySelectorAll('main section[id]')];
    const navLinks = [...nav.querySelectorAll('a')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('active', link.dataset.target === entry.target.id));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
  }

  applyMetadata();
  renderNavigation();
  renderIdentity();
  renderStats();
  renderProfile();
  renderLoadout();
  renderOperations();
  renderContact();
  initClock();
  initNavigation();
  initReveal();
})();
