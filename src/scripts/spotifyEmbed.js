/**
 * Embed Spotify lewat IFrame API resmi mereka (bukan <iframe src="...">
 * statis) -- SATU-SATUNYA cara dapat tahu kapan Spotify mulai/berhenti
 * main dan mengontrolnya dari luar, karena iframe Spotify cross-origin
 * (tidak bisa "diintip" isinya lewat DOM biasa).
 *
 * Referensi: https://developer.spotify.com/documentation/embeds/reference/iframe-api
 *
 * onPlay: dipanggil TIAP KALI Spotify mulai main -- dipakai main.js utk
 * menyuruh musik latar berhenti, supaya tidak dua-duanya bersahutan.
 *
 * Dimuat MALAS (baru benar-benar bikin controller & load script API-nya
 * saat halaman lagu pertama kali dikunjungi -- lihat view:activated di
 * bawah), bukan langsung saat web dibuka -- pengguna belum tentu sampai
 * ke halaman itu, jangan boroskan request ke Spotify kalau belum perlu.
 */

let apiScriptPromise = null;

/** Muat script IFrame API Spotify sekali saja, dipakai bersama walau
 * fungsi ini dipanggil berkali-kali. */
function loadSpotifyApi() {
  if (apiScriptPromise) return apiScriptPromise;

  apiScriptPromise = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => resolve(IFrameAPI);
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => reject(new Error("Gagal memuat Spotify IFrame API"));
    document.head.appendChild(script);
  });

  return apiScriptPromise;
}

/** "https://open.spotify.com/embed/playlist/ID?utm_source=..." -> "spotify:playlist:ID" */
function parseSpotifyUri(embedSrc) {
  const match = embedSrc?.match(/\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `spotify:${match[1]}:${match[2]}`;
}

export function initSpotifyEmbed(embedSrc, { onPlay } = {}) {
  const container = document.querySelector("[data-spotify-embed]");
  const uri = parseSpotifyUri(embedSrc);
  if (!container || !uri) {
    return { pause: () => {} };
  }

  let controller = null;
  let created = false;

  function create() {
    if (created) return;
    created = true;

    loadSpotifyApi()
      .then((IFrameAPI) => {
        IFrameAPI.createController(
          container,
          { uri, width: "100%", height: "352" },
          (EmbedController) => {
            controller = EmbedController;
            EmbedController.addListener("playback_update", (e) => {
              if (!e.data.isPaused) onPlay?.();
            });
          }
        );
      })
      .catch((err) => {
        // Gagal senyap (mis. jaringan Spotify diblokir) -- bukan bagian
        // penting dari alur utama situs, jangan sampai melempar error
        // yang menghentikan step lain di main.js.
        console.warn("Spotify embed gagal dimuat:", err);
      });
  }

  document.querySelector("#lagu")?.addEventListener("view:activated", create, { once: true });

  return {
    pause: () => controller?.pause(),
  };
}
