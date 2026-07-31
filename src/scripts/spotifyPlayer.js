/**
 * Spotify synchronization controller.
 *
 * The Spotify IFrame API must own the exact Embed that the visitor plays.
 * There is deliberately only ONE Spotify player at a time. A native iframe
 * is created only as a fallback when the official IFrame API cannot load.
 *
 * This keeps the existing v4 page/music architecture intact while fixing the
 * previous two-player collision.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount) return { pause: () => false, isReady: () => false };

  const FALLBACK_SRC = (() => {
    try {
      const url = new URL(src || "");
      url.search = "";
      return url.toString();
    } catch {
      return src || "";
    }
  })();

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let initialized = false;
  let fallbackShown = false;
  let apiReadyHandler = null;
  let fallbackTimer = null;

  function setPlayerSize(el) {
    el.style.width = "100%";
    el.style.height = "450px";
    el.style.minHeight = "450px";
    el.style.border = "0";
    el.style.display = "block";
  }

  function showNativeFallback() {
    if (ready || fallbackShown || controller) return;
    fallbackShown = true;
    mount.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.id = "spotify-native-fallback";
    iframe.src = FALLBACK_SRC;
    iframe.title = "Spotify playlist";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("frameborder", "0");
    setPlayerSize(iframe);
    mount.appendChild(iframe);
  }

  function cleanupFallbackTimer() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function create(IFrameAPI) {
    if (!IFrameAPI?.createController || initialized || ready) return;
    initialized = true;
    fallbackShown = false;

    // The API replaces this mount with the one and only controlled Embed.
    // Do not create another iframe beside it.
    mount.replaceChildren();

    try {
      IFrameAPI.createController(
        mount,
        {
          width: "100%",
          height: "450",
          url: FALLBACK_SRC,
        },
        (EmbedController) => {
          controller = EmbedController;

          controller.addListener("ready", () => {
            ready = true;
            cleanupFallbackTimer();

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
        },
      );
    } catch (err) {
      initialized = false;
      controller = null;
      ready = false;
      console.warn("[Spotify] IFrame API failed; using native fallback.", err);
      showNativeFallback();
    }
  }

  // Official API callback may have fired before this module ran, or may fire
  // after it. Support both without loading the API a second time.
  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    apiReadyHandler = (event) => create(event.detail);
    window.addEventListener("spotify-iframe-api-ready", apiReadyHandler, { once: true });
  }

  // If the official API cannot load, the site still gets a usable Spotify
  // player. Importantly, the fallback is created IN THE SAME MOUNT, so it can
  // never coexist with an API-controlled player.
  fallbackTimer = setTimeout(() => {
    if (!ready && !controller) {
      showNativeFallback();
    }
  }, 9000);

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

    if (!fallbackShown) pendingPause = true;
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
