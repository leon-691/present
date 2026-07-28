import { isMotionReduced } from "./motionPreference.js";

/**
 * Scene pembuka: kotak kado yang menunggu diketuk (goyangan idle-nya murni
 * CSS -- keyframe `gift-wobble` di sections.css, jalan otomatis lewat
 * animation di .gift-box). Modul ini menangani:
 * 1. Interaksi ketuk/klik (sekali saja -- dijaga lewat flag `hasOpened`).
 * 2. Ledakan kelopak bunga + daun + pita dari titik kotak kado.
 * 3. Sedikit "zoom" kamera pada seluruh halaman.
 * 4. Memberi tahu main.js kapan boleh unlock musik (segera, di titik
 *    ketuk -- gesture pertama pengguna) dan kapan boleh pindah ke halaman
 *    gerbang (onComplete, setelah animasi reda).
 *
 * Reduced motion: goyangan/ledakan/zoom dilewati (dekoratif), tapi
 * berpindah halaman tetap terjadi (esensial, cuma tanpa hiasan) -- sesuai
 * prinsip motion governance yang sama dipakai modul lain di situs ini.
 */

const PETAL_COLORS = ["var(--color-primary)", "var(--color-blush)", "var(--color-primary-light)"];
const RIBBON_COLORS = ["var(--color-secondary)", "var(--color-primary)"];

function spawnBurst(originRect) {
  const container = document.createElement("div");
  container.className = "gift-burst";
  container.setAttribute("aria-hidden", "true");

  const originX = originRect.left + originRect.width / 2;
  const originY = originRect.top + originRect.height / 2;

  const FLOWER_COUNT = 12;
  const LEAF_COUNT = 6;
  const RIBBON_COUNT = 9;
  const LIFETIME_MS = 1900;

  function place(el, size) {
    el.style.left = `${originX - size / 2}px`;
    el.style.top = `${originY - size / 2}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 140 + Math.random() * 220;
    const flyX = Math.round(Math.cos(angle) * distance);
    const flyY = Math.round(Math.sin(angle) * distance - 60); // bias ke atas, seperti ditiup lembut
    const spin = Math.round((Math.random() - 0.5) * 540);
    const scale = 0.6 + Math.random() * 0.7;
    const duration = 1.1 + Math.random() * 0.7;
    const delay = Math.random() * 0.25;

    el.style.setProperty("--fly-x", `${flyX}px`);
    el.style.setProperty("--fly-y", `${flyY}px`);
    el.style.setProperty("--fly-spin", `${spin}deg`);
    el.style.setProperty("--fly-scale", `${scale}`);
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
  }

  for (let i = 0; i < FLOWER_COUNT; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.classList.add("gift-burst__piece");
    svg.style.setProperty("--petal-color", PETAL_COLORS[i % PETAL_COLORS.length]);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#petal-flower");
    svg.appendChild(use);
    place(svg, 16 + Math.random() * 18);
    container.appendChild(svg);
  }

  for (let i = 0; i < LEAF_COUNT; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 30 40");
    svg.classList.add("gift-burst__piece");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#leaf-single");
    svg.appendChild(use);
    place(svg, 14 + Math.random() * 14);
    container.appendChild(svg);
  }

  for (let i = 0; i < RIBBON_COUNT; i++) {
    const span = document.createElement("span");
    span.className = "gift-burst__piece gift-burst__piece--ribbon";
    span.style.background = RIBBON_COLORS[i % RIBBON_COLORS.length];
    const size = 6 + Math.random() * 4;
    place(span, size);
    span.style.height = `${size * 4.5}px`; // strip pita: lebih panjang dari lebar
    container.appendChild(span);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), LIFETIME_MS);
}

export function initGiftOpening({ onFirstInteraction, onComplete }) {
  const scene = document.querySelector("#opening");
  const trigger = document.querySelector("[data-gift-trigger]");
  const pageEl = document.querySelector(".page");
  if (!scene || !trigger) {
    onComplete?.();
    return;
  }

  let hasOpened = false;

  trigger.addEventListener("click", () => {
    if (hasOpened) return;
    hasOpened = true;
    trigger.setAttribute("aria-disabled", "true");

    onFirstInteraction?.();

    if (isMotionReduced()) {
      // Esensial (pindah halaman) tetap terjadi, dekoratif (goyangan,
      // ledakan, zoom) dilewati sepenuhnya.
      onComplete?.();
      return;
    }

    trigger.classList.add("is-opening");
    pageEl?.classList.add("is-gift-zoom");

    const rect = trigger.getBoundingClientRect();
    spawnBurst(rect);

    setTimeout(() => {
      pageEl?.classList.remove("is-gift-zoom");
      onComplete?.();
    }, 1300);
  });
}
