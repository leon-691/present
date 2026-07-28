import { isMotionReduced } from "./motionPreference.js";
import { spawnPetalBurst } from "./petalBurst.js";
import { particleBudget } from "./deviceTier.js";

/**
 * Scene pembuka: kotak kado yang menunggu diketuk (goyangan idle-nya murni
 * CSS -- keyframe `gift-wobble` di sections.css, jalan otomatis lewat
 * animation di .gift-box). Modul ini menangani:
 * 1. Interaksi ketuk/klik (sekali saja -- dijaga lewat flag `hasOpened`).
 * 2. Ledakan kelopak bunga + daun + pita dari titik kotak kado (lihat
 *    petalBurst.js -- modul yang sama dipakai lagi saat surat disegel).
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
    pageEl?.classList.add("is-gift-zoom");

    // Jarak partikel dihitung dari diagonal layar (bukan angka piksel
    // tetap) supaya di layar besar pun kelopaknya benar-benar sampai
    // menutupi ujung layar, bukan cuma meledak kecil di tengah.
    const diagonal = Math.hypot(window.innerWidth, window.innerHeight);

    spawnPetalBurst(trigger.getBoundingClientRect(), {
      flowerCount: particleBudget({ low: 16, mid: 24, high: 32 }),
      leafCount: particleBudget({ low: 7, mid: 11, high: 15 }),
      ribbonCount: particleBudget({ low: 9, mid: 14, high: 19 }),
      distanceMin: diagonal * 0.2,
      distanceMax: diagonal * 0.68,
      angleSpread: Math.PI * 2, // ledakan ke segala arah
      sizeScale: 1.6,
      lifetimeMs: 2200,
    });

    setTimeout(() => {
      pageEl?.classList.remove("is-gift-zoom");
      onComplete?.();
    }, 1550);
  });
}
