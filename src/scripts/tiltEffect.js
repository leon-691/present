/**
 * Efek tilt 3D pada kartu foto -- miring mengikuti posisi kursor,
 * mirip kartu fisik yang dimiringkan di tangan. Hanya aktif untuk
 * mouse/trackpad (device dengan hover asli); di layar sentuh efek
 * ini dilewati karena tidak ada posisi kursor yang presisi.
 */
export function initTiltEffect() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const MAX_TILT = 12; // derajat

  // Delegasi lewat document supaya kartu yang dibuat belakangan
  // (mis. halaman kenangan yang dirender JS) tetap kebagian efeknya,
  // tanpa perlu daftar ulang listener tiap kali render.
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".photo-card");
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    card.style.transform =
      `perspective(700px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg) scale3d(1.03, 1.03, 1.03)`;
  });

  document.addEventListener(
    "mouseout",
    (e) => {
      const card = e.target.closest(".photo-card");
      if (!card) return;
      if (card.contains(e.relatedTarget)) return;
      card.style.transform = "";
    },
    true
  );
}
