const toggleBtn = document.querySelector(".menu-toggle");
const body = document.body;
const backdrop = document.querySelector(".mobile-menu-backdrop");
const mobileLinks = document.querySelectorAll(".mobile-menu a");

function toggleMenu() {
  const isOpen = body.classList.toggle("mobile-menu-open");
  toggleBtn.classList.toggle("is-active", isOpen);
  toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", toggleMenu);
}

if (backdrop) {
  backdrop.addEventListener("click", toggleMenu);
}

// Close menu when clicking a mobile nav link
mobileLinks.forEach((link) =>
  link.addEventListener("click", () => {
    if (body.classList.contains("mobile-menu-open")) {
      toggleMenu();
    }
  })
);


// 

(function () {
  const projects = [
    { title: "Aakar House of Jewellery", img: "imgs/aakar.webp", url: "https://aakarhouse.com/" },
    { title: "Shanj Yoga Studio", img: "imgs/shanjyoga.webp", url: "https://shanjyoga.com/" },
    { title: "Serenity Trion", img: "imgs/trion.webp", url: "https://serenitytrion.in/" },
    { title: "SP Shah & Sons", img: "imgs/spshah.webp", url: "https://spshah.in/" },
  ];

  const track = document.getElementById("workTrack");
  const pill = document.getElementById("workPill");
  const visit = document.getElementById("workVisit");
  const root = document.getElementById("workCarousel");
  const prev = root?.querySelector(".work-prev");
  const next = root?.querySelector(".work-next");

  if (!track || !pill || !visit || !root || !prev || !next) return;

  // Build slides (NO LINK on slides)
  track.innerHTML = projects
    .map(
      (p, i) => `
      <article class="work-slide" data-index="${i}" data-title="${escapeHtml(p.title)}">
        <img src="${p.img}" alt="${escapeHtml(p.title)}" loading="lazy" />
      </article>
    `
    )
    .join("");

  const slides = Array.from(track.querySelectorAll(".work-slide"));
  let active = Math.floor(projects.length / 2);

  function setActive(index) {
    active = (index + slides.length) % slides.length;

    slides.forEach((s, i) => s.classList.toggle("is-active", i === active));

    pill.textContent = projects[active].title;

    // Update "Visit website" link
    visit.href = projects[active].url;
    visit.setAttribute("aria-label", `Visit ${projects[active].title} website`);

    // Center the active slide in viewport
    const viewport = track.parentElement; // .work-viewport
    const slide = slides[active];

    const viewportWidth = viewport.clientWidth;
    const slideRect = slide.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    // slide center relative to track start
    const slideCenterX = (slideRect.left - trackRect.left) + (slideRect.width / 2);
    const targetTranslateX = (viewportWidth / 2) - slideCenterX;

    track.style.transform = `translateX(${targetTranslateX}px)`;
  }

  prev.addEventListener("click", () => setActive(active - 1));
  next.addEventListener("click", () => setActive(active + 1));

  // Click on any slide to focus it (no opening)
  slides.forEach((s, i) => s.addEventListener("click", () => setActive(i)));

  // Keyboard support
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") setActive(active - 1);
    if (e.key === "ArrowRight") setActive(active + 1);
  });
  root.tabIndex = 0;

  // Recenter on resize
  window.addEventListener("resize", () => setActive(active));

  // Init
  setActive(active);

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));
  }
})();



   (function () {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const THRESHOLD = 12; // px after which header becomes black

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();