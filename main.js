// --- Google Sheets Configuration ---
// Paste your Google Apps Script Web App URL below (e.g. "https://script.google.com/macros/s/AKfycb.../exec")
// If left blank, the website will automatically use browser LocalStorage for demonstration.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRCoHXiK26Nd_cDXtnpZJgCW-bi2eXOq_-YThA1PS-d9rupVrVv932C0gAKc6sAtIg/exec";

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

  // 2. Countdown Timer Logic
  const timerDisplay = document.getElementById('countdown-timer-display');
  const messageDisplay = document.getElementById('countdown-message');

  // Cross-browser numeric date constructors: new Date(year, monthIndex, day, hour, minute, second)
  // August is month index 7 (0-indexed)
  let countdownDate = new Date(2026, 7, 23, 18, 30, 0).getTime();

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
        countdownDate = new Date(2026, 7, 23, 18, 30, 0).getTime();
        heroDate.textContent = 'August 23, 2026';
        heroVenue.textContent = 'Sri Om Chairma Thirumana Mandabam • Chennai, India';
      } else if (countdownType === 'wedding') {
        countdownDate = new Date(2026, 9, 25, 7, 30, 0).getTime();
        heroDate.textContent = 'October 25, 2026';
        heroVenue.textContent = 'Pothi Mahal • Gummidipoondi, Tamilnadu';
      }

      // Reset interval to prevent stutter and trigger immediate update
      clearInterval(countdownInterval);
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
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

  // --- RSVP & Guestbook Wall Integration ---
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpDetails = document.getElementById('rsvp-details');
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  const submitBtn = document.getElementById('rsvp-submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const rsvpSuccessMsg = document.getElementById('rsvp-success');
  const successFeedbackText = document.getElementById('success-feedback-text');
  const editBtn = document.getElementById('rsvp-edit-btn');

  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookWall = document.getElementById('guestbook-wall');

  // Toggle RSVP details
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'decline') {
        rsvpDetails.style.maxHeight = '0px';
        rsvpDetails.style.opacity = '0';
        rsvpDetails.style.overflow = 'hidden';
        rsvpDetails.style.transition = 'all 0.5s ease';
      } else {
        rsvpDetails.style.maxHeight = '500px';
        rsvpDetails.style.opacity = '1';
        rsvpDetails.style.transition = 'all 0.5s ease';
      }
    });
  });

  // Default wishes to pre-populate wall
  const defaultWishes = [
    { name: "Vijay & Radhika (Uncle & Aunt)", wishes: "May your marriage be blessed with deep understanding, endless joy, and love. So thrilled for you both!", timestamp: "2026-06-20T10:15:00.000Z" },
    { name: "Rahul (Best Friend)", wishes: "Congratulations Vedha Kishore & SeethaLakshmi! Looking forward to the epic reception on August 24th! Let's party!", timestamp: "2026-06-21T02:30:00.000Z" },
    { name: "Meera Raj (Sister)", wishes: "Welcome to the family Seetha! Wishing you both a beautiful lifetime journey filled with love and laughter.", timestamp: "2026-06-21T06:45:00.000Z" }
  ];

  // Render wishes on the guestbook wall
  function renderGuestbook() {
    // Read local custom messages first as a fallback/immediate load
    const localMessages = JSON.parse(localStorage.getItem('wedding_wishes')) || [];

    // Clear wall and show loaded items
    function displayWishes(customWishes) {
      const allWishes = [...defaultWishes, ...customWishes];
      guestbookWall.innerHTML = '';

      allWishes.forEach((w, idx) => {
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
      fetch(GOOGLE_SCRIPT_URL)
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

  // Load RSVP state if exists
  const savedRSVP = localStorage.getItem('wedding_rsvp');
  if (savedRSVP) {
    const data = JSON.parse(savedRSVP);
    showSuccessState(data);
  }

  function showSuccessState(data) {
    rsvpForm.classList.add('hidden');
    rsvpSuccessMsg.classList.remove('hidden');

    if (data.attendance === 'accept') {
      successFeedbackText.textContent = `We are thrilled that you are joining us! We have registered ${data.guests} attendee(s) under your name. See you at the celebrations!`;
    } else {
      successFeedbackText.textContent = "We are sorry you won't be able to make it, but we appreciate you letting us know. Warm wishes!";
    }
  }

  // Handle RSVP Submit
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    btnText.textContent = 'Submitting...';
    btnLoader.classList.remove('hidden');
    submitBtn.disabled = true;

    const name = document.getElementById('guest-name').value;
    const mobile = document.getElementById('guest-mobile').value;
    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guests = document.getElementById('guest-count').value;
    const relation = document.getElementById('guest-relation').value;
    const wishes = document.getElementById('wishes').value;

    const rsvpData = {
      type: 'rsvp',
      name,
      mobile,
      attendance,
      guests: attendance === 'decline' ? '0' : guests,
      relation,
      wishes,
      timestamp: new Date().toISOString()
    };

    function completeRSVPSubmission() {
      // Save RSVP details locally
      localStorage.setItem('wedding_rsvp', JSON.stringify(rsvpData));

      // Save custom wish locally as well (if present)
      if (wishes.trim().length > 0) {
        const customMessages = JSON.parse(localStorage.getItem('wedding_wishes')) || [];
        if (!customMessages.some(m => m.wishes === wishes && m.name === name)) {
          customMessages.push({ name, wishes, timestamp: rsvpData.timestamp });
          localStorage.setItem('wedding_wishes', JSON.stringify(customMessages));
        }
      }

      btnText.textContent = 'Send RSVP';
      btnLoader.classList.add('hidden');
      submitBtn.disabled = false;

      showSuccessState(rsvpData);
    }

    if (GOOGLE_SCRIPT_URL) {
      // Post to Google Sheets
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData)
      })
        .then(() => {
          completeRSVPSubmission();
        })
        .catch(err => {
          console.error('Google Sheets RSVP failed, saving locally:', err);
          completeRSVPSubmission();
        });
    } else {
      // Simulate delay for feel, then save locally
      setTimeout(() => {
        completeRSVPSubmission();
      }, 1500);
    }
  });

  // Edit RSVP Handler
  editBtn.addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('wedding_rsvp'));
    if (data) {
      document.getElementById('guest-name').value = data.name;
      document.getElementById('guest-mobile').value = data.mobile || '';
      document.querySelector(`input[name="attendance"][value="${data.attendance}"]`).checked = true;
      document.getElementById('guest-count').value = data.guests || '1';
      document.getElementById('guest-relation').value = data.relation || '';
      document.getElementById('wishes').value = data.wishes || '';

      const activeRadio = document.querySelector('input[name="attendance"]:checked');
      activeRadio.dispatchEvent(new Event('change'));
    }

    rsvpSuccessMsg.classList.add('hidden');
    rsvpForm.classList.remove('hidden');
  });

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
