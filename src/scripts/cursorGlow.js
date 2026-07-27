import { isMotionReduced } from "./motionPreference.js";

/**
 * Cursor glow amber + magnetic pull pada tombol -- hanya untuk device
 * dengan mouse/trackpad asli (hover:hover & pointer:fine). Di layar
 * sentuh efek ini otomatis dilewati karena tidak ada posisi kursor
 * presisi (bukan dimatikan karena "ini mobile").
 *
 * Offset magnetic diterapkan lewat custom property --magnet-x/-y (dibaca
 * .btn di components.css), bukan langsung menimpa transform, supaya tetap
 * menyatu dengan transform hover/active bawaan tombol.
 */
export function initCursorGlow() {
  if (isMotionReduced()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  const MAGNET_RADIUS = 90;
  const MAGNET_STRENGTH = 0.25;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let activeMagnet = null;
  let activeMagnetRect = null;
  let rafId = null;

  function loop() {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  startLoop();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") startLoop();
    else stopLoop();
  });

  function resetMagnet(el) {
    el.classList.remove("is-magnet-active");
    el.style.removeProperty("--magnet-x");
    el.style.removeProperty("--magnet-y");
  }

  document.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.classList.add("is-visible");

    const magnetTarget = e.target.closest(".btn");

    if (activeMagnet && activeMagnet !== magnetTarget) {
      resetMagnet(activeMagnet);
      activeMagnet = null;
      activeMagnetRect = null;
    }

    if (!magnetTarget) return;

    if (magnetTarget !== activeMagnet) {
      activeMagnetRect = magnetTarget.getBoundingClientRect();
    }
    const rect = activeMagnetRect;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < MAGNET_RADIUS + rect.width / 2) {
      activeMagnet = magnetTarget;
      magnetTarget.classList.add("is-magnet-active");
      magnetTarget.style.setProperty("--magnet-x", `${dx * MAGNET_STRENGTH}px`);
      magnetTarget.style.setProperty("--magnet-y", `${dy * MAGNET_STRENGTH}px`);
    }
  });

  document.addEventListener("mouseleave", () => {
    glow.classList.remove("is-visible");
    if (activeMagnet) {
      resetMagnet(activeMagnet);
      activeMagnet = null;
      activeMagnetRect = null;
    }
  });

  document.addEventListener(
    "mouseout",
    (e) => {
      const btn = e.target.closest(".btn");
      if (!btn || btn !== activeMagnet) return;
      if (btn.contains(e.relatedTarget)) return;
      resetMagnet(btn);
      activeMagnet = null;
      activeMagnetRect = null;
    },
    true
  );
}
