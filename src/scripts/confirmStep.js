/**
 * Konfirmasi "udah siap buka kejutannya?" dengan reaksi lucu kalau
 * pilih "belum siap" -- lalu balik lagi ke pertanyaan yang sama,
 * meniru pola di video referensi.
 */
export function initConfirmStep({ onConfirm }) {
  const section = document.querySelector("#konfirmasi");
  if (!section) return;

  const questionEl = section.querySelector("[data-confirm-question]");
  const reactionEl = section.querySelector("[data-confirm-reaction]");
  const yesBtn = section.querySelector("[data-confirm-yes]");
  const noBtn = section.querySelector("[data-confirm-no]");
  const backBtn = section.querySelector("[data-confirm-back]");

  noBtn?.addEventListener("click", () => {
    questionEl.hidden = true;
    reactionEl.hidden = false;
  });

  backBtn?.addEventListener("click", () => {
    reactionEl.hidden = true;
    questionEl.hidden = false;
  });

  yesBtn?.addEventListener("click", () => {
    onConfirm();
  });
}
