import { isMotionReduced } from "./motionPreference.js";

/**
 * Padanan efek tilt untuk layar sentuh -- foto dimiringkan mengikuti
 * jari yang menyentuh & menggeser di atas kartu foto. Ini pasangan
 * dari tiltEffect.js (khusus mouse/trackpad) -- tanpa modul ini,
 * pengguna touch sama sekali tidak dapat feedback tilt.
 *
 * Ditambah lapisan ambient device-tilt (gyroscope) yang SANGAT halus
 * untuk Android (tidak butuh dialog izin eksplisit di mayoritas
 * browser Android). Di iOS 13+, `DeviceOrientationEvent.requestPermission()`
 * wajib dipicu langsung oleh gesture pengguna dan memunculkan dialog
 * izin -- lapisan gyro SENGAJA dilewati di sana karena meminta izin
 * sensor di tengah momen baca surat/lihat foto terasa mengganggu
 * untuk situs kado sekecil ini. Tilt sentuh di atas tetap berfungsi
 * penuh baik di iOS maupun Android.
 */
export function initTouchTilt() {
  if (isMotionReduced()) return;
  if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

  const MAX_TILT = 10; // derajat -- sedikit lebih halus dari versi mouse (12deg) supaya tidak liar di tangan

  let activeCard = null;
  let activeTiltEl = null;
  let activeRect = null; // di-cache sekali per sentuhan -- ukuran/posisi kartu tidak berubah selama jari digeser
  let latestTouch = null;
  let ticking = false;

  function computeTransform(rect, clientX, clientY) {
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    return `perspective(700px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function applyPendingTilt() {
    ticking = false;
    if (!activeCard || !latestTouch) return;
    activeTiltEl.style.transform = computeTransform(activeRect, latestTouch.clientX, latestTouch.clientY);
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      const card = e.target.closest(".photo-card");
      if (!card) return;
      activeCard = card;
      activeTiltEl = card.querySelector(".photo-card__tilt") || card;
      activeRect = card.getBoundingClientRect();
      card.classList.add("is-touch-active");
      const touch = e.touches[0];
      activeTiltEl.style.transform = computeTransform(activeRect, touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!activeCard) return;
      latestTouch = e.touches[0];
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyPendingTilt);
      }
    },
    { passive: true }
  );

  function release() {
    if (!activeCard) return;
    activeCard.classList.remove("is-touch-active");
    activeTiltEl.style.transform = "";
    activeCard = null;
    activeTiltEl = null;
    activeRect = null;
    latestTouch = null;
  }

  document.addEventListener("touchend", release, { passive: true });
  document.addEventListener("touchcancel", release, { passive: true });

  initAmbientGyroTilt();
}

function initAmbientGyroTilt() {
  if (typeof DeviceOrientationEvent === "undefined") return;
  if (typeof DeviceOrientationEvent.requestPermission === "function") return; // iOS -- lewati, lihat catatan di atas

  const AMBIENT_MAX = 4; // derajat, sangat halus -- sekadar kesan foto "hidup", bukan efek utama
  let latestEvent = null;
  let ticking = false;

  function applyAmbient() {
    ticking = false;
    if (!latestEvent) return;
    const { beta, gamma } = latestEvent;
    if (beta === null || gamma === null) return;

    const tiltEls = document.querySelectorAll(".view.is-active .photo-card:not(.is-touch-active) .photo-card__tilt");
    if (!tiltEls.length) return;

    const tiltX = Math.max(-AMBIENT_MAX, Math.min(AMBIENT_MAX, gamma / 6));
    const tiltY = Math.max(-AMBIENT_MAX, Math.min(AMBIENT_MAX, (beta - 45) / 6));

    tiltEls.forEach((el) => {
      el.style.transform = `perspective(700px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
    });
  }

  window.addEventListener(
    "deviceorientation",
    (e) => {
      latestEvent = e;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyAmbient);
      }
    },
    { passive: true }
  );
}
