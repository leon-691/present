/**
 * Deteksi ringan kemampuan device -- dipakai HANYA untuk menyesuaikan
 * JUMLAH elemen dekoratif berat (partikel ambient, radius blur besar),
 * BUKAN untuk mematikan animasi berdasarkan jenis device. Device
 * "rendah" tetap dapat semua animasi, cuma versi yang lebih hemat
 * (lebih sedikit partikel) supaya tetap mulus di kelas menengah ke
 * bawah -- sesuai prinsip "adaptasikan, jangan matikan".
 */
let cachedTier = null;

export function detectDeviceTier() {
  if (cachedTier) return cachedTier;

  const deviceMemory = navigator.deviceMemory; // GB -- tidak semua browser mendukung
  const cores = navigator.hardwareConcurrency;

  let tier = "high";

  if (typeof deviceMemory === "number" && deviceMemory <= 4) {
    tier = "low";
  } else if (typeof cores === "number" && cores <= 4) {
    tier = "low";
  } else if (typeof deviceMemory !== "number" && typeof cores !== "number") {
    // API tidak didukung sama sekali (mis. Safari) -- jangan asumsikan
    // lemah, tapi juga jangan asumsikan device kelas atas. Ambil jalan
    // tengah supaya tetap dapat efek penuh dengan jumlah partikel wajar.
    tier = "mid";
  }

  document.documentElement.classList.add(`tier-${tier}`);
  cachedTier = tier;
  return tier;
}

/** Jumlah partikel ambient yang disarankan untuk tier saat ini. */
export function particleBudget({ low = 10, mid = 18, high = 28 } = {}) {
  const tier = detectDeviceTier();
  if (tier === "low") return low;
  if (tier === "mid") return mid;
  return high;
}
