(function () {
  'use strict';

  const card = document.getElementById('card');
  const questionEl = document.getElementById('question');
  const subEl = document.getElementById('subtext');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');

  let noCount = 0;
  let lastFaceId = 'face-ask';

  // ---------- üzən ürəklər ----------
  function spawnFloaties(count) {
    const emojis = ['💗', '💖', '✨', '💞'];
    const wrap = document.getElementById('floaties');
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.left = Math.random() * 100 + 'vw';
      span.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      span.style.fontSize = (14 + Math.random() * 16) + 'px';
      span.style.animationDuration = (9 + Math.random() * 10) + 's';
      span.style.animationDelay = (Math.random() * -12) + 's';
      wrap.appendChild(span);
    }
  }

  // ---------- dovşan üzləri ----------
  function showFace(id) {
    document.querySelectorAll('.bunny-face').forEach((f) => f.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function swapText(el, text) {
    el.classList.add('swap');
    setTimeout(() => {
      el.textContent = text;
      el.classList.remove('swap');
    }, 150);
  }

  // ---------- XEYR basıldıqca çıxan reaksiyalar (psixoloji tonda) ----------
  const reactions = [
    { id: 'face-shy', text: 'Utandırma məni belə, sadəcə BƏLİ de 🙈', sub: 'çətin nədir ki, and de görüm' },
    { id: 'face-annoyed', text: 'Niyə XEYR-ə basdın?! 😤', sub: 'bu, məni bir az da inadkar edir, bil' },
    { id: 'face-sad', text: 'İndi məni kövrəltdin...', sub: 'bir BƏLİ hər şeyi düzəldə bilər' },
    { id: 'face-pleading', text: 'Xahiş edirəm... 🥹', sub: 'bu gözlərə də yox deyə bilirsən?' },
    { id: 'face-tired', text: 'Mən heç yerə getmirəm, bil 😌', sub: 'XEYR məndən qaçdığı kimi, sən də bu sualdan qaça bilməzsən' },
    { id: 'face-questioning', text: 'Mənlə görüşmək istəmirsən? 🥺', sub: 'yoxsa sadəcə barmağın sürüşdü?' },
  ];

  // müəyyən klik sayında güclü, ssenarili mesaj (təsadüfi hovuzu əvəz edir)
  const specialBeats = {
    4: { id: 'face-sad', text: 'Cidden məni kövrəltdin...', sub: 'axı bir BƏLİ hər şeyi dəyişər' },
    7: { id: 'face-pleading', text: 'Bax bu üzə də yox deyirsən?', sub: 'sadəcə bir sözdür, çətin deyil' },
    11: { id: 'face-tired', text: 'Mən BƏLİ eşidənə qədər buradayam 😌', sub: 'sən nə qədər dözəcəksən?' },
  };

  const successMessages = ['Bilirdim! 💌', 'Səni gözləyirəm 🥰', 'Mükəmməl seçim etdin 😌💕', 'Date təsdiqləndi! 🎉'];

  // ntfy.sh - qeydiyyatsız push bildiriş; mövzu adı gizli saxlanılmalıdır (kim bilsə, ora mesaj poçtlaya bilər)
  const NTFY_TOPIC = 'date-teklifi-1854fb9d24';

  function getDeviceLabel() {
    const ua = navigator.userAgent;
    let os = 'naməlum cihaz';
    if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua)) os = 'iPad';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'Mac';
    else if (/Linux/.test(ua)) os = 'Linux';

    let browser = '';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/OPR\//.test(ua)) browser = 'Opera';
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

    return browser ? `${os} (${browser})` : os;
  }

  function notifyYes() {
    // xüsusi header YOX - "Title"/"Tags" kimi header-lər CORS preflight tetikləyir,
    // bu da file:// səhifədən gedən sorğunu səssizcə bloklaya bilirdi
    const device = getDeviceLabel();
    const time = new Date().toLocaleString('az-AZ', { dateStyle: 'medium', timeStyle: 'short' });
    fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      body: `🎉 BƏLİ dedi! — 1-ci gün saat 17:30 üçün hazırlaş 💌\nCihaz: ${device}\nVaxt: ${time}`,
    })
      .then((res) => {
        if (!res.ok) console.error('ntfy bildirişi göndərilmədi, status:', res.status);
      })
      .catch((err) => console.error('ntfy bildirişi göndərilmədi:', err));
  }

  function updateReaction() {
    const pick = specialBeats[noCount] || (() => {
      let candidate;
      do {
        candidate = pickRandom(reactions);
      } while (candidate.id === lastFaceId && reactions.length > 1);
      return candidate;
    })();

    lastFaceId = pick.id;
    showFace(pick.id);

    swapText(questionEl, pick.text);
    swapText(subEl, pick.sub);
  }

  // ---------- BƏLİ düyməsi tədricən böyüyür ----------
  function reinforceYes() {
    const scale = Math.min(1 + noCount * 0.05, 1.55);
    yesBtn.style.transform = `scale(${scale})`;
  }

  // ---------- XEYR düyməsinin qaçması ----------
  function initRoaming() {
    if (noBtn.classList.contains('roaming')) return;
    const rect = noBtn.getBoundingClientRect();
    // transform olan əcdadlardan (kart) qaçıb bütün ekranda sərbəst gəzə bilsin deyə body-ə keçirilir
    document.body.appendChild(noBtn);
    noBtn.classList.add('roaming');
    noBtn.style.left = rect.left + 'px';
    noBtn.style.top = rect.top + 'px';
    void noBtn.offsetHeight; // başlanğıc mövqeyini oturtmaq üçün reflow məcbur edilir
  }

  function dodge() {
    initRoaming();
    const w = noBtn.offsetWidth;
    const h = noBtn.offsetHeight;
    const margin = 16;
    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);
    const x = margin + Math.random() * (maxX - margin);
    const y = margin + Math.random() * (maxY - margin);
    noBtn.style.left = x + 'px';
    noBtn.style.top = y + 'px';

    const rot = (Math.random() * 30 - 15).toFixed(1);
    const scale = Math.max(1 - noCount * 0.02, 0.72);
    noBtn.style.transform = `rotate(${rot}deg) scale(${scale})`;
  }

  function onNoInteract(e) {
    e.preventDefault();
    noCount++;
    dodge();
    updateReaction();
    reinforceYes();
  }

  noBtn.addEventListener('click', onNoInteract);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    noBtn.addEventListener('mouseenter', onNoInteract);
  }

  // ---------- BƏLİ basıldıqda ----------
  function onYes() {
    noBtn.removeEventListener('click', onNoInteract);
    noBtn.removeEventListener('mouseenter', onNoInteract);
    noBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    noBtn.style.opacity = '0';
    setTimeout(() => noBtn.remove(), 300);

    yesBtn.disabled = true;
    yesBtn.style.cursor = 'default';
    card.classList.add('celebrating');

    showFace('face-joy');
    swapText(questionEl, pickRandom(successMessages));
    swapText(subEl, 'sənlə görüşmək üçün səbirsizlənirəm 🎉');

    notifyYes();
    launchCelebration();
  }

  yesBtn.addEventListener('click', onYes);

  // ---------- konfeti + fişək effekti (xarici kitabxanasız, tam lokal) ----------
  let particles = [];
  let sparks = [];
  let animating = false;
  let stopAt = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const confettiColors = ['#ff5c8a', '#ff9ec7', '#ffd166', '#ffffff', '#ff8fb3'];
  const fireworkColors = ['#ff5c8a', '#ffd166', '#ff9ec7', '#ffffff', '#7ec8e3'];

  function spawnConfettiCannon(x, y, dirSign) {
    for (let i = 0; i < 70; i++) {
      const angle = (dirSign > 0 ? -0.35 : Math.PI + 0.35) + (Math.random() - 0.5) * 0.9;
      const speed = 6 + Math.random() * 9;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 5,
        color: pickRandom(confettiColors),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
      });
    }
  }

  function spawnFirework(x, y) {
    const color = pickRandom(fireworkColors);
    const count = 50;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2.5 + Math.random() * 3;
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0,
        maxLife: 55 + Math.random() * 20,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.vy += 0.18;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    particles = particles.filter((p) => p.life < 220 && p.y < window.innerHeight + 40);

    sparks.forEach((s) => {
      s.vy += 0.035;
      s.vx *= 0.985;
      s.vy *= 0.985;
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      const alpha = Math.max(0, 1 - s.life / s.maxLife);
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    sparks = sparks.filter((s) => s.life < s.maxLife);

    const stillGoing = particles.length || sparks.length || performance.now() < stopAt;
    if (stillGoing) {
      requestAnimationFrame(tick);
    } else {
      canvas.style.display = 'none';
      animating = false;
    }
  }

  function launchCelebration() {
    canvas.style.display = 'block';
    stopAt = performance.now() + 5000;

    // konfeti/fişək çərçivənin öz sol-sağ kənarlarından çıxsın, ekranın küncündən yox
    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height * 0.55;

    spawnConfettiCannon(rect.left, midY, 1);
    spawnConfettiCannon(rect.right, midY, -1);

    let rounds = 1;
    const cannonTimer = setInterval(() => {
      spawnConfettiCannon(rect.left, midY, 1);
      spawnConfettiCannon(rect.right, midY, -1);
      rounds++;
      if (rounds >= 5) clearInterval(cannonTimer);
    }, 600);

    let bursts = 0;
    const burstTimer = setInterval(() => {
      const fromLeft = Math.random() < 0.5;
      const x = (fromLeft ? rect.left : rect.right) + (Math.random() * 26 - 13);
      const y = rect.top + Math.random() * rect.height;
      spawnFirework(x, y);
      bursts++;
      if (bursts >= 14) clearInterval(burstTimer);
    }, 280);

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  spawnFloaties(14);
})();
