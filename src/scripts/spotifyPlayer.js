/**
 * Spotify Embed controller.
 *
 * The native iframe in index.html is the fallback that guarantees the player
 * remains visible. Spotify's official iFrame API is an enhancement used only
 * for playback synchronization. createController() replaces the mount element
 * with its managed Embed when the API is available.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount) return { pause: () => false, isReady: () => false };

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let apiReadyHandler = null;
  let initialized = false;

  const normalizeUrl = (value) => {
    try {
      return new URL(value, window.location.href).toString();
    } catch {
      return value;
    }
  };

  const create = (IFrameAPI) => {
    if (!IFrameAPI?.createController || initialized) return;
    initialized = true;

    try {
      IFrameAPI.createController(
        mount,
        {
          width: "100%",
          height: "450",
          url: normalizeUrl(src),
        },
        (EmbedController) => {
          controller = EmbedController;

          controller.addListener("ready", () => {
            ready = true;

            if (pendingPause) {
              pendingPause = false;
              try {
                controller.pause();
              } catch (err) {
                console.warn("[Spotify] pause after ready failed:", err);
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
        }
      );
    } catch (err) {
      initialized = false;
      console.warn("[Spotify] IFrame API initialization failed; native fallback remains available.", err);
    }
  };

  // Official API callback may have fired before this module initialized.
  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => {
      create(event.detail);
    };
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler);
  }

  // If the API never arrives, leave the native iframe completely untouched.
  setTimeout(() => {
    if (apiReadyHandler && !controller) {
      window.removeEventListener("spotify-iframe-api-ready", apiReadyHandler);
      apiReadyHandler = null;
      console.warn("[Spotify] IFrame API unavailable; using native iframe fallback.");
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

    // If the API is still initializing, remember the request.
    if (!controller) {
      pendingPause = true;
    }
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
