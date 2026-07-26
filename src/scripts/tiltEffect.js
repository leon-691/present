import { isMotionReduced } from "./motionPreference.js";

/**
 * Efek tilt 3D pada kartu foto -- miring mengikuti posisi kursor,
 * mirip kartu fisik yang dimiringkan di tangan. Hanya aktif untuk
 * mouse/trackpad (device dengan hover asli); di layar sentuh efek
 * ini dilewati karena tidak ada posisi kursor yang presisi (lihat
 * touchTilt.js untuk padanan touch-nya).
 */
export function initTiltEffect() {
  if (isMotionReduced()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const MAX_TILT = 12; // derajat

  let hoveredCard = null;
  let hoveredTiltEl = null;
  let hoveredRect = null; // di-cache sekali per kartu -- dihitung ulang HANYA saat kartu yang di-hover berganti
  let latestEvent = null;
  let ticking = false;

  function applyPendingTilt() {
    ticking = false;
    if (!hoveredCard || !latestEvent) return;
    const rect = hoveredRect;
    const x = (latestEvent.clientX - rect.left) / rect.width - 0.5;
    const y = (latestEvent.clientY - rect.top) / rect.height - 0.5;
    hoveredTiltEl.style.transform =
      `perspective(700px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg) scale3d(1.03, 1.03, 1.03)`;
  }

  // Delegasi lewat document supaya kartu yang dibuat belakangan
  // (mis. halaman kenangan yang dirender JS) tetap kebagian efeknya,
  // tanpa perlu daftar ulang listener tiap kali render.
  // Transform tilt diterapkan ke .photo-card__tilt (elemen anak),
  // BUKAN ke .photo-card langsung -- supaya tidak menimpa rotasi statis
  // gaya polaroid yang sekarang dipasang di .photo-card lewat CSS
  // (lihat components.css). Fallback ke card itu sendiri kalau
  // strukturnya tidak ada elemen ini, supaya tetap tidak pernah error.
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".photo-card");
    if (!card) {
      hoveredCard = null;
      return;
    }

    if (card !== hoveredCard) {
      hoveredCard = card;
      hoveredTiltEl = card.querySelector(".photo-card__tilt") || card;
      hoveredRect = card.getBoundingClientRect();
    }

    latestEvent = e;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyPendingTilt);
    }
  });

  document.addEventListener(
    "mouseout",
    (e) => {
      const card = e.target.closest(".photo-card");
      if (!card) return;
      if (card.contains(e.relatedTarget)) return;
      const tiltEl = card.querySelector(".photo-card__tilt") || card;
      tiltEl.style.transform = "";
      if (card === hoveredCard) {
        hoveredCard = null;
        latestEvent = null;
      }
    },
    true
  );
}
