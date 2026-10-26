import json
import copy
from pathlib import Path
import pytest
from app.services.rules.pairs import check_contradictions
from app.services.rubric import calculate_rubric_scores


@pytest.fixture
def baseline_data():
    fixture_path = Path(__file__).parent / "fixtures" / "baseline.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def keys_data():
    seed_path = Path(__file__).parent.parent / "app" / "seed" / "paket_newton_v1.json"
    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["soal"][0]["kunci"]


@pytest.fixture
def params_data():
    return {"m": 5, "F": 30, "mu_k": 0.2, "g": 10}


def test_scenario_01_arah_gaya_gesek(baseline_data, keys_data, params_data):
    # Skenario 1: visual.gaya g4.sudut = 0 (searah gerak)
    data = copy.deepcopy(baseline_data)
    for g in data["visual"]["gaya"]:
        if g["label"] in ["f_k", "fk", "gesek"]:
            g["sudut"] = 0

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P4-01" in codes
    
    # Representasi menyimpang: visual
    target_f = next(f for f in findings if f["kode_error"] == "E-P4-01")
    assert "visual" in target_f["representasi_menyimpang"]


def test_scenario_02_gaya_hilang(baseline_data, keys_data, params_data):
    # Skenario 2: hapus visual.gaya g1 (N)
    data = copy.deepcopy(baseline_data)
    data["visual"]["gaya"] = [g for g in data["visual"]["gaya"] if g["label"] != "N"]

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P2-01" in codes
    target_f = next(f for f in findings if f["kode_error"] == "E-P2-01")
    assert "visual" in target_f["representasi_menyimpang"]


def test_scenario_03_istilah_tak_ada_di_persamaan(baseline_data, keys_data, params_data):
    # Skenario 3: hapus f_k dari persamaan
    data = copy.deepcopy(baseline_data)
    data["matematis"]["baris"] = [
        {"id": "m1", "ekspresi": "N = 50 N"},
        {"id": "m3", "ekspresi": "sum_F = m*a"},
        {"id": "m4", "ekspresi": "F = m*a"},
        {"id": "m5", "ekspresi": "30 = 5*a"},
        {"id": "m6", "ekspresi": "a = 6 m/s^2"}
    ]

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P1-01" in codes


def test_scenario_04_kemiringan_tak_sesuai_hitungan(baseline_data, keys_data, params_data):
    # Skenario 4: grafis.titik = [[0,0],[8,16]], kemiringan = 2
    data = copy.deepcopy(baseline_data)
    data["grafis"]["titik"] = [[0, 0], [8, 16]]
    data["grafis"]["kemiringan"] = 2.0

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P5-01" in codes
    target_f = next(f for f in findings if f["kode_error"] == "E-P5-01")
    assert "grafis" in target_f["representasi_menyimpang"]


def test_scenario_05_kemiringan_dianggap_kecepatan(baseline_data, keys_data, params_data):
    # Skenario 5: grafis jenis x-t, kemiringan dibaca sebagai kecepatan / salah tafsir
    data = copy.deepcopy(baseline_data)
    data["grafis"]["jenis"] = "x-t"
    data["grafis"]["sumbu_y"] = {"nama": "x", "satuan": "m"}

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P5-02" in codes


def test_scenario_06_penalaran_linear_keliru(baseline_data, keys_data, params_data):
    # Skenario 6: penalaran linear keliru pada verbal
    data = copy.deepcopy(baseline_data)
    data["verbal"]["teks"] = (
        "Balok dipengaruhi gaya berat W, gaya normal N, gaya tarik F, dan gaya gesek kinetik f_k. "
        "Namun penalaran menunjukkan kecepatan setengah dari akhir dicapai pada setengah jarak tempuh "
        "menurut hukum Newton tentang percepatan gerak benda."
    )

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P3-02" in codes


def test_scenario_07_gaya_netto_vs_perubahan_gerak(baseline_data, keys_data, params_data):
    # Skenario 7: visual g4.panjang_rel = 1.0 (gesek lebih besar dari tarik F=0.6)
    data = copy.deepcopy(baseline_data)
    for g in data["visual"]["gaya"]:
        if g["label"] in ["f_k", "fk", "gesek"]:
            g["panjang_rel"] = 1.0

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-P6-01" in codes


def test_scenario_08_konsisten_tetapi_salah(baseline_data, keys_data, params_data):
    # Skenario 8: semua representasi mengabaikan gesekan, konsisten tetapi keliru
    data = copy.deepcopy(baseline_data)
    data["visual"]["gaya"] = [g for g in data["visual"]["gaya"] if g["label"] not in ["f_k", "fk", "gesek"]]
    data["verbal"]["teks"] = "Sebuah balok bermassa 5 kg ditarik gaya tarik F sebesar 30 N ke kanan di atas bidang datar sehingga mengalami gerak lurus berubah beraturan dipercepat beraturan menurut hukum II Newton dengan percepatan konstan."
    data["matematis"]["baris"] = [
        {"id": "m1", "ekspresi": "N = 50 N"},
        {"id": "m3", "ekspresi": "sum_F = m*a"},
        {"id": "m4", "ekspresi": "F = m*a"},
        {"id": "m5", "ekspresi": "30 = 5*a"},
        {"id": "m6", "ekspresi": "a = 6 m/s^2"}
    ]
    data["grafis"]["titik"] = [[0, 0], [8, 48]]
    data["grafis"]["kemiringan"] = 6.0

    findings = check_contradictions(data, keys_data, params_data)
    codes = [f["kode_error"] for f in findings]
    assert "E-X-01" in codes


def test_scenario_09_penghalusan_grafik(baseline_data, keys_data, params_data):
    # Skenario 9: grafis kasar namun linear dan kemiringan sesuai kunci
    data = copy.deepcopy(baseline_data)
    data["grafis"]["titik"] = [[0, 0], [2, 7.6], [4, 16.5], [6, 23.4], [8, 32]]
    data["grafis"]["kemiringan"] = 4.0

    findings = check_contradictions(data, keys_data, params_data)
    assert len(findings) == 0


def test_scenario_10_kontrol(baseline_data, keys_data, params_data):
    # Skenario 10: kontrol semua benar -> tanpa kontradiksi, skor 100
    findings = check_contradictions(baseline_data, keys_data, params_data)
    assert len(findings) == 0

    scores = calculate_rubric_scores(baseline_data, {"grafis": keys_data["grafis"], "matematis": keys_data["matematis"], "visual": keys_data["visual"]}, params_data)
    assert scores["visual"] == 100
    assert scores["matematis"] == 100
    assert scores["grafis"] == 100
    assert scores["verbal"] >= 90
