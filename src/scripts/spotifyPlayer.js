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
  let controllerCreated = false;
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
    // IMPORTANT: createController() replaces apiMount with the Spotify Embed.
    // The API controller is therefore the only player that can be controlled
    // by controller.pause() and emit playback events to this page.
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");

    apiMount.hidden = false;
    apiMount.removeAttribute("aria-hidden");
    apiMount.classList.add("is-api-active");
  }

  function safePauseController() {
    if (!controllerCreated || !controller) {
      pendingPause = true;
      return false;
    }

    try {
      controller.pause();
      pendingPause = false;
      return true;
    } catch (err) {
      // Keep the request pending in case Spotify's controller is still
      // completing its internal initialization.
      pendingPause = true;
      console.warn("[Spotify] controller.pause() failed:", err);
      return false;
    }
  }

  function createController(IFrameAPI) {
    if (initialized || !IFrameAPI?.createController) return;
    initialized = true;

    // The mount must have a real size while Spotify creates its iframe.
    apiMount.hidden = false;
    apiMount.classList.remove("is-api-active");
    apiMount.removeAttribute("aria-hidden");

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
          controllerCreated = true;

          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }

          // Do NOT wait for the separate `ready` event before showing the
          // controller. Spotify's official API gives us the EmbedController
          // in this callback and its own example immediately uses it. Waiting
          // for `ready` here caused the native iframe to remain visible, so
          // user interaction happened on a player that this controller could
          // never control.
          showApiController();

          controller.addListener("ready", () => {
            if (pendingPause) safePauseController();
          });

          controller.addListener("playback_started", () => {
            onPlaybackStart?.();
          });

          controller.addListener("playback_update", (event) => {
            if (event?.data?.isPaused === false) {
              onPlaybackStart?.();
            }
          });

          // A background-music click may have happened before the Spotify
          // controller callback arrived. Apply that request now.
          if (pendingPause) {
            safePauseController();
          }
        },
      );
    } catch (err) {
      initialized = false;
      controller = null;
      controllerCreated = false;
      showNativeFallback();
      console.warn(
        "[Spotify] IFrame API initialization failed; native player remains active.",
        err,
      );
    }
  }

  // The official Spotify loader invokes this global callback. index.html
  // forwards the API object through this event so initialization is safe even
  // when the API script finishes loading before main.js.
  if (window.__spotifyIframeAPI) {
    createController(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => createController(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // Fallback only if createController itself never becomes available. Once
  // its callback has supplied a controller, the API player stays visible.
  fallbackTimer = setTimeout(() => {
    if (!controllerCreated) {
      showNativeFallback();
      console.warn(
        "[Spotify] IFrame API did not create a controller; native player remains active.",
      );
    }

    if (apiReadyHandler) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
    }
  }, 12000);

  return {
    pause: () => safePauseController(),
    isReady: () => controllerCreated,
  };
}
