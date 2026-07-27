import { content } from "../data/content.js";
import { initMotionPreference, initMotionToggle } from "./motionPreference.js";
import { detectDeviceTier } from "./deviceTier.js";
import { renderMemories } from "./memoryRenderer.js";
import { initPageFlow } from "./pageFlow.js";
import { initPasswordGate } from "./passwordGate.js";
import { initConfirmStep } from "./confirmStep.js";
import { initRevealAge } from "./revealAge.js";
import { initMusicPlayer } from "./musicPlayer.js";
import { initLetterScrub } from "./letterScrub.js";
import { initPhotoTilt } from "./photoTilt.js";
import { initIntroSequence } from "./introSequence.js";
import { initFilmGrain } from "./filmGrain.js";
import { initEmberField } from "./emberField.js";
import { initCursorGlow } from "./cursorGlow.js";
import { initRippleEffect } from "./rippleEffect.js";

/**
 * Isi babak-babak sederhana yang cuma butuh teks + tombol "lanjut"
 * (sapaan, pesan-utama, transisi, lagu) lewat [data-key]/[data-key-src].
 * Babak dengan perilaku sendiri (gerbang, konfirmasi, reveal, surat)
 * mengisi teksnya sendiri di modul masing-masing.
 */
function populateStaticText() {
  document.querySelectorAll("[data-key]").forEach((el) => {
    const key = el.dataset.key;
    if (content[key] !== undefined) el.textContent = content[key];
  });
  document.querySelectorAll("[data-key-src]").forEach((el) => {
    const key = el.dataset.keySrc;
    if (content[key] !== undefined) el.src = content[key];
  });

  // Judul tab dipersonalisasi hanya di sisi klien -- <title>/OG di HTML
  // sengaja tetap netral supaya preview link yang dibagikan tidak
  // membocorkan untuk siapa kejutan ini dibuat.
  document.title = `Untuk ${content.friendName}`;
}

function init() {
  // Tiap langkah diisolasi try/catch sendiri -- satu bagian gagal (mis.
  // format content.js keliru) tidak boleh mematikan seluruh situs.
  const steps = [
    ["preferensi motion & device tier", () => {
      initMotionPreference();
      detectDeviceTier();
    }],
    ["konten", () => {
      renderMemories();
      populateStaticText();
    }],
    ["navigasi babak", initPageFlow],
    ["gerbang kata sandi", initPasswordGate],
    ["konfirmasi", initConfirmStep],
    ["reveal umur", initRevealAge],
    ["musik latar", initMusicPlayer],
    ["surat", initLetterScrub],
    ["tilt foto", initPhotoTilt],
    ["intro film-leader", initIntroSequence],
    ["grain", initFilmGrain],
    ["ember ambient", initEmberField],
    ["cursor glow & magnetic button", initCursorGlow],
    ["ripple", initRippleEffect],
    ["toggle efek visual", initMotionToggle],
  ];

  steps.forEach(([label, fn]) => {
    try {
      fn();
    } catch (err) {
      console.error(`Gagal menjalankan bagian "${label}":`, err);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
