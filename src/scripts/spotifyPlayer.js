/**
 * Spotify Embed controller.
 * Uses Spotify's official iFrame API so the page can pause the embed when
 * background music starts, and pause background music when Spotify starts.
 */
export function initSpotifyPlayer({ src, onPlaybackStart, onPlaybackStop } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount || !src) return { pause: () => {}, isReady: () => false };

  let controller = null;
  let ready = false;
  let apiReadyResolve;

  const apiReady = new Promise((resolve) => {
    apiReadyResolve = resolve;
  });

  function create(IFrameAPI) {
    if (controller || !mount.isConnected) return;

    IFrameAPI.createController(
      mount,
      {
        width: "100%",
        height: "450",
        url: src,
      },
      (EmbedController) => {
        controller = EmbedController;
        ready = true;
        apiReadyResolve(controller);

        controller.addListener("playback_started", () => {
          onPlaybackStart?.();
        });

        controller.addListener("playback_update", (event) => {
          const data = event?.data;
          if (data && data.isPaused) onPlaybackStop?.();
        });
      }
    );
  }

  const handleApiReady = (event) => {
    create(event.detail);
  };

  window.addEventListener("spotify-iframe-api-ready", handleApiReady, { once: true });

  // Covers the rare case where the API-ready event fired before this module
  // was initialized. The inline bootstrap stores the API object for us.
  if (window.__spotifyIframeAPI) create(window.__spotifyIframeAPI);

  function pause() {
    controller?.pause();
  }

  return {
    pause,
    isReady: () => ready,
    ready: apiReady,
  };
}
