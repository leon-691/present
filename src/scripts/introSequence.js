import { isMotionReduced } from "./motionPreference.js";

/**
 * Momen pembuka: hitungan mundur ala leader film 35mm sebelum gerbang
 * PIN muncul. Sekali putar per kunjungan, elemen overlay dibuat murni
 * lewat JS (tidak ada di HTML statis) dan membersihkan dirinya sendiri --
 * kalau JS gagal dimuat sama sekali, gerbang langsung terlihat tanpa
 * overlay yang nyangkut menghalangi apa pun.
 */
export function initIntroSequence() {
  if (isMotionReduced()) return;

  const overlay = document.createElement("div");
  overlay.className = "intro-leader";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="intro-leader__ring"></div><div class="intro-leader__count"></div>';
  document.body.appendChild(overlay);

  const countEl = overlay.querySelector(".intro-leader__count");
  const sequence = ["3", "2", "1"];
  let i = 0;

  function finish() {
    overlay.classList.add("is-leaving");
    const cleanup = () => overlay.remove();
    overlay.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 500); // jaring pengaman kalau transitionend tak terpicu
  }

  function step() {
    if (i >= sequence.length) {
      finish();
      return;
    }
    countEl.textContent = sequence[i];
    countEl.classList.remove("is-flashing");
    void countEl.offsetWidth; // paksa reflow supaya animasi bisa diulang
    countEl.classList.add("is-flashing");
    i++;
    setTimeout(step, 460);
  }

  step();
}
