import { burstConfetti } from "./confetti.js";

/**
 * Menyalakan gerbang kata sandi berbasis PIN numerik.
 * onSuccess() dipanggil sekali saat kode benar.
 */
export function initPasswordGate({ password, wrongMessage, onSuccess, onFirstInput }) {
  const dotsEl = document.querySelector("[data-gate-dots]");
  const keypadEl = document.querySelector("[data-gate-keypad]");
  const messageEl = document.querySelector("[data-gate-message]");

  if (!dotsEl || !keypadEl) return;

  let input = "";
  let hasStarted = false;
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

  function shakeAndReset() {
    dotsEl.classList.add("is-error");
    dotsEl.classList.add("is-shaking");
    if (messageEl) messageEl.textContent = wrongMessage;
    setTimeout(() => {
      dotsEl.classList.remove("is-shaking");
      dotsEl.classList.remove("is-error");
      if (messageEl) messageEl.textContent = originalClue;
      input = "";
      renderDots();
    }, 450);
  }

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
