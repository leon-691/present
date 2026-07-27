import { isMotionReduced } from "./motionPreference.js";

/**
 * Efek "sorotan baca" untuk surat panjang: kalimat yang paling
 * dekat ke tengah layar menyala (warna biru, penuh) dan diketik
 * huruf demi huruf, yang lain meredup. Dihitung dari posisi elemen
 * saat scroll, bukan IntersectionObserver biasa, supaya terasa
 * mengikuti posisi baca.
 */
export function initLetterScrub() {
  const container = document.querySelector("[data-scroll-container]");
  const sentences = [...document.querySelectorAll(".letter-sentence")];
  const heading = document.querySelector(".letter-heading");
  const letterView = document.querySelector("#surat");

  initClosingSeal();

  if (!container || !sentences.length) {
    revealHeadingOnSettle(letterView, heading);
    return;
  }

  if (isMotionReduced()) {
    sentences.forEach((el) => el.classList.add("is-active"));
    revealHeadingOnSettle(letterView, heading);
    return;
  }

  // Simpan teks asli sebelum dikosongkan, supaya bisa diketik ulang
  // huruf demi huruf begitu kalimatnya pertama kali "disorot".
  // Tinggi elemen dikunci dulu SEBELUM teksnya dikosongkan -- kalau
  // tidak, elemen kosong akan collapse ke tinggi 0 dan margin-nya
  // "collapse" bareng elemen sebelah, merusak semua perhitungan
  // posisi yang dipakai efek sorotan-baca ini.
  const fullTexts = new WeakMap();
  sentences.forEach((el) => {
    fullTexts.set(el, el.textContent);
    const naturalHeight = el.getBoundingClientRect().height;
    el.style.minHeight = `${naturalHeight}px`;
    el.textContent = "";
  });

  function typeSentence(el) {
    if (el.dataset.typed) return;
    el.dataset.typed = "true";

    const text = fullTexts.get(el) ?? "";
    el.classList.add("is-typing");
    let i = 0;

    (function typeChar() {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        setTimeout(typeChar, 16 + Math.random() * 14);
      } else {
        el.classList.remove("is-typing");
      }
    })();
  }

  let ticking = false;

  function update() {
    const containerRect = container.getBoundingClientRect();
    const viewportCenter = containerRect.top + containerRect.height / 2;

    // Radius sorotan dihitung dari jarak NYATA antar-kalimat di
    // layar (bukan persentase tinggi container -- itu tidak
    // berhubungan dengan spacing konten, dan sempat bikin banyak
    // kalimat aktif sekaligus). Dengan ini, kira-kira cuma satu
    // kalimat yang aktif di satu waktu, seberapa pun jarak asli
    // antar-kalimatnya (svh menyesuaikan tinggi layar otomatis).
    let pitch = 140;
    if (sentences.length > 1) {
      const r0 = sentences[0].getBoundingClientRect();
      const r1 = sentences[1].getBoundingClientRect();
      pitch = Math.abs((r1.top + r1.height / 2) - (r0.top + r0.height / 2)) || pitch;
    }
    const activeRange = pitch * 0.55;

    sentences.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elCenter - viewportCenter);
      const isActive = distance < activeRange;

      el.classList.toggle("is-active", isActive);
      if (isActive) typeSentence(el);
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  container.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // Hitung ulang tepat saat halaman surat benar-benar selesai
  // bertransisi masuk (bukan sekali di awal load halaman, saat
  // halaman ini belum tampil dan geometrinya belum akurat).
  letterView?.addEventListener("view:settled", update);
  revealHeadingOnSettle(letterView, heading);

  // Jaga-jaga kalau halaman ini entah bagaimana sudah aktif duluan
  // saat modul ini diinisialisasi.
  if (letterView?.classList.contains("is-active")) update();
}

/** Judul surat "muncul" halus sekali, tepat saat halaman ini settle. */
function revealHeadingOnSettle(letterView, heading) {
  if (!heading) return;
  const reveal = () => heading.classList.add("is-revealed");
  if (letterView?.classList.contains("is-active")) {
    reveal();
    return;
  }
  letterView?.addEventListener("view:settled", reveal, { once: true });
}

/**
 * Micro-interaction "menyegel surat" -- cincin cahaya hangat sekali
 * pancar saat tombol "kembali ke awal" ditekan. Murni dekoratif,
 * dijalankan PARALEL dengan listener navigasi pageFlow.js (lewat
 * data-go-start) -- tidak menunda ataupun mengubah kapan halaman
 * benar-benar berpindah.
 */
function initClosingSeal() {
  const btn = document.querySelector("#surat [data-go-start]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (isMotionReduced()) return;
    btn.classList.add("is-sealing");
    setTimeout(() => btn.classList.remove("is-sealing"), 700);
  });
}
