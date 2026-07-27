import { content } from "../data/content.js";

/**
 * Widget musik mengambang. Browser modern memblokir autoplay audio
 * sebelum ada interaksi user -- jadi audio baru benar-benar mulai saat
 * gerbang PIN disentuh pertama kali (lihat gate:first-interaction di
 * passwordGate.js).
 */
export function initMusicPlayer() {
  const widget = document.querySelector("[data-music-widget]");
  if (!widget) return;

  const audio = widget.querySelector("[data-music-audio]");
  const toggleBtn = widget.querySelector("[data-music-toggle]");

  audio.src = content.backgroundAudioSrc;
  audio.loop = true;
  audio.volume = 0.6;
  audio.preload = "none";

  widget.querySelector("[data-music-title]").textContent = content.backgroundAudioTitle;
  widget.querySelector("[data-music-subtitle]").textContent = content.backgroundAudioSubtitle;

  function setPlayingState(isPlaying) {
    widget.classList.toggle("is-paused", !isPlaying);
    toggleBtn.setAttribute("aria-pressed", String(isPlaying));
    toggleBtn.setAttribute("aria-label", isPlaying ? "Jeda musik latar" : "Putar musik latar");
    toggleBtn.textContent = isPlaying ? "❚❚" : "▶";
  }

  toggleBtn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        setPlayingState(true);
      } catch (err) {
        // File belum diisi / diblokir browser -- gagal senyap, tombol
        // tetap bisa dicoba lagi kapan saja, tidak dikunci permanen.
        console.warn("Tidak bisa memutar audio:", err);
      }
    } else {
      audio.pause();
      setPlayingState(false);
    }
  });

  setPlayingState(false);

  // Dipanggil sekali dari passwordGate.js tepat saat gesture pertama di
  // gerbang -- itulah user-gesture yang diizinkan browser untuk autoplay.
  document.addEventListener(
    "gate:first-interaction",
    async () => {
      try {
        await audio.play();
        setPlayingState(true);
      } catch (err) {
        console.warn("Autoplay diblokir, tunggu ketukan pada widget musik:", err);
      }
    },
    { once: true }
  );
}
