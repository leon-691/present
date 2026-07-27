/**
 * Preferensi motion terpusat.
 *
 * Kenapa modul ini perlu ada: banyak HP Android melaporkan
 * `prefers-reduced-motion: reduce` bukan karena penggunanya benar-benar
 * memintanya, tapi karena mode hemat baterai/performa bawaan OS. Kalau
 * tiap efek (grain, ember, tilt, dst) memanggil matchMedia sendiri-sendiri,
 * situs ini bisa terasa "mati" di banyak Android tanpa pengunjungnya
 * pernah benar-benar minta itu.
 *
 * Modul ini menggabungkan sinyal OS dengan pilihan manual (localStorage,
 * bertahan lintas kunjungan) jadi SATU sumber kebenaran: isMotionReduced().
 * Modul lain tinggal mengimpor fungsi ini.
 */

const STORAGE_KEY = "golden-hour:motion";
const ORDER = ["auto", "full", "reduced"];

let preference = "auto";
let ready = false;

function systemWantsReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resolve() {
  if (preference === "full") return false;
  if (preference === "reduced") return true;
  return systemWantsReduced();
}

function applyToDocument() {
  const reduced = resolve();
  document.documentElement.classList.toggle("motion-reduced", reduced);
  document.documentElement.classList.toggle("motion-full", !reduced);
  document.dispatchEvent(new CustomEvent("motion:change", { detail: { reduced } }));
}

export function isMotionReduced() {
  return resolve();
}

export function initMotionPreference() {
  if (ready) return;
  ready = true;

  try {
    preference = localStorage.getItem(STORAGE_KEY) || "auto";
  } catch {
    // localStorage bisa diblokir (mode privat ketat) -- diamkan, tetap
    // jalan dengan "auto" untuk sesi ini.
  }

  applyToDocument();

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    if (preference === "auto") applyToDocument();
  });
}

function setPreference(next) {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // diamkan -- preferensi berlaku untuk sesi ini saja
  }
  applyToDocument();
}

/**
 * Tombol kecil (ikon aperture) untuk menimpa sinyal OS secara sadar.
 * Siklus 3 keadaan tiap diketuk: auto -> full -> reduced -> auto.
 */
export function initMotionToggle() {
  const btn = document.querySelector("[data-motion-toggle]");
  if (!btn) return;

  const LABELS = {
    auto: "Efek visual: Otomatis",
    full: "Efek visual: Penuh",
    reduced: "Efek visual: Hemat",
  };

  function render() {
    btn.dataset.state = preference;
    btn.setAttribute("aria-label", `${LABELS[preference]}. Ketuk untuk ganti mode.`);
  }

  btn.addEventListener("click", () => {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
    setPreference(next);
    render();
  });

  render();
}
