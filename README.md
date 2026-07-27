# Untuk Adik — Golden Hour

Kado digital ulang tahun, **page-based** (berpindah babak lewat transisi
letterbox sinematik, bukan satu halaman scroll panjang). Identitas visual
ditulis ulang total dari nol -- film title-sequence, grain 35mm, light-leak,
palet amber senja di atas hitam hangat -- tapi seluruh fitur, alur cerita,
teks, dan fungsi tombol dari versi sebelumnya dipertahankan persis.

Urutannya: gerbang kode → sapaan → konfirmasi (+ reaksi kalau pilih "noo")
→ reveal umur → pesan utama → transisi → babak kenangan (satu foto + satu
kalimat per babak) → lagu → surat panjang (scroll internal, tombol
"Kembali ke Awal" mengulang dari babak pertama).

## 1. Yang wajib kamu isi sebelum di-deploy

Semua teks ada di **satu file**: `src/data/content.js`. Cari semua baris
bertanda `GANTI INI` dan isi dengan kata-katamu sendiri -- tidak perlu
sentuh file lain.

Checklist:
- [ ] `friendName`, `fromName`
- [ ] `password`
- [ ] `mainMessageBody`, `letterBody` (boleh tambah/kurang jumlah kalimat)
- [ ] `memories` -- taruh foto di `assets/images/` dengan nama `foto-1.jpg`
      dst. (atau ubah nama filenya di `content.js`; boleh tambah/kurangi
      jumlah item, babak otomatis menyesuaikan)
- [ ] `spotifyEmbedSrc` -- lihat cara ambilnya di komentar dalam `content.js`
- [ ] `backgroundAudioSrc` -- taruh file mp3 di `assets/audio/lagu-latar.mp3`

Kalau foto atau audio belum ditaruh, situsnya tidak akan error -- foto
menampilkan teks placeholder, tombol musik diam saja sampai file-nya ada.

> **Catatan:** `fromName` didefinisikan di `content.js` ("muncul di akhir
> surat") tapi di kode -- baik versi lama maupun rewrite ini -- field itu
> tidak pernah benar-benar dirender sebagai tanda tangan penutup. Saya
> pertahankan persis seperti aslinya (tidak menambah fitur baru sepihak
> saat harusnya cuma reskin visual). Kalau kamu memang mau surat ditutup
> dengan tanda tangan namamu, bilang saja -- itu perubahan satu baris di
> `letterScrub.js`.

## 2. Menjalankan di komputer sendiri

**Penting:** jangan buka `index.html` langsung dengan diklik dua kali.
Browser modern memblokir JavaScript modular (`type="module"`) yang dibuka
lewat `file://`. Jalankan lewat server lokal kecil:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

Atau pakai extension **Live Server** di VS Code.

## 3. Deploy (gratis)

[Netlify Drop](https://app.netlify.com/drop) -- drag-and-drop seluruh
folder ini ke browser, langsung dapat link. Vercel atau GitHub Pages juga
bisa, caranya serupa.

## 4. Struktur folder

```
index.html                halaman utama, semua babak ada di sini
src/
  styles/
    tokens.css               palet, tipografi, spacing, durasi gerak -- SATU
                              tempat untuk ubah identitas visual
    base.css                 reset + lapisan tetap (grain/vignette/letterbox)
    components.css           tombol, keypad, timecode bar, widget musik, frame foto
    sections.css              layout tiap babak
    motion.css                 timing transisi letterbox + intro film-leader
  scripts/
    main.js                     orkestrator, urutan init penting di sini
    pageFlow.js                  navigasi antar-babak (letterbox + light-leak)
    passwordGate.js                gerbang kode
    confirmStep.js                   konfirmasi yes/no + reaksi
    revealAge.js                       angka umur + koreografi flip/ledakan
    memoryRenderer.js                    babak kenangan, dibuat dari content.memories
    letterScrub.js                         efek sorotan-baca di surat
    musicPlayer.js                           widget musik mengambang
    photoTilt.js                               tilt mouse/sentuh/gyro pada foto
    confettiEmber.js                             ledakan partikel perayaan
    filmGrain.js / emberField.js                   tekstur & partikel ambient
    introSequence.js                                 hitungan mundur pembuka
    cursorGlow.js / rippleEffect.js                    feedback interaksi desktop
    motionPreference.js                                gabung sinyal OS + toggle manual
    deviceTier.js / seededRandom.js                      utilitas performa & konsistensi
  data/content.js            SEMUA teks & konfigurasi -- edit di sini saja
assets/
  images/                   taruh foto di sini
  audio/                    taruh file musik latar di sini
```

## 5. Kalau mau ubah warna/tipografi

Semua ada di `src/styles/tokens.css`, di bagian atas sendiri. Ubah nilai
hex atau nama fontnya (ingat sesuaikan juga link Google Fonts di
`index.html` kalau ganti keluarga font), otomatis berlaku ke seluruh babak.

## 6. Dependency dari CDN

Google Fonts (Fraunces + Manrope) dan **GSAP** (dari cdnjs, khusus animasi
hitung umur naik di reveal). Kalau CDN gagal dimuat, situs tetap jalan
normal -- angka umur langsung tampil tanpa animasi hitung, tidak ada yang
error. Tidak perlu `npm install` apa pun; tetap murni HTML/CSS/JS tanpa
build step, bisa langsung drag-and-drop deploy.

## 7. Soal animasi & Android

Ada tombol kecil (ikon aperture) di pojok kanan atas -- toggle "Efek
Visual" dengan 3 keadaan: Otomatis / Penuh / Hemat. Banyak HP Android
melaporkan preferensi "kurangi gerakan" ke browser bukan karena
penggunanya minta itu, tapi karena mode hemat baterai OS. Kalau animasi
terasa mati di suatu HP, ketuk tombol ini sampai ke mode "Penuh". Detail
teknis di komentar `src/scripts/motionPreference.js`.

## 8. Aksesibilitas

Babak yang sedang tidak aktif diberi `inert` + `aria-hidden` (bukan cuma
disembunyikan visual) lewat `pageFlow.js`, supaya pengguna keyboard/pembaca
layar tidak "menemukan" tombol atau teks dari babak yang belum saatnya
dibuka. Fokus keyboard dipindah ke judul babak baru tiap kali berpindah.
Kalau menambah babak baru secara manual di HTML, pastikan diberi atribut
`data-act="nama-babak"` supaya ikut governance ini otomatis.

## 9. Meta tag & SEO

`index.html` sudah diberi `robots: noindex`, Open Graph tags netral (biar
preview link rapi saat dibagikan lewat chat tanpa membocorkan isi),
`theme-color`, `color-scheme: dark`, dan favicon SVG inline. Judul tab
(`document.title`) baru dipersonalisasi lewat JS setelah situs dibuka --
`<title>`/OG di HTML sengaja tetap netral, satu-satunya teks yang tidak
diambil dari `content.js`.
