// UI behavior: animate on scroll, active nav highlight, theme toggle, project tilt, contact feedback
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animate elements on scroll (adds .in-view)
  const animateEls = document.querySelectorAll('.animate');
  if(!prefersReduced && 'IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    },{threshold:0.12});
    animateEls.forEach(el=>obs.observe(el));
  } else {
    animateEls.forEach(el=>el.classList.add('in-view'));
  }

  // Active nav highlighting
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if('IntersectionObserver' in window && !prefersReduced){
    const navObs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        const id = entry.target.id;
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if(entry.isIntersecting){
          navLinks.forEach(l=>l.classList.remove('active'));
          if(link) link.classList.add('active');
        }
      });
    },{threshold:0.55});
    sections.forEach(s=>navObs.observe(s));
  } else {
    window.addEventListener('scroll', ()=>{
      const y = window.scrollY + 120;
      let current = sections[0];
      for(let s of sections){ if(s.offsetTop <= y) current = s; }
      navLinks.forEach(l=>l.classList.remove('active'));
      const link = document.querySelector(`.nav-link[href="#${current.id}"]`);
      if(link) link.classList.add('active');
    },{passive:true});
  }

  // Theme toggle (neon/dark) - persisted in localStorage
  const toggle = document.getElementById('themeToggle');
  function applyTheme(theme){
    if(theme === 'neon') document.documentElement.classList.add('theme-neon');
    else document.documentElement.classList.remove('theme-neon');
    if(toggle) toggle.textContent = theme === 'neon' ? '⚡' : '🌙';
  }
  const saved = localStorage.getItem('theme');
  if(saved) applyTheme(saved);
  else applyTheme('');
  if(toggle){
    toggle.addEventListener('click', ()=>{
      const isNeon = document.documentElement.classList.toggle('theme-neon');
      const theme = isNeon ? 'neon' : 'dark';
      applyTheme(theme === 'neon' ? 'neon' : '');
      localStorage.setItem('theme', theme === 'neon' ? 'neon' : '');
    });
  }

  // Nav toggle (accessible)
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  if(navToggle && primaryNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      primaryNav.classList.toggle('open');
      // focus the first link when opening
      if(primaryNav.classList.contains('open')){
        const first = primaryNav.querySelector('.nav-link');
        if(first) first.focus();
      }
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && primaryNav.classList.contains('open')){
        navToggle.setAttribute('aria-expanded','false');
        primaryNav.classList.remove('open');
        navToggle.focus();
      }
    });
  }

  // Basic tracking & UTM handling (privacy-friendly)
  window._events = window._events || [];
  function trackEvent(name, data){
    const ev = {name, data, time: Date.now()};
    window._events.push(ev);
    console.log('trackEvent', ev);
    const utmField = document.getElementById('utm_source');
    if(utmField && data && data.source) utmField.value = data.source;
  }

  // populate utm_source from URL if present
  const urlParams = new URLSearchParams(location.search);
  const utmFromUrl = urlParams.get('utm_source');
  if(utmFromUrl){ const utmField = document.getElementById('utm_source'); if(utmField) utmField.value = utmFromUrl; }

  // auto-track clickable elements with data-track or data-utm
  document.querySelectorAll('[data-track]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const label = el.dataset.utm || el.dataset.track || el.textContent.trim();
      trackEvent('click', {label, href: el.href || null, source: label});
    });
  });

  // Project card tilt (mouse-only, respects reduced motion / touch)
  const tiltEls = document.querySelectorAll('[data-tilt]');
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if(!prefersReduced && !supportsTouch){
    tiltEls.forEach(el=>{
      const rect = () => el.getBoundingClientRect();
      function onMove(e){
        const r = rect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const rotY = x * 6; // degrees
        const rotX = -y * 6;
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
        // shine position for pseudo-element
        const px = (x + 0.5) * 100;
        const py = (y + 0.5) * 100;
        el.style.setProperty('--shine-x', `${px}%`);
        el.style.setProperty('--shine-y', `${py}%`);
      }
      function reset(){ el.style.transform = ''; el.style.setProperty('--shine-x','-50%'); el.style.setProperty('--shine-y','-50%'); }
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
      el.addEventListener('mouseenter', ()=>el.style.transition = 'transform 160ms ease');
    });

    // Hero image parallax + dynamic shine
    const heroVisual = document.querySelector('.hero-visual');
    const heroWrap = document.querySelector('.hero-img-wrap');
    if(heroVisual && heroWrap){
      let hx = 0, hy = 0, tx = 0, ty = 0;
      heroVisual.addEventListener('mousemove', (e)=>{
        const r = heroVisual.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        hx = x; hy = y;
      });
      heroVisual.addEventListener('mouseleave', ()=>{ hx = 0; hy = 0 });

      function rafHero(){
        tx += (hx - tx) * 0.12;
        ty += (hy - ty) * 0.12;
        const rotX = ty * 6; const rotY = tx * -6;
        heroWrap.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
        const px = (tx + 0.5) * 100;
        const py = (ty + 0.5) * 100;
        heroWrap.style.setProperty('--shine-x', `${px}%`);
        heroWrap.style.setProperty('--shine-y', `${py}%`);
        requestAnimationFrame(rafHero);
      }
      requestAnimationFrame(rafHero);
    }
  }

  // Simple contact feedback
  const form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      // lightweight tracking
      const utmValue = document.getElementById('utm_source') ? document.getElementById('utm_source').value : 'site';
      if(window.trackEvent) trackEvent('contact_submit', {source: utmValue});

      const submit = form.querySelector('button[type="submit"]');
      const original = submit.textContent;
      submit.textContent = 'Sending...';
      submit.disabled = true;
      await new Promise(r=>setTimeout(r,700)); // simulate network

      // show inline success message
      let note = document.createElement('div');
      note.className = 'contact-note';
      note.textContent = 'Message sent successfully — I will reply soon.';
      form.appendChild(note);

      submit.textContent = 'Sent';
      setTimeout(()=>{ submit.textContent = original; submit.disabled = false; }, 1200);
      form.reset();
    });
  }

  /* Testimonials carousel (accessible + reduced-motion aware) */
  (function initTestimonials(){
    const root = document.getElementById('testimonials');
    if(!root) return;
    const slides = Array.from(root.querySelectorAll('.testimonial-slide'));
    const dots = Array.from(root.querySelectorAll('.testimonial-dot'));
    const prev = root.querySelector('.testimonial-prev');
    const next = root.querySelector('.testimonial-next');
    let idx = 0, timer = null;

    function show(i){
      slides.forEach((s,k)=>{
        const active = k === i;
        s.classList.toggle('active', active);
        s.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((d,k)=>{
        d.classList.toggle('active', k === i);
        d.setAttribute('aria-selected', String(k === i));
      });
      idx = i;
    }
    function nextSlide(){ show((idx + 1) % slides.length); }
    function prevSlide(){ show((idx - 1 + slides.length) % slides.length); }

    prev?.addEventListener('click', ()=>{ prevSlide(); resetTimer(); });
    next?.addEventListener('click', ()=>{ nextSlide(); resetTimer(); });
    dots.forEach((d,i)=> d.addEventListener('click', ()=>{ show(i); resetTimer(); }));

    root.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight'){ nextSlide(); resetTimer(); }
      else if(e.key === 'ArrowLeft'){ prevSlide(); resetTimer(); }
    });

    function startTimer(){ if(prefersReduced) return; if(timer) clearInterval(timer); timer = setInterval(nextSlide, 7000); }
    function resetTimer(){ if(timer) clearInterval(timer); timer = null; startTimer(); }

    root.addEventListener('mouseenter', ()=>{ if(timer){ clearInterval(timer); timer = null; }});
    root.addEventListener('mouseleave', ()=>{ if(!timer) startTimer(); });

    if(slides.length) show(0);
    startTimer();
  })();

  /* -----------------------------
     AI BACKGROUND: Fixed 3D neural network canvas
     - Stable while scrolling (position:fixed)
     - Respects prefers-reduced-motion
     - Hidden on small screens for perf
     ------------------------------ */
  (function initAIBackground(){
    const canvas = document.getElementById('ai-bg');
    if(!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
    let nodes = [], stars = [];
    let rafId = null;
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReduced = mqReduced.matches;

    // Roaming camera offset for slow galaxy drift (includes continuous drift velocity)
    let roam = {x: 0, y: 0, tx: 0, ty: 0, amp: Math.max(28, Math.max(window.innerWidth, window.innerHeight) * 0.03), vx: 0, vy: 0};

    function createNodes(count){
      nodes = [];
      const depth = Math.max(window.innerWidth, window.innerHeight) * 1.3;
      for(let i=0;i<count;i++){
        nodes.push({
          x: (Math.random() - 0.5) * window.innerWidth * 1.5,
          y: (Math.random() - 0.5) * window.innerHeight * 1.5,
          z: Math.random() * depth,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          vz: (Math.random() - 0.5) * 0.2
        });
      }
    }

    function createStars(count){
      stars = [];
      for(let i=0;i<count;i++){
        const radius = Math.random() * 1.8 + 0.4;
        stars.push({
          x: Math.random() * (w || window.innerWidth),
          y: Math.random() * (h || window.innerHeight),
          r: radius,
          speed: (prefersReduced ? 0 : (Math.random() * 0.035 + 0.006)),
          phase: Math.random() * Math.PI * 2,
          brightness: 0.6 + Math.random() * 0.9
        });
      }
    }

    function resize(){
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      w = canvas.width / dpr; h = canvas.height / dpr;
      const nodeCount = window.innerWidth < 720 ? 28 : 64;
      createNodes(nodeCount);
      // star count scales with viewport area but capped for perf
      const area = Math.max(400000, w * h);
      const starCount = Math.min(200, Math.floor(area / 35000));
      createStars(starCount);
      // adjust roam amplitude for new size
      roam.amp = Math.max(18, Math.max(w,h) * 0.03);
      // set a small continuous drift velocity (per viewport) for an infinite cruise feel
      if(!prefersReduced){
        const scaleFactor = Math.max(w,h) / 1000;
        roam.vx = (Math.random() * 2 - 1) * 0.08 * scaleFactor;
        roam.vy = (Math.random() * 2 - 1) * 0.04 * scaleFactor;
      } else {
        roam.vx = roam.vy = 0;
      }
    }

    function project(node){
      const fov = Math.max(600, Math.min(1200, window.innerWidth));
      const scale = fov / (fov + node.z);
      const cx = w/2, cy = h/2;
      // apply a subtle roam/parallax offset — closer (larger scale) objects move slightly more
      const roamFactor = prefersReduced ? 0 : (0.45 * scale);
      return {x: cx + node.x * scale + roam.x * roamFactor, y: cy + node.y * scale + roam.y * roamFactor, r: Math.max(0.6, 6 * (1 - scale)) * 0.6, s: scale};
    }

    function draw(){
      ctx.clearRect(0,0,w,h);
      // draw twinkling stars (subtle galaxy feel)
      if(stars && stars.length){
        for(let s of stars){
          // continuous drift applied to star positions and wrap-around for infinite movement
          if(!prefersReduced){
            s.x += roam.vx * (0.9 + s.r * 0.25);
            s.y += roam.vy * (0.9 + s.r * 0.25);
            if(s.x < -20) s.x += (w + 40);
            else if(s.x > w + 20) s.x -= (w + 40);
            if(s.y < -20) s.y += (h + 40);
            else if(s.y > h + 20) s.y -= (h + 40);
          }
          const t = time * 0.02; // control twinkle rate
          const alpha = prefersReduced ? 0.7 : (0.35 + 0.65 * Math.abs(Math.sin(s.phase + t * s.speed * 60)));
          // star position (slight additional parallax from eased roam)
          const sx = s.x + (prefersReduced ? 0 : roam.x * 0.06);
          const sy = s.y + (prefersReduced ? 0 : roam.y * 0.06);
          // core
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${(alpha * s.brightness).toFixed(3)})`;
          ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx.fill();
          // faint glow for larger stars
          if(s.r > 1.2){
            ctx.beginPath();
            ctx.fillStyle = `rgba(140,110,255,${(alpha * 0.055).toFixed(3)})`;
            ctx.arc(sx, sy, s.r * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // background tint subtle overlay is handled by CSS gradient; we draw nodes+lines

      // draw connections
      for(let i=0;i<nodes.length;i++){
        const a = project(nodes[i]);
        for(let j=i+1;j<nodes.length;j++){
          const b = project(nodes[j]);
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const max = 140 * Math.max(a.s,b.s);
          if(dist < max){
            const alpha = (1 - dist / max) * 0.12 * (a.s + b.s);
            ctx.strokeStyle = `rgba(120,80,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = Math.max(0.4, (1 - dist / max) * 1.6);
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
      }

      // draw nodes
      for(let i=0;i<nodes.length;i++){
        const p = project(nodes[i]);
        const grad = ctx.createRadialGradient(p.x,p.y,p.r*0.15,p.x,p.y,p.r*1.8);
        grad.addColorStop(0,'rgba(150,120,255,0.95)');
        grad.addColorStop(0.6,'rgba(120,80,255,0.7)');
        grad.addColorStop(1,'rgba(120,80,255,0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
    }

    let time = 0;
    function step(){
      time += 1;

      // update roam targets using slightly faster LFOs for a more lively drift
      if(!prefersReduced){
        // faster LFOs for slightly quicker roaming (subtle but noticeable) + continuous drift influence
        roam.tx = Math.sin(time * 0.004) * roam.amp + roam.vx * 30;
        roam.ty = Math.cos(time * 0.003) * roam.amp * 0.8 + roam.vy * 18;
        // ease toward targets quicker for snappier response
        roam.x += (roam.tx - roam.x) * 0.035;
        roam.y += (roam.ty - roam.y) * 0.035;
      } else {
        roam.x = roam.y = roam.tx = roam.ty = 0;
      }

      // subtle movement of nodes
      if(!prefersReduced){
        const depth = Math.max(window.innerWidth, window.innerHeight) * 1.3;
        const wrapX = window.innerWidth * 0.75;
        const wrapY = window.innerHeight * 0.75;
        for(let n of nodes){
          // slightly increased node velocity for a livelier scene
          n.x += n.vx * 0.45 + roam.vx * (0.5 + (1 - n.z / depth) * 0.9);
          n.y += n.vy * 0.45 + roam.vy * (0.5 + (1 - n.z / depth) * 0.9);
          n.z += n.vz * 0.45;
          // bounce z a bit to keep in bounds
          if(n.z < 0) n.z = Math.abs(n.z);
          if(n.z > depth) n.z = n.z % depth;
          // wrap nodes so the field feels infinite
          if(n.x > wrapX) n.x -= window.innerWidth * 1.5;
          else if(n.x < -wrapX) n.x += window.innerWidth * 1.5;
          if(n.y > wrapY) n.y -= window.innerHeight * 1.5;
          else if(n.y < -wrapY) n.y += window.innerHeight * 1.5;
        }
      }
      draw();
      rafId = requestAnimationFrame(step);
    }

    // pause when tab not visible
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){ if(rafId) cancelAnimationFrame(rafId); rafId = null; }
      else if(!rafId) rafId = requestAnimationFrame(step);
    });

    window.addEventListener('resize', ()=>{ if(rafId){ cancelAnimationFrame(rafId); rafId = null } resize(); rafId = requestAnimationFrame(step); }, {passive:true});

    // start
    resize();
    if(!prefersReduced) rafId = requestAnimationFrame(step);

    // update when reduced motion setting toggles
    mqReduced.addEventListener('change', (ev)=>{
      if(ev.matches){ if(rafId) cancelAnimationFrame(rafId); rafId = null; }
      else if(!rafId) rafId = requestAnimationFrame(step);
    });

  })();

/* Background music player — exposes toggleMusic() for inline use and persists preference */
(function initBGMusic(){
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('musicToggle');
  if(!audio || !btn){ window.toggleMusic = ()=>{}; return; }

  const src = audio.getAttribute('src') || (audio.querySelector('source') && audio.querySelector('source').getAttribute('src'));
  if(!src){ btn.style.display = 'none'; window.toggleMusic = ()=>{}; return; }

  function setUI(on){
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '🔊' : '🔈';
  }

  window.toggleMusic = async function(){
    if(audio.paused){
      try{ await audio.play(); setUI(true); localStorage.setItem('bgMusic','on'); }
      catch(e){ console.info('Autoplay blocked or user gesture required'); setUI(false); }
    } else {
      audio.pause(); setUI(false); localStorage.setItem('bgMusic','off');
    }
  };

  // Keep a click handler for progressive enhancement (in case inline onclick is removed)
  btn.addEventListener('click', ()=>{ if(window.toggleMusic) window.toggleMusic(); });

  // Set initial state
  audio.volume = 0.7; // Set volume to 70% for background music
  localStorage.setItem('bgMusic','on');
  setUI(true);
  
  // Flag to track if music has been started by user interaction
  let musicStarted = false;
  
  // Function to start music on first user interaction (touch or click)
  async function startMusicOnInteraction(){
    if(musicStarted) return; // Only start once
    musicStarted = true;
    
    try {
      await audio.play();
      audio.muted = false;
      setUI(true);
      // updateStatus and clearAutoplayRetry will be called after they're defined
      // For now, just ensure music plays
    } catch(e) {
      console.info('Music start failed, will retry on next interaction');
      musicStarted = false; // Allow retry on next interaction
    }
  }
  
  // Add event listeners for touch and click to start music
  document.addEventListener('touchstart', startMusicOnInteraction, {passive: true, once: true});
  document.addEventListener('click', startMusicOnInteraction, {once: true});
  
  // Function to start music with autoplay handling
  async function startMusic(){
    try {
      // Try to play unmuted first
      await audio.play();
      audio.muted = false;
      setUI(true);
      updateStatus();
      clearAutoplayRetry();
    } catch(e) {
      // If unmuted autoplay fails, try muted autoplay (browsers allow this)
      try {
        audio.muted = true;
        await audio.play();
        setUI(true);
        updateStatus();
        // Try to unmute after a short delay
        setTimeout(async () => {
          try {
            audio.muted = false;
            await audio.play();
            removeUnmuteAction();
          } catch(e3) {
            showUnmuteAction();
          }
        }, 500);
        clearAutoplayRetry();
      } catch(e2) {
        // If both fail, use retry mechanism
        attemptAutoplay();
      }
    }
  }
  
  // Don't start music automatically - wait for user interaction (touch/click)
  // Music will start when user touches or clicks the page (handled by startMusicOnInteraction)

  // show small status text next to button
  const status = document.createElement('span');
  status.id = 'music-status';
  status.style.marginLeft = '8px';
  status.style.fontSize = '0.92rem';
  status.style.color = 'var(--muted)';
  btn.insertAdjacentElement('afterend', status);
  function updateStatus(){
    const s = audio && !audio.paused ? 'Playing' : 'Paused';
    if(useSynth) status.textContent = audio && !audio.paused ? 'Playing (synth)' : 'Paused (synth)';
    else status.textContent = s;
  }

  // Fallback: if audio file fails to load or missing, use WebAudio synth so user hears sound
  let useSynth = false;
  let audioCtx = null, osc = null, gain = null;

  function startSynth(){
    if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(!osc){
      osc = audioCtx.createOscillator();
      gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220;
      gain.gain.value = 0; // start silent
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
    }
    // ramp gain up briefly for a pleasant tone loop
    gain.gain.cancelScheduledValues(audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
  }
  function stopSynth(){ if(gain) gain.gain.linearRampToValueAtTime(0, (audioCtx || window).currentTime + 0.05); }

  // handle audio loading errors
  audio.addEventListener('error', (e)=>{
    console.error('Audio failed to load, enabling synth fallback', e);
    useSynth = true;
    // show helper overlay to prompt user interaction
    showMusicHelper('Audio file not found or failed to load — using built-in tone. Click to enable sound.');
    updateStatus();
  });

  audio.addEventListener('play', ()=>{ updateStatus(); });
  audio.addEventListener('pause', ()=>{ updateStatus(); });
  
  // Audio is ready, but wait for user interaction to start
  // Music will start when user touches or clicks the page

  // expose function to show a small overlay that asks the user to click (for autoplay)
  function showMusicHelper(message){
    let helper = document.getElementById('music-helper');
    if(!helper){
      helper = document.createElement('div'); helper.id = 'music-helper';
      helper.innerHTML = `<div class="music-helper-inner">${message} <button id="music-helper-btn">Enable sound</button></div>`;
      document.body.appendChild(helper);
      document.getElementById('music-helper-btn').addEventListener('click', ()=>{ window.toggleMusic(); helper.remove(); });
    } else { helper.querySelector('.music-helper-inner').innerHTML = `${message} <button id="music-helper-btn">Enable sound</button>`; }
  }

  // if autoplay is blocked, show helper asking for gesture and attempt autoplay when possible
  audio.addEventListener('play', ()=>{ /* playing ok */ });

  // attempt autoplay with muted fallback and periodic retries
  let __autoplayRetry = null;
  async function attemptAutoplay(){
    // Always try to play if music should be on
    if(localStorage.getItem('bgMusic') !== 'on') {
      localStorage.setItem('bgMusic','on');
    }
    // first try unmuted
    try{
      await audio.play(); audio.muted = false; setUI(true); updateStatus(); clearAutoplayRetry(); return;
    } catch(e){
      // try muted autoplay (some browsers allow muted autoplay)
      try{ audio.muted = true; await audio.play(); setUI(true); updateStatus(); showUnmuteAction(); clearAutoplayRetry(); return; } catch(e2){
        // fallback to synth attempt
        useSynth = true;
        try{
          startSynth(); setUI(true); updateStatus(); clearAutoplayRetry(); return;
        } catch(e3){
          // can't start yet — show helper and schedule retries
          showMusicHelper('Click to enable background sound.');
        }
      }
    }

    // schedule retries every 5s until successful or user turns off
    if(__autoplayRetry) return;
    __autoplayRetry = setInterval(async ()=>{
      if(localStorage.getItem('bgMusic') !== 'on'){ clearAutoplayRetry(); return; }
      try{ await audio.play(); audio.muted = false; setUI(true); updateStatus(); clearAutoplayRetry(); removeUnmuteAction(); }
      catch(e){
        try{ audio.muted = true; await audio.play(); setUI(true); updateStatus(); showUnmuteAction(); clearAutoplayRetry(); }
        catch(e2){
          // try synth start
          try{ useSynth = true; startSynth(); setUI(true); updateStatus(); clearAutoplayRetry(); }
          catch(e3){}
        }
      }
    }, 5000);
  }
  function clearAutoplayRetry(){ if(__autoplayRetry){ clearInterval(__autoplayRetry); __autoplayRetry = null; } }

  // show an 'Unmute' button next to the status when playback has started muted
  function showUnmuteAction(){
    removeUnmuteAction();
    const un = document.createElement('button');
    un.id = 'music-unmute';
    un.className = 'music-unmute';
    un.textContent = 'Unmute';
    un.addEventListener('click', async ()=>{
      audio.muted = false;
      try{ await audio.play(); setUI(true); updateStatus(); removeUnmuteAction(); }
      catch(e){ console.error('Unmute failed', e); }
    });
    status.insertAdjacentElement('afterend', un);
  }
  function removeUnmuteAction(){ const ex = document.getElementById('music-unmute'); if(ex) ex.remove(); }

  // expose fallback behavior in toggleMusic
  const originalToggle = window.toggleMusic;
  window.toggleMusic = async function(){
    if(useSynth){
      if(!audioCtx || (gain && gain.gain.value === 0 && (audio.paused || audio.muted || audio.volume === 0))){
        // start synth
        startSynth();
        // set a small repeating pattern to mimic background music (very subtle)
        // create gentle pulsing using interval
        if(!window.__synthInterval){
          window.__synthInterval = setInterval(()=>{ if(gain) { gain.gain.cancelScheduledValues(audioCtx.currentTime); gain.gain.setValueAtTime(0.02, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.6); gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 1.6); } }, 1200);
        }
        setUI(true); localStorage.setItem('bgMusic','on'); updateStatus(); clearAutoplayRetry();
      } else {
        stopSynth(); if(window.__synthInterval){ clearInterval(window.__synthInterval); window.__synthInterval = null; } setUI(false); localStorage.setItem('bgMusic','off'); updateStatus(); clearAutoplayRetry();
      }
    } else {
      // normal audio file
      await originalToggle();
      updateStatus(); if(!audio.paused) clearAutoplayRetry();
    }
  };

  // Visibility change: keep music playing continuously
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      // Optionally pause when tab is hidden (or keep playing - your choice)
      // For continuous play, we'll keep it playing even when hidden
    } else {
      // Resume music when tab becomes visible if it was playing
      if(localStorage.getItem('bgMusic') === 'on' && audio.paused && !useSynth){
        audio.play().catch(()=>{});
      } else if(localStorage.getItem('bgMusic') === 'on' && useSynth && (!gain || gain.gain.value === 0)){
        startSynth();
      }
    }
  });

})();

})();