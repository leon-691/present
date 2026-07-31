/**
 * Spotify Embed integration.
 *
 * Uses Spotify's official iFrame API so the site can observe Spotify playback
 * and pause the local background MP3 when Spotify starts playing. Directly
 * accessing the Spotify iframe is not possible because it is cross-origin.
 */

const SPOTIFY_IFRAME_API = "https://open.spotify.com/embed/iframe-api/v1";
let apiPromise = null;

function loadSpotifyIframeApi() {
  if (window.IFrameAPI) return Promise.resolve(window.IFrameAPI);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onSpotifyIframeApiReady;
    let settled = false;

    const finish = (api) => {
      if (settled) return;
      settled = true;
      window.onSpotifyIframeApiReady = previousReady || undefined;
      resolve(api);
    };

    window.onSpotifyIframeApiReady = (api) => {
      previousReady?.(api);
      finish(api);
    };

    const existing = document.querySelector('script[data-spotify-iframe-api]');
    if (existing) return;

    const script = document.createElement("script");
    script.src = SPOTIFY_IFRAME_API;
    script.async = true;
    script.dataset.spotifyIframeApi = "true";
    script.onerror = () => {
      if (settled) return;
      settled = true;
      reject(new Error("Spotify iFrame API gagal dimuat."));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}

export async function initSpotifyEmbed({ url, onPlaybackStart, onReady }) {
  const host = document.querySelector("[data-spotify-embed]");
  if (!host || !url) return null;

  // Prevent accidental duplicate initialization if page setup runs twice.
  if (host.dataset.spotifyInitialized === "true") {
    return host._spotifyController || null;
  }

  host.dataset.spotifyInitialized = "loading";

  try {
    const IFrameAPI = await loadSpotifyIframeApi();

    const controller = await new Promise((resolve, reject) => {
      let finished = false;
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          reject(new Error("Spotify Embed tidak selesai diinisialisasi."));
        }
      }, 10000);

      const options = {
        width: "100%",
        height: host.dataset.height || "300",
        url,
      };

      IFrameAPI.createController(host, options, (EmbedController) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        resolve(EmbedController);
      });
    });

    host.dataset.spotifyInitialized = "true";
    host._spotifyController = controller;

    controller.addListener("playback_started", () => {
      onPlaybackStart?.(controller);
    });

    controller.addListener("playback_update", (event) => {
      // Some Spotify embeds emit playback_started only once per context;
      // playback_update is therefore also used as a reliable signal that
      // playback has become active.
      if (event?.data && event.data.isPaused === false) {
        onPlaybackStart?.(controller);
      }
    });

    onReady?.(controller);
    return controller;
  } catch (err) {
    host.dataset.spotifyInitialized = "error";
    console.warn("Spotify Embed tidak dapat diinisialisasi:", err);
    return null;
  }
}
