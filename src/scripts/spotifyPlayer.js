/**
 * Spotify synchronization controller.
 *
 * The native iframe remains visible unless the official IFrame API has
 * successfully created a controller AND emitted its `ready` event. The API
 * therefore can never turn a working Spotify player into an empty box.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const fallback = document.querySelector("#spotify-native-fallback");
  const apiMount = document.querySelector("#spotify-api-mount");
  if (!fallback || !apiMount) return { pause: () => false, isReady: () => false };

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let initialized = false;
  let apiReadyHandler = null;

  function showApiPlayer() {
    fallback.hidden = true;
    fallback.setAttribute("aria-hidden", "true");
    apiMount.hidden = false;
    apiMount.setAttribute("aria-hidden", "false");
  }

  function create(IFrameAPI) {
    if (!IFrameAPI?.createController || initialized) return;
    initialized = true;
    try {
      IFrameAPI.createController(apiMount, {
        width: "100%",
        height: "450",
        url: src,
      }, (EmbedController) => {
        controller = EmbedController;
        controller.addListener("ready", () => {
          ready = true;
          showApiPlayer();
          if (pendingPause) {
            pendingPause = false;
            try { controller.pause(); } catch (err) {
              console.warn("[Spotify] queued pause failed:", err);
            }
          }
        });
        controller.addListener("playback_started", () => onPlaybackStart?.());
        controller.addListener("playback_update", (event) => {
          if (event?.data?.isPaused === false) onPlaybackStart?.();
        });
      });
    } catch (err) {
      initialized = false;
      console.warn("[Spotify] API failed; native player remains active.", err);
    }
  }

  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => create(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  setTimeout(() => {
    if (!ready && apiReadyHandler) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
      console.warn("[Spotify] API unavailable/slow; native player remains active.");
    }
  }, 10000);

  function pause() {
    if (controller && ready) {
      try { controller.pause(); return true; }
      catch (err) { console.warn("[Spotify] pause failed:", err); return false; }
    }
    pendingPause = true;
    return false;
  }

  return { pause, isReady: () => ready };
}
