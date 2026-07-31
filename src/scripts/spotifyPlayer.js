/**
 * Spotify IFrame API controller.
 *
 * Belangrijk: controller wordt pas dibuat ketika section Spotify sudah aktif.
 * Spotify hanya mempunyai SATU embed; tidak ada controller + iframe aktif
 * bersamaan. Ini mengikuti pola resmi Spotify: createController(element,
 * options, callback), lalu controller menyediakan pause() dan event playback.
 */
export function initSpotifyPlayer({ src, onPlaybackStart } = {}) {
  const mount = document.querySelector("#spotify-embed");
  const scene = document.querySelector("#lagu");
  if (!mount) return { pause: () => false, isReady: () => false };

  const source = String(src || "");
  const playlistMatch = source.match(/\/playlist\/([A-Za-z0-9]+)(?:[/?]|$)/);
  const spotifyUri = playlistMatch ? `spotify:playlist:${playlistMatch[1]}` : source;

  let controller = null;
  let ready = false;
  let pendingPause = false;
  let creating = false;
  let api = window.__spotifyIframeAPI || null;
  let fallbackShown = false;

  function setPlayerSize(el) {
    el.style.width = "100%";
    el.style.height = "450px";
    el.style.minHeight = "450px";
    el.style.border = "0";
    el.style.display = "block";
  }

  function isSpotifySceneActive() {
    return !scene || scene.classList.contains("is-active");
  }

  function showFallback() {
    // Fallback hanya untuk kasus API benar-benar tidak tersedia. Ia memakai
    // mount yang sama, sehingga tidak pernah berdampingan dengan controller.
    if (controller || ready || fallbackShown || !source || !isSpotifySceneActive()) return;

    fallbackShown = true;
    mount.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.id = "spotify-native-fallback";
    iframe.src = source;
    iframe.title = "Spotify playlist";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("frameborder", "0");
    setPlayerSize(iframe);
    mount.appendChild(iframe);
  }

  function createControllerIfPossible() {
    if (!api?.createController || creating || controller || !isSpotifySceneActive()) return;

    creating = true;
    fallbackShown = false;
    mount.replaceChildren();

    const options = {
      width: "100%",
      height: "450",
      // Spotify officially accepts either a Spotify URI or a full Spotify URL.
      // Use the original URL here so playlist query parameters are preserved.
      url: source || spotifyUri,
    };

    try {
      api.createController(mount, options, (EmbedController) => {
        controller = EmbedController;

        controller.addListener("ready", () => {
          ready = true;
          creating = false;

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
      creating = false;
      controller = null;
      ready = false;
      console.warn("[Spotify] createController failed:", err);
      // Jangan langsung membuat fallback ketika section masih belum stabil.
      // Jika API memang gagal, fallback dibuat hanya setelah scene aktif.
      showFallback();
    }
  }

  // Spotify memanggil callback global ini dari HTML. Event custom di sini
  // juga mendukung kasus API selesai loading setelah module dijalankan.
  window.addEventListener("spotify-iframe-api-ready", (event) => {
    api = event.detail;
    createControllerIfPossible();
  });

  // Create the Embed as soon as the official API is ready. Spotify's own
  // documentation uses this pattern, and the mount is a dedicated element.
  // The section can still be hidden by pageFlow; the Embed itself remains
  // ready when the user reaches the Spotify page.
  scene?.addEventListener("view:activated", createControllerIfPossible);
  scene?.addEventListener("view:settled", createControllerIfPossible);

  // Jika API sudah tersedia ketika module dijalankan, jangan menunggu event
  // yang sudah lewat; createControllerIfPossible akan membuatnya ketika
  // section aktif.
  createControllerIfPossible();

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

    // Background music bisa dimainkan sebelum Spotify controller ready.
    // Simpan permintaan pause dan eksekusi segera setelah ready.
    pendingPause = true;
    return false;
  }

  return {
    pause,
    isReady: () => ready,
  };
}
