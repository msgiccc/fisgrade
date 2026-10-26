# FisGrade — Product Requirements Document (PRD)

Versi 1.0 | 25 Oktober 2026 | Status: Draf siap dikembangkan | Topik awal: Hukum Newton tentang gerak

Dokumen pendamping: Technical Design Document (TDD) dan UI/UX Wireframes & User Flow.

## 1. Ringkasan Eksekutif

FisGrade adalah aplikasi web asesmen formatif fisika berbasis proses. Mahasiswa mengerjakan satu soal melalui empat kanvas dalam satu layar: verbal, matematis, grafis, dan visual. Selama pengerjaan, sistem memeriksa konsistensi antarrepresentasi. Jika ditemukan kontradiksi, sistem menahan skor representasi terkait, menampilkan garis penghubung dengan ikon hint, lalu memandu mahasiswa melalui pilihan coba perbaiki atau hint bertingkat yang mengurangi batas skor. Hasil akhir berupa skor 0–100 per representasi yang dipetakan pada grafik radar belah ketupat, lalu diteruskan ke dasbor dosen beserta log dan rekaman ulang proses.

Tiga prinsip produk:

1. FisGrade bertindak sebagai tutor kognitif, bukan mesin pemberi skor akhir.
2. Proses pengerjaan transparan dan dapat ditinjau ulang oleh dosen.
3. Dosen tetap pemegang keputusan akhir atas skor.

Tema visual: putih khas pendidikan dengan warna utama Navy Blue dan Pure White.

## 2. Latar Belakang dan Dasar Literatur

| Temuan literatur | Implikasi bagi produk | Sumber |
| --- | --- | --- |
| Performa mahasiswa berbeda menurut format representasi, dan perbedaan lebih jelas terlihat ketika penjelasan ikut dinilai | Soal meminta penjelasan; empat representasi dinilai terpisah | Kohl & Finkelstein (2005); De Cock (2012) |
| Mahasiswa dengan diagram benda bebas benar menjawab benar 85%, diagram keliru 38%, tanpa bukti diagram 49%; mahasiswa berprestasi tinggi memakai diagram untuk memeriksa konsistensi | Pemeriksaan konsistensi dibuat eksplisit dan terlihat oleh mahasiswa | Rosengrant et al. (2009) |
| Representasi ganda dapat saling melengkapi, saling membatasi tafsir, dan membangun pemahaman; menerjemahkan antarrepresentasi sulit | Empat kanvas berdampingan; pasangan representasi diperiksa | Ainsworth (1999) |
| Siswa cenderung langsung memakai rumus tanpa analisis | Kanvas verbal dan visual wajib diisi sebelum skor dibuka | Nurul (2022) |
| AES berbasis teks dapat menilai esai tanpa rumus; pada fisika, LLM sebagai penilai hanya sesuai 50,8% dengan penilai manusia; kesesuaian persis GPT 54,33% | Lapisan deterministik, hitungan simbolik, kunci penyelesaian, dan hak ubah skor oleh dosen | Pradani & Suadaa (2023); Mizumoto & Eguchi (2023); Yeadon & Hardy (2023) |
| Rubrik analitik multidimensi dan verifikasi sebelum penilaian | Rubrik per representasi dan indikator analitik | Atil et al. (2024) |
| Umpan balik formatif efektif bila spesifik dan tepat waktu; hint dapat disalahgunakan | Hint bertingkat, berpenalti, dengan jeda pada level terakhir | Black & Wiliam (1998); Shute (2008); Earl (2003); Aleven et al. (2004) |

## 3. Tujuan, Sasaran, dan Metrik Keberhasilan

Tujuan produk: (a) menghasilkan prototipe fungsional yang dapat diakses daring; (b) mendeteksi kontradiksi antarrepresentasi pada topik Hukum Newton; (c) memberi umpan balik diagnostik per representasi; (d) mengurangi beban dosen dalam mengoreksi jawaban multirepresentasi.

| Metrik | Definisi | Target awal (dikalibrasi) | Sumber data |
| --- | --- | --- | --- |
| Kepraktisan | P = (total skor angket / skor maksimum ideal) × 100% | ≥ 81% (kategori sangat praktis) | Angket Likert 1–5 |
| Cakupan deteksi | Skenario berkontradiksi yang terdeteksi / total skenario berkontradiksi | ≥ 80% pada set uji internal | Harness uji |
| Alarm palsu | Peringatan pada skenario kontrol | 0 dari skenario kontrol | Harness uji |
| Latensi pemeriksaan | Waktu dari perubahan kanvas ke hasil tampil, persentil 95 | ≤ 8 detik | Log sistem |
| Penyelesaian sesi | Peserta uji yang mengirim jawaban tanpa bantuan teknis | ≥ 90% | Log dan observasi |
| Kesesuaian skor dengan dosen | QWK antara skor otomatis dan skor dosen | Ditetapkan setelah data beta; tafsir mengikuti Landis & Koch (1977) | Dasbor |
| Tingkat override | Skor yang diubah dosen / seluruh skor | Dipantau, tanpa target | Audit trail |

Catatan: seluruh angka target adalah target rancangan, bukan klaim kinerja.

## 4. Ruang Lingkup

**Dalam lingkup (v1):** aplikasi web responsif untuk dosen dan mahasiswa; akses mahasiswa melalui kode atau tautan sesi; paket soal bawaan sistem tentang Hukum Newton tentang gerak; empat kanvas dengan masukan cerdas; mesin pemeriksa konsistensi enam pasangan representasi; hint bertingkat dan penalti; skor per representasi dan radar belah ketupat; dasbor dosen dengan log, rekaman ulang, dan ubah skor; privasi berbasis pseudonim; modul angket kepraktisan dan harness uji skenario.

**Di luar lingkup:** gamifikasi (XP, koin, level, leaderboard); AI Mentor percakapan; pustaka materi; editor soal oleh dosen; integrasi LMS; aplikasi mobile native; mode luring; penilaian esai bahasa; materi selain Hukum Newton; validasi isi oleh pakar (agenda lanjutan); antarmuka multibahasa.

**Asumsi dan batasan:**

- Soal, kunci penyelesaian, dan rubrik disediakan sistem dan dibekukan per versi.
- Mahasiswa mengerjakan di perangkat dengan lebar layar minimal 1024 px (tablet lanskap atau laptop).
- Pemeriksaan semantik memerlukan koneksi internet ke layanan LLM.
- Topik dibatasi pada Hukum Newton tentang gerak.

## 5. Pengguna dan Peran

| Peran | Deskripsi | Tujuan utama | Akses utama |
| --- | --- | --- | --- |
| Dosen | Pengampu fisika yang membuka sesi | Menilai pemahaman multirepresentasi dengan efisien dan melihat miskonsepsi kelas | Kelas, sesi, hasil, log, ubah skor |
| Mahasiswa | Mahasiswa Pendidikan Fisika semester 3, usia sekitar 18–20 tahun | Mengerjakan soal, memahami letak kesalahan, memperbaiki mandiri | Mengerjakan sesi sendiri dan melihat hasilnya |
| Admin | Pengembang atau pengelola konten | Mengelola paket soal, versi, parameter, dan harness uji | Panel admin |

## 6. Konsep Inti Produk

### 6.1 Definisi operasional empat representasi

| Representasi | Definisi | Masukan cerdas |
| --- | --- | --- |
| Verbal | Penjelasan konsep dengan kata-kata: prinsip, gaya yang bekerja, keadaan gerak | Ketik atau dikte suara dengan modal transkrip yang dapat disunting |
| Matematis | Persamaan dan perhitungan beserta satuan | Papan ketik persamaan lengkap |
| Grafis | Grafik hubungan antarbesaran dengan sumbu, satuan, bentuk kurva, dan nilai kunci | Penggeser titik awal–akhir atau penempatan titik; penghalusan bentuk |
| Visual (setara piktorial pada Kohl & Finkelstein, 2005) | Gambar atau diagram situasi fisis, termasuk diagram benda bebas dengan panah gaya berlabel | Pustaka aset seret-lepas; panah gaya dapat dibuat dan dinamai |

### 6.2 Kunci penyelesaian dan rubrik

Setiap soal memiliki kunci penyelesaian untuk masing-masing representasi dan rubrik analitik berskor 0–100 per representasi. Bobot di bawah adalah bobot awal yang dikalibrasi pada uji alfa.

| Representasi | Indikator rubrik (bobot awal) |
| --- | --- |
| Verbal | Ketepatan prinsip atau hukum (30); identifikasi gaya (30); hubungan sebab-akibat dengan keadaan gerak (30); kejelasan (10) |
| Matematis | Persamaan dasar (25); substitusi (25); hasil numerik (30); satuan (20) |
| Grafis | Jenis dan bentuk kurva (30); sumbu dan satuan (25); nilai kunci atau kemiringan (35); kelengkapan (10) |
| Visual | Objek dan sistem (15); kelengkapan gaya (30); arah (25); panjang relatif (15); pelabelan (15) — mengadaptasi kriteria diagram benda bebas Rosengrant et al. (2009) |

Konsistensi antarrepresentasi tidak sama dengan kebenaran. Setiap representasi dibandingkan dengan kunci penyelesaian, sehingga jawaban yang konsisten tetapi keliru (misalnya gesekan diabaikan di keempat representasi) tetap terdeteksi.

### 6.3 Pasangan representasi yang diperiksa

| Kode | Pasangan | Contoh kontradiksi target | Dasar |
| --- | --- | --- | --- |
| P1 | Verbal ↔ Matematis | Menyebut gaya gesek kinetik, persamaan tanpa suku fₖ | Nurul (2022) |
| P2 | Verbal ↔ Visual | Gaya disebut tetapi tidak digambar, atau gaya berlebih | Rosengrant et al. (2009) |
| P3 | Verbal ↔ Grafis | Menyebut percepatan konstan, kurva v–t melengkung; penalaran linear keliru | De Cock (2012) |
| P4 | Matematis ↔ Visual | Panah gesek searah gaya tarik, persamaan bertanda F − fₖ | Rosengrant et al. (2009) |
| P5 | Matematis ↔ Grafis | a hasil hitung berbeda dengan kemiringan grafik v–t; kemiringan dibaca sebagai kecepatan | De Cock (2012) |
| P6 | Visual ↔ Grafis | Gaya netto ke kanan, grafik menunjukkan kecepatan menurun | Desain peneliti |

### 6.4 Prinsip skor dan hint

- Skor per representasi 0–100; tidak ada skor total.
- Skor akhir representasi = minimum dari skor rubrik dan (100 − total penalti hint pada representasi itu), dengan batas bawah 0.
- Penalti hanya jatuh pada representasi yang dibantu hint dan yang menyimpang dari kunci.
- Skor representasi ditahan selama ada kontradiksi yang melibatkannya.
- Log proses (percobaan, waktu) dipisahkan dari skor agar proses tidak dinilai ganda.
- Hint bertingkat: level 1 lokasi ketidaksesuaian dan bagian yang sudah benar; level 2 jenis kesalahan; level 3 petunjuk koreksi eksplisit tanpa jawaban akhir.

## 7. Ringkasan Alur Pengguna

**Dosen:** daftar atau masuk → buat kelas → pilih paket soal → buka sesi → bagikan kode atau tautan → pantau → sesi ditutup → tinjau hasil, log, dan rekaman ulang → ubah skor bila perlu → ekspor.

**Mahasiswa:** buka tautan atau masukkan kode → baca dan setujui persetujuan → isi nama dan NIM → baca instruksi → kerjakan di empat kanvas → ikon hint muncul bila ada kontradiksi → pilih coba perbaiki atau hint → tinjau ringkasan → kirim → lihat radar dan umpan balik diagnostik.

Detail alur dan layar ada pada dokumen UI/UX.

## 8. Kebutuhan Fungsional

Prioritas: **M** (harus, masuk MVP), **S** (sebaiknya, versi alfa), **C** (bisa, versi beta atau lebih lanjut).

### 8.1 Akun dan akses

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-A1 | Dosen mendaftar dan masuk dengan email dan kata sandi | M |
| FR-A2 | Mahasiswa tidak memerlukan akun; masuk dengan kode atau tautan sesi, nama, dan NIM | M |
| FR-A3 | Sesi mahasiswa dapat dilanjutkan setelah koneksi terputus melalui token sesi | M |
| FR-A4 | Pemulihan kata sandi dan verifikasi email dosen | S |
| FR-A5 | Akun admin dan pembagian peran | S |

### 8.2 Kelas

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-B1 | Dosen membuat kelas (nama, mata kuliah, semester) | M |
| FR-B2 | Satu kelas dapat memiliki banyak sesi | M |
| FR-B3 | Daftar dan arsip kelas | S |

### 8.3 Paket soal

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-C1 | Katalog paket soal bawaan sistem (Hukum Newton) bersifat baca saja | M |
| FR-C2 | Paket memuat butir soal, kunci per representasi, rubrik per representasi, durasi bawaan, dan nomor versi | M |
| FR-C3 | Versi paket dibekukan saat sesi dibuka | M |
| FR-C4 | Pratinjau paket oleh dosen (soal terlihat, kunci hanya untuk dosen) | S |
| FR-C5 | Dosen tidak dapat mengedit soal pada versi ini | M |

### 8.4 Sesi dan akses mahasiswa

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-D1 | Dosen membuka sesi: pilih paket, atur durasi; status Draf, Dibuka, Berjalan, Ditutup | M |
| FR-D2 | Sistem menghasilkan kode sesi dan tautan; kode QR | M (kode, tautan); S (QR) |
| FR-D3 | Sesi ditutup manual oleh dosen atau otomatis saat durasi habis; pewaktu dihitung server | M |
| FR-D4 | Pemantauan langsung: peserta, status, jumlah kontradiksi dan hint | S |
| FR-D5 | Peserta yang sudah mengirim tidak dapat mengubah jawaban | M |

### 8.5 Kanvas kuadran

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-E1 | Empat kanvas dalam satu layar (2×2) yang selalu terlihat bersamaan | M |
| FR-E2 | Verbal: ketik teks dengan batas karakter; simpan otomatis | M |
| FR-E3 | Verbal: tombol mikrofon membuka modal; hasil dikte tampil dulu sebagai teks, mahasiswa menyunting, lalu menekan Gunakan teks sebelum masuk kanvas; audio tidak disimpan | M |
| FR-E4 | Matematis: papan ketik persamaan lengkap (pecahan, pangkat, indeks bawah, akar, huruf Yunani seperti μ, θ, Σ, operator, fungsi trigonometri, simbol vektor, satuan); keluaran notasi terstruktur | M |
| FR-E5 | Matematis: beberapa baris persamaan; validasi sintaks | M |
| FR-E6 | Grafis: pilih jenis grafik (x–t, v–t, a–t, F–t) | M |
| FR-E7 | Grafis: masukan dengan penggeser dari titik awal ke akhir atau penempatan titik pada koordinat | M |
| FR-E8 | Grafis: penghalusan goresan menjadi bentuk linear, kuadratik, atau konstan tanpa mengubah kemiringan atau nilai; mahasiswa dapat membatalkan penghalusan | M |
| FR-E9 | Grafis: nama sumbu dan satuan wajib diisi | M |
| FR-E10 | Visual: pustaka aset seret-lepas (balok, bidang datar, bidang miring, katrol, tali, benda gantung) | M |
| FR-E11 | Visual: panah gaya dibuat dari titik tangkap, diatur arah dan panjang relatifnya, dan diberi nama per panah | M |
| FR-E12 | Visual: pelabelan panah dengan notasi gaya (misalnya N, W, F, fₖ, T) dan subskrip dua objek opsional | S |
| FR-E13 | Undo, redo, hapus pada setiap kanvas; simpan otomatis dengan indikator status | M |
| FR-E14 | Tombol Periksa sekarang (manual) di samping pemeriksaan otomatis | S |
| FR-E15 | Ringkasan sebelum kirim dan konfirmasi Selesai dan Kirim | M |

### 8.6 Mesin pemeriksa konsistensi

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-F1 | Setiap kanvas dinormalisasi menjadi data terstruktur | M |
| FR-F2 | Pemeriksaan otomatis berjalan setelah mahasiswa berhenti mengubah kanvas selama jeda tertentu dan hanya bila data berubah | M |
| FR-F3 | Lapis 1: aturan deterministik dan mesin hitung simbolik untuk tanda, arah, nilai, kemiringan, dan satuan | M |
| FR-F4 | Lapis 2: LLM menilai makna penjelasan verbal dan kesesuaian konsep memakai rubrik, kunci, dan data terstruktur | M |
| FR-F5 | Enam pasangan P1–P6 diperiksa | M (P2, P4, P5); S (P1, P3, P6) |
| FR-F6 | Setiap representasi dibandingkan dengan kunci untuk menentukan representasi yang menyimpang | M |
| FR-F7 | Kontradiksi hanya ditandai bila elemen terkait lengkap (panah berlabel, persamaan utuh, sumbu bernama) | M |
| FR-F8 | Keluaran LLM divalidasi terhadap skema; bila gagal, sistem memakai hasil aturan saja dan menandai pemeriksaan makna tertunda | M |
| FR-F9 | Hasil pemeriksaan disimpan dengan kode kesalahan yang terkait miskonsepsi target | M |
| FR-F10 | Kunci tidak pernah dikirim ke peramban mahasiswa | M |

### 8.7 Hint, penalti, dan skor

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-G1 | Garis penghubung antara dua elemen yang bertentangan lintas kanvas, dengan ikon hint di titik tengah | M |
| FR-G2 | Klik ikon membuka modal: pesan ketidaksesuaian dan pilihan Coba perbaiki atau Gunakan hint | M |
| FR-G3 | Coba perbaiki dibatasi jumlah percobaan per kontradiksi; setelah habis atau stagnasi, tombol terkunci dan hint level 1 dibuka | M |
| FR-G4 | Hint level 1 menyebut bagian yang sudah benar; level 2 jenis kesalahan; level 3 petunjuk eksplisit tanpa jawaban akhir dan terkunci sementara | M |
| FR-G5 | Penalti per level hint hanya pada representasi yang dibantu dan menyimpang | M |
| FR-G6 | Skor representasi ditahan selama kontradiksi belum teratasi | M |
| FR-G7 | Waktu habis saat kontradiksi belum teratasi: representasi ditandai Belum terselesaikan, skor sementara dihitung, keputusan diteruskan ke dosen | M |
| FR-G8 | Skor per representasi dihitung dengan rumus pada bagian 6.4 | M |

### 8.8 Hasil mahasiswa

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-H1 | Radar belah ketupat empat sumbu (verbal, matematis, visual, grafis) skala 0–100 | M |
| FR-H2 | Rincian per representasi: skor rubrik, penalti, hint yang dipakai, status | M |
| FR-H3 | Umpan balik diagnostik tentang kekuatan dan aspek yang perlu diperbaiki | M |
| FR-H4 | Hasil dirilis setelah sesi ditutup; pengaturan rilis oleh dosen | S |

### 8.9 Dasbor dosen

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-I1 | Daftar hasil mahasiswa: skor per representasi, status, hint dipakai | M |
| FR-I2 | Ringkasan kelas: radar rata-rata, distribusi skor | S |
| FR-I3 | Miskonsepsi tersering dari agregasi kode kesalahan, diberi label indikasi, bukan kepastian | S |
| FR-I4 | Detail mahasiswa: log kejadian (kontradiksi, hint, perbaikan) berurutan waktu | M |
| FR-I5 | Rekaman ulang proses perbaikan | S |
| FR-I6 | Ubah skor dengan alasan wajib; audit trail menyimpan nilai lama, nilai baru, penyunting, dan waktu | M |
| FR-I7 | Ekspor hasil (CSV atau XLSX) | S |

### 8.10 Privasi dan persetujuan

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-J1 | Layar persetujuan sebelum mengerjakan: tujuan, data yang diproses, penggunaan layanan LLM pihak ketiga, hak mahasiswa | M |
| FR-J2 | Identitas (nama, NIM) disimpan terpisah dari jawaban dan log; keduanya terhubung ID acak | M |
| FR-J3 | Hanya ID acak dan data terstruktur yang dikirim ke LLM | M |
| FR-J4 | Peringatan dan penyaringan sederhana agar mahasiswa tidak menulis identitas pada teks verbal | S |
| FR-J5 | Permintaan penghapusan data dan kebijakan retensi | S |

### 8.11 Admin dan konten

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-K1 | Kelola paket soal dan versi (impor berkas terstruktur) | S |
| FR-K2 | Kelola parameter global | S |
| FR-K3 | Harness uji skenario berisi 10 skenario awal dengan laporan terdeteksi atau tidak | S |

### 8.12 Modul penelitian

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-L1 | Angket kepraktisan Likert 1–5 dengan empat indikator: kemudahan penggunaan, kemenarikan visual, kejelasan petunjuk, kemanfaatan | S |
| FR-L2 | Perhitungan P dan kategori kepraktisan otomatis | S |
| FR-L3 | Lembar catatan kualitatif dengan kategori: substansi materi, tampilan, operasional teknis | S |

## 9. Aturan Bisnis

| ID | Aturan |
| --- | --- |
| BR-01 | Skor representasi final = min(skor rubrik, 100 − total penalti), batas bawah 0 |
| BR-02 | Penalti hanya pada representasi yang dibantu dan menyimpang dari kunci; representasi yang sesuai kunci tidak dikenai penalti |
| BR-03 | Hint dibuka dengan menyebut bagian yang sudah benar |
| BR-04 | Hint level 3 tidak memuat jawaban akhir dan baru dapat dibuka setelah jeda |
| BR-05 | Skor representasi ditahan selama ada kontradiksi aktif yang melibatkannya |
| BR-06 | Tanpa kesalahan dan tanpa hint, skor yang mungkin dicapai adalah 100 |
| BR-07 | Percobaan perbaikan dan waktu tidak mengurangi skor; keduanya hanya dicatat di log |
| BR-08 | Sesi berakhir dengan kontradiksi aktif: status Belum terselesaikan, skor sementara dihitung, dosen memutuskan |
| BR-09 | Penghalusan grafik tidak boleh mengubah kemiringan atau nilai yang menjadi makna fisis |
| BR-10 | Hasil otomatis adalah usulan; dosen dapat mengubah dengan alasan tercatat |
| BR-11 | Versi paket soal dan rubrik yang dipakai sesi tidak berubah selama sesi berjalan |
| BR-12 | Teks, transkrip, dan gambar mahasiswa diperlakukan sebagai data tidak tepercaya dan tidak boleh mengubah instruksi sistem |

## 10. Parameter Konfigurasi

Nilai berikut adalah keputusan desain tanpa sumber literatur dan dikalibrasi pada uji alfa.

| Parameter | Nilai awal |
| --- | --- |
| Jeda tanpa perubahan sebelum pemeriksaan | 7 detik (rentang uji 5–10) |
| Percobaan Coba perbaiki per kontradiksi | 3 kali |
| Ambang stagnasi tanpa perubahan bermakna | 60 detik |
| Penalti hint level 1, 2, 3 | 5, 10, 10 |
| Jeda sebelum hint level 3 dapat dibuka | 15 detik |
| Durasi sesi bawaan | 45 menit (dapat diubah dosen) |
| Batas karakter teks verbal | 1500 |
| Toleransi deviasi penghalusan grafik | 5% dari kemiringan |
| Batas bawah skor | 0 |

## 11. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
| --- | --- |
| Kinerja | Pemeriksaan p95 ≤ 8 detik; antarmuka kanvas responsif (interaksi < 100 ms); simpan otomatis tanpa memblokir input |
| Keandalan | Simpan otomatis setiap perubahan; pemulihan sesi setelah koneksi putus; mode turun kelas (aturan saja) bila LLM tidak tersedia |
| Keamanan | HTTPS; kontrol akses berbasis peran; token sesi mahasiswa; sanitasi masukan dan notasi matematis; pembatasan laju; rahasia kunci API hanya di server |
| Privasi | Pseudonimisasi; identitas terpisah; tanpa penyimpanan audio; log tanpa data pribadi; retensi ditetapkan komite etik |
| Aksesibilitas | Target WCAG 2.1 AA; kontras tinggi navy-putih; navigasi keyboard pada elemen non-kanvas; label ARIA; tidak mengandalkan warna saja |
| Kompatibilitas | Chrome, Edge, Firefox, Safari versi terbaru; layar ≥ 1024 px untuk mahasiswa |
| Lokalisasi | Antarmuka bahasa Indonesia |
| Keterpeliharaan | Parameter dapat dikonfigurasi tanpa mengubah kode; versi paket soal dan prompt tercatat |
| Observabilitas | Log terstruktur, metrik latensi dan galat, jejak panggilan LLM tanpa data pribadi |

## 12. Privasi, Etika, dan Kepatuhan

- Data mahasiswa bersifat pseudonim, bukan anonim, karena dosen melihat nama di dasbor. Gunakan istilah pseudonimisasi pada artikel dan persetujuan.
- Persetujuan dengan penjelasan memadai sebelum pemrosesan; mahasiswa berhak menolak dan menarik persetujuan.
- Pemrosesan data pribadi mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi; baca pasal terkait dan konsultasikan dengan komite etik kampus.
- Log dan rekaman ulang proses termasuk data pribadi dan diperlakukan sama.
- Periksa kebijakan retensi dan penggunaan data untuk pelatihan pada penyedia LLM yang dipakai melalui dokumentasi resminya.
- Diagnosis miskonsepsi bersifat indikasi, bukan kepastian.

## 13. Rencana Evaluasi Produk

1. Uji internal: 10 skenario (verbal–matematis, verbal–visual, matematis–visual, matematis–grafis, kemiringan dibaca sebagai kecepatan, penalaran linear keliru, gaya netto versus perubahan gerak, konsisten tetapi salah, penghalusan grafik, kontrol) dengan hasil terdeteksi atau tidak, termasuk kegagalan.
2. Uji coba terbatas: 5 mahasiswa Pendidikan Fisika semester 3 (convenience sampling), angket Likert dan catatan kualitatif.
3. Evaluasi lanjut (agenda): validasi isi oleh pakar dan kesesuaian skor dengan penilai manusia memakai QWK atau kappa.

## 14. Prioritas dan Rilis

**MVP (versi demo, prioritas M):** autentikasi dosen sederhana; satu kelas; satu paket soal Hukum Newton dengan kunci dan rubrik bawaan; sesi dengan kode dan tautan; masuk mahasiswa dengan persetujuan; empat kanvas versi dasar; pemeriksaan aturan untuk P2, P4, P5 ditambah LLM untuk makna verbal; garis, ikon, modal; hint tiga level, penalti, skor ditahan; radar; dasbor dosen berisi daftar hasil, log, dan ubah skor.

**Alfa (prioritas S):** pasangan P1, P3, P6; pemantauan langsung; rekaman ulang; ekspor; harness uji; modul angket; rilis hasil terkontrol.

**Beta dan seterusnya (prioritas C):** pengembangan paket soal tambahan, validasi pakar, dan integrasi lain yang tidak tercantum pada ruang lingkup v1.

Catatan realistis: seluruh fitur M tergolong banyak untuk waktu sangat singkat; bila waktu terbatas, kurangi kedalaman kanvas (misalnya papan ketik persamaan standar) sebelum mengurangi alur inti (kontradiksi, hint, skor).

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Akurasi LLM rendah pada fisika | Alarm palsu atau terlewat | Lapis deterministik dan hitungan simbolik; kunci; dosen dapat mengubah skor |
| Kunci atau rubrik keliru | Penilaian salah | Verifikasi independen kunci; tinjauan dosen pembimbing; validasi pakar sebagai agenda |
| Coba-coba dan penyalahgunaan hint | Skor tidak mencerminkan pemahaman | Batas percobaan, stagnasi, jeda hint level 3, log proses |
| Alarm palsu dari jawaban setengah jadi | Frustrasi mahasiswa | Gerbang kelengkapan elemen; ikon halus; modal hanya saat diklik |
| Latensi dan biaya LLM | Pengalaman buruk, biaya membengkak | Debounce, cache berdasarkan hash data, aturan lebih dulu |
| Kebocoran data pribadi | Pelanggaran privasi | Pemisahan identitas, ID acak, penyaringan, retensi |
| Prompt injection dari teks mahasiswa | Manipulasi skor | Teks diperlakukan sebagai data; output terskema; batas peran |
| Waktu pengembangan sangat singkat | MVP tidak lengkap | Prioritas M/S/C dan skenario pengurangan cakupan |
| Layar kecil | Kanvas tidak layak | Peringatan layar minimal 1024 px |

## 16. Keputusan Terbuka

1. Bobot rubrik akhir dan toleransi penghalusan grafik.
2. Kebijakan retensi data (menunggu komite etik).
3. Penyedia dan model LLM serta kebijakan datanya.
4. Mekanisme dikte suara: layanan peramban atau transkripsi server.
5. Jumlah soal per paket pada MVP dan apakah hasil dirilis otomatis.
6. Sumber buku teks untuk verifikasi kunci.

## 17. Rujukan

- Aleven, V., McLaren, B., Roll, I., & Koedinger, K. (2004). Toward tutoring help seeking. Proceedings of the 7th International Conference on Intelligent Tutoring Systems.
- Ainsworth, S. (1999). The functions of multiple representations. Computers & Education, 33(2–3), 131–152.
- Atil, B., Sheikhi Karizaki, M., & Passonneau, R. J. (2024). VerAs: Verify then assess STEM lab reports. arXiv:2402.05224.
- Black, P., & Wiliam, D. (1998). Assessment and classroom learning. Assessment in Education, 5(1), 7–74.
- De Cock, M. (2012). Representation use and strategy choice in physics problem solving. Phys. Rev. ST Phys. Educ. Res., 8, 020117.
- Earl, L. M. (2003). Assessment as learning. Corwin Press.
- Kohl, P. B., & Finkelstein, N. D. (2005). Student representational competence and self-assessment when solving physics problems. Phys. Rev. ST Phys. Educ. Res., 1, 010104.
- Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics, 33(1), 159–174.
- Mizumoto, A., & Eguchi, M. (2023). Exploring the potential of using an AI language model for automated essay scoring. Research Methods in Applied Linguistics, 2(2), 100050.
- Nurul, D. (2022). Analisis kesulitan kemampuan pemecahan masalah pada peserta didik dalam pembelajaran fisika. JURINOTEP, 1(1), 20–30.
- Pradani, K. A., & Suadaa, L. H. (2023). Automated essay scoring menggunakan semantic textual similarity berbasis Transformer untuk penilaian ujian esai. JTIIK, 10(6), 1177–1184.
- Rosengrant, D., Van Heuvelen, A., & Etkina, E. (2009). Do students use and understand free-body diagrams? Phys. Rev. ST Phys. Educ. Res., 5, 010108.
- Shute, V. J. (2008). Focus on formative feedback. Review of Educational Research, 78(1), 153–189.
- Yeadon, W., & Hardy, T. (2023). The impact of AI in physics education. arXiv:2309.05163.
- Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.

## 18. Revisi 1.1 — Keputusan Final dan Kriteria Penerimaan

**Status dan prioritas dokumen:** bagian 18 ini berlaku dan **menggantikan** butir sebelumnya yang bertentangan (termasuk bagian 16 Keputusan Terbuka). Dokumen pendamping: TDD bagian 20, UI/UX bagian 11, dan Build Brief v1.1. Bila ada perbedaan antara gambar ilustrasi pada artikel dan dokumen ini, **dokumen ini yang diikuti**.

### 18.1 Keputusan final

| No | Topik | Keputusan |
| --- | --- | --- |
| 1 | Paket MVP | Satu paket: Hukum Newton tentang gerak v1.0, satu soal (tampil Soal 1 dari 1), durasi bawaan 45 menit |
| 2 | Soal contoh | Balok 5 kg ditarik F = 30 N ke kanan di bidang datar kasar (μₖ = 0,2; g = 10 m/s²). Kunci: N = W = 50 N; fₖ = 10 N; a = 4 m/s²; v(8 s) = 32 m/s |
| 3 | Kesalahan yang diteruskan (error carried forward) | Aktif untuk rantai numerik N, fₖ, a: kesalahan hulu ditandai satu kali; nilai hilir yang konsisten dengan nilai hulu mahasiswa tidak ditandai lagi dan tidak dikenai penalti ganda |
| 4 | Dikte suara | Web Speech API peramban; persetujuan menyebut bahwa pemrosesan suara dapat dilakukan oleh penyedia peramban; audio tidak disimpan oleh FisGrade; mengetik selalu tersedia |
| 5 | Teks hint | Dari templat per kode kesalahan (bukan keluaran LLM) pada v1 |
| 6 | Retensi data | Parameter DATA\_RETENTION\_DAYS, nilai awal 365 hari, menunggu keputusan komite etik; penghapusan atas permintaan tersedia |
| 7 | Rilis hasil | Otomatis saat sesi ditutup; dosen dapat memilih manual |
| 8 | Autentikasi dosen | Pendaftaran email dan kata sandi; akun admin dibuat lewat perintah seed; verifikasi email opsional |
| 9 | Bobot rubrik dan toleransi | Memakai nilai awal PRD bagian 6.2 dan bagian 10; disimpan di basis data, dapat diubah admin tanpa mengubah kode |
| 10 | Bahasa dan layar | Bahasa Indonesia saja; mahasiswa minimal 1024 px |
| 11 | Pemeriksaan LLM | Dipanggil hanya bila diperlukan untuk penilaian makna (verbal, P1, P3, dan kasus P5 tertentu); dapat dimatikan dengan flag sehingga sistem berjalan mode aturan saja |
| 12 | Penghalusan grafik | Toleransi kemiringan 5%; bila lebih, tawarkan goresan asli |
| 13 | Hosting | Satu server kontainer (Docker Compose) cukup untuk demo dan uji coba 5 mahasiswa; pemilihan penyedia di luar dokumen ini |

### 18.2 Perubahan kebutuhan fungsional

| ID | Perubahan | Prioritas |
| --- | --- | --- |
| FR-E1 (ubah) | Bilah atas menampilkan nama sesi, Soal 1/1, status simpan (Menyimpan, Tersimpan, Belum tersimpan), dan Sisa waktu mm:ss; judul panel berlabel: 1 Verbal (Penjelasan), 2 Visual (Diagram), 3 Matematis (Perhitungan), 4 Grafis (Grafik) | M |
| FR-E4 (ubah) | Papan ketik persamaan terbuka secara bawaan dan dapat dilipat; memuat angka, + − × ÷ =, pecahan, pangkat, indeks bawah, akar, tanda kurung, π μ θ α Δ Σ, sin cos tan, panah vektor, dan satuan umum (N, kg, m, s, m/s, m/s²) | M |
| FR-E7 (ubah) | Panel grafis memuat pilihan jenis grafik, kolom nama dan satuan sumbu x dan y, pilihan masukan (penggeser atau titik), tombol Haluskan bentuk dan Batalkan; kurva digambar garis tegas, bukan putus-putus | M |
| FR-E11 (ubah) | Panel visual memuat pustaka aset, tombol + Gaya, dan kolom Nama, Arah (derajat), serta Panjang relatif; semua panah diberi label; kanvas awal kosong | M |
| FR-G1 (ubah) | Garis kontradiksi berwarna amber putus-putus; ikon hint lingkaran navy berisi bola lampu putih; kedua ujung disorot cincin tipis | M |
| FR-G2 (ubah) | Modal memuat pesan ketidaksesuaian, sisa percobaan (misalnya 2 dari 3), dan keterangan bahwa hint menurunkan batas skor representasi yang dibantu | M |
| FR-F11 (baru) | Penerapan error carried forward sesuai keputusan 3 | M |
| FR-F12 (baru) | Kontradiksi hanya diperiksa untuk elemen lengkap; gaya yang hilang ditandai otomatis hanya bila disebut pada teks verbal, dan selebihnya dikurangi pada rubrik saat pengiriman | M |
| FR-H5 (baru) | Representasi berstatus Belum terselesaikan ditandai ikon peringatan pada sumbu radar dan pada rincian skor | M |
| FR-I8 (baru) | Radar pada dasbor dosen diberi label Skor otomatis; skor dosen ditampilkan pada tabel dan, bila berbeda, ditampilkan sebagai lapisan kedua pada radar | S |
| FR-I9 (baru) | Detail mahasiswa menggabungkan radar, kronologi kejadian, pemutar mini, dan tabel Skor otomatis, Skor dosen, Alasan perubahan; sel yang diubah ditandai teks Diubah dan ikon pensil, bukan warna saja | M |
| FR-M1 (baru) | Flag LLM\_ENABLED; bila mati, banner kecil Pemeriksaan makna tertunda tampil dan sistem tetap berfungsi | M |

### 18.3 Kriteria penerimaan MVP

Setiap butir harus dapat diuji otomatis atau manual.

| ID | Kriteria |
| --- | --- |
| AC-01 | Dosen mendaftar, membuat kelas, memilih paket, dan membuka sesi; sistem menampilkan kode 6 karakter dan tautan; status sesi Dibuka; versi paket terkunci |
| AC-02 | Mahasiswa memasukkan kode, menyetujui persetujuan, mengisi nama dan NIM; tanpa persetujuan tidak dapat lanjut |
| AC-03 | Empat panel tampil bersamaan pada 1280×720 dan 1024×768 tanpa gulir horizontal |
| AC-04 | Muat ulang halaman memulihkan keempat kanvas dalam ≤ 2 detik; masuk ulang dengan kode dan NIM yang sama memulihkan pekerjaan |
| AC-05 | Skenario arah gaya gesek keliru: setelah jeda 7 detik muncul garis dan ikon; klik ikon membuka modal; skor Visual dan Matematis tidak ditampilkan (ditahan) |
| AC-06 | Skenario kontrol (semua benar): tanpa garis atau ikon; setelah kirim skor 100 pada keempat representasi |
| AC-07 | Tiga kali Coba perbaiki gagal: tombol terkunci dan hint level 1 terbuka; hint level 3 terkunci 15 detik; penalti 5, 10, 10 hanya pada representasi yang dibantu; skor akhir tidak melebihi 100 dikurangi penalti |
| AC-08 | Waktu habis saat kontradiksi aktif: jawaban terkirim otomatis; representasi ditandai Belum terselesaikan, skor sementara dihitung, tampil di dasbor dosen |
| AC-09 | Dosen mengubah skor: alasan wajib; riwayat tersimpan (nilai lama, nilai baru, penyunting, waktu); mahasiswa melihat skor dosen |
| AC-10 | Uji otomatis: respons API untuk peserta tidak mengandung kunci atau rubrik |
| AC-11 | Uji otomatis: muatan ke LLM tidak mengandung nama atau NIM (diuji dengan penanda unik) |
| AC-12 | Dengan LLM\_ENABLED=false, pemeriksaan aturan tetap berjalan dan banner Pemeriksaan makna tertunda tampil |
| AC-13 | Dikte: transkrip tampil pada modal dan dapat disunting; teks masuk ke kanvas hanya setelah Gunakan teks; tidak ada audio tersimpan |
| AC-14 | Penghalusan grafik tidak mengubah kemiringan lebih dari 5%; bila lebih, antarmuka menawarkan goresan asli |
| AC-15 | Harness menjalankan 10 skenario dan melaporkan terdeteksi atau tidak, termasuk skenario yang gagal |
| AC-16 | Seluruh kontrol non-kanvas dapat dioperasikan dengan keyboard; kontras memenuhi WCAG 2.1 AA; ada mode form untuk membuat gaya dan titik grafik |
| AC-17 | Dasbor dosen dengan 40 peserta tampil ≤ 2 detik |
| AC-18 | Ekspor hasil CSV memuat skor otomatis, skor dosen, status, dan hint per representasi tanpa nama bila diminta pseudonim |

### 18.4 Definisi selesai

1. Seluruh AC-01 sampai AC-18 lulus pada lingkungan staging.
2. Set emas 10 skenario dijalankan dan hasilnya dilaporkan apa adanya.
3. Tidak ada rahasia pada repositori; variabel lingkungan terdokumentasi.
4. README memuat cara menjalankan, menyemai data, dan menguji.
5. Uji kegunaan dengan 5 mahasiswa dapat dijalankan dan angket menghasilkan P serta kategori kepraktisan.

### 18.5 Di luar lingkup (ditegaskan ulang)

Gamifikasi, AI Mentor percakapan, pustaka materi, editor soal oleh dosen, integrasi LMS, aplikasi mobile native, mode luring, materi selain Hukum Newton, dan validasi pakar. Validasi pakar dinyatakan sebagai keterbatasan dan agenda lanjutan.
