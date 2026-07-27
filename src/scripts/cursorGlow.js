import { isMotionReduced } from "./motionPreference.js";

/**
 * Cursor glow + magnetic pull pada tombol -- HANYA untuk device dengan
 * mouse/trackpad asli (hover:hover & pointer:fine), pola gate yang
 * sama seperti tiltEffect.js. Di layar sentuh efek ini otomatis
 * dilewati karena memang tidak ada posisi kursor presisi (bukan
 * dimatikan karena "ini mobile").
 *
 * Offset magnetic diterapkan lewat custom property --magnet-x/-y,
 * BUKAN langsung menimpa `transform` -- supaya tetap menyatu dengan
 * transform hover/active bawaan tombol di components.css, bukan
 * menimpanya.
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
  let activeMagnetRect = null; // cache -- dihitung ulang HANYA saat tombol yang di-hover berganti, bukan tiap mousemove
  let rafId = null;

  function loop() {
    // Lerp lembut supaya glow terasa "mengikuti dengan jeda halus",
    // bukan menempel kaku 1:1 ke posisi kursor.
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId) return;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  startLoop();

  // Jangan biarkan loop rAF jalan terus tanpa henti saat tab tidak
  // terlihat (mis. pengunjung pindah tab) -- sia-sia menghabiskan
  // baterai/CPU untuk animasi yang toh tidak terlihat. Pola sama
  // seperti ambientBackground.js.
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

    // Rect cuma dihitung ulang saat tombolnya baru saja jadi target
    // (ukuran/posisi tombol tidak berubah selama pointer masih di
    // atasnya) -- sebelumnya dihitung ulang di SETIAP event
    // mousemove, padahal nilainya nyaris selalu sama.
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
