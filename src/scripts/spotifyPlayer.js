/**
 * Spotify Embed controller.
 *
 * Primary path:
 *   Spotify iFrame API -> real playback events + controller.pause().
 *
 * Fallback path:
 *   normal Spotify iframe -> keeps the playlist visible even when the
 *   iFrame API is blocked/unavailable. Playback synchronization is only
 *   available on the API path because the Spotify iframe is cross-origin.
 */
export function initSpotifyPlayer({ src, onPlaybackStart, onPlaybackStop } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount || !src) {
    return { pause: () => {}, isReady: () => false };
  }

  let controller = null;
  let ready = false;
  let fallbackTimer = null;

  const apiReady = new Promise((resolve) => {
    const create = (IFrameAPI) => {
      if (controller || !mount.isConnected || !IFrameAPI?.createController) return;

      try {
        IFrameAPI.createController(
          mount,
          {
            width: "100%",
            height: "450",
            url: src,
          },
          (EmbedController) => {
            if (!EmbedController) {
              createFallback();
              return;
            }

            controller = EmbedController;
            ready = true;

            EmbedController.addListener("playback_started", () => {
              onPlaybackStart?.();
            });

            EmbedController.addListener("playback_update", (event) => {
              if (event?.data?.isPaused) {
                onPlaybackStop?.();
              }
            });

            resolve(EmbedController);
          }
        );
      } catch (error) {
        console.warn("[Spotify] iFrame API gagal, memakai fallback iframe.", error);
        createFallback();
      }
    };

    function createFallback() {
      if (controller || mount.querySelector("iframe")) return;

      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "Spotify playlist";
      iframe.loading = "lazy";
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.style.width = "100%";
      iframe.style.height = "450px";
      iframe.style.minHeight = "400px";
      iframe.style.border = "0";
      iframe.style.display = "block";
      iframe.style.borderRadius = "inherit";

      mount.replaceChildren(iframe);
      resolve(null);
    }

    const handleApiReady = (event) => create(event.detail);

    window.addEventListener(
      "spotify-iframe-api-ready",
      handleApiReady,
      { once: true }
    );

    if (window.__spotifyIframeAPI) {
      create(window.__spotifyIframeAPI);
    }

    // Never leave the white song card empty if Spotify's API fails to load.
    fallbackTimer = window.setTimeout(() => {
      if (!controller && !mount.querySelector("iframe")) {
        createFallback();
      }
    }, 5000);
  });

  apiReady.finally(() => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  });

  return {
    pause() {
      try {
        controller?.pause();
      } catch (error) {
        console.warn("[Spotify] Tidak dapat menjeda player.", error);
      }
    },

    isReady: () => ready,
    ready: apiReady,
  };
}
