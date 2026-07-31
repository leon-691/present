/**
 * Spotify synchronization controller.
 *
 * IMPORTANT: the native iframe is the safe visual fallback. The official
 * Spotify IFrame API is initialized only after the Spotify section is
 * actually visible, because initializing an Embed while its parent view is
 * inactive can leave the controller without a usable playback surface.
 *
 * Architecture:
 *   native iframe -> always available
 *   API controller -> optional enhancement, same visual slot
 *
 * Synchronization:
 *   background music -> controller.pause()
 *   Spotify playback -> onPlaybackStart()
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const scene = document.querySelector("#lagu");
  const fallback = document.querySelector("#spotify-native-fallback");
  const apiMount = document.querySelector("#spotify-api-mount");

  if (!scene || !fallback || !apiMount || !src) {
    return { pause: () => false, isReady: () => false };
  }

  let controller = null;
  let ready = false;
  let initialized = false;
  let sectionReady = false;
  let apiReady = Boolean(window.__spotifyIframeAPI);
  let pendingPause = false;
  let apiReadyHandler = null;
  let sectionSettledHandler = null;

  function showController() {
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");
    apiMount.hidden = false;
    apiMount.setAttribute("aria-hidden", "false");
  }

  function pauseController() {
    if (!controller || !ready) {
      pendingPause = true;
      return false;
    }

    try {
      controller.pause();
      pendingPause = false;
      return true;
    } catch (error) {
      console.warn("[Spotify] pause failed:", error);
      return false;
    }
  }

  function handlePlaybackStart() {
    onPlaybackStart?.();
  }

  function bindController(embedController) {
    if (!embedController || controller) return;

    controller = embedController;

    controller.addListener("ready", () => {
      ready = true;
      showController();

      if (pendingPause) {
        // Give the newly-created Embed one frame to finish attaching its
        // playback surface before issuing pause().
        requestAnimationFrame(() => {
          pauseController();
        });
      }
    });

    controller.addListener("playback_started", handlePlaybackStart);
    controller.addListener("playback_update", (event) => {
      if (event?.data?.isPaused === false) handlePlaybackStart();
    });
  }

  function createController(IFrameAPI) {
    if (initialized || !sectionReady || !IFrameAPI?.createController) return;

    initialized = true;
    apiReady = true;

    try {
      IFrameAPI.createController(
        apiMount,
        {
          width: "100%",
          height: "450",
          url: src,
        },
        bindController
      );
    } catch (error) {
      initialized = false;
      console.warn("[Spotify] IFrame API initialization failed; native player remains active.", error);
    }
  }

  function tryCreateController() {
    if (window.__spotifyIframeAPI) {
      createController(window.__spotifyIframeAPI);
    }
  }

  // The section must be visible before we ask Spotify to build its controller.
  sectionSettledHandler = () => {
    sectionReady = true;
    tryCreateController();
  };
  scene.addEventListener("view:settled", sectionSettledHandler, { once: true });

  // The API may load before OR after the Spotify section becomes visible.
  if (!window.__spotifyIframeAPI) {
    apiReadyHandler = (event) => {
      apiReadyHandler = null;
      apiReady = true;
      createController(event.detail);
    };
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // Keep the native player indefinitely if the API never becomes available.
  // This is deliberately a non-destructive timeout: it never hides/replaces
  // the working fallback.
  setTimeout(() => {
    if (!ready && !apiReady) {
      console.warn("[Spotify] IFrame API unavailable; native player remains active.");
    }
  }, 10000);

  return {
    pause() {
      if (ready) return pauseController();
      pendingPause = true;
      tryCreateController();
      return false;
    },
    isReady: () => ready,
  };
}
