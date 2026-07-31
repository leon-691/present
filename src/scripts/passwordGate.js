import { burstConfetti } from "./confetti.js";

/**
 * Gerbang PIN numerik.
 * State PIN sengaja di-reset setiap kali gerbang dimasuki kembali.
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
  let successLocked = false;
  const length = password.length;
  const originalClue = messageEl?.textContent ?? "";

  dotsEl.innerHTML = Array.from({ length }, () =>
    `<span class="keypad-dots__dot"></span>`,
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
    successLocked = false;
    dotsEl.classList.remove("is-error", "is-shaking");
    if (messageEl) messageEl.textContent = originalClue;
    renderDots();
  }

  function shakeAndReset() {
    dotsEl.classList.add("is-error", "is-shaking");
    if (messageEl) messageEl.textContent = wrongMessage;

    resetTimer = setTimeout(() => {
      resetTimer = null;
      dotsEl.classList.remove("is-shaking", "is-error");
      if (messageEl) messageEl.textContent = originalClue;
      input = "";
      renderDots();
    }, 450);
  }

  // Reset ketika gerbang benar-benar masuk lagi.
  gateScene?.addEventListener("view:settled", resetGateState);
  // Jaring pengaman: reset juga pada awal transisi masuk. Ini membuat
  // reset tidak bergantung pada transitionend/fallback timer pageFlow.
  gateScene?.addEventListener("view:activated", resetGateState);

  // Kembali ke awal juga harus membersihkan PIN meskipun navigasi terjadi
  // tanpa menunggu event transition. Listener ini berjalan setelah pageFlow
  // menangani tombol yang sama, jadi state pasti bersih saat gerbang aktif lagi.
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-go-start]")) resetGateState();
  });

  function handleKey(key) {
    if (successLocked) return;

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
        successLocked = true;
        burstConfetti(dotsEl);

        // Kosongkan PIN SEBELUM berpindah halaman. Jadi meskipun event
        // view:settled tidak sempat terjadi karena suatu kondisi transisi,
        // ketika kembali ke awal state closure sudah tetap bersih.
        input = "";
        hasStarted = false;
        renderDots();

        setTimeout(() => {
          onSuccess?.();
          // Tetap bersih sebagai safety net setelah navigasi.
          resetGateState();
        }, 500);
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
}
