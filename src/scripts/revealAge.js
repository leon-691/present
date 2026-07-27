import { content } from "../data/content.js";
import { goNext } from "./pageFlow.js";
import { burstEmbers } from "./confettiEmber.js";
import { isMotionReduced } from "./motionPreference.js";

let numberEl;
let hasAnimatedOnce = false;

function animateCountUp() {
  if (!numberEl || isMotionReduced() || typeof window.gsap === "undefined") return;
  const target = Number(content.age);
  if (!Number.isFinite(target)) return;

  const counter = { value: 0 };
  window.gsap.to(counter, {
    value: target,
    duration: 1.1,
    ease: "power2.out",
    onUpdate: () => {
      numberEl.textContent = Math.round(counter.value);
    },
  });
}

function handleSettled(e) {
  if (hasAnimatedOnce || e.detail.act?.dataset.act !== "reveal") return;
  hasAnimatedOnce = true;
  animateCountUp();
}

// Momen besar kedua (setelah kode PIN benar): flip singkat pada angka +
// ledakan ember, ditunda sebentar supaya jatuh TEPAT saat halaman reveal
// sudah kelihatan usai transisi letterbox, bukan di halaman konfirmasi.
function handleConfirmYes() {
  goNext();
  if (numberEl) {
    numberEl.classList.remove("is-flipping");
    void numberEl.offsetWidth;
    numberEl.classList.add("is-flipping");
  }
  setTimeout(() => burstEmbers(numberEl), 300);
}

export function initRevealAge() {
  const root = document.querySelector('[data-act="reveal"]');
  if (!root) return;

  numberEl = root.querySelector("[data-reveal-number]");
  root.querySelector("[data-reveal-prefix]").textContent = content.revealPrefix;
  root.querySelector("[data-reveal-suffix]").textContent = content.revealSuffix;
  root.querySelector("[data-reveal-button]").textContent = content.revealButton;

  // Nilai aman langsung ditampilkan -- dipakai kalau GSAP gagal dimuat
  // atau motion sedang direduksi. Animasi hitung-naik di atas ini cuma
  // progressive enhancement.
  if (numberEl) numberEl.textContent = content.age;

  // Animasi hitung-naik cuma sekali seumur kunjungan (kejutan pertama),
  // bukan diulang tiap kali halaman ini disinggahi lagi lewat "kembali
  // ke awal") -- lihat flag hasAnimatedOnce di atas. Flip+ledakan di
  // bawah SEBALIKNYA memang diulang tiap kali confirm "yess" ditekan.
  document.addEventListener("view:settled", handleSettled);
  document.addEventListener("confirm:yes", handleConfirmYes);
}
