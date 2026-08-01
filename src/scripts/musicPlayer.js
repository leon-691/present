/**
 * Widget musik mengambang. Browser modern memblokir autoplay audio
 * sebelum ada interaksi user -- jadi audio baru benar-benar mulai
 * saat tombol "buka" di landing page diklik (lihat main.js).
 *
 * onPlay: dipanggil TIAP KALI audio ini mulai main (baik dari unlock()
 * pertama maupun toggle manual) -- dipakai main.js utk menyuruh Spotify
 * berhenti, supaya tidak dua-duanya bersahutan.
 */
export function initMusicPlayer({ src, title, subtitle, onPlay }) {
  const pill = document.querySelector("[data-music-pill]");
  if (!pill) return { unlock: () => {}, pause: () => {} };

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

  async function play() {
    try {
      await audio.play();
      setPlayingState(true);
      onPlay?.();
    } catch (err) {
      // File belum ada / diblokir browser -- gagal senyap, tidak crash.
      console.warn("Tidak bisa memutar audio:", err);
    }
  }

  function pause() {
    audio.pause();
    setPlayingState(false);
  }

  toggleBtn.addEventListener("click", () => {
    if (audio.paused) play();
    else pause();
  });

  setPlayingState(false);

  // Dipanggil dari main.js tepat saat user pertama kali menekan tombol
  // "buka" di landing page -- itulah user-gesture yang diizinkan browser.
  async function unlock() {
    try {
      await audio.play();
      setPlayingState(true);
      onPlay?.();
    } catch (err) {
      console.warn("Autoplay diblokir, tunggu klik pada pil musik:", err);
    }
  }

  return { unlock, pause };
}
