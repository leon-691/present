import { isMotionReduced } from "./motionPreference.js";

/**
 * Overlay grain 35mm yang menempel di seluruh layar. Supaya murah secara
 * performa, noise TIDAK dihitung ulang per pixel per frame -- sebaliknya,
 * beberapa "kartu" noise kecil digambar SEKALI di awal ke canvas offscreen,
 * lalu tiap beberapa frame kita cuma pindah-pindah menggambar kartu yang
 * mana (drawImage, murah) dengan offset acak. Hasilnya tetap terasa hidup
 * (flicker halus) tanpa membebani CPU/GPU.
 */
export function initFilmGrain() {
  const canvas = document.querySelector(".grain-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const TILE_SIZE = 128;
  const FRAME_COUNT = 5;
  const frames = Array.from({ length: FRAME_COUNT }, () => makeNoiseTile(TILE_SIZE));

  let width = 0;
  let height = 0;
  let running = false;
  let lastDraw = 0;
  const INTERVAL_MS = 90; // ~11fps -- cukup utk kesan grain, jauh lebih murah dari 60fps

  function makeNoiseTile(size) {
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d");
    const imageData = octx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = Math.random() * 60;
    }
    octx.putImageData(imageData, 0, 0);
    return off;
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function drawFrame() {
    const tile = frames[Math.floor(Math.random() * frames.length)];
    ctx.clearRect(0, 0, width, height);
    const pattern = ctx.createPattern(tile, "repeat");
    ctx.save();
    ctx.translate(-Math.random() * TILE_SIZE, -Math.random() * TILE_SIZE);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width + TILE_SIZE, height + TILE_SIZE);
    ctx.restore();
  }

  function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastDraw >= INTERVAL_MS) {
      drawFrame();
      lastDraw = timestamp;
    }
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    ctx.clearRect(0, 0, width, height);
  }

  function drawStaticFrame() {
    resize();
    drawFrame();
  }

  function sync() {
    const visible = document.visibilityState === "visible";
    if (isMotionReduced()) {
      stop();
      // Tetap tampilkan SATU frame statis -- grain adalah identitas
      // tekstur situs, bukan cuma animasi; menghilangkannya total akan
      // membuat tampilan terasa "polos" secara tidak sengaja.
      if (visible) drawStaticFrame();
      return;
    }
    if (visible) start();
    else stop();
  }

  window.addEventListener("resize", () => {
    if (running) resize();
  });
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("motion:change", sync);

  sync();
}
