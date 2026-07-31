/**
 * Spotify iFrame API controller.
 *
 * Important architecture:
 * - There is ONE Spotify Embed only.
 * - The official IFrame API creates that Embed by replacing #spotify-embed.
 * - We never keep a second native iframe alive beside the controller.
 * - If the API cannot initialize, we restore a normal native iframe into the
 *   same mount so Spotify still works instead of leaving an empty box.
 *
 * Synchronization:
 * - background music -> controller.pause()
 * - Spotify playback_started/playback_update -> onPlaybackStart()
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount || !src) {
    return { pause: () => false, isReady: () => false };
  }

  const fallbackSrc = normalizeEmbedUrl(src);
  let controller = null;
  let ready = false;
  let apiAttempted = false;
  let fallbackShown = false;
  let pendingPause = false;
  let apiReadyHandler = null;
  let fallbackTimer = null;

  function normalizeEmbedUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      url.searchParams.delete("utm_source");
      url.searchParams.delete("si");
      return url.toString();
    } catch {
      return value;
    }
  }

  function renderFallback() {
    if (ready || fallbackShown) return;
    fallbackShown = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);

    mount.replaceChildren();
    const iframe = document.createElement("iframe");
    iframe.id = "spotify-native-fallback";
    iframe.src = fallbackSrc;
    iframe.width = "100%";
    iframe.height = "450";
    iframe.frameBorder = "0";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.loading = "lazy";
    iframe.title = "Spotify playlist";
    mount.appendChild(iframe);
  }

  function handlePlaybackStart() {
    onPlaybackStart?.();
  }

  function bindController(EmbedController) {
    if (!EmbedController || controller) return;
    controller = EmbedController;

    controller.addListener("ready", () => {
      ready = true;
      fallbackShown = false;

      // The controller has now created the one visible Embed in #spotify-embed.
      if (fallbackTimer) clearTimeout(fallbackTimer);

      if (pendingPause) {
        pendingPause = false;
        try {
          controller.pause();
        } catch (error) {
          console.warn("[Spotify] queued pause failed:", error);
        }
      }
    });

    controller.addListener("playback_started", handlePlaybackStart);
    controller.addListener("playback_update", (event) => {
      if (event?.data?.isPaused === false) handlePlaybackStart();
    });
  }

  function createController(IFrameAPI) {
    if (apiAttempted || !IFrameAPI?.createController) return;
    apiAttempted = true;

    try {
      IFrameAPI.createController(
        mount,
        {
          width: "100%",
          height: "450",
          url: fallbackSrc,
        },
        bindController
      );
    } catch (error) {
      console.warn("[Spotify] IFrame API initialization failed; using native Embed.", error);
      renderFallback();
    }
  }

  // The API replaces the mount with the actual controller Embed.
  // Keep the mount visible; do not hide it while waiting.
  if (window.__spotifyIframeAPI) {
    createController(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => {
      apiReadyHandler = null;
      createController(event.detail);
    };
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // Do not leave the page empty if the API is blocked or unavailable.
  fallbackTimer = setTimeout(() => {
    if (!ready) {
      if (apiReadyHandler) {
        window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
        apiReadyHandler = null;
      }
      renderFallback();
    }
  }, 8000);

  function pause() {
    if (controller && ready) {
      try {
        controller.pause();
        return true;
      } catch (error) {
        console.warn("[Spotify] pause failed:", error);
        return false;
      }
    }

    // If the controller is still initializing, remember the user's intent.
    // Once the controller fires `ready`, the pause is issued immediately.
    if (!fallbackShown) {
      pendingPause = true;
    }
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
