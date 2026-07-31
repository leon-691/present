import { isMotionReduced } from "./motionPreference.js";
import { particleBudget } from "./deviceTier.js";

/**
 * Partikel bokeh lembut yang melayang pelan di lapisan atmosfer --
 * perluasan pola canvas 2D yang sudah dipakai confetti.js (bukan
 * WebGL/Three.js), supaya kesan "depth"-nya murah secara performa dan
 * tetap jalan mulus di Android kelas menengah.
 *
 * Optimasi performa: warna tiap partikel di-render SEKALI di awal jadi
 * "sprite" (canvas offscreen kecil berisi radial-gradient), lalu tiap
 * frame tinggal di-drawImage -- bukan bikin gradient baru per partikel
 * per frame (itu jauh lebih berat di GPU/CPU kelas menengah).
 */
export function initAmbientBackground() {
  const host = document.querySelector("[data-atmosphere]");
  if (!host) return;

  const canvas = document.createElement("canvas");
  canvas.className = "atmosphere__bokeh";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas); // di bawah lapisan mesh/glow/noise (yang di-append lebih dulu di HTML)
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const colorNames = ["--aurora-1", "--aurora-2", "--aurora-3", "--aurora-4"];
  const sprites = colorNames.map((name) => {
    const rgb = rootStyle.getPropertyValue(name).trim() || "255,255,255";
    return makeSprite(rgb);
  });

  function makeSprite(rgb) {
    const size = 200;
    const radius = size / 2;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d");
    const gradient = octx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, `rgba(${rgb}, 0.85)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    octx.fillStyle = gradient;
    octx.beginPath();
    octx.arc(radius, radius, radius, 0, Math.PI * 2);
    octx.fill();
    return off;
  }

  let particles = [];
  let width = 0;
  let height = 0;
  let rafId = null;
  let running = false;

  function resize() {
    width = canvas.width = host.clientWidth;
    height = canvas.height = host.clientHeight;
  }

  function spawn(count) {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 50 + Math.random() * 90,
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
      alpha: 0.12 + Math.random() * 0.16,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -p.r) p.x = width + p.r;
      if (p.x > width + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = height + p.r;
      if (p.y > height + p.r) p.y = -p.r;

      ctx.globalAlpha = p.alpha;
      ctx.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    spawn(particleBudget());
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, width, height);
  }

  // Hormati preferensi motion (lihat motionPreference.js) DAN hemat
  // baterai saat tab tidak terlihat -- dua alasan berbeda untuk
  // berhenti sementara, keduanya legit.
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
