import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db
from app.seed.load import seed_paket

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    seed_paket()


def test_healthz():
    # M0 exit criteria: /healthz ok
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["app"] == "FisGrade"


def test_ac_01_and_ac_02_flow():
    # AC-01: Dosen mendaftar, buat kelas, pilih paket, buka sesi
    reg_resp = client.post("/api/auth/register", json={
        "email": "dosen_test_ac01@fisika.ac.id",
        "password": "PasswordDosen123!",
        "nama_tampil": "Dr. Dosen Fisika"
    })
    assert reg_resp.status_code in [200, 400]

    login_resp = client.post("/api/auth/login", json={
        "email": "dosen_test_ac01@fisika.ac.id",
        "password": "PasswordDosen123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Buat kelas
    class_resp = client.post("/api/classes", headers=headers, json={
        "nama": "Fisika Dasar 1 - Kelas A",
        "mata_kuliah": "Mekanika",
        "semester": "Ganjil 2026/2027"
    })
    assert class_resp.status_code == 200
    class_id = class_resp.json()["id"]

    # Ambil paket
    pkg_resp = client.get("/api/packages", headers=headers)
    assert pkg_resp.status_code == 200
    packages = pkg_resp.json()
    assert len(packages) >= 1
    package_id = packages[0]["id"]

    # Buka sesi (AC-01)
    session_resp = client.post(f"/api/classes/{class_id}/sessions", headers=headers, json={
        "package_id": package_id,
        "judul": "Newton - Pertemuan 1",
        "durasi_menit": 45,
        "rilis_hasil": "otomatis"
    })
    assert session_resp.status_code == 200
    sess_data = session_resp.json()
    assert len(sess_data["kode"]) == 6
    assert sess_data["status"] == "dibuka"
    assert sess_data["package_version"] == "1.0"
    kode_sesi = sess_data["kode"]

    # AC-02: Mahasiswa tanpa persetujuan DITOLAK
    join_reject = client.post("/api/join", json={
        "kode": kode_sesi,
        "nama": "Ahmad Fauzi",
        "nim": "2502001",
        "persetujuan": False
    })
    assert join_reject.status_code == 400

    # AC-02: Mahasiswa dengan persetujuan DITERIMA
    join_ok = client.post("/api/join", json={
        "kode": kode_sesi,
        "nama": "Ahmad Fauzi",
        "nim": "2502001",
        "persetujuan": True
    })
    assert join_ok.status_code == 200
    j_data = join_ok.json()
    assert "token" in j_data
    assert "submission_id" in j_data
    assert j_data["sesi"]["durasi_menit"] == 45


def test_ac_09_override_score_requires_reason():
    # AC-09: Dosen mengubah skor: alasan wajib; riwayat tersimpan
    # 1. Login dosen
    login_resp = client.post("/api/auth/login", json={
        "email": "dosen_test_ac01@fisika.ac.id",
        "password": "PasswordDosen123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Cari submission skor
    class_list = client.get("/api/classes", headers=headers).json()
    class_id = class_list[0]["id"]
    class_detail = client.get(f"/api/classes/{class_id}", headers=headers).json()
    session_id = class_detail["sessions"][0]["id"]

    results = client.get(f"/api/sessions/{session_id}/results", headers=headers).json()
    assert len(results["peserta"]) >= 1
    peserta = results["peserta"][0]
    scores = peserta["scores"]
    assert "matematis" in scores
    score_id = scores["matematis"]["id"]

    # Override TANPA alasan -> 400 atau 422
    fail_override = client.patch(f"/api/scores/{score_id}", headers=headers, json={
        "skor_dosen": 85,
        "alasan": ""
    })
    assert fail_override.status_code in [400, 422]

    # Override DENGAN alasan -> 200
    ok_override = client.patch(f"/api/scores/{score_id}", headers=headers, json={
        "skor_dosen": 85,
        "alasan": "Langkah konsep tepat, terdapat kesalahan aritmetika kecil pada substitusi."
    })
    assert ok_override.status_code == 200
    res_data = ok_override.json()
    assert res_data["skor_dosen"] == 85
    assert "audit_id" in res_data
