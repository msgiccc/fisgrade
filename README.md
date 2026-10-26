# FisGrade — Asesmen Formatif Fisika Berbasis Proses Multirepresentasi

Versi 1.1 | Topik: Hukum Newton tentang Gerak

FisGrade adalah aplikasi web asesmen formatif proses fisika. Mahasiswa mengerjakan soal melalui empat kanvas yang tampil bersamaan dalam satu layar:
1. **Verbal** (Penjelasan konsep dengan kata-kata dan dikte suara)
2. **Visual** (Diagram benda bebas interaktif dengan arah vektor dan panjang relatif)
3. **Matematis** (Persamaan hukum Newton, substitusi, dan perhitungan bersatuan)
4. **Grafis** (Grafik hubungan besaran fisis v–t dengan kemiringan dan sumbu)

Sistem memeriksa konsistensi antarrepresentasi secara otomatis (6 pasangan representasi P1–P6), memandu mahasiswa melalui *Coba perbaiki* dan *Hint bertingkat* yang transparan, serta memetakan profil pemahaman ke dalam grafik radar belah ketupat empat sumbu (0–100). Dosen memegang keputusan akhir melalui modul peninjauan proses dan penyesuaian skor dengan audit trail yang tidak dapat diubah.

---

## Struktur Repositori

```
fisgrade/
  docker-compose.yml         # Konfigurasi containerized db (PostgreSQL), api, web
  .env.example               # Contoh variabel lingkungan lengkap
  README.md
  apps/
    api/                     # FastAPI (Python 3.11+), SQLAlchemy 2.0, SymPy, Alembic
      app/
        main.py              # Endpoint utama & /healthz
        config.py            # Pengaturan parameter & toleransi fisis
        db.py                # Koneksi basis data (PostgreSQL / SQLite)
        models/              # SQLAlchemy model relasional & audit
        schemas/             # Skema kontrak Pydantic v2
        routers/             # Auth, Classes, Packages, Sessions, Join, Me, Submissions, Contradictions, Scores, Surveys, Admin
        services/            # Normalizer, Gate, Rules (P1-P6), ECF, Attribution, Hints, Rubric, Scoring, Privacy, LLM
        seed/                # paket_newton_v1.json & seed loader
        cli.py               # CLI buat_admin & jalankan_skenario
      tests/                 # Fixture baseline & test suite (test_rules, test_scenarios, test_scoring, test_privacy, test_api_flow)
    web/                     # Next.js 16 (React 19), Tailwind CSS v4, shadcn/ui
      app/                   # App Router rute publik, mahasiswa, dosen, status
      components/            # QuadCanvas, VerbalPanel, VisualPanel, MathPanel, GraphPanel, ContradictionOverlay, HintModal, RadarDiamond
      lib/                   # api.ts (REST client), utils.ts
```

---

## Persyaratan Sistem

- **Node.js**: v18+ (disarankan v20 atau v22)
- **Python**: 3.11+
- **Docker & Docker Compose** (opsional untuk lingkungan kontainer)
- **Peramban**: Resolusi layar minimal 1024 px (laptop atau tablet lanskap)

---

## Menjalankan dengan Docker Compose

1. Salin berkas lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Jalankan seluruh layanan (Database PostgreSQL, Backend FastAPI, Frontend Next.js):
   ```bash
   docker compose up --build
   ```
3. Akses aplikasi:
   - Web Frontend: [http://localhost:3000](http://localhost:3000)
   - API Backend: [http://localhost:8000](http://localhost:8000)
   - Dokumentasi Swagger API: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Pemeriksaan Kesehatan: [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

## Menjalankan secara Lokal (Tanpa Docker)

### 1. Menjalankan Backend (`apps/api`)
```bash
cd apps/api
python -m pip install -r requirements.txt

# Menjalankan migrasi dan penyemaian data bawaan:
python -m app.seed.load

# Membuat akun dosen admin awal (opsional):
python -m app.cli buat_admin --email dosen@fisika.ac.id --password PasswordDosen123! --nama "Dr. Dosen Fisika"

# Menjalankan server backend:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Menjalankan Frontend (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## Pengujian dan Verifikasi Kriteria Penerimaan

Jalankan rangkaian pengujian otomatis:
```bash
cd apps/api
python -m pytest -v
```

Harness pengujian mencakup verifikasi:
- **AC-01 & AC-02**: Alur registrasi dosen, pembuatan kelas, sesi dengan kode 6 karakter terkunci, dan validasi persetujuan mahasiswa.
- **AC-05 & AC-06**: Deteksi kontradiksi arah gaya gesek (E-P4-01), penahanan skor, dan kasus kontrol tanpa alarm (skor 100).
- **AC-07 & AC-08**: Penguncian batas 3 kali percobaan, penalti bertingkat (5, 10, 10), penolakan pembukaan hint level 3 sebelum jeda 15 detik, dan status `belum_terselesaikan` saat waktu habis dengan kontradiksi aktif.
- **AC-09**: Penyesuaian skor dosen wajib menyertakan alasan penyesuaian dan riwayat tercatat dalam tabel audit yang *append-only*.
- **AC-10**: Proteksi kunci dan rubrik agar tidak pernah bocor ke respons peramban peserta.
- **AC-11**: Perlindungan privasi agar nama dan NIM mahasiswa tidak pernah dikirimkan ke layanan LLM pihak ketiga atau dicatat di log.
- **AC-12**: Dukungan degradasi halus (*graceful degradation*) saat `LLM_ENABLED=false` dengan banner *Pemeriksaan makna tertunda*.
- **AC-14 & Skenario 9**: Penghalusan kurva grafik dengan deviasi kemiringan terkontrol dalam toleransi 5%.
- **AC-15**: Set emas 10 skenario dijalankan dan dilaporkan apa adanya.

---

## Variabel Lingkungan (.env)

| Variabel | Keterangan | Nilai Bawaan |
|---|---|---|
| `DATABASE_URL` | URL koneksi basis data SQLAlchemy | `sqlite:///./fisgrade.db` / `postgresql+psycopg://...` |
| `SECRET_KEY` | Kunci rahasia token JWT sesi dosen | *string acak panjang* |
| `ENCRYPTION_KEY` | Kunci Fernet untuk enkripsi identitas mahasiswa | *kunci fernet 32 byte base64* |
| `NIM_HASH_PEPPER` | Salt rahasia untuk HMAC pencarian masuk ulang | *string acak* |
| `LLM_ENABLED` | Mengaktifkan/menonaktifkan evaluasi LLM | `true` |
| `OPENROUTER_API_KEY` | Kunci API OpenRouter (bila LLM aktif) | *kunci api penyedia* |
| `CHECK_IDLE_MS` | Jeda tanpa perubahan sebelum pemeriksaan konsistensi | `7000` (7 detik) |
| `MAX_ATTEMPTS` | Maksimal percobaan Coba perbaiki sebelum terkunci | `3` |
| `HINT3_DELAY_SEC` | Jeda wajib sebelum hint level 3 dapat dibuka | `15` |
