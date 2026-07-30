/**
 * ==========================================================================
 * ISI KONTEN WEBSITE
 * ==========================================================================
 * Ini SATU-SATUNYA file yang perlu Anda edit untuk mengganti teks.
 * Tidak perlu sentuh HTML/CSS/JS lain sama sekali.
 *
 * PENTING soal bahasa: teks di bawah sengaja mengikuti bahasa ASLI
 * video referensi apa adanya -- mayoritas Inggris (gaya santai, ada
 * ejaan sengaja diulang seperti "readyy"/"thisss"), dan Indonesia
 * HANYA di titik yang di video memang berbahasa Indonesia (gerbang
 * password, satu reaksi bercanda, tombol "Kembali ke Awal"). Hanya
 * kata-kata yang bernuansa romantis/pasangan yang diganti (mis.
 * "girlfriend", "my love", "pretty girl") -- selebihnya dipertahankan
 * sedekat mungkin ke referensi. Yang bertanda "GANTI INI" wajib
 * kamu isi sendiri (data personal yang tidak bisa ditebak).
 * ==========================================================================
 */

export const content = {
  // Nama panggilan adik/teman dekat kamu.
  friendName: "Adik",

  // Nama kamu sendiri, muncul di akhir surat.
  fromName: "EL",

  // Umur yang dirayakan (angka besar di halaman reveal).
  age: 16,

  // ------------------------------------------------------------------
  // 0. OPENING -- kado yang menunggu diketuk, halaman PALING PERTAMA.
  // Label "For {friendName}" dibangun otomatis dari friendName di atas
  // (lihat main.js) -- tidak perlu diisi terpisah di sini.
  // ------------------------------------------------------------------
  openingHint: "CLICK THE BOX!",

  // ------------------------------------------------------------------
  // 1. GERBANG KATA SANDI -- halaman kedua, setelah kado dibuka.
  // Baris ini di video aslinya berbahasa Indonesia campur Inggris,
  // jadi dipertahankan apa adanya -- hanya kata "love" (panggilan
  // sayang) yang dihapus.
  // ------------------------------------------------------------------
  password: "2807", // GANTI INI -- format bebas, panjangnya menentukan jumlah kotak PIN
  gateSubtitle: "Hii, guess the password, I bet u knoww!!",
  passwordClue: "clue : your birthday",
  gateWrongMessage: "wrongg! try again hahaha",

  // ------------------------------------------------------------------
  // 2. SAPAAN -- setelah kode benar. Aslinya "hi, pretty" -- kata
  // "pretty" (pujian ke pasangan) dihapus.
  // ------------------------------------------------------------------
  greetingText: "HI!!",
  greetingButton: "tap<3",

  // ------------------------------------------------------------------
  // 3. KONFIRMASI -- yes/no persis referensi, + reaksi bercanda yang
  // di video memang berbahasa Indonesia.
  // ------------------------------------------------------------------
  confirmQuestion: "are you ready to open thiss?",
  confirmYes: "yess",
  confirmNo: "noo",
  confirmReactionText: "GRRR!",
  confirmReactionButton: "backkk",

  // ------------------------------------------------------------------
  // 4. REVEAL UMUR -- aslinya "Today, this pretty girl turns 18!
  // happy birthday, my love" -- "pretty girl" & "my love" dihapus.
  // ------------------------------------------------------------------
  revealPrefix: "today, you turn",
  revealSuffix: "happy birthday!",
  revealButton: "open it<3",

  // ------------------------------------------------------------------
  // 5. PESAN UTAMA -- aslinya "Happy birthday to my most beautiful,
  // loving, and caring girlfriend, I love youu so muchh!!" --
  // "girlfriend"/"beautiful"/"I love you" diganti versi platonis.
  // ------------------------------------------------------------------
  mainMessageTitle: "happy birthday to one of the kindest, most caring people I know istg",
  mainMessageBody: "so glad to know you in this life!!",
  mainMessageButton: "i have something for you🎁",

  // ------------------------------------------------------------------
  // 6. TRANSISI -- persis referensi, tidak ada nuansa romantis.
  // ------------------------------------------------------------------
  transitionText: "last one, i made something for your birthday, read it slowly okay",
  continueLabel: "klik ini <3",

  // ------------------------------------------------------------------
  // 7. KENANGAN -- satu halaman = satu foto + satu kalimat, PERSIS
  // seperti di video (bukan grid foto terpisah dari teks). Boleh
  // tambah/kurangi jumlah item; halaman otomatis menyesuaikan.
  // src: path ke file foto di folder assets/images/
  // ------------------------------------------------------------------
  memories: [
    {
      src: "assets/images/foto-1.jpg",
      line: "This was our first picture, a moment who can make me feel so lovely",
    },
    {
      src: "assets/images/foto-2.jpg",
      line: "I'm so grateful for every moment we've shared since then",
    },
    {
      src: "assets/images/foto-3.jpg",
      line: "Thank you for being part of my days at that time",
    },
    {
      src: "assets/images/foto-4.jpg",
      line: "I hope you can have a good life until you die",
    },
    {
      src: "assets/images/foto-5.jpg",
      line: "you deserve the world!",
    },
  ],

  // ------------------------------------------------------------------
  // 8. LAGU KENANGAN -- aslinya "our song" -- diganti sedikit karena
  // "our song" konotasinya pasangan, selebihnya sama.
  // Cara ambil embedSrc:
  // 1. Buka playlist di Spotify -> titik tiga (...) -> Share -> Embed playlist
  // 2. Salin URL di dalam atribut src= pada kode yang diberikan Spotify
  // 3. Tempel di sini.
  // ------------------------------------------------------------------
  songTitle: "some songs for you 🎵",
  songSubtitle: "a few songs that remind me of..",
  spotifyEmbedSrc: "https://open.spotify.com/embed/playlist/GANTI_INI?utm_source=generator",

  // ------------------------------------------------------------------
  // 9. SURAT PANJANG -- satu paragraf mengalir, persis alur referensi
  // (cuma "my love" & "loving you" diganti versi platonis).
  // ------------------------------------------------------------------
  letterHeading: "happy birthday",
  // Petunjuk drag di scene amplop -- muncul sebelum & sesudah amplop dibuka.
  envelopeHint: "tarik amplopnya ke atas",
  envelopePaperHint: "tarik kertasnya keluar",
  letterBody: [
    "On your special day, I just want to remind you how grateful I am to can know you in this life.",
    "Thank you for being the amazing person you are -- kind, caring, and always making everything feel a little warmer just by being around.",
    "I hope this new year of your life brings you happiness, peace, and all the good things you've been wishing for.",
    "May every step you take feel lighter, and may you always be surrounded by people who truly care about you.",
    "You deserve so much more than you realize.",
    "I'm thankful I get to celebrate you, today and maybe in another life.",
    "I look forward to creating more memories with you like a before and being there for you in all the simple ways that matter most.",
    "Happy birthday.",
  ],
  // Tombol ini di video aslinya memang berbahasa Indonesia.
  closingButton: "Kembali ke Awal",

  // ------------------------------------------------------------------
  // MUSIK LATAR (widget mengambang)
  // src: path ke file mp3 di folder assets/audio/
  // ------------------------------------------------------------------
  backgroundAudioSrc: "assets/audio/lagu-latar.mp3", // diperbaiki -- sebelumnya "asset/Sound-Good.mp3" (folder "asset" itu tidak ada; filenya sudah ditaruh di assets/audio/lagu-latar.mp3, lihat README)
  backgroundAudioTitle: "Again",
  backgroundAudioSubtitle: "background music",
};
