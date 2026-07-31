import { burstConfetti } from "./confetti.js";

/** PIN gate. State is explicitly cleared whenever the gate is entered again. */
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
  const length = String(password ?? "").length;
  const originalClue = messageEl?.textContent ?? "";

  dotsEl.innerHTML = Array.from({ length }, () => `<span class="keypad-dots__dot"></span>`).join("");
  const dots = [...dotsEl.querySelectorAll(".keypad-dots__dot")];

  function renderDots() {
    dots.forEach((dot, i) => dot.classList.toggle("is-filled", i < input.length));
  }

  function resetGateState() {
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
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
      resetGateState();
    }, 450);
  }

  // Three independent reset paths make the state deterministic: direct
  // page activation, completed transition, and the explicit Go-To-Start
  // signal from pageFlow.
  gateScene?.addEventListener("view:activated", resetGateState);
  gateScene?.addEventListener("view:settled", resetGateState);
  gateScene?.addEventListener("password:reset", resetGateState);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-go-start]")) resetGateState();
  });

  function handleKey(key) {
    if (successLocked) return;

    if (!hasStarted) { hasStarted = true; onFirstInput?.(); }
    if (key === "back") { input = input.slice(0, -1); renderDots(); return; }
    if (input.length >= length) return;

    input += key;
    renderDots();

    if (input.length === length) {
      if (input === String(password)) {
        successLocked = true;
        burstConfetti(dotsEl);
        // Clear immediately, before navigation, so there is never stale PIN state.
        input = "";
        hasStarted = false;
        renderDots();
        setTimeout(() => {
          onSuccess?.();
          resetGateState();
        }, 500);
      } else {
        shakeAndReset();
      }
    }
  }

  keypadEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (btn) handleKey(btn.dataset.key);
  });

  window.addEventListener("keydown", (e) => {
    if (/^[0-9]$/.test(e.key)) handleKey(e.key);
    if (e.key === "Backspace") handleKey("back");
  });
}
