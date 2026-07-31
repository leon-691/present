import { isMotionReduced } from "./motionPreference.js";

/**
 * Scene surat: amplop yang di-drag ke atas utk dibuka, lalu kertas surat
 * di dalamnya di-drag lagi ke atas utk ditarik keluar. Baru setelah kertas
 * keluar PENUH, isi surat (judul+teks) ditampilkan -- statis, tanpa efek
 * ketik/sorot-baca (dihapus atas permintaan).
 *
 * Prinsip drag di modul ini (dipakai utk amplop MAUPUN kertas):
 * - Gerakan mengikuti jari 1:1 selama drag aktif (transition dimatikan).
 * - Lepas sebelum melewati threshold -> kembali ke posisi semula ("pegas"
 *   pelan lewat CSS transition), bukan langsung diam di tempat.
 * - Lepas setelah threshold -> "commit": lanjut ke state berikutnya.
 * - Tap/klik singkat (tanpa drag berarti) & aktivasi keyboard (Enter/Space)
 *   TETAP membuka -- fallback aksesibilitas, bukan cara utama (drag adalah
 *   interaksi utama sesuai permintaan, bukan sekadar klik).
 */

function attachDragUp(el, { threshold, maxDrag, onMove, onCommit, onCancel, disabled }) {
  let dragging = false;
  let startY = 0;
  let lastDelta = 0;
  let activePointerId = null;
  let recentPointerSequence = false;

  function move(clientY) {
    if (!dragging) return;
    const raw = clientY - startY;
    lastDelta = Math.max(-maxDrag, Math.min(0, raw));
    const fraction = Math.min(1, Math.abs(lastDelta) / threshold);
    onMove?.(lastDelta, fraction, false);
  }

  function finish() {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    if (Math.abs(lastDelta) > threshold) {
      onCommit?.();
    } else {
      onCancel?.();
    }
    // Jendela singkat supaya klik sintetis yang menyusul pointerup (perilaku
    // browser normal) tidak ikut memicu handler klik di bawah dua kali.
    setTimeout(() => {
      recentPointerSequence = false;
    }, 80);
  }

  el.addEventListener("pointerdown", (e) => {
    if (disabled?.()) return;
    dragging = true;
    recentPointerSequence = true;
    startY = e.clientY;
    lastDelta = 0;
    activePointerId = e.pointerId;
    el.setPointerCapture?.(e.pointerId);
    onMove?.(0, 0, true);
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== activePointerId) return;
    move(e.clientY);
  });
  el.addEventListener("pointerup", (e) => {
    if (e.pointerId !== activePointerId) return;
    finish();
  });
  el.addEventListener("pointercancel", () => {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    onCancel?.();
  });

  // Fallback aksesibilitas: tap tanpa drag berarti & aktivasi keyboard.
  el.addEventListener("click", () => {
    if (recentPointerSequence || disabled?.()) return;
    onCommit?.();
  });
}

export function initEnvelopeReveal() {
  const scene = document.querySelector("#surat");
  const envelope = document.querySelector("[data-envelope]");
  const paperEl = document.querySelector("[data-letter-paper]");
  const contentEl = document.querySelector("[data-letter-content]");
  const decorEl = document.querySelector(".envelope-scene__decor");
  const hintEl = document.querySelector("[data-envelope-hint]");
  if (!scene || !envelope || !paperEl || !contentEl) return;

  const ENV_THRESHOLD = 64;
  const ENV_MAX_DRAG = 200;
  const PAPER_THRESHOLD = 84;
  const PAPER_MAX_DRAG = 240;
  const PEEK_Y = 30; // px, posisi "mengintip" sblm ditarik -- lihat sections.css

  const hintTextEl = hintEl?.querySelector("[data-key='envelopeHint']") ?? null;
  const hintDefaultText = hintTextEl?.textContent ?? "";

  let envelopeOpen = false;
  let paperOut = false;

  // #surat bisa aktif lagi kalau Indah menekan "Kembali ke Awal" lalu maju
  // lagi ke halaman ini di sesi yang sama (pageFlow.goToStart() -> activate(0),
  // lalu next() berkali-kali). Tanpa reset ini, amplop akan tetap dalam wujud
  // "sudah dibuka" dari sesi sebelumnya -- persis pola bug yang sama dengan
  // kotak kado, lihat giftOpening.js.
  function resetScene() {
    envelopeOpen = false;
    paperOut = false;

    envelope.classList.remove("is-committed", "is-dragging");
    envelope.style.transform = "";
    envelope.removeAttribute("aria-hidden");
    envelope.tabIndex = 0;

    paperEl.classList.remove("is-peeking", "is-final", "is-dragging");
    paperEl.style.transform = "";
    paperEl.setAttribute("role", "button");
    paperEl.setAttribute("aria-label", "Tarik kertas surat ke atas untuk mengeluarkannya");
    paperEl.tabIndex = -1;
    contentEl.removeAttribute("tabindex");

    contentEl.classList.remove("is-revealed");
    contentEl.hidden = true;

    decorEl?.classList.remove("is-hidden");

    if (hintTextEl) hintTextEl.textContent = hintDefaultText;
    hintEl?.classList.remove("is-hidden");
  }

  scene.addEventListener("view:settled", resetScene);

  // Enter/Space di kertas (role="button" selama fase "mengintip") --
  // <div> biasa tidak otomatis merespons keyboard spt <button> asli, jadi
  // ditangani manual di sini. Tidak bisa dijadikan <button> sungguhan
  // karena nanti berisi tombol lain (data-go-start) begitu isinya
  // terbuka -- <button> di dalam <button> tidak valid di HTML.
  paperEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!envelopeOpen || paperOut) return;
    e.preventDefault();
    pullPaperOut();
  });

  // ---- AMPLOP -------------------------------------------------------
  attachDragUp(envelope, {
    threshold: ENV_THRESHOLD,
    maxDrag: ENV_MAX_DRAG,
    disabled: () => envelopeOpen,
    onMove: (delta, fraction, justStarted) => {
      if (isMotionReduced()) return;
      if (justStarted) envelope.classList.add("is-dragging");
      const rotate = (delta / ENV_MAX_DRAG) * 5;
      envelope.style.transform = `translate(-50%, -50%) translateY(${delta}px) rotate(${rotate}deg)`;
    },
    onCancel: () => {
      envelope.classList.remove("is-dragging");
      envelope.style.transform = "";
    },
    onCommit: () => openEnvelope(),
  });

  function openEnvelope() {
    if (envelopeOpen) return;
    envelopeOpen = true;
    envelope.classList.remove("is-dragging");
    envelope.style.transform = "";
    envelope.classList.add("is-committed");
    envelope.setAttribute("aria-hidden", "true");
    envelope.tabIndex = -1;

    if (hintTextEl) hintTextEl.textContent = hintEl?.dataset.paperHint || hintDefaultText;

    const revealPaper = () => {
      paperEl.classList.add("is-peeking");
      paperEl.tabIndex = 0;
    };
    if (isMotionReduced()) {
      revealPaper();
    } else {
      // Nyaris seketika (bukan menunggu) -- kertas harus mulai kelihatan
      // TEPAT saat kedua separuh amplop mulai mengelupas, supaya terasa
      // "sudah ada di dalam", bukan muncul belakangan setelah amplop
      // hilang duluan.
      setTimeout(revealPaper, 60);
    }
  }

  // ---- KERTAS SURAT ---------------------------------------------------
  attachDragUp(paperEl, {
    threshold: PAPER_THRESHOLD,
    maxDrag: PAPER_MAX_DRAG,
    disabled: () => !envelopeOpen || paperOut,
    onMove: (delta, fraction, justStarted) => {
      if (isMotionReduced()) return;
      if (justStarted) paperEl.classList.add("is-dragging");
      const y = PEEK_Y + delta;
      const scale = 0.8 + 0.2 * fraction;
      const rotate = (delta / PAPER_MAX_DRAG) * 3;
      paperEl.style.transform = `translate(-50%, calc(-50% + ${y}px)) scale(${scale}) rotate(${rotate}deg)`;
    },
    onCancel: () => {
      paperEl.classList.remove("is-dragging");
      paperEl.style.transform = "";
    },
    onCommit: () => pullPaperOut(),
  });

  function pullPaperOut() {
    if (paperOut) return;
    paperOut = true;
    paperEl.classList.remove("is-dragging", "is-peeking");
    paperEl.style.transform = "";
    paperEl.classList.add("is-final");
    // Kertas sudah bukan "tombol yg ditarik" lagi -- sekarang murni wadah
    // scroll, kontrol sungguhan di dalamnya (tombol "kembali ke awal")
    // yang mengambil alih giliran Tab berikutnya.
    paperEl.removeAttribute("role");
    paperEl.removeAttribute("aria-label");
    paperEl.tabIndex = -1;

    hintEl?.classList.add("is-hidden");
    decorEl?.classList.add("is-hidden");

    contentEl.hidden = false;
    contentEl.tabIndex = 0;
    // Satu frame jeda supaya browser sempat render display:block dulu
    // sebelum opacity mulai transisi -- kalau tidak, transisinya dilewati
    // (loncat langsung ke opacity:1 tanpa animasi).
    requestAnimationFrame(() => {
      contentEl.classList.add("is-revealed");
      contentEl.focus({ preventScroll: true });
    });
  }
}
