/**
 * Preferensi motion terpusat.
 *
 * Kenapa modul ini ada: sebelumnya tiap fitur (flowerIntro, confetti,
 * tiltEffect, letterScrub) memanggil `matchMedia("(prefers-reduced-motion:
 * reduce)")` sendiri-sendiri. Itu sebenarnya praktik aksesibilitas yang
 * benar SECARA UMUM -- tapi banyak HP Android melaporkan
 * prefers-reduced-motion:reduce bukan karena penggunanya sengaja minta
 * itu, melainkan karena mode hemat baterai/performa bawaan OS (mis.
 * MIUI "Hapus Animasi", atau skala animasi di Opsi Pengembang yang
 * di-set ke 0 oleh sebagian pengguna power-user). Akibatnya hampir
 * semua animasi situs ini mati di Android tanpa pengunjungnya pernah
 * benar-benar memintanya.
 *
 * Modul ini menggabungkan sinyal OS dengan pilihan manual pengguna
 * (disimpan di localStorage, bertahan lintas kunjungan) jadi SATU
 * sumber kebenaran: `isMotionReduced()`. Modul lain tinggal
 * mengimpor fungsi ini alih-alih memanggil matchMedia sendiri-sendiri.
 *
 * Class `motion-reduced` / `motion-full` juga ditambahkan ke <html>
 * supaya CSS bisa ikut bereaksi (lihat variables.css & base.css --
 * class ini sengaja dibuat lebih spesifik daripada media query
 * `prefers-reduced-motion`, supaya pilihan manual pengguna menang atas
 * sinyal OS yang keliru).
 */

const STORAGE_KEY = "untuk-adik:motion-preference"; // "auto" | "full" | "reduced"

let currentPreference = "auto";
let initialized = false;

function systemPrefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resolve() {
  if (currentPreference === "full") return false;
  if (currentPreference === "reduced") return true;
  return systemPrefersReduced();
}

function applyToDocument() {
  const reduced = resolve();
  document.documentElement.classList.toggle("motion-reduced", reduced);
  document.documentElement.classList.toggle("motion-full", !reduced);
  document.dispatchEvent(new CustomEvent("motion:change", { detail: { reduced } }));
}

/**
 * Nilai motion yang berlaku SEKARANG (sudah menggabungkan pilihan
 * manual + sinyal OS). Aman dipanggil kapan saja setelah
 * initMotionPreference() dijalankan sekali di awal.
 */
export function isMotionReduced() {
  return resolve();
}

/** Setup awal -- dipanggil sekali paling awal di main.js. */
export function initMotionPreference() {
  if (initialized) return { isReduced: isMotionReduced, getPreference: () => currentPreference, setPreference };
  initialized = true;

  try {
    currentPreference = localStorage.getItem(STORAGE_KEY) || "auto";
  } catch {
    // localStorage bisa diblokir (mis. mode privat ketat) -- diamkan,
    // tetap jalan dengan default "auto" untuk sesi ini.
  }

  applyToDocument();

  // Selama masih "auto", tetap ikuti perubahan sinyal OS secara live
  // (mis. pengguna menyalakan mode hemat baterai saat situs sudah
  // terbuka).
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    if (currentPreference === "auto") applyToDocument();
  });

  return { isReduced: isMotionReduced, getPreference: () => currentPreference, setPreference };
}

function setPreference(next) {
  currentPreference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // diamkan -- preferensi tetap berlaku untuk sesi ini saja
  }
  applyToDocument();
}

/**
 * Tombol kecil "Efek visual: Otomatis/Penuh/Hemat" -- memberi
 * pengunjung kendali sadar untuk menimpa sinyal OS yang mungkin keliru
 * (lihat catatan di atas). Siklus 3 keadaan tiap diketuk.
 */
export function initMotionToggle() {
  const btn = document.querySelector("[data-motion-toggle]");
  if (!btn) return;

  const LABELS = {
    auto: "Efek visual: Otomatis",
    full: "Efek visual: Penuh",
    reduced: "Efek visual: Hemat",
  };
  const ORDER = ["auto", "full", "reduced"];

  function render() {
    const pref = currentPreference;
    btn.dataset.state = pref;
    btn.setAttribute("aria-label", `${LABELS[pref]}. Ketuk untuk ganti mode.`);
  }

  btn.addEventListener("click", () => {
    const next = ORDER[(ORDER.indexOf(currentPreference) + 1) % ORDER.length];
    setPreference(next);
    render();
  });

  render();
}
