(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.getElementById("siteHeader");
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  function closeMenu() {
    if (!mainNav || !menuToggle) return;
    mainNav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
  }

  const navLinks = document.querySelectorAll("[data-nav]");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  const revealEls = document.querySelectorAll("[data-reveal]");
  const groupCounters = new Map();

  revealEls.forEach((el) => {
    const parent = el.closest("section") || el.parentElement;
    const count = groupCounters.get(parent) || 0;
    el.style.setProperty("--delay", Math.min(count * 90, 360) + "ms");
    groupCounters.set(parent, count + 1);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  function formatStatNumber(value, compact) {
    if (compact && value >= 1000000) {
      return (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + "M";
    }
    if (compact && value >= 1000) {
      return (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + "K";
    }
    return Math.round(value).toLocaleString("pt-BR");
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || "0");
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const compact = el.dataset.compact === "true";
    const duration = prefersReducedMotion ? 0 : 1600;

    if (duration === 0) {
      el.textContent = prefix + formatStatNumber(target, compact) + suffix;
      return;
    }

    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = prefix + formatStatNumber(current, compact) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const statNumbers = document.querySelectorAll(".stat-number");
  if (statNumbers.length && "IntersectionObserver" in window) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNumbers.forEach((el) => statObserver.observe(el));
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  const portCards = document.querySelectorAll(".port-card");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const filter = btn.dataset.filter;
      portCards.forEach((card) => {
        const show = filter === "todos" || card.dataset.category === filter;
        card.dataset.hidden = show ? "false" : "true";
      });
    });
  });

  const slides = document.querySelectorAll(".testimonial-slide");
  const dotsWrap = document.getElementById("testimonialDots");
  const tsPrev = document.getElementById("tsPrev");
  const tsNext = document.getElementById("tsNext");
  let currentSlide = 0;
  let autoplayTimer = null;

  function goToSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === currentSlide));
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((dot, i) =>
        dot.classList.toggle("is-active", i === currentSlide)
      );
    }
  }

  function startAutoplay() {
    if (prefersReducedMotion || slides.length < 2) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 6500);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (slides.length) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", "Ir para depoimento " + (i + 1));
      dot.addEventListener("click", () => {
        goToSlide(i);
        startAutoplay();
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
    });

    goToSlide(0);
    startAutoplay();

    if (tsPrev) tsPrev.addEventListener("click", () => { goToSlide(currentSlide - 1); startAutoplay(); });
    if (tsNext) tsNext.addEventListener("click", () => { goToSlide(currentSlide + 1); startAutoplay(); });

    const sliderWrap = document.querySelector(".testimonial-slider");
    if (sliderWrap) {
      sliderWrap.addEventListener("mouseenter", stopAutoplay);
      sliderWrap.addEventListener("mouseleave", startAutoplay);
    }
  }

  const vfCursor = document.getElementById("vfCursor");
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (vfCursor && isFinePointer) {
    let rafId = null;
    let mouseX = 0, mouseY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        vfCursor.style.left = mouseX + "px";
        vfCursor.style.top = mouseY + "px";
        rafId = null;
      });
    });

    document.querySelectorAll(".frame-viewfinder").forEach((frame) => {
      frame.addEventListener("mouseenter", () => vfCursor.classList.add("is-active"));
      frame.addEventListener("mouseleave", () => vfCursor.classList.remove("is-active"));
    });
  }

  const parallaxEl = document.querySelector("[data-parallax]");
  if (parallaxEl && !prefersReducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const offset = Math.min(window.scrollY * 0.06, 40);
        parallaxEl.style.transform = "translateY(" + offset + "px)";
      },
      { passive: true }
    );
  }
})();
