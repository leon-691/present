/**
 * Spotify synchronization controller.
 *
 * IMPORTANT: the official Spotify IFrame API owns the single Embed shown to
 * the visitor. We only initialize it once the Spotify section is actually
 * visible, which avoids creating an Embed inside an inactive/transitioning
 * view. A native iframe is used only as a same-mount fallback if the API
 * cannot initialize.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const scene = document.querySelector("#lagu");
  const mount = document.querySelector("#spotify-embed");
  if (!scene || !mount) return { pause: () => false, isReady: () => false };

  const sourceUrl = src || "";

  function getPlaylistUri(value) {
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      const kindIndex = parts.findIndex((part) => part === "playlist");
      const id = kindIndex >= 0 ? parts[kindIndex + 1] : "";
      if (id) return `spotify:playlist:${id}`;
    } catch {
      // Fall through to URL mode below.
    }
    return "";
  }

  const spotifyUri = getPlaylistUri(sourceUrl);

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let initialized = false;
  let fallbackShown = false;
  let sectionSettled = scene.classList.contains("is-active");
  let fallbackTimer = null;

  function setPlayerSize(el) {
    el.style.width = "100%";
    el.style.height = "450px";
    el.style.minHeight = "450px";
    el.style.border = "0";
    el.style.display = "block";
  }

  function showNativeFallback() {
    if (ready || controller || fallbackShown || !sectionSettled) return;
    fallbackShown = true;
    mount.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.id = "spotify-native-fallback";
    iframe.src = sourceUrl;
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
    if (!sectionSettled || !IFrameAPI?.createController || initialized || controller) return;
    initialized = true;
    fallbackShown = false;
    cleanupFallbackTimer();
    mount.replaceChildren();

    const options = {
      width: "100%",
      height: "450",
      ...(spotifyUri ? { uri: spotifyUri } : { url: sourceUrl }),
    };

    try {
      IFrameAPI.createController(mount, options, (EmbedController) => {
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
          if (event?.data?.isPaused === false) onPlaybackStart?.();
        });
      });
    } catch (err) {
      initialized = false;
      controller = null;
      ready = false;
      console.warn("[Spotify] IFrame API failed; using native fallback.", err);
      showNativeFallback();
    }
  }

  function tryCreateFromGlobalAPI() {
    if (window.__spotifyIframeAPI) create(window.__spotifyIframeAPI);
  }

  function startFallbackWatch() {
    cleanupFallbackTimer();
    fallbackTimer = setTimeout(() => {
      if (!ready && !controller && !initialized) showNativeFallback();
    }, 8000);
  }

  function initializeWhenVisible() {
    sectionSettled = true;
    tryCreateFromGlobalAPI();
    startFallbackWatch();
  }

  if (sectionSettled) {
    initializeWhenVisible();
  } else {
    scene.addEventListener("view:settled", initializeWhenVisible, { once: true });
  }

  // The official callback is installed in index.html before the API script.
  // This event handles the case where the API finishes loading after this
  // module, including when the Spotify section is already visible.
  window.addEventListener(
    "spotify-iframe-api-ready",
    (event) => create(event.detail),
    { passive: true },
  );

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

    pendingPause = true;
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
