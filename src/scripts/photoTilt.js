import { isMotionReduced } from "./motionPreference.js";

/**
 * Tilt 3D interaktif pada frame foto -- tiga sumber (mouse, sentuh,
 * gyro ambient), semuanya didelegasikan lewat document (BUKAN listener
 * per kartu) supaya kartu yang dibuat belakangan oleh memoryRenderer.js
 * otomatis kebagian efek tanpa perlu didaftarkan ulang satu-satu.
 * Bounding rect kartu di-cache SEKALI per interaksi (bukan dihitung
 * ulang tiap gerakan) -- posisi/ukuran kartu tidak berubah selama jari
 * digeser atau kursor di atasnya.
 */

function computeTransform(rect, clientX, clientY, maxTilt, scale) {
  const x = (clientX - rect.left) / rect.width - 0.5;
  const y = (clientY - rect.top) / rect.height - 0.5;
  return `perspective(700px) rotateY(${(x * maxTilt).toFixed(2)}deg) rotateX(${(-y * maxTilt).toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
}

/** Mouse/trackpad -- device dengan hover asli saja. */
function initMouseTilt() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const MAX_TILT = 12;
  let hoveredFrame = null;
  let tiltEl = null;
  let cachedRect = null;
  let latestEvent = null;
  let ticking = false;

  function applyPending() {
    ticking = false;
    if (!hoveredFrame || !latestEvent) return;
    tiltEl.style.transform = computeTransform(cachedRect, latestEvent.clientX, latestEvent.clientY, MAX_TILT, 1.03);
  }

  document.addEventListener("mousemove", (e) => {
    const frame = e.target.closest(".photo-frame");
    if (!frame) {
      hoveredFrame = null;
      return;
    }
    if (frame !== hoveredFrame) {
      hoveredFrame = frame;
      tiltEl = frame.querySelector(".photo-frame__tilt") || frame;
      cachedRect = frame.getBoundingClientRect();
    }
    latestEvent = e;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyPending);
    }
  });

  document.addEventListener(
    "mouseout",
    (e) => {
      const frame = e.target.closest(".photo-frame");
      if (!frame || frame.contains(e.relatedTarget)) return;
      (frame.querySelector(".photo-frame__tilt") || frame).style.transform = "";
      if (frame === hoveredFrame) {
        hoveredFrame = null;
        latestEvent = null;
      }
    },
    true
  );
}

/** Sentuh -- padanan mouse-tilt untuk layar sentuh. */
function initTouchTilt() {
  if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

  const MAX_TILT = 10; // sedikit lebih halus dari mouse (12deg) -- tidak liar di tangan
  let activeFrame = null;
  let tiltEl = null;
  let cachedRect = null;
  let latestTouch = null;
  let ticking = false;

  function applyPending() {
    ticking = false;
    if (!activeFrame || !latestTouch) return;
    tiltEl.style.transform = computeTransform(cachedRect, latestTouch.clientX, latestTouch.clientY, MAX_TILT, 1.02);
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      const frame = e.target.closest(".photo-frame");
      if (!frame) return;
      activeFrame = frame;
      tiltEl = frame.querySelector(".photo-frame__tilt") || frame;
      cachedRect = frame.getBoundingClientRect();
      frame.classList.add("is-touch-active");
      const touch = e.touches[0];
      tiltEl.style.transform = computeTransform(cachedRect, touch.clientX, touch.clientY, MAX_TILT, 1.02);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!activeFrame) return;
      latestTouch = e.touches[0];
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyPending);
      }
    },
    { passive: true }
  );

  function release() {
    if (!activeFrame) return;
    activeFrame.classList.remove("is-touch-active");
    tiltEl.style.transform = "";
    activeFrame = null;
    tiltEl = null;
    cachedRect = null;
    latestTouch = null;
  }

  document.addEventListener("touchend", release, { passive: true });
  document.addEventListener("touchcancel", release, { passive: true });
}

/**
 * Goyangan ambient sangat halus dari sensor kemiringan device -- HANYA
 * Android. iOS/iPadOS dideteksi lewat ADA-TIDAKNYA
 * DeviceOrientationEvent.requestPermission (feature-detection, bukan
 * UA-sniffing) dan dilewati SEPENUHNYA di sana, karena memicu dialog
 * izin sensor di tengah momen baca surat/lihat foto terasa mengganggu
 * untuk situs kado sekecil ini. Tilt sentuh di atas tetap penuh di iOS.
 */
function initAmbientGyroTilt() {
  if (typeof DeviceOrientationEvent === "undefined") return;
  if (typeof DeviceOrientationEvent.requestPermission === "function") return; // iOS -- sengaja dilewati

  const AMBIENT_MAX = 4;
  let latestEvent = null;
  let ticking = false;

  function apply() {
    ticking = false;
    if (!latestEvent) return;
    const { beta, gamma } = latestEvent;
    if (beta === null || gamma === null) return;

    const tiltEls = document.querySelectorAll(".act.is-active .photo-frame:not(.is-touch-active) .photo-frame__tilt");
    if (!tiltEls.length) return;

    const tiltX = Math.max(-AMBIENT_MAX, Math.min(AMBIENT_MAX, gamma / 6));
    const tiltY = Math.max(-AMBIENT_MAX, Math.min(AMBIENT_MAX, (beta - 45) / 6));

    tiltEls.forEach((el) => {
      el.style.transform = `perspective(700px) rotateY(${tiltX.toFixed(2)}deg) rotateX(${(-tiltY).toFixed(2)}deg)`;
    });
  }

  window.addEventListener(
    "deviceorientation",
    (e) => {
      latestEvent = e;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    },
    { passive: true }
  );
}

export function initPhotoTilt() {
  if (isMotionReduced()) return;
  initMouseTilt();
  initTouchTilt();
  initAmbientGyroTilt();
}
