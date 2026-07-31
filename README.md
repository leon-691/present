# Website Ulang Tahun untuk Adik

Kado digital sederhana, **page-based** (berpindah halaman dengan fade,
bukan satu halaman scroll panjang) -- mengikuti gaya video referensi,
termasuk bahasanya (dominan Inggris, Indonesia hanya di beberapa titik
yang di video memang berbahasa Indonesia).

Urutannya: **kado pembuka** (kotak kado yang diketuk) → gerbang kata
sandi → sapaan → konfirmasi (+ reaksi lucu kalau pilih "noo") → reveal
umur → pesan utama → transisi → halaman kenangan (satu foto + satu
kalimat per halaman) → lagu kenangan → **surat** (amplop di-drag ke atas
utk dibuka, kertas surat di dalamnya di-drag lagi utk ditarik keluar,
baru isi surat tampil -- tombol "Kembali ke Awal" balik ke **kado
pembuka**, bukan ke gerbang, karena kado sekarang halaman paling
pertama).

Identitas visualnya: kertas, sticker lucu (aset asli di `assets/stickers/`),
dan tulisan tangan -- tidak ada karakter/maskot buatan sendiri, dan TIDAK
ADA ilustrasi bunga SVG sama sekali. Bunga SENGAJA dibatasi jadi aksen di
3 titik saja, semuanya foto asli:
- **opening** -- ledakan `assets/images/bunga-png/bunga-1..21.png` (foto
  transparan, background dihapus otomatis), dibesarkan sampai menutupi
  layar
- **transisi** -- 2 foto (`assets/images/bunga-1.jpg`/`bunga-2.jpg`) +
  sticker "read it slowly" di tengahnya, dibulatkan jadi medali kecil
- **ending/surat** -- amplop & kertas surat asli (`assets/images/surat/`),
  dikelilingi 10 dekorasi pilihan dari `assets/images/surat/deco-*.png`
  (foto asli yang kamu kirim, background dihapus otomatis juga)

Di luar 3 titik itu, halaman lain sengaja dibiarkan tenang tanpa bunga.

## 1. Yang wajib kamu isi sebelum di-deploy

Semua teks ada di **satu file**: `src/data/content.js`. Cari semua
baris bertanda `GANTI INI` dan isi dengan kata-katamu sendiri —
tidak perlu sentuh file lain.

Status saat ini:
- [x] `friendName`, `fromName`, `password` — sudah terisi
- [x] `mainMessageBody`, `letterBody` — sudah terisi
- [x] `memories` — 5 foto sudah ada di `assets/images/foto-1.jpg` s/d `foto-5.jpg`
- [x] `backgroundAudioSrc` — sudah ada di `assets/audio/lagu-latar.mp3`
      (judul lagu asli tidak diketahui dari metadata file, jadi
      `backgroundAudioTitle` ikut apa yang kamu isi manual)
- [ ] `spotifyEmbedSrc` — **masih placeholder**, lihat cara ambilnya di
      komentar dalam `content.js`

Kalau foto atau audio belum ditaruh, situsnya tidak akan error — foto
akan menampilkan teks placeholder, dan tombol musik akan diam saja
sampai file-nya ada.

## 2. Menjalankan di komputer sendiri

**Penting:** jangan buka `index.html` langsung dengan cara diklik dua kali.
Browser modern memblokir JavaScript modular (`type="module"`) yang
dibuka lewat `file://`. Situs harus dijalankan lewat server lokal kecil:

```bash
# Dari dalam folder project ini:
python3 -m http.server 8000
# lalu buka http://localhost:8000 di browser
```

Atau kalau pakai VS Code, extension **Live Server** juga bisa.

## 3. Deploy (gratis)

Cara termudah: [Netlify Drop](https://app.netlify.com/drop) — tinggal
drag-and-drop seluruh folder project ini ke browser, langsung dapat link.
Alternatif lain: Vercel atau GitHub Pages, caranya serupa.

## 4. Struktur folder

```
index.html              halaman utama, semua section ada di sini
src/
  styles/                design tokens & komponen CSS, terpisah per keperluan
  scripts/                logic interaktif, satu modul per fitur
    pageFlow.js             navigasi antar-halaman (page-based)
    giftOpening.js          scene kado di halaman paling pertama
    envelopeReveal.js        scene amplop+kertas surat di halaman terakhir --
                              drag amplop ke atas utk buka, drag kertas ke
                              atas lagi utk tarik keluar, baru isi surat tampil
    petalBurst.js            ledakan/hembusan bunga (FOTO ASLI transparan dari
                              assets/images/bunga-png/, bukan SVG) -- dipakai
                              bareng oleh giftOpening.js (kado dibuka) &
                              letterScrub.js (surat "disegel" saat kembali ke awal)
    passwordGate.js        gerbang PIN
    confirmStep.js           konfirmasi yes/no + reaksi
    letterScrub.js             cuma micro-interaction "segel" tombol kembali
                                ke awal -- efek ketik/sorot-baca sudah dihapus
    musicPlayer.js               widget musik mengambang
    confetti.js                    efek konfeti
    motionPreference.js            satu sumber kebenaran preferensi motion
                                    (gabung sinyal OS + toggle manual "Efek
                                    Visual") -- modul lain baca isReduced()
                                    dari sini, bukan matchMedia sendiri-sendiri
    deviceTier.js                   heuristik ringan utk jumlah partikel ambient
    seededRandom.js                 rotasi polaroid/tape yg konsisten per foto
    ambientBackground.js            partikel bokeh canvas di lapisan atmosfer
    cursorGlow.js                   cursor glow + magnetic button (desktop)
    touchTilt.js                    padanan tilt utk layar sentuh + gyro ambient
  data/content.js         SEMUA teks & konfigurasi -- edit di sini saja
assets/
  images/                 foto kenangan (foto-1..5.jpg), 2 foto bunga utk
                          medali transisi (bunga-1.jpg/bunga-2.jpg), folder
                          bunga-png/ (21 foto bunga transparan utk ledakan
                          kado), folder surat/ (amplop, kertas surat, +10
                          dekorasi -- lihat catatan di bagian atas README ini)
  audio/                  musik latar (lagu-latar.mp3)
  stickers/               5 sticker asli (webp) -- identitas visual UTAMA
                          sekarang
```

## 5. Kalau mau ubah warna

Semua warna & font ada di `src/styles/variables.css`, di bagian atas
sendiri. Ubah nilai hex-nya, otomatis berlaku ke seluruh halaman.

Font-nya 3 peran (jangan campur lebih dari ini, biar tetap tenang):
`--font-display` (Shantell Sans -- headline/struktur), `--font-accent`
(Caveat -- aksen tulisan tangan, dipakai sedikit tapi menonjol),
`--font-body` (Plus Jakarta Sans -- badan teks panjang spt pesan &
surat, dijaga tetap sangat mudah dibaca).

## 6. Dependency dari CDN

Selain Google Fonts (sudah ada dari awal), situs ini sekarang juga
memuat **GSAP** dari CDN (`cdnjs`) untuk satu efek: animasi hitung
umur naik di halaman reveal. Kalau CDN gagal dimuat (mis. tidak ada
internet), situs tetap jalan normal -- angka umur langsung tampil
tanpa animasi hitung, tidak ada yang error. Tidak perlu `npm install`
apa pun; situs ini tetap murni HTML/CSS/JS tanpa build step.

## 7. Soal animasi & Android

Ada tombol kecil (✨) di pojok kanan atas -- itu toggle "Efek Visual"
dengan 3 keadaan: Otomatis / Penuh / Hemat. Alasannya: banyak HP
Android melaporkan preferensi "kurangi gerakan" ke browser bukan
karena penggunanya minta itu, tapi karena mode hemat baterai OS.
Kalau animasi terasa mati di suatu HP, coba ketuk tombol ini sampai
ke mode "Penuh". Detail teknisnya ada di komentar
`src/scripts/motionPreference.js`.

## 8. Aksesibilitas: halaman yang belum dibuka disembunyikan total

Situs ini page-based -- semua halaman (`.view`) ada di DOM sekaligus,
cuma satu yang terlihat lewat CSS. Supaya pengguna keyboard/pembaca
layar tidak "menemukan" tombol atau teks dari halaman yang belum
saatnya dibuka (misalnya surat, sebelum kode dimasukkan),
`pageFlow.js` memasang atribut `inert` + `aria-hidden` ke semua
halaman yang sedang tidak aktif. Kalau menambah halaman baru secara
manual di HTML (bukan lewat `content.js`), pastikan classnya tetap
`view` supaya ikut kena governance ini secara otomatis.

## 9. Meta tag & SEO

`index.html` sudah diberi `robots: noindex` (situs ini kado pribadi,
sengaja tidak boleh terindeks mesin pencari), Open Graph tags (biar
preview link rapi saat dibagikan lewat chat, tanpa membocorkan isi),
`theme-color`, `color-scheme: light`, dan favicon SVG inline berbentuk
bunga kecil. Kalau mau ganti judul/deskripsi yang dipakai utk
preview link, edit langsung di `<head>` -- ini SATU-SATUNYA teks yang
sengaja tidak diambil dari `content.js`, karena harus tetap netral
(tidak boleh membocorkan isi kejutan) walau isi surat/pesan diubah.
