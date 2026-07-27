/**
 * Deteksi ringan kemampuan device -- HANYA dipakai untuk menyesuaikan
 * JUMLAH elemen dekoratif berat (partikel ember, grain resolution), BUKAN
 * untuk mematikan animasi berdasarkan jenis device. Prinsipnya: adaptasikan
 * jumlahnya, jangan matikan animasinya.
 */
let cachedTier = null;

export function detectDeviceTier() {
  if (cachedTier) return cachedTier;

  const memory = navigator.deviceMemory; // GB -- tidak semua browser mendukung
  const cores = navigator.hardwareConcurrency;

  let tier = "high";

  if (typeof memory === "number" && memory <= 4) {
    tier = "low";
  } else if (typeof cores === "number" && cores <= 4) {
    tier = "low";
  } else if (typeof memory !== "number" && typeof cores !== "number") {
    // API tidak didukung sama sekali (mis. Safari) -- ambil jalan tengah,
    // jangan asumsikan lemah ataupun kelas atas.
    tier = "mid";
  }

  document.documentElement.classList.add(`tier-${tier}`);
  cachedTier = tier;
  return tier;
}

/** Jumlah partikel ember yang disarankan untuk tier saat ini. */
export function emberBudget({ low = 10, mid = 18, high = 28 } = {}) {
  const tier = detectDeviceTier();
  if (tier === "low") return low;
  if (tier === "mid") return mid;
  return high;
}
