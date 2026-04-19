// ===== PREMIUM PORTFOLIO ANIMATIONS =====
// Using GSAP, ScrollTrigger, and Lenis for award-level animations

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof gsap === 'undefined') {
  console.info('Advanced animations skipped.');
} else {
// Register ScrollTrigger plugin
if (typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ===== SMOOTH SCROLL (Lenis) =====
function initSmoothScroll() {
  try {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    console.warn('Lenis smooth scroll not available');
  }
}

// ===== HERO TEXT STAGGER ANIMATION (PREMIUM) =====
function initHeroTextAnimation() {
  // Subtitle
  const subtitle = document.querySelector('.home__subtitle');
  if (subtitle) {
    gsap.fromTo(
      subtitle,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.1,
      }
    );
  }

  // Headline - word by word stagger
  const headlineWords = document.querySelectorAll('.headline-word');
  if (headlineWords.length > 0) {
    gsap.fromTo(
      headlineWords,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2,
      }
    );
  }

  // Description
  const description = document.querySelector('.home__description');
  if (description) {
    gsap.fromTo(
      description,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.6,
      }
    );
  }

  // Professional fallback for old data attributes
  const heroProfession = document.querySelector('[data-hero-profession]');
  if (heroProfession && !heroProfession.classList.contains('home__description')) {
    // Legacy support for old structure
    gsap.fromTo(
      heroProfession,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.6,
      }
    );
  }
}

// ===== PARALLAX EFFECT =====
function initParallaxEffects() {
  // Hero image parallax
  const heroImageWrap = document.querySelector('.home__image-wrap');
  const heroImage = document.querySelector('[data-hero-image]');
  
  if (heroImageWrap && heroImage && typeof ScrollTrigger !== 'undefined') {
    gsap.to(heroImage, {
      scrollTrigger: {
        trigger: heroImageWrap,
        scrub: 1,
        onUpdate: (self) => {
          gsap.to(heroImage, {
            y: self.getVelocity() * -0.2,
            overwrite: 'auto',
            duration: 0.5,
          });
        },
      },
    });
  }

  // About section parallax
  const aboutImageWrap = document.querySelector('.about__image-wrap');
  if (aboutImageWrap) {
    gsap.fromTo(
      aboutImageWrap,
      {
        opacity: 0.5,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        scrollTrigger: {
          trigger: aboutImageWrap,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
          markers: false,
        },
        ease: 'none',
      }
    );
  }
}

// ===== SECTION REVEAL ANIMATIONS =====
function initSectionReveals() {
  // Projects section
  const projectCards = document.querySelectorAll('[data-projects-list] .project-card');
  if (projectCards.length > 0) {
    gsap.fromTo(
      projectCards,
      {
        opacity: 0,
        y: 50,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-projects-list]',
          start: 'top 70%',
          markers: false,
        },
      }
    );
  }

  // Experience cards
  const workCards = document.querySelectorAll('[data-work-list] article');
  if (workCards.length > 0) {
    gsap.fromTo(
      workCards,
      {
        opacity: 0,
        x: -30,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '[data-work-list]',
          start: 'top 70%',
          markers: false,
        },
      }
    );
  }

  // Skills section
  const skillCards = document.querySelectorAll('[data-skills-list] .skill-card');
  if (skillCards.length > 0) {
    gsap.fromTo(
      skillCards,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '[data-skills-list]',
          start: 'top 75%',
          markers: false,
        },
      }
    );
  }

  // Testimonials
  const testimonials = document.querySelectorAll('.testimonial-card');
  if (testimonials.length > 0) {
    gsap.fromTo(
      testimonials,
      {
        opacity: 0,
        rotationY: -30,
        y: 20,
      },
      {
        opacity: 1,
        rotationY: 0,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.testimonials__grid',
          start: 'top 70%',
          markers: false,
        },
      }
    );
  }
}

// ===== PROJECT CARD 3D HOVER =====
function initProjectCardHover() {
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach((card) => {
    card.addEventListener('mouseenter', function () {
      gsap.to(this, {
        y: -15,
        boxShadow: '0 30px 60px rgba(164, 220, 200, 0.25)',
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      // Tilt effect on hover
      gsap.to(this, {
        rotationX: -5,
        rotationY: 5,
        transformPerspective: 1200,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });

    card.addEventListener('mouseleave', function () {
      gsap.to(this, {
        y: 0,
        rotationX: 0,
        rotationY: 0,
        boxShadow: '0 8px 24px rgba(164, 220, 200, 0.1)',
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  });
}

// ===== PROFILE IMAGE MOUSE TRACKING =====
function initProfileImageTracking() {
  const profileCards = document.querySelectorAll('.profile-card');
  
  profileCards.forEach((card) => {
    const imageContainer = card.querySelector('.profile-card__image-container');
    const blob = card.querySelector('.profile-card__bg-blob');
    
    if (!imageContainer) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(imageContainer, {
        rotationY: x * 15,
        rotationX: y * -15,
        transformPerspective: 1000,
        duration: 0.4,
        ease: 'power1.out',
        overwrite: 'auto',
      });

      if (blob) {
        gsap.to(blob, {
          x: x * 20,
          y: y * 20,
          duration: 0.4,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(imageContainer, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (blob) {
        gsap.to(blob, {
          x: 0,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });
  });
}

// ===== BUTTON MICRO-INTERACTIONS =====
function initButtonInteractions() {
  const buttons = document.querySelectorAll('.button');
  
  buttons.forEach((button) => {
    button.addEventListener('mouseenter', function () {
      gsap.to(this, {
        scale: 1.05,
        boxShadow: '0 12px 24px rgba(164, 220, 200, 0.3)',
        duration: 0.3,
        ease: 'back.out(1.5)',
        overwrite: 'auto',
      });
    });

    button.addEventListener('mouseleave', function () {
      gsap.to(this, {
        scale: 1,
        boxShadow: '0 4px 12px rgba(164, 220, 200, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });

    // Ripple effect on click
    button.addEventListener('click', function (e) {
      if (this.classList.contains('button--ghost')) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.position = 'absolute';
        ripple.style.width = ripple.style.height = '10px';
        ripple.style.background = 'rgba(164, 220, 200, 0.5)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        gsap.to(ripple, {
          width: 300,
          height: 300,
          left: x - 150,
          top: y - 150,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        });
      }
    });
  });
}

// ===== BACKGROUND MOTION EFFECT =====
function initBackgroundMotion() {
  // Subtle animated gradient background
  const body = document.body;
  
  gsap.to(body, {
    backgroundPosition: '100% 0%',
    duration: 15,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
}

// ===== SCROLL PROGRESS INDICATOR =====
function initScrollProgress() {
  const scrollProgress = document.querySelector('.scroll-progress');
  if (!scrollProgress) return;

  window.addEventListener('scroll', () => {
    const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollTotal) * 100;
    scrollProgress.style.width = scrolled + '%';
  });
}

// ===== INITIALIZE ALL ANIMATIONS =====
function initAllAnimations() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSmoothScroll();
      initHeroTextAnimation();
      initParallaxEffects();
      initSectionReveals();
      initProjectCardHover();
      initProfileImageTracking();
      initButtonInteractions();
      initScrollProgress();
    });
  } else {
    initSmoothScroll();
    initHeroTextAnimation();
    initParallaxEffects();
    initSectionReveals();
    initProjectCardHover();
    initProfileImageTracking();
    initButtonInteractions();
    initScrollProgress();
  }
}

// Start animations when portfolio data is loaded
const originalInit = window.init;
if (originalInit) {
  window.init = async function() {
    await originalInit.call(this);
    setTimeout(initAllAnimations, 500);
  };
} else {
  initAllAnimations();
}
}
