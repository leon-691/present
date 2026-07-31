import { burstConfetti } from "./confetti.js";

/**
 * Gerbang PIN numerik.
 * Reset dilakukan setiap kali halaman gerbang selesai ditampilkan lagi,
 * sehingga kembali ke awal selalu memberi PIN kosong seperti sesi baru.
 */
export function initPasswordGate({ password, wrongMessage, onSuccess, onFirstInput }) {
  const scene = document.querySelector("#gerbang");
  const dotsEl = document.querySelector("[data-gate-dots]");
  const keypadEl = document.querySelector("[data-gate-keypad]");
  const messageEl = document.querySelector("[data-gate-message]");

  if (!scene || !dotsEl || !keypadEl) return;

  let input = "";
  let hasStarted = false;
  let resetTimer = null;
  const length = password.length;
  const originalClue = messageEl?.textContent ?? "";

  dotsEl.innerHTML = Array.from({ length }, () =>
    `<span class="keypad-dots__dot"></span>`,
  ).join("");
  const dots = [...dotsEl.querySelectorAll(".keypad-dots__dot")];

  function renderDots() {
    dots.forEach((dot, i) => dot.classList.toggle("is-filled", i < input.length));
  }

  function resetGate() {
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
    dotsEl.classList.add("is-error", "is-shaking");
    if (messageEl) messageEl.textContent = wrongMessage;
    resetTimer = setTimeout(() => {
      resetTimer = null;
      resetGate();
    }, 450);
  }

  function handleKey(key) {
    if (!scene.classList.contains("is-active")) return;

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
        // Kosongkan state segera. Kalau user kembali ke awal sebelum transisi
        // selesai, PIN lama tetap tidak akan ikut terbawa.
        input = "";
        hasStarted = false;
        renderDots();
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

  window.addEventListener("keydown", (e) => {
    if (/^[0-9]$/.test(e.key)) handleKey(e.key);
    if (e.key === "Backspace") handleKey("back");
  });

  scene.addEventListener("view:settled", resetGate);
  resetGate();
}
