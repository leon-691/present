/**
 * Ledakan/hembusan bunga (FOTO ASLI transparan, bukan SVG -- lihat
 * FLOWER_PHOTOS di bawah) dari satu titik asal. Dipakai di 2 momen
 * berbeda (parameter beda, keyframe & CSS sama -- lihat .petal-burst di
 * animations.css):
 * - giftOpening.js: meledak ke segala arah, banyak & besar, sampai
 *   menutupi layar (kado dibuka)
 * - letterScrub.js: lebih sedikit & condong satu arah, spt tertiup angin
 *   (surat "disegel" saat kembali ke awal)
 *
 * TIDAK ADA lagi potongan pita/"confetti" -- dihapus atas permintaan,
 * dinilai kurang pas dengan foto bunga asli. Kalau flowerCount lebih
 * besar dari jumlah foto unik (21), foto-nya diputar ulang (duplikat) --
 * itu memang disengaja, bukan bug.
 */

const FLOWER_PHOTOS = Array.from(
  { length: 21 },
  (_, i) => `assets/images/bunga-png/bunga-${i + 1}.png`
);

/**
 * Kocok urutan foto (Fisher-Yates) supaya semua 21 foto kebagian tampil
 * merata sebelum ada yang berulang, bukan dipilih acak murni yang bisa
 * kebetulan sering muncul foto yang sama.
 */
function shuffledPhotoCycle() {
  const arr = [...FLOWER_PHOTOS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {DOMRect} originRect - elemen sumber ledakan (posisinya dipakai sbg titik tengah)
 * @param {object} [opts]
 * @param {number} [opts.flowerCount=16]
 * @param {number} [opts.distanceMin=140] - jarak minimum partikel terbang (px)
 * @param {number} [opts.distanceMax=360] - jarak maksimum partikel terbang (px)
 * @param {number} [opts.angleSpread=Math.PI*2] - rentang sudut terbang (radian) -- 2π = segala arah
 * @param {number} [opts.angleCenter=0] - pusat rentang sudut (radian, 0 = kanan, -PI/2 = atas)
 * @param {number} [opts.sizeScale=1] - pengali ukuran tiap partikel (>1 utk ledakan yg perlu "menutupi layar")
 * @param {number} [opts.lifetimeMs=1900] - berapa lama container dibersihkan dari DOM
 */
export function spawnPetalBurst(originRect, opts = {}) {
  const {
    flowerCount = 16,
    distanceMin = 140,
    distanceMax = 360,
    angleSpread = Math.PI * 2,
    angleCenter = 0,
    sizeScale = 1,
    lifetimeMs = 1900,
  } = opts;

  const container = document.createElement("div");
  container.className = "petal-burst";
  container.setAttribute("aria-hidden", "true");

  const originX = originRect.left + originRect.width / 2;
  const originY = originRect.top + originRect.height / 2;

  function place(el, size) {
    el.style.left = `${originX - size / 2}px`;
    el.style.top = `${originY - size / 2}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    const angle = angleCenter + (Math.random() - 0.5) * angleSpread;
    const distance = distanceMin + Math.random() * (distanceMax - distanceMin);
    const flyX = Math.round(Math.cos(angle) * distance);
    const flyY = Math.round(Math.sin(angle) * distance);
    const spin = Math.round((Math.random() - 0.5) * 540);
    const scale = 0.6 + Math.random() * 0.7;
    const duration = 1.1 + Math.random() * 0.7;
    const delay = Math.random() * 0.25;

    el.style.setProperty("--fly-x", `${flyX}px`);
    el.style.setProperty("--fly-y", `${flyY}px`);
    el.style.setProperty("--fly-spin", `${spin}deg`);
    el.style.setProperty("--fly-scale", `${scale}`);
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
  }

  const photoCycle = shuffledPhotoCycle();
  for (let i = 0; i < flowerCount; i++) {
    const img = document.createElement("img");
    img.src = photoCycle[i % photoCycle.length];
    img.alt = "";
    img.className = "petal-burst__piece petal-burst__piece--photo";
    place(img, (34 + Math.random() * 48) * sizeScale);
    container.appendChild(img);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), lifetimeMs);
}
