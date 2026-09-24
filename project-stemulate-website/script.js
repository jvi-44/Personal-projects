// Project STEMulate site behaviour: Academy link, mobile menu, lesson tabs,
// quiz answer reveals and gentle scroll-in animations. No dependencies.

// ─── Set this to the live STEMulate Academy address once it's deployed. ───
// Every "Enter STEMulate Academy" button on the page uses it. While it's
// empty, those buttons scroll to the Academy section instead.
const ACADEMY_URL = "";

document.documentElement.classList.add("js");

if (ACADEMY_URL) {
  document.querySelectorAll("[data-academy-link]").forEach((a) => {
    a.href = ACADEMY_URL;
    a.target = "_blank";
    a.rel = "noopener";
  });
}

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// Lesson tabs (arrow keys move between tabs, per the WAI-ARIA tabs pattern)
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

// Quiz answer reveals
document.querySelectorAll(".reveal").forEach((btn) => {
  btn.addEventListener("click", () => {
    const answer = btn.nextElementSibling;
    const show = answer.hidden;
    answer.hidden = !show;
    btn.setAttribute("aria-expanded", String(show));
    btn.textContent = show ? "Hide answer" : "Reveal answer";
  });
});

// Scroll-in animations
const revealTargets = document.querySelectorAll(
  ".section-head, .fact, .prog, .bot-card, .flow, .lesson-info, .lesson-side, .curr, .totals, .tile, .timeline li, .quote, .join"
);
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => {
    el.classList.add("reveal-up");
    io.observe(el);
  });
}
