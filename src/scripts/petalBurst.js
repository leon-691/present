/**
 * Ledakan/hembusan partikel kelopak bunga + daun + potongan pita dari satu
 * titik asal. Dipakai di 2 momen berbeda (parameter beda, keyframe & CSS
 * sama -- lihat .petal-burst di animations.css):
 * - giftOpening.js: meledak ke segala arah, banyak partikel (kado dibuka)
 * - letterScrub.js: lebih sedikit & condong satu arah, spt tertiup angin
 *   (surat disegel/ditutup)
 */

const PETAL_COLORS = ["var(--color-primary)", "var(--color-blush)", "var(--color-primary-light)"];
const RIBBON_COLORS = ["var(--color-secondary)", "var(--color-primary)"];

/**
 * @param {DOMRect} originRect - elemen sumber ledakan (posisinya dipakai sbg titik tengah)
 * @param {object} [opts]
 * @param {number} [opts.flowerCount=12]
 * @param {number} [opts.leafCount=6]
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
    leafCount = 6,
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

  for (let i = 0; i < flowerCount; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.classList.add("petal-burst__piece");
    svg.style.setProperty("--petal-color", PETAL_COLORS[i % PETAL_COLORS.length]);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#petal-flower");
    svg.appendChild(use);
    place(svg, (16 + Math.random() * 18) * sizeScale);
    container.appendChild(svg);
  }

  for (let i = 0; i < leafCount; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 30 40");
    svg.classList.add("petal-burst__piece");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#leaf-single");
    svg.appendChild(use);
    place(svg, (14 + Math.random() * 14) * sizeScale);
    container.appendChild(svg);
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
