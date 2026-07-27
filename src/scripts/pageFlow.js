/**
 * Orkestrator navigasi antar-babak. SATU bahasa transisi dipakai di semua
 * perpindahan halaman (letterbox menutup -> tukar konten -> letterbox
 * membuka, dengan light-leak menyapu tepat saat tertutup penuh) --
 * sengaja tidak macam-macam gaya transisi per halaman, supaya terasa
 * seperti satu film yang diarahkan, bukan kumpulan efek lepas-lepas.
 *
 * Kontrak aksesibilitas yang dijaga persis seperti sebelumnya:
 *  - babak nonaktif diberi `inert` + `aria-hidden`, benar-benar tidak bisa
 *    dijangkau keyboard/pembaca layar, bukan cuma disembunyikan visual
 *  - fokus keyboard dipindah ke judul babak baru tiap kali berpindah
 *  - durasi transisi dibaca dari --dur-letterbox, otomatis singkat saat
 *    motion direduksi -- gerak TETAP ada (itu bagaimana pengguna tahu
 *    halaman berpindah), cuma dipersingkat, tidak dihilangkan total
 */

let acts = [];
let currentIndex = -1;
let transitioning = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLetterboxDuration() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--dur-letterbox").trim();
  const ms = parseFloat(raw);
  return Number.isFinite(ms) ? ms : 360;
}

function setInert(el, inert) {
  if (inert) {
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
  } else {
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  }
}

function updateTimecode(index) {
  const fill = document.querySelector(".timecode__fill");
  const label = document.querySelector(".timecode__label");
  const total = acts.length;
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
  if (fill) fill.style.width = `${pct}%`;
  if (label) {
    label.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }
}

function focusIncoming(act) {
  const target = act.querySelector("h1, h2") || act;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
}

async function transitionTo(index, { instant = false } = {}) {
  if (transitioning || index < 0 || index >= acts.length || index === currentIndex) return;
  transitioning = true;

  const outgoing = currentIndex >= 0 ? acts[currentIndex] : null;
  const incoming = acts[index];

  function swap() {
    if (outgoing) {
      outgoing.classList.remove("is-active");
      setInert(outgoing, true);
    }
    incoming.classList.add("is-active");
    setInert(incoming, false);
    currentIndex = index;
    updateTimecode(index);
  }

  if (instant || !outgoing) {
    swap();
    document.dispatchEvent(new CustomEvent("view:settled", { detail: { index, act: incoming } }));
    transitioning = false;
    return;
  }

  const duration = getLetterboxDuration();
  const bars = document.querySelectorAll(".letterbox__bar");
  const leak = document.querySelector(".light-leak");

  bars.forEach((bar) => (bar.style.height = "52%"));
  if (leak) leak.classList.add("is-sweeping");

  await wait(duration);
  swap();
  focusIncoming(incoming);
  if (leak) leak.classList.remove("is-sweeping");
  bars.forEach((bar) => (bar.style.height = "0%"));

  await wait(duration);
  document.dispatchEvent(new CustomEvent("view:settled", { detail: { index, act: incoming } }));
  transitioning = false;
}

function handleDelegatedClick(e) {
  const restartBtn = e.target.closest("[data-restart]");
  if (restartBtn) {
    document.dispatchEvent(new CustomEvent("experience:restart"));
    transitionTo(0);
    return;
  }
  const nextBtn = e.target.closest("[data-next]");
  if (nextBtn) goNext();
}

/** Maju satu babak -- dipakai oleh hampir semua tombol "lanjut". */
export function goNext() {
  transitionTo(currentIndex + 1);
}

/**
 * Dipanggil sekali di awal (main.js), SETELAH babak kenangan dinamis
 * selesai dirender ke DOM -- supaya urutan & jumlah babak sudah final
 * sebelum timecode bar menghitung totalnya.
 */
export function initPageFlow() {
  acts = Array.from(document.querySelectorAll("[data-act]"));
  acts.forEach((act) => setInert(act, true));
  document.addEventListener("click", handleDelegatedClick);
  transitionTo(0, { instant: true });
}
