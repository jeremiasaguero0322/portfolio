/* ============================================================
   Portfolio interactions
   - Rotating 3D star-cluster background
   - Star-studded mouse trail + glow cursor
   - Scroll reveals, typed roles, animated counters
   - Stack grid injection, magnetic buttons, card spotlight
   ============================================================ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ----------------------------------------------------------
     1. Spiral galaxy background
     ---------------------------------------------------------- */
  const sky = document.getElementById('starfield');
  const sctx = sky.getContext('2d');
  let W, H, cx, cy, stars = [], spread = 0;
  const STAR_COUNT = reduceMotion ? 1100 : 3000;
  const PERSP = 900;          // perspective depth
  const TILT = 0.62;          // viewing angle — more face-on so the spiral reads (~36°)
  const ARMS = 2;             // grand-design two-arm spiral
  const TWIST = 3.1;          // how tightly the arms wind

  // gentle parallax target driven by the mouse
  let parX = 0, parY = 0, parTX = 0, parTY = 0;

  // colour by distance from the core: warm/bright core → violet → blue rim
  function galaxyColor(t, bulge) {
    const r = Math.random();
    if (bulge) return r < 0.5 ? '#fff6e0' : (r < 0.8 ? '#ffe9c2' : '#ffffff');
    if (t < 0.33) return r < 0.5 ? '#ffffff' : (r < 0.8 ? '#ffe6f7' : '#f0d9ff');
    if (t < 0.66) return r < 0.5 ? '#c4b5fd' : (r < 0.8 ? '#a78bfa' : '#d8b4ff');
    return r < 0.5 ? '#93c5fd' : (r < 0.8 ? '#a5f3ff' : '#7dd3fc');
  }

  function makeStars() {
    stars = [];
    spread = Math.max(W, H) * 0.62;
    const bulgeR = spread * 0.32;
    for (let i = 0; i < STAR_COUNT; i++) {
      // ~28% form a smooth, densely-graded central bulge
      const bulge = Math.random() < 0.28;
      let r, ang, y;
      if (bulge) {
        // a rounded (slightly oblate) spheroid → projects to a circular core
        const br = Math.pow(Math.random(), 2.4) * bulgeR;
        const cosPhi = Math.random() * 2 - 1;
        const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
        ang = Math.random() * Math.PI * 2;
        r = br * sinPhi;          // in-plane radius
        y = br * cosPhi * 0.78;   // vertical extent (oblate flatten)
      } else {
        r = bulgeR * 0.35 + Math.pow(Math.random(), 0.62) * (spread - bulgeR * 0.35);
        const arm = (i % ARMS) * ((Math.PI * 2) / ARMS);
        // tighter scatter near the core, looser at the rim → crisp arms
        const fuzz = (Math.random() - 0.5) * (0.22 + 0.55 * (r / spread));
        ang = arm + (r / spread) * TWIST * Math.PI * 2 + fuzz;
        y = (Math.random() - 0.5) * spread * 0.04; // thin disk
      }
      const t = Math.min(1, r / spread);
      // smaller, denser stars in the core; a touch larger out in the arms
      const size = (bulge ? 0.62 * (Math.random() * 0.9 + 0.35)
                          : 0.85 * (Math.random() * 1.25 + 0.45));
      stars.push({
        r, ang, y, size, bulge,
        color: galaxyColor(t, bulge),
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    W = sky.width = window.innerWidth;
    H = sky.height = window.innerHeight;
    cx = W / 2; cy = H * 0.34;  // core sits in the upper third
    cur.width = W; cur.height = H;
    makeStars();
  }

  let spin = 0;
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  function renderSky(t) {
    sctx.clearRect(0, 0, W, H);
    spin += reduceMotion ? 0 : 0.00045; // slow galactic rotation

    parX += (parTX - parX) * 0.04;
    parY += (parTY - parY) * 0.04;
    const ox = cx + parX, oy = cy + parY;

    // luminous galactic core glow
    const coreR = spread * 0.5;
    const grd = sctx.createRadialGradient(ox, oy, 0, ox, oy, coreR);
    grd.addColorStop(0, 'rgba(255, 247, 230, 0.6)');
    grd.addColorStop(0.14, 'rgba(226, 196, 255, 0.34)');
    grd.addColorStop(0.42, 'rgba(124, 92, 255, 0.12)');
    grd.addColorStop(1, 'rgba(124, 92, 255, 0)');
    sctx.fillStyle = grd;
    sctx.beginPath();
    sctx.arc(ox, oy, coreR, 0, Math.PI * 2);
    sctx.fill();

    // additive blending so overlapping stars glow softly (esp. the core)
    sctx.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const a = s.ang + spin;
      const x = s.r * Math.cos(a);
      const z = s.r * Math.sin(a);
      // tilt the disk around the X axis so we see it on an angle
      const y2 = s.y * cosT - z * sinT;
      const z2 = s.y * sinT + z * cosT;

      const denom = PERSP + z2;
      if (denom < 120) continue;
      const scale = PERSP / denom;
      const sx = ox + x * scale;
      const sy = oy + y2 * scale;

      const twinkle = 0.7 + 0.3 * Math.sin(t * 0.0013 + s.tw);
      const alpha = Math.min(0.95, scale * 0.95) * twinkle;
      const size = s.size * scale * 1.25;

      sctx.globalAlpha = alpha;
      sctx.fillStyle = s.color;
      sctx.beginPath();
      sctx.arc(sx, sy, size, 0, Math.PI * 2);
      sctx.fill();

      if (size > 1.4) {
        sctx.globalAlpha = alpha * 0.14;
        sctx.beginPath();
        sctx.arc(sx, sy, size * 3.4, 0, Math.PI * 2);
        sctx.fill();
      }
    }
    sctx.globalAlpha = 1;
    sctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(renderSky);
  }

  /* ----------------------------------------------------------
     2. Star-studded mouse trail
     ---------------------------------------------------------- */
  const cur = document.getElementById('cursor-stars');
  const cctx = cur.getContext('2d');
  const glow = document.getElementById('cursor-glow');
  let sparks = [];
  let mx = -100, my = -100, lastSpawn = 0;

  const SPARK_COLORS = ['#ffffff', '#a5f3ff', '#c4b5fd', '#f9a8d4', '#fde68a'];

  function spawnSpark(x, y, burst = 1) {
    for (let i = 0; i < burst; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 1.4 + 0.2;
      sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.3,
        life: 1,
        decay: Math.random() * 0.02 + 0.012,
        size: Math.random() * 2.2 + 0.8,
        rot: Math.random() * Math.PI,
        color: SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0],
      });
    }
    if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
  }

  // draw a 4-point sparkle star
  function drawStar(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.38;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  function renderSparks() {
    cctx.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.012; // slight gravity
      p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }

      cctx.globalAlpha = Math.max(0, p.life);
      cctx.fillStyle = p.color;
      cctx.shadowBlur = 8;
      cctx.shadowColor = p.color;
      drawStar(cctx, p.x, p.y, p.size * (0.5 + p.life), p.rot);
    }
    cctx.globalAlpha = 1;
    cctx.shadowBlur = 0;
    requestAnimationFrame(renderSparks);
  }

  if (!coarse) {
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      // parallax for the cluster
      parTX = (mx - cx) * 0.02;
      parTY = (my - cy) * 0.02;

      glow.style.transform = `translate(${mx}px, ${my}px)`;

      const now = performance.now();
      if (!reduceMotion && now - lastSpawn > 16) {
        spawnSpark(mx, my, 2);
        lastSpawn = now;
      }
    });

    document.addEventListener('mousedown', () => {
      glow.classList.add('is-active');
      if (!reduceMotion) spawnSpark(mx, my, 24);
    });
    document.addEventListener('mouseup', () => glow.classList.remove('is-active'));

    // bigger sparkle burst over interactive elements
    document.querySelectorAll('a, button, .chip, .glass-card, .strength').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        glow.classList.add('is-active');
        if (!reduceMotion) spawnSpark(mx, my, 10);
      });
      el.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
    });
  }

  /* ----------------------------------------------------------
     3. Stack grid data
     ---------------------------------------------------------- */
  const STACK = [
    { icon: '🧠', title: 'AI / LLM', items: ['LLM API integration', 'RAG pipelines', 'Embeddings', 'Vector search', 'pgvector', 'Pinecone', 'LangChain', 'LlamaIndex', 'Function calling', 'Streaming', 'Prompt engineering', 'Evaluation & tracing'] },
    { icon: '🖥️', title: 'Backend', items: ['Node.js', 'Express', 'NestJS', 'Python', 'FastAPI', 'Django', 'Microservices', 'Background queues', 'Auth (JWT / OAuth)'] },
    { icon: '🎨', title: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'React Query', 'Zustand / Redux', 'Framer Motion', 'SSR / ISR', 'Vite'] },
    { icon: '🔌', title: 'APIs', items: ['REST', 'GraphQL', 'WebSockets', 'tRPC', 'gRPC', 'Webhooks', 'OpenAPI'] },
    { icon: '🗄️', title: 'Data', items: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'SQLAlchemy', 'Elasticsearch', 'Schema design'] },
    { icon: '☁️', title: 'Cloud & DevOps', items: ['AWS (EC2, S3, Lambda, RDS)', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Terraform', 'Nginx'] },
    { icon: '🧪', title: 'Testing & Quality', items: ['Jest', 'Vitest', 'Playwright', 'Pytest', 'ESLint', 'Type-safe contracts'] },
    { icon: '📈', title: 'Observability', items: ['Datadog', 'Sentry', 'Grafana', 'Prometheus', 'OpenTelemetry', 'Structured logging'] },
  ];

  const grid = document.getElementById('stackGrid');
  if (grid) {
    STACK.forEach((cat, i) => {
      const el = document.createElement('div');
      el.className = 'stack-cat reveal';
      el.style.setProperty('--d', `${i * 70}ms`);
      el.innerHTML = `
        <div class="stack-cat__head">
          <span class="stack-cat__icon">${cat.icon}</span>
          <span class="stack-cat__title">${cat.title}</span>
        </div>
        <div class="chips">
          ${cat.items.map((it) => `<span class="chip">${it}</span>`).join('')}
        </div>`;
      grid.appendChild(el);
    });
  }

  /* ----------------------------------------------------------
     4. Scroll reveal
     ---------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ----------------------------------------------------------
     5. Typed roles
     ---------------------------------------------------------- */
  const typedEl = document.getElementById('typed');
  const ROLES = [
    'Node.js · Express · NestJS',
    'Python · FastAPI · Django',
    'React · Next.js · TypeScript',
    'LLM · RAG · Vector Search',
    'AWS · Docker · Kubernetes',
  ];
  if (typedEl && !reduceMotion) {
    let ri = 0, ci = 0, deleting = false;
    function tick() {
      const word = ROLES[ri];
      typedEl.textContent = word.slice(0, ci);
      if (!deleting) {
        if (ci < word.length) { ci++; setTimeout(tick, 55); }
        else { deleting = true; setTimeout(tick, 1600); }
      } else {
        if (ci > 0) { ci--; setTimeout(tick, 28); }
        else { deleting = false; ri = (ri + 1) % ROLES.length; setTimeout(tick, 350); }
      }
    }
    tick();
  } else if (typedEl) {
    typedEl.textContent = ROLES[0];
  }

  /* ----------------------------------------------------------
     6. Animated counters
     ---------------------------------------------------------- */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat__num').forEach((el) => counterIO.observe(el));

  /* ----------------------------------------------------------
     7. Nav scrolled state
     ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     8. Magnetic buttons
     ---------------------------------------------------------- */
  if (!coarse && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------------
     9. Card spotlight (follows cursor inside glass cards)
     ---------------------------------------------------------- */
  document.querySelectorAll('.glass-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ----------------------------------------------------------
     10. Misc
     ---------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  // boot
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(renderSky);
  if (!coarse) requestAnimationFrame(renderSparks);
})();
