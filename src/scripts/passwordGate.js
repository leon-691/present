import { burstConfetti } from "./confetti.js";

/**
 * Menyalakan gerbang kata sandi berbasis PIN numerik.
 * onSuccess() dipanggil sekali saat kode benar.
 */
export function initPasswordGate({ password, wrongMessage, onSuccess, onFirstInput }) {
  const dotsEl = document.querySelector("[data-gate-dots]");
  const keypadEl = document.querySelector("[data-gate-keypad]");
  const messageEl = document.querySelector("[data-gate-message]");
  const gateScene = document.querySelector("#gerbang");

  if (!dotsEl || !keypadEl) return;

  let input = "";
  let hasStarted = false;
  let resetTimer = null;
  const length = password.length;
  const originalClue = messageEl?.textContent ?? "";

  // Bangun titik indikator sebanyak panjang password
  dotsEl.innerHTML = Array.from({ length }, () =>
    `<span class="keypad-dots__dot"></span>`
  ).join("");
  const dots = [...dotsEl.querySelectorAll(".keypad-dots__dot")];

  function renderDots() {
    dots.forEach((dot, i) => dot.classList.toggle("is-filled", i < input.length));
  }

  function resetGateState() {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }

    input = "";
    hasStarted = false;
    dotsEl.classList.remove("is-error", "is-shaking");
    if (messageEl) messageEl.textContent = originalClue;
    renderDots();
  }

  function shakeAndReset() {
    dotsEl.classList.add("is-error");
    dotsEl.classList.add("is-shaking");
    if (messageEl) messageEl.textContent = wrongMessage;
    resetTimer = setTimeout(() => {
      resetTimer = null;
      dotsEl.classList.remove("is-shaking");
      dotsEl.classList.remove("is-error");
      if (messageEl) messageEl.textContent = originalClue;
      input = "";
      renderDots();
    }, 450);
  }

  // pageFlow mengaktifkan kembali halaman gerbang saat pengguna memilih
  // "Kembali ke Awal". Reset state di sini supaya PIN lama tidak tertinggal
  // di closure modul dan terlihat seperti sudah terisi ketika gerbang dibuka
  // lagi. Ini sengaja dipicu saat halaman benar-benar selesai masuk, bukan
  // saat meninggalkannya, agar state tidak berubah di tengah transisi.
  gateScene?.addEventListener("view:settled", resetGateState);

  function handleKey(key) {
    if (!hasStarted) {
      hasStarted = true;
      onFirstInput?.();
    }

    if (key === "back") {
      input = input.slice(0, -1);
      renderDots();
      return;
    }
    if (input.length >= length) return;

    input += key;
    renderDots();

    if (input.length === length) {
      if (input === password) {
        burstConfetti(dotsEl);
        setTimeout(onSuccess, 500);
      } else {
        shakeAndReset();
      }
    }
  }

  keypadEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (!btn) return;
    handleKey(btn.dataset.key);
  });

  // Dukungan keyboard fisik untuk aksesibilitas
  window.addEventListener("keydown", (e) => {
    if (/^[0-9]$/.test(e.key)) handleKey(e.key);
    if (e.key === "Backspace") handleKey("back");
  });
}
