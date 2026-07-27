/**
 * Widget musik mengambang. Browser modern memblokir autoplay audio
 * sebelum ada interaksi user -- jadi audio baru benar-benar mulai
 * saat tombol "buka" di landing page diklik (lihat main.js).
 */
export function initMusicPlayer({ src, title, subtitle }) {
  const pill = document.querySelector("[data-music-pill]");
  if (!pill) return { unlock: () => {} };

  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.6;

  const toggleBtn = pill.querySelector("[data-music-toggle]");
  const titleEl = pill.querySelector("[data-music-title]");
  const subtitleEl = pill.querySelector("[data-music-subtitle]");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  function setPlayingState(isPlaying) {
    pill.classList.toggle("is-paused", !isPlaying);
    toggleBtn.setAttribute("aria-pressed", String(isPlaying));
    toggleBtn.textContent = isPlaying ? "⏸" : "▶";
  }

  toggleBtn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        setPlayingState(true);
      } catch (err) {
        // File belum ada / diblokir browser -- gagal senyap, tidak crash.
        console.warn("Tidak bisa memutar audio:", err);
      }
    } else {
      audio.pause();
      setPlayingState(false);
    }
  });

  setPlayingState(false);

  // Dipanggil dari main.js tepat saat user pertama kali menekan tombol
  // "buka" di landing page -- itulah user-gesture yang diizinkan browser.
  async function unlock() {
    try {
      await audio.play();
      setPlayingState(true);
    } catch (err) {
      console.warn("Autoplay diblokir, tunggu klik pada pil musik:", err);
    }
  }

  return { unlock };
}
