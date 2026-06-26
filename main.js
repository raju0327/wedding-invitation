// --- Google Sheets Configuration ---
// Paste your Google Apps Script Web App URL below (e.g. "https://script.google.com/macros/s/AKfycb.../exec")
// If left blank, the website will automatically use browser LocalStorage for demonstration.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLo97TVmDtJ2f1H3QehtKmu4ai0NlqkTiJr20g4UJYOtZ2Aqgb_qKDMaB5z0pDVoU/exec";

// --- Custom Ambient Audio Synthesizer (Web Audio API) ---
// Plays a soft, romantic arpeggio progression to simulate background music.
class AmbientSynth {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timerId = null;
    this.currentChordIdx = 0;
    this.delayNode = null;
    this.filterNode = null;

    // Chord progression (Root, third, fifth, seventh, octaves)
    this.chords = [
      [130.81, 164.81, 196.00, 246.94, 261.63, 329.63], // Cmaj7
      [110.00, 130.81, 164.81, 220.00, 261.63, 329.63], // Am7
      [87.31, 130.81, 174.61, 220.00, 261.63, 349.23],  // Fmaj7
      [98.00, 146.83, 196.00, 246.94, 293.66, 392.00]   // G7
    ];
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Set up low pass filter for soft tone
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);

    // Set up delay/echo effect for spacey/romantic vibe
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.4, this.ctx.currentTime);

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // Connect delay circuit
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Connect routing: Synth -> Filter -> Destination
    // Connect output to Delay too
    this.filterNode.connect(this.ctx.destination);
    this.filterNode.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.ctx.destination);
  }

  playNote(frequency, startTime, duration) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Soft volume envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.06, startTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.filterNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playArpeggio() {
    if (!this.isPlaying) return;

    const now = this.ctx.currentTime;
    const chord = this.chords[this.currentChordIdx];
    const noteTimeSpacing = 0.25;

    const notesToPlay = [...chord, chord[4], chord[3], chord[2], chord[1]];

    notesToPlay.forEach((freq, idx) => {
      this.playNote(freq, now + (idx * noteTimeSpacing), 1.8);
    });

    const totalChordDuration = notesToPlay.length * noteTimeSpacing;
    this.currentChordIdx = (this.currentChordIdx + 1) % this.chords.length;

    this.timerId = setTimeout(() => this.playArpeggio(), totalChordDuration * 1000);
  }

  start() {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.playArpeggio();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

// --- Initialize Components ---
document.addEventListener('DOMContentLoaded', () => {

  // --- Floating Gold Particles Engine ---
  function initGoldParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    const maxParticles = 90;

    // Track mouse / touch position relative to the viewport
    const mouse = { x: -1000, y: -1000 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial = false) {
        this.x = Math.random() * canvas.width;
        this.y = isInitial ? Math.random() * canvas.height : canvas.height + Math.random() * 30;

        // 40% golden hearts, 60% standard gold dust particles
        this.type = Math.random() < 0.4 ? 'heart' : 'dust';

        if (this.type === 'heart') {
          this.size = Math.random() * 8 + 6; // Volumetric size (6px to 14px)
          this.speedY = -(Math.random() * 0.45 + 0.2); // Slow upward float
          this.speedX = Math.random() * 0.4 - 0.2;
        } else {
          this.size = Math.random() * 2.2 + 0.8; // fine dust (0.8px to 3.0px)
          this.speedY = -(Math.random() * 0.35 + 0.15);
          this.speedX = Math.random() * 0.2 - 0.1;
        }

        this.vx = this.speedX;
        this.vy = this.speedY;

        this.baseOpacity = this.type === 'heart'
          ? (this.size / 14.0) * 0.35 + 0.15  // 0.15 to 0.5 opacity for hearts
          : (this.size / 3.0) * 0.4 + 0.1;    // 0.10 to 0.5 opacity for dust
        this.opacity = this.baseOpacity;

        this.flickerSpeed = Math.random() * 0.015 + 0.005;
        this.flickerAngle = Math.random() * Math.PI * 2;
        this.swaySpeed = Math.random() * 0.01 + 0.005;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.swayRange = this.type === 'heart' ? Math.random() * 0.6 + 0.25 : Math.random() * 0.4 + 0.1;

        const colors = [
          'rgba(203, 163, 49, ',  // Champagne gold
          'rgba(235, 213, 148, ', // Soft gold
          'rgba(242, 222, 172, ', // Cream gold
          'rgba(252, 239, 161, '  // Shimmering white gold
        ];
        this.colorPrefix = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Calculate distance from cursor
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Escape / evasion radius
        const minDistance = this.type === 'heart' ? 120 : 70;

        if (distance < minDistance) {
          // Push vector away from cursor
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;

          // Evasion force is stronger when closer
          const maxForce = this.type === 'heart' ? 8.0 : 4.0;
          const force = (minDistance - distance) / minDistance;

          const targetSpeedX = forceDirectionX * force * maxForce;
          const targetSpeedY = forceDirectionY * force * maxForce;

          // Steer towards target escape velocity
          this.vx += (targetSpeedX - this.vx) * 0.18;
          this.vy += (targetSpeedY - this.vy) * 0.18;
        } else {
          // Sway movement added to base speed
          this.swayAngle += this.swaySpeed;
          const baseSway = Math.sin(this.swayAngle) * this.swayRange;

          // Smooth return to default float speed + sway
          this.vx += (this.speedX + baseSway - this.vx) * 0.06;
          this.vy += (this.speedY - this.vy) * 0.06;
        }

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Shimmering opacity
        this.flickerAngle += this.flickerSpeed;
        this.opacity = this.baseOpacity * (0.8 + Math.sin(this.flickerAngle) * 0.35);

        // Respawn when drifted past upper or side boundaries
        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset(false);
        }
      }

      draw() {
        ctx.fillStyle = this.colorPrefix + this.opacity + ')';

        if (this.type === 'heart') {
          // Draw symmetric heart path using bezier curves
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.size);
          // Left curve
          ctx.bezierCurveTo(
            this.x - this.size, this.y + this.size * 0.2,
            this.x - this.size * 0.7, this.y - this.size * 0.6,
            this.x, this.y - this.size * 0.15
          );
          // Right curve
          ctx.bezierCurveTo(
            this.x + this.size * 0.7, this.y - this.size * 0.6,
            this.x + this.size, this.y + this.size * 0.2,
            this.x, this.y + this.size
          );
          ctx.closePath();
          ctx.fill();

          // Outer glowing halo
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.size * 1.3);
          ctx.bezierCurveTo(
            this.x - this.size * 1.3, this.y + this.size * 0.26,
            this.x - this.size * 0.91, this.y - this.size * 0.78,
            this.x, this.y - this.size * 0.195
          );
          ctx.bezierCurveTo(
            this.x + this.size * 0.91, this.y - this.size * 0.78,
            this.x + this.size * 1.3, this.y + this.size * 0.26,
            this.x, this.y + this.size * 1.3
          );
          ctx.closePath();
          ctx.fillStyle = this.colorPrefix + (this.opacity * 0.15) + ')';
          ctx.fill();
        } else {
          // Draw standard dust particle
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = this.colorPrefix + (this.opacity * 0.25) + ')';
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle(true));
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Launch particle engine immediately
  try {
    initGoldParticles();
  } catch (err) {
    console.error('Failed to initialize gold particles engine:', err);
  }

  // 0. Cover Invitation Open Animation
  const invitationCover = document.getElementById('invitation-cover');
  const openInvitationBtn = document.getElementById('open-invitation-btn');
  const musicToggle = document.getElementById('music-toggle');
  const navbar = document.querySelector('.navbar');
  const ambientSynth = new AmbientSynth();

  openInvitationBtn.addEventListener('click', () => {
    // Add opened class to cover overlay to trigger split animations
    invitationCover.classList.add('opened');

    // Remove no-scroll from body to allow scroll
    document.body.classList.remove('no-scroll');

    // Show navigation bar
    navbar.classList.remove('hidden');
    navbar.classList.add('visible');



    // Play the ambient synthesizer background music automatically on user interaction
    ambientSynth.start();
    musicToggle.classList.add('playing');

    // Remove cover overlay from display after animations finish (1.8 seconds)
    setTimeout(() => {
      invitationCover.style.display = 'none';
    }, 1800);
  });

  // 1. Audio Control Setup
  musicToggle.addEventListener('click', () => {
    if (ambientSynth.isPlaying) {
      ambientSynth.stop();
      musicToggle.classList.remove('playing');
    } else {
      ambientSynth.start();
      musicToggle.classList.add('playing');
    }
  });

  // --- SPA Hash Router ---
  const pages = document.querySelectorAll('.page-view');
  const navLinks = document.querySelectorAll('.nav-link');

  function handleRoute() {
    const hash = window.location.hash || '#home';

    // Deactivate all page views and nav links
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    // Activate target page
    const activePage = document.querySelector(hash);
    if (activePage) {
      activePage.classList.add('active');
    } else {
      // Fallback
      document.getElementById('home').classList.add('active');
    }

    // Set active link highlight
    const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    } else {
      document.querySelector('.nav-link[href="#home"]').classList.add('active');
    }

    // Scroll view to top on navigate
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', handleRoute);
  // Trigger initial route
  if (window.location.hash) {
    handleRoute();
  }

  // Helper to convert Chennai, India (IST, UTC+5:30) date to global UTC timestamp
  function getISTTimestamp(year, monthIndex, day, hour, minute) {
    const utcTime = Date.UTC(year, monthIndex, day, hour, minute, 0);
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
    return utcTime - istOffset;
  }

  // 2. Countdown Timer Logic
  const timerDisplay = document.getElementById('countdown-timer-display');
  const messageDisplay = document.getElementById('countdown-message');

  // August is month index 7 (0-indexed)
  let countdownDate = getISTTimestamp(2026, 7, 23, 18, 30);

  function updateCountdown() {
    if (!timerDisplay || !messageDisplay) return;

    const now = new Date().getTime();
    const timeDifference = countdownDate - now;

    if (timeDifference <= 0) {
      timerDisplay.classList.add('hidden');
      messageDisplay.classList.remove('hidden');
      return;
    }

    timerDisplay.classList.remove('hidden');
    messageDisplay.classList.add('hidden');

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  let countdownInterval = setInterval(updateCountdown, 1000);

  // Home Page Hero Switcher Logic
  const heroTabs = document.querySelectorAll('.hero-tab');
  const heroDate = document.getElementById('hero-date');
  const heroVenue = document.getElementById('hero-venue');

  heroTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      heroTabs.forEach(t => t.classList.remove('active'));
      const activeTab = e.currentTarget;
      activeTab.classList.add('active');

      const countdownType = activeTab.getAttribute('data-countdown-type');

      if (countdownType === 'engagement') {
        countdownDate = getISTTimestamp(2026, 7, 23, 18, 30);
        heroDate.textContent = 'August 23, 2026';
        heroVenue.textContent = 'Sri Om Chairma Thirumana Mandabam • Chennai, India';
      } else if (countdownType === 'wedding') {
        countdownDate = getISTTimestamp(2026, 9, 25, 7, 30);
        heroDate.textContent = 'October 25, 2026';
        heroVenue.textContent = 'Pothi Mahal • Gummidipoondi, Tamilnadu';
        
        if (isWeddingLocked()) {
          const wrapper = document.getElementById('hero-details-lock-wrapper');
          if (wrapper) triggerShake(wrapper);
        } else {
          triggerConfetti();
        }
      }

      // Reset interval to prevent stutter and trigger immediate update
      clearInterval(countdownInterval);
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);

      updateLockUI();
    });
  });

  // 3. Scroll Reveal Animations (for timeline items and local triggers)
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // 3.5 Event Details Filter Logic
  const eventTabs = document.querySelectorAll('.event-tab');
  const eventCards = document.querySelectorAll('.events-grid .event-card');

  function filterEvents(category) {
    eventCards.forEach(card => {
      const cardCat = card.getAttribute('data-event-category');
      if (cardCat === category) {
        card.classList.remove('hidden');
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        // Small timeout to allow browser to register display:block before transitioning
        setTimeout(() => {
          card.style.transition = 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 50);
      } else {
        card.classList.add('hidden');
      }
    });
  }

  // Initial event filter loading (Engagement by default)
  filterEvents('engagement');

  eventTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      eventTabs.forEach(t => t.classList.remove('active'));
      const activeTab = e.currentTarget;
      activeTab.classList.add('active');
      const category = activeTab.getAttribute('data-event-filter');
      filterEvents(category);

      if (category === 'wedding') {
        if (isWeddingLocked()) {
          const reception = document.getElementById('reception-card');
          const mugurtham = document.getElementById('mugurtham-card');
          if (reception) triggerShake(reception);
          if (mugurtham) triggerShake(mugurtham);
        } else {
          triggerConfetti();
        }
      }
    });
  });

  // 4. Gallery Category Filter Logic
  const galleryTabs = document.querySelectorAll('.gallery-tab');
  const galleryItems = document.querySelectorAll('.gallery-item');
  let activeCategory = 'all';

  galleryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      galleryTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      activeCategory = e.target.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (activeCategory === 'all' || itemCat === activeCategory) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });

      // Update indices for Lightbox
      reindexVisibleImages();
    });
  });

  // 5. Photo Gallery Lightbox Modal
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  let currentImgIndex = 0;
  let visibleImagesData = []; // Populated dynamically based on category filtering

  function reindexVisibleImages() {
    visibleImagesData = [];
    let count = 0;
    galleryItems.forEach(item => {
      if (!item.classList.contains('hidden')) {
        const img = item.querySelector('.gallery-img');
        // Store reference back to DOM item index
        visibleImagesData.push({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt'),
          originalElement: img
        });
        img.setAttribute('data-visible-index', count);
        count++;
      } else {
        item.querySelector('.gallery-img').removeAttribute('data-visible-index');
      }
    });
  }

  // Initial index setup
  reindexVisibleImages();

  function openLightbox(index) {
    currentImgIndex = index;
    lightboxImg.src = visibleImagesData[index].src;
    lightboxCaption.textContent = visibleImagesData[index].alt;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    if (!document.body.classList.contains('no-scroll')) {
      document.body.style.overflow = 'auto';
    }
  }

  function showNextImage() {
    if (visibleImagesData.length <= 1) return;
    currentImgIndex = (currentImgIndex + 1) % visibleImagesData.length;
    lightboxImg.src = visibleImagesData[currentImgIndex].src;
    lightboxCaption.textContent = visibleImagesData[currentImgIndex].alt;
  }

  function showPrevImage() {
    if (visibleImagesData.length <= 1) return;
    currentImgIndex = (currentImgIndex - 1 + visibleImagesData.length) % visibleImagesData.length;
    lightboxImg.src = visibleImagesData[currentImgIndex].src;
    lightboxCaption.textContent = visibleImagesData[currentImgIndex].alt;
  }

  // Open lightbox on image clicks (filtering active index)
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('.gallery-img');
      const index = parseInt(img.getAttribute('data-visible-index'));
      if (!isNaN(index)) {
        openLightbox(index);
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  nextBtn.addEventListener('click', showNextImage);
  prevBtn.addEventListener('click', showPrevImage);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'block') {
      if (e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowLeft') showPrevImage();
      if (e.key === 'Escape') closeLightbox();
    }
  });

  // --- Guestbook Wall Integration ---
  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookWall = document.getElementById('guestbook-wall');

  // Render wishes on the guestbook wall
  function renderGuestbook() {
    // Read local custom messages first as a fallback/immediate load
    const localMessages = JSON.parse(localStorage.getItem('wedding_wishes')) || [];

    // Clear wall and show loaded items
    function displayWishes(customWishes) {
      guestbookWall.innerHTML = '';

      customWishes.forEach((w, idx) => {
        const note = document.createElement('div');
        const colorTheme = idx % 2 === 0 ? 'note-emerald' : 'note-gold';
        note.className = `guestbook-note glass-card ${colorTheme}`;

        note.innerHTML = `
          <div class="note-inner-frame">
            <div class="note-quote-icon top-quote"><i class="fa-solid fa-quote-left"></i></div>
            <p class="note-message">${w.wishes}</p>
            <div class="note-quote-icon bottom-quote"><i class="fa-solid fa-quote-right"></i></div>
            <p class="note-author">— ${w.name}</p>
          </div>
        `;
        guestbookWall.appendChild(note);
      });
    }

    // Display local wishes immediately
    displayWishes(localMessages);

    // If Google Sheet is configured, fetch global wishes
    if (GOOGLE_SCRIPT_URL) {
      const fetchUrl = GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
      fetch(fetchUrl)
        .then(response => {
          if (!response.ok) throw new Error('Network error');
          return response.json();
        })
        .then(globalWishes => {
          if (Array.isArray(globalWishes)) {
            // Save a copy locally as cache
            localStorage.setItem('wedding_wishes_cache', JSON.stringify(globalWishes));
            displayWishes(globalWishes);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch from Google Sheets, using cache:', err);
          const cached = JSON.parse(localStorage.getItem('wedding_wishes_cache')) || localMessages;
          displayWishes(cached);
        });
    }
  }

  // Initial load of guestbook
  renderGuestbook();

  // --- Time-Lock Security System Logic ---
  const UNLOCK_TIME = getISTTimestamp(2026, 7, 23, 20, 0); // August 23, 2026, 8:00 PM IST

  function isWeddingLocked() {
    const override = localStorage.getItem('wedding_details_locked');
    if (override === 'false') return false;
    if (override === 'true') return true;
    if (window.location.search.includes('bypass-lock')) return false;
    return Date.now() < UNLOCK_TIME;
  }

  function isFooterLocked() {
    const override = localStorage.getItem('footer_memories_locked');
    if (override === 'false') return false;
    if (override === 'true') return true;
    return Date.now() < UNLOCK_TIME;
  }

  function triggerShake(element) {
    if (!element) return;
    element.classList.remove('shake-element');
    void element.offsetWidth; // Force reflow
    element.classList.add('shake-element');
    setTimeout(() => {
      element.classList.remove('shake-element');
    }, 600);
  }

  function updateLockUI() {
    const weddingLocked = isWeddingLocked();
    const footerLocked = isFooterLocked();
    
    const heroDetailsContent = document.getElementById('hero-details-content');
    const heroLockOverlay = document.getElementById('hero-lock-overlay');
    const receptionCard = document.getElementById('reception-card');
    const mugurthamCard = document.getElementById('mugurtham-card');
    
    const countdownLockContent = document.getElementById('countdown-lock-content');
    const countdownLockOverlay = document.getElementById('countdown-lock-overlay');
    const galleryLockCard = document.getElementById('gallery-lock-card');

    // Update footer toggle control states (Locked / Unlocked)
    const footerLockControl = document.getElementById('footer-lock-control');
    const footerLockToggle = document.getElementById('footer-lock-toggle');
    const footerLockStatusText = document.getElementById('footer-lock-status-text');

    const bothUnlocked = !weddingLocked && !footerLocked;

    if (footerLockToggle) {
      footerLockToggle.checked = bothUnlocked;
    }
    if (footerLockControl) {
      if (bothUnlocked) {
        footerLockControl.classList.remove('locked');
        footerLockControl.classList.add('unlocked');
        if (footerLockStatusText) footerLockStatusText.textContent = "UNLOCKED";
      } else {
        footerLockControl.classList.remove('unlocked');
        footerLockControl.classList.add('locked');
        if (footerLockStatusText) footerLockStatusText.textContent = "LOCKED";
      }
    }

    // Update Hero date/venue display
    const activeHeroTab = document.querySelector('.hero-tab.active');
    const isWeddingTab = activeHeroTab && activeHeroTab.getAttribute('data-countdown-type') === 'wedding';
    const heroDetailsLockWrapper = document.getElementById('hero-details-lock-wrapper');

    if (isWeddingTab && weddingLocked) {
      if (heroDetailsLockWrapper) heroDetailsLockWrapper.classList.add('is-locked');
      if (heroDetailsContent) heroDetailsContent.classList.add('blur-details');
      if (heroLockOverlay) heroLockOverlay.classList.remove('hidden-fade');
    } else {
      if (heroDetailsLockWrapper) heroDetailsLockWrapper.classList.remove('is-locked');
      if (heroDetailsContent) heroDetailsContent.classList.remove('blur-details');
      if (heroLockOverlay) heroLockOverlay.classList.add('hidden-fade');
    }

    // Update Countdown display
    const countdownLockWrapper = document.getElementById('countdown-lock-wrapper');
    if (isWeddingTab && weddingLocked) {
      if (countdownLockWrapper) countdownLockWrapper.classList.add('is-locked');
      if (countdownLockContent) countdownLockContent.classList.add('blur-details');
      if (countdownLockOverlay) countdownLockOverlay.classList.remove('hidden-fade');
    } else {
      if (countdownLockWrapper) countdownLockWrapper.classList.remove('is-locked');
      if (countdownLockContent) countdownLockContent.classList.remove('blur-details');
      if (countdownLockOverlay) countdownLockOverlay.classList.add('hidden-fade');
    }

    // Update Event cards
    [receptionCard, mugurthamCard].forEach(card => {
      if (card) {
        const content = card.querySelector('.lockable-content');
        const overlay = card.querySelector('.lock-overlay');
        
        if (weddingLocked) {
          card.classList.add('is-locked');
          if (content) content.classList.add('blur-details');
          if (overlay) overlay.classList.remove('hidden-fade');
        } else {
          card.classList.remove('is-locked');
          if (content) content.classList.remove('blur-details');
          if (overlay) overlay.classList.add('hidden-fade');
        }
      }
    });

    // Update Gallery lock card
    if (galleryLockCard) {
      const content = galleryLockCard.querySelector('.lockable-content');
      const overlay = galleryLockCard.querySelector('.lock-overlay');
      
      if (footerLocked) {
        galleryLockCard.classList.add('is-locked');
        if (content) content.classList.add('blur-details');
        if (overlay) overlay.classList.remove('hidden-fade');
      } else {
        galleryLockCard.classList.remove('is-locked');
        if (content) content.classList.remove('blur-details');
        if (overlay) overlay.classList.add('hidden-fade');
      }
    }

    // Update toggle switches in password modal
    const toggleWeddingInput = document.getElementById('toggle-wedding-details');
    const toggleFooterInput = document.getElementById('toggle-footer-memories');
    if (toggleWeddingInput) toggleWeddingInput.checked = !weddingLocked;
    if (toggleFooterInput) toggleFooterInput.checked = !footerLocked;
  }

  // Set click handlers on overlays to trigger shake
  const heroLockOverlay = document.getElementById('hero-lock-overlay');
  if (heroLockOverlay) {
    heroLockOverlay.addEventListener('click', () => {
      const wrapper = document.getElementById('hero-details-lock-wrapper');
      if (wrapper) triggerShake(wrapper);
    });
  }

  const countdownLockOverlay = document.getElementById('countdown-lock-overlay');
  if (countdownLockOverlay) {
    countdownLockOverlay.addEventListener('click', () => {
      const wrapper = document.getElementById('countdown-lock-wrapper');
      if (wrapper) triggerShake(wrapper);
    });
  }

  const receptionCard = document.getElementById('reception-card');
  const mugurthamCard = document.getElementById('mugurtham-card');
  [receptionCard, mugurthamCard].forEach(card => {
    if (card) {
      const overlay = card.querySelector('.lock-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          triggerShake(card);
        });
      }
    }
  });

  const galleryLockCard = document.getElementById('gallery-lock-card');
  if (galleryLockCard) {
    const overlay = galleryLockCard.querySelector('.lock-overlay');
    const lockTooltip = document.getElementById('lock-tooltip');
    let tooltipTimeout = null;

    if (overlay) {
      overlay.addEventListener('click', () => {
        if (isFooterLocked()) {
          triggerShake(galleryLockCard);
          if (lockTooltip) {
            lockTooltip.classList.remove('hidden');
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
              lockTooltip.classList.add('hidden');
            }, 2000);
          }
        }
      });
    }
  }

  // Address details navigation button click handler
  const heroAddressBtn = document.getElementById('hero-address-btn');
  if (heroAddressBtn) {
    heroAddressBtn.addEventListener('click', () => {
      const activeHeroTab = document.querySelector('.hero-tab.active');
      const countdownType = activeHeroTab ? activeHeroTab.getAttribute('data-countdown-type') : 'engagement';
      
      // Navigate to Events Page
      window.location.hash = '#events';
      
      // Click corresponding events category tab
      const filterTab = document.querySelector(`.event-tab[data-event-filter="${countdownType}"]`);
      if (filterTab) {
        filterTab.click();
      }
    });
  }

  // Run initial lock state setup
  updateLockUI();

  // --- Admin Lock Settings Modal Logic ---
  const footerLockToggle = document.getElementById('footer-lock-toggle');
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('admin-password-input');
  const passwordCancelBtn = document.getElementById('password-cancel-btn');
  const passwordSubmitBtn = document.getElementById('password-submit-btn');
  const passwordErrorMsg = document.getElementById('password-error-msg');
  
  const authView = document.getElementById('password-modal-auth-view');
  const controlsView = document.getElementById('password-modal-controls-view');
  const adminCloseBtn = document.getElementById('admin-close-btn');
  const toggleWeddingInput = document.getElementById('toggle-wedding-details');
  const toggleFooterInput = document.getElementById('toggle-footer-memories');

  if (footerLockToggle && passwordModal) {
    footerLockToggle.addEventListener('click', (e) => {
      const weddingLocked = isWeddingLocked();
      const footerLocked = isFooterLocked();
      const bothUnlocked = !weddingLocked && !footerLocked;

      if (bothUnlocked) {
        // Unlocked -> Locked: Lock everything immediately, no passcode needed!
        localStorage.setItem('wedding_details_locked', 'true');
        localStorage.setItem('footer_memories_locked', 'true');
        updateLockUI();
      } else {
        // Locked -> Unlocked: Prevent default visual toggle, ask for password
        e.preventDefault();
        passwordModal.classList.remove('hidden');
        if (authView) authView.classList.remove('hidden');
        if (controlsView) controlsView.classList.add('hidden');
        passwordInput.value = '';
        passwordInput.focus();
        passwordErrorMsg.classList.add('hidden');
      }
    });

    passwordCancelBtn.addEventListener('click', () => {
      passwordModal.classList.add('hidden');
    });

    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        passwordModal.classList.add('hidden');
      }
    });

    function handleAdminPasswordSubmit() {
      const password = passwordInput.value;
      if (password === 'VS2026') {
        if (authView) authView.classList.add('hidden');
        if (controlsView) controlsView.classList.remove('hidden');
        
        // Initial toggles state setup
        if (toggleWeddingInput) toggleWeddingInput.checked = !isWeddingLocked();
        if (toggleFooterInput) toggleFooterInput.checked = !isFooterLocked();
      } else {
        passwordErrorMsg.classList.remove('hidden');
        const modalCard = passwordModal.querySelector('.password-modal-card');
        if (modalCard) triggerShake(modalCard);
      }
    }

    passwordSubmitBtn.addEventListener('click', handleAdminPasswordSubmit);
    
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAdminPasswordSubmit();
      }
    });

    // Toggle password visibility handler
    const togglePasswordBtn = document.getElementById('toggle-password-visibility');
    if (togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePasswordBtn.querySelector('i');
        if (icon) {
          if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        }
      });
    }

    // Toggle switch listeners
    if (toggleWeddingInput) {
      toggleWeddingInput.addEventListener('change', (e) => {
        const unlocked = e.target.checked;
        localStorage.setItem('wedding_details_locked', unlocked ? 'false' : 'true');
        updateLockUI();
        if (unlocked) {
          triggerConfetti();
        }
      });
    }

    if (toggleFooterInput) {
      toggleFooterInput.addEventListener('change', (e) => {
        const unlocked = e.target.checked;
        localStorage.setItem('footer_memories_locked', unlocked ? 'false' : 'true');
        updateLockUI();
        if (unlocked) {
          triggerConfetti();
        }
      });
    }

    if (adminCloseBtn) {
      adminCloseBtn.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
      });
    }
  }

  // --- Paper Confetti Popup Celebration Engine ---
  function triggerConfetti() {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffe066', '#cba331', '#123e32', '#3b5c51', '#ebd594', '#ff4d4d', '#4d94ff'];
    let confetti = [];

    class ConfettiPiece {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.size = Math.random() * 8 + 5;
        this.speedX = Math.random() * 10 - 5;
        this.speedY = -(Math.random() * 15 + 10);
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.gravity = 0.4;
      }

      update() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
        ctx.restore();
      }
    }

    for (let i = 0; i < 100; i++) {
      confetti.push(new ConfettiPiece());
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti = confetti.filter(p => p.y < canvas.height + 50 && p.x > -50 && p.x < canvas.width + 50);

      confetti.forEach(p => {
        p.update();
        p.draw();
      });

      if (confetti.length > 0 || Date.now() < animationEnd) {
        if (Date.now() < animationEnd && confetti.length < 70) {
          confetti.push(new ConfettiPiece());
        }
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }

    frame();
  }

  // Handle Guestbook Form Submit (Posting directly from wall)
  guestbookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('gb-name').value;
    const wishes = document.getElementById('gb-message').value;
    const timestamp = new Date().toISOString();

    const wishData = {
      type: 'wish',
      name,
      wishes,
      timestamp
    };

    const submitBtn = guestbookForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;

    function completeWishSubmission() {
      // Save locally
      const customMessages = JSON.parse(localStorage.getItem('wedding_wishes')) || [];
      customMessages.push({ name, wishes, timestamp });
      localStorage.setItem('wedding_wishes', JSON.stringify(customMessages));

      // Clear inputs
      document.getElementById('gb-name').value = '';
      document.getElementById('gb-message').value = '';

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      // Render and scroll to wall
      renderGuestbook();

      const wallHeader = document.querySelector('.wall-title');
      wallHeader.scrollIntoView({ behavior: 'smooth' });
    }

    if (GOOGLE_SCRIPT_URL) {
      // Post to Google Sheets
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wishData)
      })
        .then(() => {
          // Wait 1 second for propagation, then refresh
          setTimeout(() => {
            completeWishSubmission();
          }, 1000);
        })
        .catch(err => {
          console.error('Google Sheets wish failed, saving locally:', err);
          completeWishSubmission();
        });
    } else {
      completeWishSubmission();
    }
  });



});
