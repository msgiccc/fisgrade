from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.config import settings

HINT_TEMPLATES = {
    "E-P4-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa hubungan antara panah {label} di kanvas Visual dan baris {baris} di kanvas Matematis.",
        2: "Jenis kesalahan: tanda atau arah. Panah dan tanda suku harus sama-sama menyatakan gaya yang melawan gerak.",
        3: "Gaya gesek kinetik melawan arah gerak relatif. Tentukan arah panah gesek dan tanda suku gesek pada penjumlahan gaya searah sumbu x positif."
    },
    "E-P2-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Ada gaya pada penjelasan verbal ({label}) yang belum tampak pada diagram.",
        2: "Jenis kesalahan: kelengkapan gaya.",
        3: "Daftarkan semua benda yang berinteraksi dengan balok lalu tentukan gaya dari masing-masing, termasuk gaya yang bekerja tanpa sentuhan."
    },
    "E-P1-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Besaran yang Anda sebut pada penjelasan ({label}) belum muncul pada persamaan.",
        2: "Jenis kesalahan: kelengkapan persamaan.",
        3: "Tuliskan penjumlahan gaya searah gerak dan pastikan setiap gaya yang Anda sebut punya suku, lengkap dengan tandanya."
    },
    "E-P5-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa hubungan antara percepatan pada persamaan dan kemiringan grafik.",
        2: "Jenis kesalahan: nilai. Kemiringan grafik v–t menyatakan percepatan.",
        3: "Hitung kemiringan dari dua titik pada garis (selisih v dibagi selisih t) dan bandingkan dengan a pada persamaan; periksa titik akhir yang Anda tempatkan."
    },
    "E-P3-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa hubungan antara pernyataan verbal tentang gerak dan bentuk grafik.",
        2: "Jenis kesalahan: bentuk kurva. Percepatan konstan berarti kecepatan berubah secara linear terhadap waktu.",
        3: "Pilih bentuk kurva v–t yang sesuai dengan percepatan konstan lalu periksa kembali kemiringannya."
    },
    "E-P3-02": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa penalaran Anda tentang hubungan antara kecepatan dan jarak.",
        2: "Jenis kesalahan: penalaran linear. Hubungan kecepatan dan jarak pada percepatan konstan tidak linear.",
        3: "Gunakan hubungan antara kecepatan dan jarak untuk gerak berpercepatan konstan, atau kaitkan dengan energi, lalu periksa kembali."
    },
    "E-P5-02": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa makna kemiringan pada grafik Anda.",
        2: "Jenis kesalahan: tafsir grafik. Kemiringan grafik posisi–waktu menyatakan kecepatan, bukan percepatan.",
        3: "Tentukan besaran pada sumbu y, lalu tentukan besaran yang diwakili kemiringannya."
    },
    "E-P6-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Periksa hubungan antara arah gaya netto pada diagram dan perubahan kecepatan pada grafik.",
        2: "Jenis kesalahan: arah. Gaya netto searah gerak menambah kecepatan, berlawanan arah mengurangi.",
        3: "Jumlahkan gaya-gaya pada diagram searah sumbu x lalu tentukan tanda percepatannya dan samakan dengan arah kemiringan grafik."
    },
    "E-X-01": {
        1: "Bagian yang sudah benar: {rep_benar}. Seluruh bagian Anda saling sejalan, tetapi hasil pada {rep_menyimpang} berbeda dari hasil yang diharapkan.",
        2: "Jenis kesalahan: konsep atau nilai awal. Periksa kembali gaya apa saja yang bekerja.",
        3: "Periksa apakah ada gaya yang terlewat atau diabaikan pada keempat representasi, lalu tulis ulang dari diagram benda bebas."
    }
}


def build_hint_text(
    kode_error: str,
    level: int,
    rep_benar: List[str],
    label: str = "f_k",
    baris: str = "2",
    rep_menyimpang: str = "Matematis dan Visual"
) -> str:
    template_set = HINT_TEMPLATES.get(kode_error, HINT_TEMPLATES["E-X-01"])
    tmpl = template_set.get(level, template_set[1])
    
    rep_benar_str = ", ".join([r.capitalize() for r in rep_benar]) if rep_benar else "Belum ada"
    
    return tmpl.format(
        rep_benar=rep_benar_str,
        label=label,
        baris=baris,
        rep_menyimpang=rep_menyimpang
    )


def get_penalty_for_level(level: int) -> int:
    penalties = settings.hint_penalties_list
    if 1 <= level <= len(penalties):
        return penalties[level - 1]
    return 10
