import { content } from "../data/content.js";
import { initPasswordGate } from "./passwordGate.js";
import { initConfirmStep } from "./confirmStep.js";
import { initMusicPlayer } from "./musicPlayer.js";
import { initSpotifyPlayer } from "./spotifyPlayer.js";
import { initPageFlow } from "./pageFlow.js";
import { initLetterScrub } from "./letterScrub.js";
import { initEnvelopeReveal } from "./envelopeReveal.js";
import { initTiltEffect } from "./tiltEffect.js";
import { initTouchTilt } from "./touchTilt.js";
import { initGiftOpening } from "./giftOpening.js";
import { burstConfetti } from "./confetti.js";
import { initMotionPreference, initMotionToggle, isMotionReduced } from "./motionPreference.js";
import { detectDeviceTier } from "./deviceTier.js";
import { seededRange } from "./seededRandom.js";
import { initAmbientBackground } from "./ambientBackground.js";
import { initCursorGlow } from "./cursorGlow.js";
import { initRippleEffect } from "./rippleEffect.js";

/** Isi semua elemen [data-key] dengan teks dari content.js */
function populateStaticText() {
  document.querySelectorAll("[data-key]").forEach((el) => {
    const key = el.dataset.key;
    if (content[key] !== undefined) el.textContent = content[key];
  });

  // Teks tahap-2 scene surat (setelah amplop dibuka, ganti jadi "tarik
  // kertasnya keluar") -- disimpan sbg data-attribute, dipakai
  // envelopeReveal.js saat envelope-nya di-drag terbuka.
  const envelopeHintEl = document.querySelector("[data-envelope-hint]");
  if (envelopeHintEl) envelopeHintEl.dataset.paperHint = content.envelopePaperHint;

  document.title = `Untuk ${content.friendName}`;

  // Label kado "For {friendName}" -- sengaja dibangun dari friendName di
  // sini (bukan field content.js terpisah), supaya nama tetap satu sumber
  // kebenaran: ganti friendName sekali, ikut berubah di semua tempat.
  const openingLabelEl = document.querySelector("[data-opening-label]");
  if (openingLabelEl) openingLabelEl.textContent = `For ${content.friendName}`;
}

/**
 * Bangun satu halaman (.view) untuk tiap kenangan -- satu foto +
 * satu kalimat per halaman, persis pola di video referensi (bukan
 * grid foto terpisah dari teks). Disisipkan ke placeholder-nya di
 * HTML supaya urutan halaman di DOM tetap benar (dipakai pageFlow
 * untuk urutan navigasi).
 *
 * Tiap foto dibungkus gaya polaroid + selotip washi. Rotasi &
 * posisi selotip "acak" tapi konsisten (seeded dari path foto)
 * lewat seededRandom.js -- supaya kemiringannya selalu sama tiap
 * kali halaman dirender ulang, bukan berubah-ubah tiap reload.
 */
function renderMemoryPages() {
  const placeholder = document.querySelector("[data-memory-pages]");
  if (!placeholder) return;

  const fragment = document.createDocumentFragment();

  content.memories.forEach(({ src, line }, i) => {
    const view = document.createElement("section");
    view.className = "view view--liquid section--memory";
    view.id = `kenangan-${i + 1}`;

    const rotate = seededRange(src, -6, 6).toFixed(2);
    const tapeRotate = seededRange(`${src}:tape`, -16, 16).toFixed(2);
    const tapeLeft = seededRange(`${src}:tape-pos`, 20, 60).toFixed(1);
    const tapeSide = i % 2 === 0 ? "left" : "right";

    view.innerHTML = `
      <figure class="photo-card" style="--polaroid-rotate:${rotate}deg">
        <span class="washi-tape washi-tape--${tapeSide}" style="--tape-rotate:${tapeRotate}deg; --tape-left:${tapeLeft}%" aria-hidden="true"></span>
        <div class="photo-card__tilt">
          <div class="photo-card__frame">
            <img src="${src}" alt="${line}" loading="lazy"
                 onerror="this.closest('.photo-card__frame').innerHTML='Taruh foto di assets/images/'" />
          </div>
        </div>
      </figure>
      <p class="memory-line">${line}</p>
      <button class="btn" data-next>${content.continueLabel}</button>
    `;
    fragment.appendChild(view);
  });

  placeholder.replaceWith(fragment);
}

/** Render surat panjang sbg paragraf statis (tanpa efek ketik/sorot baca --
 * dihapus atas permintaan; teks langsung terbaca penuh begitu kertas surat
 * selesai ditarik keluar, lihat envelopeReveal.js). */
function renderLetterBody() {
  const container = document.querySelector("[data-letter-body]");
  if (!container) return;

  container.innerHTML = content.letterBody
    .map((sentence) => `<p class="letter-sentence">${sentence}</p>`)
    .join("");
}

function setupGate(music, pageFlow) {
  initPasswordGate({
    password: content.password,
    wrongMessage: content.gateWrongMessage,
    // Musik sudah mungkin ter-unlock lebih awal lewat ketukan kado (lihat
    // setupGiftOpening) -- unlock() aman dipanggil berulang, cuma no-op
    // kalau audio sudah jalan.
    onFirstInput: () => music.unlock(),
    onSuccess: () => pageFlow.next(),
  });
}

function setupGiftOpening(music, pageFlow) {
  initGiftOpening({
    onFirstInteraction: () => music.unlock(),
    onComplete: () => pageFlow.next(),
  });
}

function setupConfirm(pageFlow) {
  const revealView = document.querySelector("#reveal");
  const revealNumberEl = document.querySelector("[data-reveal-number]");
  // Set langsung sebagai default aman -- dipakai kalau GSAP gagal
  // dimuat (mis. CDN diblokir) atau motion sedang direduksi. Animasi
  // hitung naik di bawah cuma progressive enhancement di atas ini.
  if (revealNumberEl) revealNumberEl.textContent = content.age;

  function animateAgeCountUp() {
    if (!revealNumberEl || typeof window.gsap === "undefined" || isMotionReduced()) return;
    const targetAge = Number(content.age);
    if (!Number.isFinite(targetAge)) return;

    const counter = { value: 0 };
    window.gsap.to(counter, {
      value: targetAge,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        revealNumberEl.textContent = Math.round(counter.value);
      },
    });
  }
  revealView?.addEventListener("view:settled", animateAgeCountUp, { once: true });

  initConfirmStep({
    onConfirm: () => {
      pageFlow.next();
      revealNumberEl?.classList.add("is-flipping");
      setTimeout(() => burstConfetti(revealNumberEl), 300);
    },
  });
}

function init() {
  // Tiap langkah dibungkus try/catch sendiri-sendiri -- kalau satu
  // fitur error (mis. salah format di content.js), fitur lain di
  // halaman ini tetap jalan normal, bukan mati total tanpa pesan.
  let pageFlow;
  let music;
  let spotify;

  const steps = [
    // Harus jadi step PERTAMA: semua modul di bawah (confetti,
    // tiltEffect, dst) membaca isMotionReduced() dari
    // motionPreference.js, jadi nilainya harus sudah siap sebelum
    // step-step lain jalan. detectDeviceTier() juga ditaruh di sini
    // supaya class `tier-*` sudah ada di <html> sebelum CSS lain
    // dievaluasi. (Tiap step di array ini otomatis dibungkus
    // try/catch yang sama lewat forEach di bawah -- lihat komentar
    // di awal fungsi init().)
    ["preferensi motion & device tier", () => {
      initMotionPreference();
      detectDeviceTier();
    }],
    ["konten", () => {
      renderMemoryPages();
      populateStaticText();
      renderLetterBody();
    }],
    ["navigasi halaman", () => {
      pageFlow = initPageFlow();
    }],
    ["musik", () => {
      music = initMusicPlayer({
        src: content.backgroundAudioSrc,
        title: content.backgroundAudioTitle,
        subtitle: content.backgroundAudioSubtitle,
        onBeforePlay: () => spotify?.pause(),
      });

      spotify = initSpotifyPlayer({
        src: content.spotifyEmbedSrc,
        onPlaybackStart: () => music?.pause(),
      });
    }],
    // Kado adalah halaman PERTAMA yang dilihat pengguna -- ketukannya
    // jadi gesture pertama yang sah untuk unlock musik (lebih awal dari
    // gerbang password), lihat setupGiftOpening di atas.
    ["kado pembuka", () => setupGiftOpening(music, pageFlow)],
    ["gerbang", () => setupGate(music, pageFlow)],
    ["konfirmasi", () => setupConfirm(pageFlow)],
    ["scene amplop & tarik kertas", initEnvelopeReveal],
    ["efek surat", initLetterScrub],
    ["efek tilt foto (mouse)", initTiltEffect],
    ["efek tilt foto (sentuh)", initTouchTilt],
    // Catatan desain: momen "wow pertama" dulunya kelopak SVG jatuh
    // otomatis saat load (flowerIntro.js) -- modul itu sudah DIHAPUS
    // total (bukan cuma dinonaktifkan), karena isinya murni ilustrasi
    // SVG bunga yang sudah digantikan foto bunga asli + ledakan kado
    // (giftOpening.js), yang baru terpicu SETELAH Indah mengetuk kado.
    ["atmosfer ambient", initAmbientBackground],
    ["cursor glow & magnetic button", initCursorGlow],
    ["ripple feedback tombol/tuts", initRippleEffect],
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
