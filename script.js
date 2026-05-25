// === Matrix Rain Background ===
(function initMatrix() {
  const canvas = document.getElementById('matrix-bg');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 50);
})();

// === Typing Effect for Role ===
(function initTyping() {
  const el = document.getElementById('typed-role');
  const roles = [
    'Full-Stack Developer',
    'Open Source Enthusiast',
    'System Architect',
    'Bug Hunter',
    'Coffee ☕ → Code Converter',
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const current = roles[roleIndex];

    if (!deleting) {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(type, 2000);
        return;
      }
      setTimeout(type, 60 + Math.random() * 40);
    } else {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(type, 400);
        return;
      }
      setTimeout(type, 30);
    }
  }

  setTimeout(type, 1000);
})();

// === Scroll-based Section Reveal ===
(function initScrollReveal() {
  const sections = document.querySelectorAll('.section:not(.hero)');
  sections.forEach(section => {
    section.classList.add('fade-in');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  sections.forEach(section => observer.observe(section));
})();

// === Active Nav Link ===
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionIds = Array.from(navLinks).map(link =>
    link.getAttribute('href').substring(1)
  );

  function updateActive() {
    let current = '';
    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150) {
          current = id;
        }
      }
    }

    navLinks.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${current}`
      );
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
})();

// === Glitch Effect on Hover ===
(function initGlitch() {
  document.querySelectorAll('.project-name').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const original = el.textContent;
      const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      let iterations = 0;

      const interval = setInterval(() => {
        el.textContent = original
          .split('')
          .map((char, i) => {
            if (i < iterations) return original[i];
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('');

        iterations += 1 / 2;
        if (iterations >= original.length) {
          el.textContent = original;
          clearInterval(interval);
        }
      }, 30);
    });
  });
})();

// === Command Output in Nav ===
(function initNavCommand() {
  const output = document.getElementById('terminal-output');
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const cmd = link.getAttribute('data-cmd');
      const line = document.createElement('div');
      line.className = 'output-line';
      line.innerHTML = `<span style="color:var(--green)">$</span> ${cmd}`;
      output.appendChild(line);

      output.style.opacity = '1';
      setTimeout(() => {
        output.style.opacity = '0';
        setTimeout(() => { output.innerHTML = ''; }, 300);
      }, 1200);
    });
  });
})();

// === Smooth scroll offset for fixed nav ===
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      const offset = 60;
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});
