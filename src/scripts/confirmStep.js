import { content } from "../data/content.js";

let questionEl, reactionEl, yesBtn;

function showReaction() {
  questionEl.hidden = true;
  reactionEl.hidden = false;
  const heading = reactionEl.querySelector("h2");
  heading.classList.remove("is-glitching");
  void heading.offsetWidth;
  heading.classList.add("is-glitching");
}

function showQuestion() {
  reactionEl.hidden = true;
  questionEl.hidden = false;
}

function handleYes() {
  document.dispatchEvent(new CustomEvent("confirm:yes"));
}

export function initConfirmStep() {
  const root = document.querySelector('[data-act="konfirmasi"]');
  if (!root) return;

  questionEl = root.querySelector("[data-confirm-question]");
  reactionEl = root.querySelector("[data-confirm-reaction]");
  yesBtn = root.querySelector("[data-confirm-yes]");
  const noBtn = root.querySelector("[data-confirm-no]");
  const backBtn = root.querySelector("[data-confirm-back]");

  root.querySelector("[data-confirm-question-text]").textContent = content.confirmQuestion;
  yesBtn.textContent = content.confirmYes;
  noBtn.textContent = content.confirmNo;
  root.querySelector("[data-confirm-reaction-text]").textContent = content.confirmReactionText;
  backBtn.textContent = content.confirmReactionButton;

  yesBtn.addEventListener("click", handleYes);
  noBtn.addEventListener("click", showReaction);
  backBtn.addEventListener("click", showQuestion);

  document.addEventListener("experience:restart", showQuestion);
}
