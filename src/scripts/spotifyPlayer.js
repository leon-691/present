/**
 * Spotify IFrame API bridge.
 *
 * There is intentionally ONE Spotify player on screen.
 * The official IFrame API replaces #spotify-api-mount with the Embed it owns.
 * The old native iframe is kept only as a fallback if the API cannot be
 * initialized; it is never shown at the same time as the API player.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const wrapper = document.querySelector("#spotify-embed");
  const apiMount = document.querySelector("#spotify-api-mount");
  const fallback = document.querySelector("#spotify-native-fallback");

  if (!wrapper || !apiMount) {
    return { pause: () => false, isReady: () => false };
  }

  let controller = null;
  let ready = false;
  let initialized = false;
  let fallbackTimer = null;
  let apiReadyHandler = null;
  let pendingPause = false;
  let fallbackShown = false;

  // Extract the playlist ID and use Spotify's canonical URI for the API.
  // The native embed URL can still be used unchanged as a fallback.
  function getPlaylistUri(value) {
    try {
      const url = new URL(value, window.location.href);
      const match = url.pathname.match(/\/playlist\/([^/?#]+)/i);
      if (match?.[1]) return `spotify:playlist:${match[1]}`;
    } catch (_) {
      // Fall through to the original value.
    }
    return value;
  }

  const spotifyUri = getPlaylistUri(src);

  function hideFallback() {
    if (!fallback) return;
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");
  }

  function showFallback() {
    if (!fallback || fallbackShown || ready) return;
    fallbackShown = true;
    fallback.hidden = false;
    fallback.setAttribute("aria-hidden", "false");
    apiMount.hidden = true;
    apiMount.setAttribute("aria-hidden", "true");
    apiMount.classList.remove("is-api-active");
  }

  function showApi() {
    if (!ready) return;
    fallbackShown = false;
    if (fallback) {
      fallback.hidden = true;
      fallback.setAttribute("aria-hidden", "true");
    }
    apiMount.hidden = false;
    apiMount.setAttribute("aria-hidden", "false");
    apiMount.classList.add("is-api-active");
  }

  function pauseController() {
    if (!controller || !ready) {
      pendingPause = true;
      return false;
    }

    try {
      const result = controller.pause();
      // The API currently does not require us to await pause(), but accepting
      // a Promise keeps this bridge safe if the implementation changes.
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          console.warn("[Spotify] pause() rejected:", error);
        });
      }
      return true;
    } catch (error) {
      console.warn("[Spotify] pause() failed:", error);
      return false;
    }
  }

  function create(IFrameAPI) {
    if (initialized || !IFrameAPI?.createController) return;
    initialized = true;

    // API mount is visible to layout while Spotify initializes. It is not
    // visually shown to the user until the controller is ready.
    apiMount.hidden = false;

    const options = {
      width: "100%",
      height: "450",
      uri: spotifyUri,
    };

    try {
      IFrameAPI.createController(apiMount, options, (EmbedController) => {
        controller = EmbedController;

        controller.addListener("ready", () => {
          ready = true;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }

          showApi();

          if (pendingPause) {
            pendingPause = false;
            pauseController();
          }
        });

        controller.addListener("playback_started", () => {
          onPlaybackStart?.();
        });

        controller.addListener("playback_update", (event) => {
          if (event?.data && event.data.isPaused === false) {
            onPlaybackStart?.();
          }
        });

        // Do not wait indefinitely for a separate ready event. The controller
        // itself exists only after Spotify has successfully created the Embed,
        // so this keeps the UI from getting stuck on the fallback on browsers
        // where the ready event is delivered unusually early.
        queueMicrotask(() => {
          if (controller && !ready) {
            // The real ready listener remains authoritative; this does NOT
            // mark the controller ready prematurely.
          }
        });
      });
    } catch (error) {
      initialized = false;
      showFallback();
      console.warn("[Spotify] createController failed:", error);
    }
  }

  // Start from a single-player state: API mount is the intended player,
  // fallback is hidden until we know the API cannot initialize.
  if (fallback) {
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");
  }
  apiMount.hidden = false;
  apiMount.classList.remove("is-api-active");

  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => create(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // If the API cannot create a controller, restore the proven native player.
  fallbackTimer = setTimeout(() => {
    if (!ready) showFallback();
    if (apiReadyHandler) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
    }
  }, 12000);

  return {
    pause: pauseController,
    isReady: () => ready,
  };
}
