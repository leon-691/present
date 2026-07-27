import { isMotionReduced } from "./motionPreference.js";

/**
 * Burst partikel hangat (bukan konfeti pelangi generik) -- dipakai sebagai
 * "momen besar" di dua titik: kode berhasil ditebak & konfirmasi "yess".
 * Sengaja tidak dipakai berulang di tempat lain supaya tetap terasa
 * spesial. Canvas 2D murni, tanpa library eksternal.
 */
const COLORS = ["#e2963f", "#f6c179", "#e2694a", "#f6eee1"];

export function burstEmbers(targetEl, { count = 70 } = {}) {
  if (isMotionReduced()) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "80";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const originX = canvas.width / 2;
  const originY = targetEl
    ? targetEl.getBoundingClientRect().top + targetEl.offsetHeight / 2
    : canvas.height / 2;

  const particles = Array.from({ length: count }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 13,
    vy: Math.random() * -13 - 3,
    size: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 18,
  }));

  let frame = 0;
  const maxFrames = 95;

  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.vy += 0.42; // gravitasi
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      ctx.restore();
    });

    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);
}
