import { content } from "../data/content.js";
import { seededRange } from "./seededRandom.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Satu babak = satu foto + satu kalimat, persis alur referensi (bukan
 * grid foto terpisah dari teksnya). Jumlah babak sepenuhnya mengikuti
 * panjang content.memories -- tambah/kurangi foto di content.js, halaman
 * ini otomatis menyesuaikan tanpa sentuh kode lain.
 *
 * WAJIB dipanggil SEBELUM initPageFlow(), supaya babak-babak ini sudah
 * ada di DOM saat pageFlow menghitung total babak.
 */
export function renderMemories() {
  const placeholder = document.querySelector("[data-memory-slot]");
  if (!placeholder) return;

  const total = content.memories.length;
  const fragment = document.createDocumentFragment();

  content.memories.forEach((memory, i) => {
    const section = document.createElement("section");
    section.className = "act section--memory";
    section.dataset.act = `kenangan-${i + 1}`;
    section.setAttribute("aria-label", `Kenangan ${i + 1} dari ${total}`);

    const index = String(i + 1).padStart(2, "0");
    const totalLabel = String(total).padStart(2, "0");
    const filename = memory.src.split("/").pop();
    // Kemiringan statis "acak" tapi konsisten per foto -- seeded dari
    // path foto, supaya selalu sama tiap kali halaman dirender ulang.
    const tilt = seededRange(memory.src, -6, 6).toFixed(2);

    section.innerHTML = `
      <div class="photo-frame" style="--tilt:${tilt}deg">
        <span class="memory-label">MEMORY ${index}/${totalLabel}</span>
        <span class="photo-frame__perf photo-frame__perf--left" aria-hidden="true"></span>
        <span class="photo-frame__perf photo-frame__perf--right" aria-hidden="true"></span>
        <div class="photo-frame__tilt">
          <div class="photo-frame__window" data-photo-window>
            <span>Taruh ${escapeHtml(filename)} di folder assets/images/</span>
            <img src="${escapeHtml(memory.src)}" alt="${escapeHtml(memory.line)}" loading="lazy" data-photo-img />
          </div>
        </div>
      </div>
      <p class="memory-line">${escapeHtml(memory.line)}</p>
      <button type="button" class="btn btn--primary" data-next>${escapeHtml(content.continueLabel)}</button>
    `;

    const img = section.querySelector("[data-photo-img]");
    img.addEventListener("error", () => {
      img.remove(); // placeholder <span> yang sudah ada di window jadi tetap terlihat
    });

    fragment.appendChild(section);
  });

  placeholder.replaceWith(fragment);
}
