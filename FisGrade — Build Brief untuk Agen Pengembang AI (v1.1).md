# FisGrade — Build Brief untuk Agen Pengembang AI (v1.1)

Versi 1.1 | 25 Oktober 2026 | Ringkasan komando untuk membangun aplikasi dari PRD, TDD, dan UI/UX

## 1. Tujuan dan cara memakai

Dokumen ini adalah pintu masuk tunggal bagi agen pengembang (AI atau manusia) untuk membangun FisGrade. Serahkan dokumen ini bersama tiga dokumen acuan. Agen mengerjakan milestone M0 sampai M8 secara berurutan; setiap milestone dinyatakan selesai hanya bila uji pintu keluarnya lulus. Dokumen ini tidak menjamin aplikasi langsung siap tanpa iterasi: keputusan, kunci API, hosting, dan persetujuan etik tetap perlu diisi manusia (bagian 6).

## 2. Dokumen acuan dan urutan prioritas

1. **Build Brief ini** (aturan kerja dan milestone).
2. **PRD bagian 18** (keputusan final dan kriteria penerimaan AC-01 sampai AC-18).
3. **TDD bagian 20** (spesifikasi teknis siap bangun: tumpukan, repositori, skema, API, aturan, rubrik, hint, seed, fixture, backlog T-01 sampai T-26).
4. **UI/UX bagian 11** (token desain, perubahan wireframe, rute, komponen, teks, kriteria U-01 sampai U-10).
5. Bagian bernomor lebih kecil pada ketiga dokumen: hanya berlaku bila tidak bertentangan dengan butir 1–4.
6. Gambar pada artikel: hanya ilustrasi; tidak boleh mengalahkan dokumen.

## 3. Aturan kerja untuk agen

1. Jangan menambah fitur di luar lingkup (tanpa gamifikasi, AI Mentor, pustaka materi, editor soal, integrasi LMS).
2. Kunci penyelesaian dan rubrik hanya di server dan tidak pernah dalam respons peserta.
3. Nama dan NIM tidak pernah dikirim ke LLM atau ke log.
4. Aturan deterministik dan hitungan simbolik lebih dulu; LLM hanya untuk penilaian makna dan harus dapat dimatikan dengan LLM\_ENABLED=false.
5. Tulis uji bersama kode; jangan menandai milestone selesai bila ada uji gagal.
6. Jangan mengarang nomor versi pustaka, URL API, atau kebijakan penyedia; periksa dokumentasi resmi, atau tulis TODO eksplisit bila tidak dapat diperiksa.
7. Parameter (jeda, percobaan, penalti, toleransi) dibaca dari konfigurasi, bukan ditulis tetap di kode.
8. Gunakan teks antarmuka persis seperti UI/UX 11.5 dan palet hanya dari token 11.1.
9. Laporkan hasil uji skenario apa adanya, termasuk yang gagal; jangan mengubah ekspektasi agar lulus.
10. Setelah setiap milestone: ringkas yang dikerjakan, uji lulus dan gagal, serta keputusan yang membutuhkan manusia.

## 4. Milestone dan pintu keluar

| Milestone | Cakupan (tugas TDD 20.14) | Pintu keluar |
| --- | --- | --- |
| M0 Fondasi | T-01, T-02, T-07 | docker compose up berjalan; /healthz ok; migrasi dan seed memuat 1 paket 1 soal; halaman W-01 tampil dengan palet navy dan putih |
| M1 Dosen dan sesi | T-03, T-04 | AC-01 lulus |
| M2 Mahasiswa masuk | T-05, T-06 | AC-02 lulus; AC-04 bagian pemulihan |
| M3 Kanvas | T-08, T-09, T-10, T-11 | AC-03 lulus; keempat panel menyimpan otomatis dan pulih setelah muat ulang |
| M4 Mesin pemeriksa dasar | T-12, T-13, T-14 | Skenario 1, 4, 7, dan 10 lulus pada test\_scenarios; respons check sesuai kontrak TDD 20.4 |
| M5 Kontradiksi, hint, skor | T-15, T-16 | AC-05, AC-06, AC-07, AC-08 lulus secara menyeluruh (UI dan API) |
| M6 Hasil dan dasbor dosen | T-19, T-20 | AC-09 dan AC-17 lulus; radar sesuai UI/UX 11.4 |
| M7 LLM dan pasangan lengkap | T-17, T-18, T-25 | AC-12 dan AC-15 lulus; seluruh 10 skenario dijalankan dan dilaporkan |
| M8 Pelengkap dan pengerasan | T-21, T-22, T-23, T-24, T-26 | AC-13, AC-16, AC-18 lulus; Definisi selesai PRD 18.4 terpenuhi |

## 5. Prompt utama (salin dan tempel ke agen)

```
Anda adalah pengembang senior yang membangun aplikasi web FisGrade dari awal.

Baca dokumen berikut dan patuhi sesuai urutan prioritas: (1) Build Brief v1.1,
(2) PRD bagian 18, (3) TDD bagian 20, (4) UI/UX bagian 11. Bagian lama pada
PRD, TDD, dan UI/UX hanya berlaku bila tidak bertentangan. Gambar pada artikel
hanya ilustrasi.

Kerjakan milestone M0 sampai M8 secara berurutan. Sebuah milestone selesai hanya
bila uji pintu keluarnya lulus. Patuhi aturan kerja pada bagian 3 Build Brief.
Jangan menambah fitur di luar lingkup. Jangan mengarang nomor versi atau URL;
periksa dokumentasi resmi atau beri TODO eksplisit. Kunci penyelesaian hanya di
server. Nama dan NIM tidak pernah dikirim ke LLM atau log. Semua teks antarmuka
berbahasa Indonesia sesuai UI/UX 11.5.

Setelah tiap milestone, laporkan: apa yang dikerjakan, uji yang lulus atau
gagal, dan keputusan yang perlu manusia. Mulai dari M0.
```

Prompt per milestone (tempel satu per satu setelah laporan milestone sebelumnya): Lanjutkan ke M{n} sesuai tabel bagian 4. Kerjakan tugas T-xx yang tercantum, jalankan uji pintu keluar, dan laporkan hasilnya.

## 6. Yang harus dikerjakan manusia

| Butir | Keterangan |
| --- | --- |
| Kunci OpenRouter dan pemilihan model | Isi OPENROUTER\_API\_KEY dan OPENROUTER\_MODEL; periksa kebijakan retensi dan penggunaan data penyedia pada dokumentasi resminya |
| Verifikasi kunci penyelesaian | Hitung ulang secara independen dan cocokkan dengan buku teks; isi sitasi buku pada artikel (placeholder \[sitasi\]) |
| Tinjauan rubrik | Minta dosen pembimbing meninjau rubrik dan bobot sebelum uji alfa; tulis hanya bila benar-benar terjadi |
| Hosting dan domain | Pilih penyedia, atur HTTPS, variabel lingkungan produksi, dan cadangan basis data |
| Persetujuan dan etik | Finalkan teks persetujuan dan kebijakan retensi bersama komite etik; baca pasal terkait UU No. 27 Tahun 2022 |
| Dikte suara | Putuskan akhir antara Web Speech API peramban dan transkripsi di server setelah memeriksa kebijakan pemrosesan audio |
| Hasil uji skenario | Jalankan harness dan isi Tabel 5 artikel dengan hasil nyata, termasuk kegagalan |
| Uji coba terbatas | Uji dengan 5 mahasiswa, kumpulkan angket Likert dan catatan kualitatif, hitung P dan kategori kepraktisan |
| Kontras warna | Verifikasi rasio kontras dengan alat pemeriksa; angka pada dokumen UX adalah perkiraan |
| Gambar artikel | Perbaiki gambar sesuai instruksi regenerasi; teks pada gambar hasil generator harus diperiksa |

## 7. Hal yang belum diverifikasi

- Nomor versi dan kompatibilitas semua pustaka pada TDD 20.1.
- URL dasar dan format permintaan OpenRouter serta dukungan keluaran JSON terstruktur per model.
- Apakah Web Speech API mengirim audio ke pihak ketiga pada peramban yang dipakai.
- Efektivitas aturan deteksi pada data mahasiswa nyata; seluruh angka target adalah target rancangan, bukan klaim kinerja.
- Validasi isi oleh pakar belum dilakukan dan harus dinyatakan sebagai keterbatasan.
- Nilai parameter (jeda 7 detik, 3 percobaan, stagnasi 60 detik, penalti 5, 10, 10, bobot rubrik, toleransi) adalah nilai awal tanpa sumber literatur dan perlu dikalibrasi.

## 8. Daftar periksa serah terima

- [ ] Seluruh AC-01 sampai AC-18 lulus pada staging.
- [ ] Set emas 10 skenario dijalankan; hasil dilaporkan apa adanya.
- [ ] Uji otomatis AC-10 dan AC-11 lulus (tanpa kebocoran kunci dan PII).
- [ ] README memuat cara menjalankan, menyemai, dan menguji.
- [ ] Tidak ada rahasia pada repositori; .env.example lengkap.
- [ ] Kriteria antarmuka U-01 sampai U-10 lulus.
- [ ] Daftar pada bagian 6 dikerjakan atau dicatat sebagai terbuka.
