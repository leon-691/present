import { isMotionReduced } from "./motionPreference.js";
import { spawnPetalBurst } from "./petalBurst.js";
import { particleBudget } from "./deviceTier.js";

/**
 * Scene pembuka: kotak kado yang menunggu diketuk (goyangan idle-nya murni
 * CSS -- keyframe `gift-wobble` di sections.css, jalan otomatis lewat
 * animation di .gift-box). Modul ini menangani:
 * 1. Interaksi ketuk/klik (sekali saja -- dijaga lewat flag `hasOpened`).
 * 2. Ledakan foto bunga asli dari titik kotak kado (lihat petalBurst.js --
 *    modul yang sama dipakai lagi saat surat disegel), dibesarkan &
 *    diperbanyak sampai menutupi layar.
 * 3. Sedikit "zoom" kamera pada seluruh halaman.
 * 4. Memberi tahu main.js kapan boleh unlock musik (segera, di titik
 *    ketuk -- gesture pertama pengguna) dan kapan boleh pindah ke halaman
 *    gerbang (onComplete, setelah animasi reda).
 *
 * Reduced motion: goyangan/ledakan/zoom dilewati (dekoratif), tapi
 * berpindah halaman tetap terjadi (esensial, cuma tanpa hiasan) -- sesuai
 * prinsip motion governance yang sama dipakai modul lain di situs ini.
 */
export function initGiftOpening({ onFirstInteraction, onComplete }) {
  const scene = document.querySelector("#opening");
  const trigger = document.querySelector("[data-gift-trigger]");
  const pageEl = document.querySelector(".page");
  if (!scene || !trigger) {
    onComplete?.();
    return;
  }

  let hasOpened = false;

  // Decorative sparkles are generated once so they do not alter the gift
  // contents or its interaction logic.
  const sparkleField = document.createElement("div");
  sparkleField.className = "gift-spark-field motion-decorative";
  sparkleField.setAttribute("aria-hidden", "true");
  const sparkleData = [
    ["10%", "28%", "1.1", "0ms"], ["18%", "62%", "0.8", "420ms"],
    ["28%", "20%", "1.35", "760ms"], ["72%", "18%", "0.9", "180ms"],
    ["83%", "38%", "1.3", "620ms"], ["77%", "67%", "0.75", "980ms"],
    ["61%", "78%", "1.05", "320ms"], ["35%", "82%", "0.85", "860ms"],
  ];
  sparkleData.forEach(([x, y, scale, delay]) => {
    const spark = document.createElement("span");
    spark.className = "gift-spark";
    spark.style.left = x;
    spark.style.top = y;
    spark.style.setProperty("--spark-scale", scale);
    spark.style.animationDelay = delay;
    sparkleField.appendChild(spark);
  });
  scene.insertBefore(sparkleField, scene.firstChild);

  function resetGift() {
    hasOpened = false;
    trigger.classList.remove("is-opening");
    sparkleField.classList.remove("is-opening");
    trigger.removeAttribute("aria-disabled");
  }

  // #opening bisa aktif lagi kalau Indah menekan "Kembali ke Awal" di
  // surat (pageFlow.goToStart() -> activate(0)). Tanpa ini, kotak kado
  // akan tetap dalam wujud "sudah meledak" (tutup & badan sudah
  // opacity:0 dari sesi sebelumnya) alih-alih kembali utuh menunggu
  // diketuk -- lihat laporan bug dari Anda.
  scene.addEventListener("view:settled", resetGift);

  trigger.addEventListener("click", () => {
    if (hasOpened) return;
    hasOpened = true;
    trigger.setAttribute("aria-disabled", "true");

    onFirstInteraction?.();

    if (isMotionReduced()) {
      // Esensial (pindah halaman) tetap terjadi, dekoratif (goyangan,
      // ledakan, zoom) dilewati sepenuhnya.
      onComplete?.();
      return;
    }

    trigger.classList.add("is-opening");
    sparkleField.classList.add("is-opening");
    pageEl?.classList.add("is-gift-zoom");

    // Jarak partikel dihitung dari diagonal layar (bukan angka piksel
    // tetap) supaya di layar besar pun kelopaknya benar-benar sampai
    // menutupi ujung layar, bukan cuma meledak kecil di tengah.
    const diagonal = Math.hypot(window.innerWidth, window.innerHeight);

    spawnPetalBurst(trigger.getBoundingClientRect(), {
      flowerCount: particleBudget({ low: 34, mid: 50, high: 68 }),
      distanceMin: diagonal * 0.08, // sebagian tetap dekat pusat, biar tidak ada "lubang" kosong di tengah
      distanceMax: diagonal * 0.8,
      angleSpread: Math.PI * 2, // ledakan ke segala arah
      sizeScale: 3.4, // foto asli, bukan ikon SVG kecil -- dibesarkan spy benar2 menutupi layar
      lifetimeMs: 2400,
    });

    setTimeout(() => {
      pageEl?.classList.remove("is-gift-zoom");
      onComplete?.();
    }, 1750);
  });
}
