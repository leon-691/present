/**
 * Spotify synchronization controller.
 *
 * IMPORTANT: Spotify's IFrame API controller must own the Embed iframe that
 * the user actually interacts with. A separate hidden controller cannot
 * observe/control the native fallback iframe. We therefore use the native
 * iframe only as a temporary fallback while the API controller initializes.
 *
 * If the API fails, the native iframe stays visible and the rest of the site
 * keeps working. If the API succeeds, the API-owned iframe replaces the
 * fallback and becomes the single source of Spotify playback events.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const fallback = document.querySelector("#spotify-native-fallback");
  const apiMount = document.querySelector("#spotify-api-mount");
  if (!fallback || !apiMount) {
    return { pause: () => false, isReady: () => false };
  }

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let initialized = false;
  let apiReadyHandler = null;
  let fallbackTimer = null;

  // The mount must NOT be display:none while Spotify initializes.
  // It is visually hidden only with opacity/pointer-events in CSS.
  function showApiPlayer() {
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");
    apiMount.hidden = false;
    apiMount.setAttribute("aria-hidden", "false");
    apiMount.classList.add("is-api-active");
  }

  function keepNativeFallback() {
    fallback.hidden = false;
    fallback.setAttribute("aria-hidden", "false");
    apiMount.classList.remove("is-api-active");
    apiMount.setAttribute("aria-hidden", "true");
  }

  function create(IFrameAPI) {
    if (!IFrameAPI?.createController || initialized) return;
    initialized = true;

    // Let Spotify initialize in a real layout box. It is visually transparent
    // until the controller is confirmed ready.
    apiMount.hidden = false;

    try {
      IFrameAPI.createController(apiMount, {
        width: "100%",
        height: "450",
        url: src,
      }, (EmbedController) => {
        controller = EmbedController;

        controller.addListener("ready", () => {
          ready = true;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }

          showApiPlayer();

          if (pendingPause) {
            pendingPause = false;
            try {
              controller.pause();
            } catch (err) {
              console.warn("[Spotify] queued pause failed:", err);
            }
          }
        });

        controller.addListener("playback_started", () => {
          onPlaybackStart?.();
        });

        controller.addListener("playback_update", (event) => {
          if (event?.data?.isPaused === false) {
            onPlaybackStart?.();
          }
        });
      });
    } catch (err) {
      initialized = false;
      keepNativeFallback();
      console.warn("[Spotify] API failed; native player remains active.", err);
    }
  }

  // API may already have loaded before this module executes, or it may load
  // afterwards. Supporting both paths avoids a race on slower Android devices.
  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => create(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler);
  }

  // Give the API enough time to initialize, but never sacrifice the native
  // player just because the API is unavailable.
  fallbackTimer = setTimeout(() => {
    if (!ready) {
      keepNativeFallback();
      console.warn("[Spotify] API did not become ready; native player stays active.");
    }
    if (apiReadyHandler) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
    }
  }, 10000);

  function pause() {
    if (controller && ready) {
      try {
        controller.pause();
        return true;
      } catch (err) {
        console.warn("[Spotify] pause failed:", err);
        return false;
      }
    }

    // If the user starts background music before Spotify's controller is ready,
    // remember the request and execute it immediately after controller ready.
    pendingPause = true;
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
