/**
 * Spotify IFrame API controller.
 *
 * IMPORTANT:
 * - The Spotify player the user sees MUST be the player owned by the official
 *   Spotify IFrame API controller. Otherwise controller.pause() cannot control
 *   the native fallback iframe.
 * - The native iframe is kept as a visual fallback until the API controller
 *   has emitted `ready`.
 * - If the API never becomes ready, the native iframe remains usable and the
 *   rest of the website continues normally.
 *
 * Synchronization:
 *   background music -> spotify.pause()
 *   spotify playback   -> onPlaybackStart()
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const fallback = document.querySelector("#spotify-native-fallback");
  const apiMount = document.querySelector("#spotify-api-mount");

  if (!fallback || !apiMount) {
    return {
      pause: () => false,
      isReady: () => false,
    };
  }

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let initialized = false;
  let apiReadyHandler = null;
  let fallbackTimer = null;

  function showNativeFallback() {
    fallback.hidden = false;
    fallback.removeAttribute("aria-hidden");

    apiMount.classList.remove("is-api-active");
    apiMount.setAttribute("aria-hidden", "true");
  }

  function showApiController() {
    // The API controller is now the actual player the user interacts with.
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");

    apiMount.hidden = false;
    apiMount.removeAttribute("aria-hidden");
    apiMount.classList.add("is-api-active");
  }

  function safePauseController() {
    if (!controller || !ready) {
      pendingPause = true;
      return false;
    }

    try {
      controller.pause();
      return true;
    } catch (err) {
      console.warn("[Spotify] controller.pause() failed:", err);
      return false;
    }
  }

  function createController(IFrameAPI) {
    if (initialized || !IFrameAPI?.createController) return;
    initialized = true;

    // Never use display:none for the API mount during initialization. Spotify
    // needs a real layout box in which to construct its Embed.
    apiMount.hidden = false;
    apiMount.classList.remove("is-api-active");
    apiMount.setAttribute("aria-hidden", "true");

    try {
      IFrameAPI.createController(
        apiMount,
        {
          width: "100%",
          height: "450",
          url: src,
        },
        (EmbedController) => {
          controller = EmbedController;

          controller.addListener("ready", () => {
            ready = true;

            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
              fallbackTimer = null;
            }

            // Only now do we replace the fallback visually. From this point
            // forward the visible Spotify player IS the API-owned player.
            showApiController();

            if (pendingPause) {
              pendingPause = false;
              safePauseController();
            }
          });

          // This is the most direct event for Spotify starting playback.
          controller.addListener("playback_started", () => {
            onPlaybackStart?.();
          });

          // Keep playback_update as a secondary signal. Some browser/embed
          // combinations may report playback through this event first.
          controller.addListener("playback_update", (event) => {
            if (event?.data?.isPaused === false) {
              onPlaybackStart?.();
            }
          });
        },
      );
    } catch (err) {
      initialized = false;
      showNativeFallback();
      console.warn("[Spotify] IFrame API initialization failed; native player remains active.", err);
    }
  }

  // Spotify's official loader calls this global callback. main/index.html
  // forwards the API object through a custom event so this module does not
  // depend on script ordering.
  if (window.__spotifyIframeAPI) {
    createController(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => createController(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // Do NOT remove the native player just because the API is slow. This is
  // only a timeout for the controller enhancement, never for the website.
  fallbackTimer = setTimeout(() => {
    if (!ready) {
      showNativeFallback();
      console.warn("[Spotify] IFrame API did not become ready; native player remains active.");
    }

    if (apiReadyHandler) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
    }
  }, 12000);

  function pause() {
    return safePauseController();
  }

  return {
    pause,
    isReady: () => ready,
  };
}
