import { content } from "../data/content.js";
import { goNext } from "./pageFlow.js";
import { burstEmbers } from "./confettiEmber.js";

// Persis tata letak referensi: 1-9, spasi kosong (bukan tombol "hapus
// semua" yang tidak pernah ada), 0, lalu hapus-satu-digit.
const KEY_LAYOUT = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "spacer", "0", "back"];

let buffer = [];
let locked = false;
let hasStarted = false;
let root, dotsEl, keypadEl, hintEl, originalClue;

function isGateActive() {
  return root?.classList.contains("is-active");
}

function renderDots() {
  dotsEl.innerHTML = "";
  const length = String(content.password).length;
  for (let i = 0; i < length; i++) {
    const tick = document.createElement("span");
    tick.className = "frame-dots__tick";
    if (i < buffer.length) tick.classList.add("is-filled");
    dotsEl.appendChild(tick);
  }
}

// Baris hint yang sama menampilkan clue secara default, lalu untuk
// sesaat menampilkan pesan salah sebelum kembali ke clue -- persis satu
// baris yang sama seperti referensi, bukan dua baris terpisah.
function shakeAndReset() {
  dotsEl.classList.add("is-error", "is-shaking");
  hintEl.textContent = content.gateWrongMessage;
  setTimeout(() => {
    dotsEl.classList.remove("is-shaking", "is-error");
    hintEl.textContent = originalClue;
    buffer = [];
    renderDots();
  }, 450);
}

function handleSuccess() {
  locked = true;
  burstEmbers(dotsEl);
  setTimeout(() => goNext(), 500);
}

function handleKey(key) {
  if (locked || !isGateActive()) return;

  if (!hasStarted) {
    hasStarted = true;
    document.dispatchEvent(new CustomEvent("gate:first-interaction"));
  }

  if (key === "back") {
    buffer.pop();
    renderDots();
    return;
  }

  const target = String(content.password);
  if (buffer.length >= target.length) return;

  buffer.push(key);
  renderDots();

  if (buffer.length === target.length) {
    if (buffer.join("") === target) handleSuccess();
    else shakeAndReset();
  }
}

function buildKeypad() {
  keypadEl.innerHTML = "";
  KEY_LAYOUT.forEach((key) => {
    if (key === "spacer") {
      const spacer = document.createElement("span");
      spacer.className = "keypad__spacer";
      spacer.setAttribute("aria-hidden", "true");
      keypadEl.appendChild(spacer);
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "keypad__key";

    if (key === "back") {
      btn.classList.add("keypad__key--action");
      btn.textContent = "⌫";
      btn.setAttribute("aria-label", "Hapus satu digit");
    } else {
      btn.textContent = key;
      btn.setAttribute("aria-label", `Digit ${key}`);
    }

    btn.addEventListener("click", () => handleKey(key));
    keypadEl.appendChild(btn);
  });
}

function handlePhysicalKeyboard(e) {
  if (/^[0-9]$/.test(e.key)) handleKey(e.key);
  else if (e.key === "Backspace") handleKey("back");
}

function reset() {
  buffer = [];
  locked = false;
  hasStarted = false;
  dotsEl.classList.remove("is-error", "is-shaking");
  hintEl.textContent = originalClue;
  renderDots();
}

export function initPasswordGate() {
  root = document.querySelector('[data-act="gerbang"]');
  if (!root) return;

  dotsEl = root.querySelector("[data-gate-dots]");
  keypadEl = root.querySelector("[data-gate-keypad]");
  hintEl = root.querySelector("[data-gate-hint]");

  root.querySelector("[data-gate-subtitle]").textContent = content.gateSubtitle;
  originalClue = content.passwordClue;
  hintEl.textContent = originalClue;

  buildKeypad();
  renderDots();

  window.addEventListener("keydown", handlePhysicalKeyboard);
  document.addEventListener("experience:restart", reset);
}
