import { content } from "../data/content.js";
import { isMotionReduced } from "./motionPreference.js";

/**
 * Efek "sorotan baca" di surat panjang: kalimat yang PALING DEKAT ke
 * tengah container menyala penuh & diketik huruf demi huruf, sisanya
 * meredup. Jangkauan sorotan dihitung dari jarak piksel NYATA antar
 * kalimat di layar (bukan persentase tinggi container) -- pendekatan
 * persentase sempat bikin beberapa kalimat menyala bersamaan kalau
 * jarak antar kalimat tidak seragam.
 */

let scrollEl, headingEl, sentences = [];
let ticking = false;

function lockHeightsThenClear() {
  // Kalimat diukur dalam keadaan PENUH dulu -- supaya posisi/jaraknya
  // akurat untuk perhitungan sorotan sejak awal -- baru tinggi aslinya
  // dikunci lewat min-height dan teksnya dikosongkan. Kalau langsung
  // dikosongkan tanpa dikunci, elemen collapse ke tinggi 0 dan
  // margin-nya "menyatu" dengan tetangganya, merusak semua jarak yang
  // dipakai efek ini.
  sentences.forEach((el) => {
    const height = el.getBoundingClientRect().height;
    el.style.minHeight = `${height}px`;
    el.textContent = "";
    el.dataset.typed = "";
  });
}

function typeSentence(el) {
  if (el.dataset.typed === "true") return;
  el.dataset.typed = "true";

  const text = el.dataset.fullText;
  el.classList.add("is-typing");
  let i = 0;

  (function typeChar() {
    el.textContent = text.slice(0, i);
    i++;
    if (i <= text.length) {
      setTimeout(typeChar, 16 + Math.random() * 14);
    } else {
      el.classList.remove("is-typing");
    }
  })();
}

function updateSpotlight() {
  const containerRect = scrollEl.getBoundingClientRect();
  const focusY = containerRect.top + containerRect.height / 2;

  // Pitch = jarak nyata (piksel) antar pusat dua kalimat pertama --
  // dipakai sebagai satuan "berapa dekat dianggap aktif", otomatis
  // menyesuaikan ukuran font/line-height/viewport tanpa perlu di-tune
  // ulang manual.
  let pitch = 140;
  if (sentences.length > 1) {
    const r0 = sentences[0].getBoundingClientRect();
    const r1 = sentences[1].getBoundingClientRect();
    const measured = Math.abs(r1.top + r1.height / 2 - (r0.top + r0.height / 2));
    if (measured > 0) pitch = measured;
  }
  const activeRange = pitch * 0.55;

  sentences.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const isActive = Math.abs(center - focusY) < activeRange;
    el.classList.toggle("is-active", isActive);
    if (isActive) typeSentence(el);
  });
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateSpotlight();
    ticking = false;
  });
}

function handleSettled(e) {
  if (e.detail.act?.dataset.act !== "surat") return;
  headingEl.classList.add("is-revealed");
  updateSpotlight();
}

function reset() {
  scrollEl.scrollTop = 0;
  headingEl.classList.remove("is-revealed");
  sentences.forEach((el) => el.classList.remove("is-active", "is-typing"));
  if (!isMotionReduced()) lockHeightsThenClear();
}

export function initLetterScrub() {
  const root = document.querySelector('[data-act="surat"]');
  if (!root) return;

  scrollEl = root.querySelector("[data-letter-scroll]");
  headingEl = root.querySelector("[data-letter-heading]");
  const bodyEl = root.querySelector("[data-letter-body]");
  const restartBtn = root.querySelector("[data-restart]");

  headingEl.textContent = content.letterHeading;
  restartBtn.textContent = content.closingButton;

  bodyEl.innerHTML = "";
  content.letterBody.forEach((sentenceText) => {
    const p = document.createElement("p");
    p.className = "letter-sentence";
    p.dataset.fullText = sentenceText;
    p.textContent = sentenceText; // tampil penuh dulu -- lihat lockHeightsThenClear()
    bodyEl.appendChild(p);
  });
  sentences = Array.from(bodyEl.querySelectorAll(".letter-sentence"));

  if (isMotionReduced()) {
    sentences.forEach((el) => el.classList.add("is-active"));
  } else {
    lockHeightsThenClear();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  // Micro-interaction "menyegel surat" -- cincin cahaya sekali pancar,
  // berjalan PARALEL dengan navigasi pageFlow.js (lewat [data-restart]),
  // tidak menunda ataupun mengubah kapan halaman benar-benar berpindah.
  restartBtn.addEventListener("click", () => {
    if (isMotionReduced()) return;
    restartBtn.classList.add("is-sealing");
    setTimeout(() => restartBtn.classList.remove("is-sealing"), 700);
  });

  document.addEventListener("view:settled", handleSettled);
  document.addEventListener("experience:restart", reset);

  if (root.classList.contains("is-active")) updateSpotlight();
}
