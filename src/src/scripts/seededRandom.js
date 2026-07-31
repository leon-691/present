/**
 * PRNG kecil berbasis seed (mulberry32) -- dipakai supaya dekorasi
 * "acak" seperti rotasi polaroid & posisi washi tape konsisten untuk
 * foto yang sama tiap kali halaman dirender ulang, bukan berubah-ubah
 * dan terasa "berkedip" tiap reload.
 */
export function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed angka dari string (mis. path foto) -- supaya seed stabil per foto. */
export function seedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Angka acak (tapi konsisten) di antara min..max, dari seed string. */
export function seededRange(str, min, max) {
  const rand = createSeededRandom(seedFromString(str));
  return min + rand() * (max - min);
}
