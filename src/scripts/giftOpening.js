import { isMotionReduced } from "./motionPreference.js";
import { spawnPetalBurst } from "./petalBurst.js";
import { particleBudget } from "./deviceTier.js";

/**
 * Opening kado:
 * - idle wobble tetap ringan
 * - interaksi pertama memberi sedikit "hesitation" sebelum kado terbuka
 * - tutup membuka dengan dorongan ke atas
 * - cahaya + bunga menjadi transisi utama
 * - isi/struktur kado tidak diubah
 */
export function initGiftOpening({ onFirstInteraction, onComplete }) {
  const scene = document.querySelector("#opening");
  const trigger = document.querySelector("[data-gift-trigger]");
  const pageEl = document.querySelector(".page");
  const hintEl = scene?.querySelector("[data-key='openingHint']");
  if (!scene || !trigger) {
    onComplete?.();
    return;
  }

  let hasOpened = false;
  let hintTimer = null;

  const defaultHint = hintEl?.textContent ?? "";

  function clearHintTimer() {
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = null;
    }
  }

  function resetGift() {
    clearHintTimer();
    hasOpened = false;
    trigger.classList.remove("is-opening", "is-hesitating");
    trigger.removeAttribute("aria-disabled");
    pageEl?.classList.remove("is-gift-zoom");
    if (hintEl) {
      hintEl.textContent = defaultHint;
      hintEl.classList.remove("is-opening-hint");
    }
  }

  scene.addEventListener("view:settled", resetGift);

  trigger.addEventListener("click", () => {
    if (hasOpened) return;
    hasOpened = true;
    trigger.setAttribute("aria-disabled", "true");
    onFirstInteraction?.();

    if (isMotionReduced()) {
      onComplete?.();
      return;
    }

    // Fase singkat: kado seperti "menahan" sebelum benar-benar dibuka.
    trigger.classList.add("is-hesitating");
    if (hintEl) {
      hintEl.textContent = "hmm...";
      hintEl.classList.add("is-opening-hint");
    }

    hintTimer = setTimeout(() => {
      trigger.classList.remove("is-hesitating");
      trigger.classList.add("is-opening");

      if (hintEl) {
        hintEl.textContent = "okay okay...";
      }

      pageEl?.classList.add("is-gift-zoom");

      const diagonal = Math.hypot(window.innerWidth, window.innerHeight);

      spawnPetalBurst(trigger.getBoundingClientRect(), {
        flowerCount: particleBudget({ low: 34, mid: 50, high: 68 }),
        distanceMin: diagonal * 0.08,
        distanceMax: diagonal * 0.8,
        angleSpread: Math.PI * 2,
        sizeScale: 3.4,
        lifetimeMs: 2400,
      });

      hintTimer = setTimeout(() => {
        pageEl?.classList.remove("is-gift-zoom");
        onComplete?.();
      }, 1750);
    }, 620);
  });
}
