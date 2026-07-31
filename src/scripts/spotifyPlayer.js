/**
 * Spotify IFrame API — exactly ONE player.
 * The official API owns #spotify-embed; native iframe is only a fallback
 * when the API cannot create the Embed.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  if (!mount) return { pause: () => false, isReady: () => false };

  const EMBED_SRC = (() => {
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
  let creating = false;
  let fallbackShown = false;
  let fallbackTimer = null;

  function size(el) {
    el.style.width = "100%";
    el.style.height = "450px";
    el.style.minHeight = "450px";
    el.style.border = "0";
    el.style.display = "block";
  }

  function clearFallbackTimer() {
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
  }

  function showFallback() {
    if (controller || ready || fallbackShown || !EMBED_SRC) return;
    fallbackShown = true;
    mount.replaceChildren();
    const iframe = document.createElement("iframe");
    iframe.id = "spotify-native-fallback";
    iframe.src = EMBED_SRC;
    iframe.title = "Spotify playlist";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("frameborder", "0");
    size(iframe);
    mount.appendChild(iframe);
  }

  function create(api) {
    if (!api?.createController || controller || creating || fallbackShown) return;
    creating = true;
    mount.replaceChildren();

    try {
      api.createController(
        mount,
        { width: "100%", height: "450", url: EMBED_SRC },
        (EmbedController) => {
          creating = false;
          controller = EmbedController;
          clearFallbackTimer();

          controller.addListener("ready", () => {
            ready = true;
            if (pendingPause) {
              pendingPause = false;
              try { controller.pause(); } catch (err) { console.warn("[Spotify] queued pause failed", err); }
            }
          });

          controller.addListener("playback_started", () => onPlaybackStart?.());
          controller.addListener("playback_update", (event) => {
            if (event?.data?.isPaused === false) onPlaybackStart?.();
          });
        },
      );
    } catch (err) {
      creating = false;
      controller = null;
      ready = false;
      console.warn("[Spotify] IFrame API createController failed", err);
      showFallback();
    }
  }

  // Handles both cases: API loaded before this module, or after it.
  if (window.__spotifyIframeAPI) {
    create(window.__spotifyIframeAPI);
  } else {
    window.addEventListener("spotify-iframe-api-ready", (event) => create(event.detail), { once: true });
  }

  // Never leave the mount blank indefinitely. If the official API cannot
  // initialize, the visitor still gets a usable Spotify embed.
  fallbackTimer = setTimeout(() => {
    if (!controller && !ready) showFallback();
  }, 6000);

  function pause() {
    if (controller && ready) {
      try { controller.pause(); return true; }
      catch (err) { console.warn("[Spotify] pause failed", err); return false; }
    }
    if (!fallbackShown) pendingPause = true;
    return false;
  }

  return { pause, isReady: () => ready };
}
