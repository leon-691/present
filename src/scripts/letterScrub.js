import { isMotionReduced } from "./motionPreference.js";
import { spawnPetalBurst } from "./petalBurst.js";

/**
 * Surat sekarang dibuka lewat ritual drag amplop+tarik kertas (lihat
 * envelopeReveal.js) -- teksnya ditampilkan statis begitu kertas selesai
 * ditarik keluar, TANPA efek ketik/sorot-baca (dihapus atas permintaan).
 * Modul ini sekarang cuma menangani satu micro-interaction sisa: kado
 * "disegel" saat tombol "kembali ke awal" ditekan.
 */
export function initLetterScrub() {
  initClosingSeal();
}

/**
 * Micro-interaction "menyegel surat" -- cincin cahaya hangat sekali
 * pancar + hembusan kelopak pelan (bukan ledakan penuh spt kado dibuka --
 * lihat petalBurst.js) saat tombol "kembali ke awal" ditekan. Murni
 * dekoratif, dijalankan PARALEL dengan listener navigasi pageFlow.js
 * (lewat data-go-start) -- tidak menunda ataupun mengubah kapan halaman
 * benar-benar berpindah.
 */
function initClosingSeal() {
  const btn = document.querySelector("#surat [data-go-start]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (isMotionReduced()) return;
    btn.classList.add("is-sealing");
    setTimeout(() => btn.classList.remove("is-sealing"), 700);

    spawnPetalBurst(btn.getBoundingClientRect(), {
      flowerCount: 5,
      ribbonCount: 4,
      distanceMin: 60,
      distanceMax: 170,
      angleCenter: -Math.PI / 2, // condong ke atas, spt tertiup pelan
      angleSpread: Math.PI * 0.9,
      lifetimeMs: 1600,
    });
  });
}
