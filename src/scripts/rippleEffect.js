import { isMotionReduced } from "./motionPreference.js";

/**
 * Ripple feedback saat tombol/tuts ditekan -- satu listener terdelegasi
 * di document, otomatis berlaku juga untuk tombol yang dibuat belakangan
 * secara dinamis (mis. tombol "lanjut" di tiap halaman kenangan).
 * Dipicu lewat `pointerdown`, sama untuk mouse maupun sentuhan.
 */
export function initRippleEffect() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (isMotionReduced()) return;
      const target = e.target.closest(".btn, .keypad__key, .motion-toggle");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const originX = e.clientX ?? rect.left + rect.width / 2;
      const originY = e.clientY ?? rect.top + rect.height / 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${originX - rect.left - size / 2}px`;
      ripple.style.top = `${originY - rect.top - size / 2}px`;

      target.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    },
    { passive: true }
  );
}
