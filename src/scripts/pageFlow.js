import { isMotionReduced } from "./motionPreference.js";

/**
 * Navigasi antar-halaman (page-based, bukan scroll dokumen).
 * Urutan halaman diambil dari urutan .view di DOM secara otomatis --
 * jadi menambah/menghapus halaman di HTML tidak perlu mengubah file ini.
 */
export function initPageFlow() {
  const progressBar = document.querySelector("[data-page-progress]");

  function getPages() {
    return [...document.querySelectorAll(".view")];
  }

  let currentIndex = Math.max(
    getPages().findIndex((el) => el.classList.contains("is-active")),
    0
  );

  function updateProgress(total) {
    if (!progressBar) return;
    const pct = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  }

  // Jalankan callback begitu transisi CSS elemen ini benar-benar
  // selesai (bukan asumsi berdasarkan waktu tetap) -- dipakai untuk
  // membersihkan halaman yang keluar, dan memberi tahu halaman yang
  // masuk kapan dia benar-benar sudah "diam" di posisi akhirnya.
  function afterTransition(el, callback) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      callback();
      el.removeEventListener("transitionend", onEnd);
    };
    const onEnd = (e) => {
      if (e.target === el) finish();
    };
    el.addEventListener("transitionend", onEnd);
    // Fallback kalau transitionend entah bagaimana tidak terpicu.
    // Nilainya dibaca live (bukan disimpan sekali di awal) supaya
    // tetap sinkron kalau pengunjung mengganti toggle "Efek Visual"
    // di tengah sesi -- lihat motionPreference.js. --dur-page under
    // reduced motion sekarang 260ms (dulu 0ms), jadi buffer-nya juga
    // ikut disesuaikan, bukan langsung 0.
    setTimeout(finish, isMotionReduced() ? 400 : 900);
  }

  function activate(index) {
    const pages = getPages();
    if (index < 0 || index >= pages.length) return;
    if (index === currentIndex && pages[index].classList.contains("is-active")) return;

    const outgoing = pages[currentIndex];
    const incoming = pages[index];

    if (outgoing && outgoing !== incoming) {
      outgoing.classList.remove("is-active");
      outgoing.classList.add("is-leaving");
      afterTransition(outgoing, () => outgoing.classList.remove("is-leaving"));
    }

    incoming.classList.add("is-active");
    currentIndex = index;

    // Reset scroll internal (dipakai halaman surat) tiap kali halaman
    // itu ditampilkan lagi, supaya selalu mulai dari atas.
    incoming.querySelector("[data-scroll-container]")?.scrollTo(0, 0);

    // Beri tahu modul lain (mis. efek sorotan-baca di surat) bahwa
    // halaman ini sudah benar-benar tampil penuh -- transisi masuk
    // selesai -- supaya perhitungan posisi/geometri elemen dilakukan
    // di waktu yang tepat, bukan sekali saja di awal load halaman.
    afterTransition(incoming, () => {
      incoming.dispatchEvent(new CustomEvent("view:settled", { bubbles: true }));
    });

    updateProgress(pages.length);
  }

  function next() {
    activate(currentIndex + 1);
  }

  function goToStart() {
    activate(0);
  }

  // Delegasi satu listener untuk semua tombol "lanjut" generik,
  // supaya tiap halaman baru tidak perlu daftar listener sendiri.
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-next]")) next();
    if (e.target.closest("[data-go-start]")) goToStart();
  });

  updateProgress(getPages().length);

  return { next, goToStart, activate };
}
