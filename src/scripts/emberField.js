import { isMotionReduced } from "./motionPreference.js";
import { emberBudget } from "./deviceTier.js";

/**
 * Partikel ember hangat yang melayang pelan ke atas, seperti percikan api
 * unggun jauh atau kunang-kunang senja. Sprite warna digambar SEKALI di
 * awal (radial-gradient di canvas offscreen kecil), lalu tiap frame cuma
 * di-drawImage -- bukan bikin gradient baru per partikel per frame (jauh
 * lebih berat di CPU/GPU kelas menengah, terutama Android).
 */
export function initEmberField() {
  const canvas = document.querySelector(".ember-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const colorNames = ["--color-amber-rgb", "--color-ember-rgb", "--color-amber-bright-rgb"];
  const sprites = colorNames.map((name) => {
    const rgb = rootStyle.getPropertyValue(name).trim() || "226,150,63";
    return makeSprite(rgb);
  });

  function makeSprite(rgb) {
    const size = 48;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d");
    const gradient = octx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${rgb}, 0.9)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    octx.fillStyle = gradient;
    octx.fillRect(0, 0, size, size);
    return off;
  }

  let particles = [];
  let width = 0;
  let height = 0;
  let rafId = null;
  let running = false;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function spawn(count) {
    particles = Array.from({ length: count }, () => makeParticle(Math.random() * height));
  }

  function makeParticle(startY) {
    return {
      x: Math.random() * width,
      y: startY,
      r: 3 + Math.random() * 5,
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
      vy: -(0.12 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 0.16,
      baseAlpha: 0.25 + Math.random() * 0.35,
      flickerSeed: Math.random() * 1000,
    };
  }

  function tick(timestamp) {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -p.r) {
        p.y = height + p.r;
        p.x = Math.random() * width;
      }
      if (p.x < -p.r) p.x = width + p.r;
      if (p.x > width + p.r) p.x = -p.r;

      const flicker = 0.75 + 0.25 * Math.sin(timestamp / 420 + p.flickerSeed);
      ctx.globalAlpha = p.baseAlpha * flicker;
      ctx.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    spawn(emberBudget());
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, width, height);
  }

  function sync() {
    const shouldRun = !isMotionReduced() && document.visibilityState === "visible";
    if (shouldRun) start();
    else stop();
  }

  window.addEventListener("resize", () => {
    if (running) resize();
  });
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("motion:change", sync);

  sync();
}
