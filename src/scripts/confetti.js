import { isMotionReduced } from "./motionPreference.js";

/**
 * Confetti burst ringan pakai <canvas>, tanpa library eksternal.
 * Dipakai sekali sebagai "momen besar" saat kode berhasil ditebak --
 * sengaja tidak dipakai berulang di tempat lain supaya tetap terasa spesial.
 */

/** Ambil warna dari token desain saat ini (variables.css), bukan hex
 * tertulis langsung -- supaya otomatis ikut berubah kalau palet di
 * variables.css diganti, tidak perlu disunting dua tempat. */
function getPaletteColors() {
  const styles = getComputedStyle(document.documentElement);
  const tokens = ["--color-primary", "--color-primary-dark", "--color-secondary", "--color-blush", "--color-sage"];
  const colors = tokens.map((t) => styles.getPropertyValue(t).trim()).filter(Boolean);
  return colors.length ? colors : ["#A84A63", "#D3A354"]; // jaring pengaman kalau token entah kenapa kosong
}

export function burstConfetti(targetEl, { count = 60 } = {}) {
  if (isMotionReduced()) return;

  const colors = getPaletteColors();

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
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -12 - 4,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 20,
    life: 0,
  }));

  let frame = 0;
  const maxFrames = 90;

  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.vy += 0.45; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
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
