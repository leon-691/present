/**
 * Spotify Embed controller.
 *
 * IMPORTANT:
 * Spotify's iFrame API creates/replaces the embed element with its own iframe.
 * Therefore the HTML contains a plain mount <div>, not a pre-built iframe.
 * The API is an enhancement: if it fails to load, the rest of the site keeps
 * working, but cross-player pause synchronization cannot be guaranteed.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount) return { pause: () => false, isReady: () => false };

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let apiReadyHandler = null;

  const normalizeUrl = (value) => {
    try {
      return new URL(value, window.location.href).toString();
    } catch {
      return value;
    }
  };

  const create = (IFrameAPI) => {
    if (!IFrameAPI?.createController || controller) return;

    const options = {
      width: "100%",
      height: "450",
      url: normalizeUrl(src),
    };

    try {
      IFrameAPI.createController(mount, options, (EmbedController) => {
        controller = EmbedController;

        controller.addListener("ready", () => {
          ready = true;
          if (pendingPause) {
            pendingPause = false;
            try {
              controller.pause();
            } catch (err) {
              console.warn("Spotify pause gagal:", err);
            }
          }
        });

        controller.addListener("playback_started", () => {
          onPlaybackStart?.();
        });

        // playback_update juga menangkap perubahan state yang tidak selalu
        // menghasilkan playback_started, tetapi hanya bereaksi saat benar-benar
        // mulai bermain agar tidak membuat loop pause.
        controller.addListener("playback_update", (event) => {
          if (event?.data?.isPaused === false) onPlaybackStart?.();
        });
      });
    } catch (err) {
      console.warn("Spotify IFrame API gagal membuat controller:", err);
    }
  };

  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => create(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // Safety timeout: jangan biarkan event listener hidup selamanya.
  setTimeout(() => {
    if (apiReadyHandler && !controller) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
      console.warn("Spotify IFrame API tidak tersedia; player tetap dibiarkan aman.");
    }
  }, 10000);

  function pause() {
    if (controller && ready) {
      try {
        controller.pause();
        return true;
      } catch (err) {
        console.warn("Spotify pause gagal:", err);
        return false;
      }
    }

    // Background music bisa mulai sebelum Spotify controller selesai siap.
    // Simpan permintaan pause dan jalankan segera setelah controller ready.
    pendingPause = true;
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
