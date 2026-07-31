/**
 * Background music player.
 *
 * The background MP3 and the Spotify Embed are mutually exclusive:
 * - starting the background music pauses Spotify;
 * - starting Spotify pauses the background music.
 *
 * Spotify is controlled through its official iFrame API (see spotifyPlayer.js)
 * rather than trying to access the cross-origin iframe directly.
 */
export function initMusicPlayer({ src, title, subtitle }) {
  const pill = document.querySelector("[data-music-pill]");
  if (!pill) {
    return {
      unlock: async () => {},
      pause: () => {},
      isPlaying: () => false,
      setSpotifyController: () => {},
    };
  }

  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.6;

  const toggleBtn = pill.querySelector("[data-music-toggle]");
  const titleEl = pill.querySelector("[data-music-title]");
  const subtitleEl = pill.querySelector("[data-music-subtitle]");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  let spotifyController = null;
  let spotifyReady = false;

  function setPlayingState(isPlaying) {
    pill.classList.toggle("is-paused", !isPlaying);
    toggleBtn?.setAttribute("aria-pressed", String(isPlaying));
    if (toggleBtn) toggleBtn.textContent = isPlaying ? "⏸" : "▶";
  }

  function pause() {
    if (!audio.paused) audio.pause();
    setPlayingState(false);
  }

  async function play() {
    // Mutual exclusion: the local background audio always gives Spotify
    // the right of way if Spotify is currently playing.
    try {
      if (spotifyController && spotifyReady) {
        await Promise.resolve(spotifyController.pause());
      }
    } catch (err) {
      console.warn("Tidak bisa menjeda Spotify Embed:", err);
    }

    try {
      await audio.play();
      setPlayingState(true);
    } catch (err) {
      console.warn("Tidak bisa memutar audio:", err);
      setPlayingState(false);
    }
  }

  toggleBtn?.addEventListener("click", () => {
    if (audio.paused) {
      void play();
    } else {
      pause();
    }
  });

  setPlayingState(false);

  function setSpotifyController(controller) {
    spotifyController = controller;
    spotifyReady = Boolean(controller);
  }

  async function unlock() {
    // Do not force Spotify to pause here unless it is actually ready. The
    // first user gesture is allowed to start the local background audio.
    await play();
  }

  return {
    unlock,
    play,
    pause,
    isPlaying: () => !audio.paused,
    setSpotifyController,
  };
}
