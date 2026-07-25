import { isMotionReduced } from "./motionPreference.js";

/**
 * Animasi bunga berjatuhan saat situs pertama kali dibuka -- momen
 * "wow" singkat sebelum pengunjung mulai berinteraksi. Sekali putar
 * lalu bersih-bersih sendiri dari DOM.
 */
export function initFlowerIntro() {
  if (isMotionReduced()) return;

  const COLORS = ["var(--color-blush)", "var(--color-primary-light)", "var(--color-secondary)"];
  const COUNT = 16;
  const LIFETIME_MS = 4200;

  const container = document.createElement("div");
  container.className = "flower-intro";
  container.setAttribute("aria-hidden", "true");

  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    piece.setAttribute("viewBox", "0 0 40 40");
    piece.classList.add("flower-intro__piece");

    const size = 14 + Math.random() * 16;
    const delay = Math.random() * 0.7;
    const duration = 2.4 + Math.random() * 1.6;
    const drift = Math.round((Math.random() - 0.5) * 140);
    const spin = Math.round((Math.random() - 0.5) * 420);

    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${duration}s`;
    piece.style.setProperty("--drift", `${drift}px`);
    piece.style.setProperty("--spin", `${spin}deg`);
    piece.style.setProperty("--petal-color", COLORS[i % COLORS.length]);

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#petal-flower");
    piece.appendChild(use);
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), LIFETIME_MS);
}
