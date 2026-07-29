/**
 * Ledakan/hembusan partikel bunga (FOTO ASLI, bukan SVG -- lihat FLOWER_PHOTOS
 * di bawah) + potongan pita dari satu titik asal. Dipakai di 2 momen berbeda
 * (parameter beda, keyframe & CSS sama -- lihat .petal-burst di animations.css):
 * - giftOpening.js: meledak ke segala arah, banyak partikel besar, sampai
 *   menutupi layar (kado dibuka)
 * - letterScrub.js: lebih sedikit & condong satu arah, spt tertiup angin
 *   (surat disegel/ditutup)
 */

const FLOWER_PHOTOS = [
  "assets/images/bunga-1.jpg",
  "assets/images/bunga-2.jpg",
  "assets/images/bunga-3.jpg",
  "assets/images/bunga-4.jpg",
  "assets/images/bunga-5.jpg",
  "assets/images/bunga-6.jpg",
  "assets/images/bunga-7.jpg",
  "assets/images/bunga-8.jpg",
  "assets/images/bunga-9.jpg",
  "assets/images/bunga-10.jpg",
  "assets/images/bunga-11.jpg",
];

const RIBBON_COLORS = ["var(--color-secondary)", "var(--color-primary)"];

/**
 * Kocok urutan foto (Fisher-Yates) supaya semua 11 foto kebagian tampil
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
 * @param {number} [opts.flowerCount=12]
 * @param {number} [opts.ribbonCount=9]
 * @param {number} [opts.distanceMin=140] - jarak minimum partikel terbang (px)
 * @param {number} [opts.distanceMax=360] - jarak maksimum partikel terbang (px)
 * @param {number} [opts.angleSpread=Math.PI*2] - rentang sudut terbang (radian) -- 2π = segala arah
 * @param {number} [opts.angleCenter=0] - pusat rentang sudut (radian, 0 = kanan, -PI/2 = atas)
 * @param {number} [opts.sizeScale=1] - pengali ukuran tiap partikel (>1 utk ledakan yg perlu "menutupi layar")
 * @param {number} [opts.lifetimeMs=1900] - berapa lama container dibersihkan dari DOM
 */
export function spawnPetalBurst(originRect, opts = {}) {
  const {
    flowerCount = 12,
    ribbonCount = 9,
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

  // Foto asli (bukan ilustrasi SVG) -- dibulatkan spt medali pressed-flower,
  // konsisten dgn .transition-flowers di halaman transisi.
  const photoCycle = shuffledPhotoCycle();
  for (let i = 0; i < flowerCount; i++) {
    const img = document.createElement("img");
    img.src = photoCycle[i % photoCycle.length];
    img.alt = "";
    img.className = "petal-burst__piece petal-burst__piece--photo";
    place(img, (34 + Math.random() * 48) * sizeScale);
    container.appendChild(img);
  }

  for (let i = 0; i < ribbonCount; i++) {
    const span = document.createElement("span");
    span.className = "petal-burst__piece petal-burst__piece--ribbon";
    span.style.background = RIBBON_COLORS[i % RIBBON_COLORS.length];
    const size = (6 + Math.random() * 4) * sizeScale;
    place(span, size);
    span.style.height = `${size * 4.5}px`; // strip pita: lebih panjang dari lebar
    container.appendChild(span);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), lifetimeMs);
}
