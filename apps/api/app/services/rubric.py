import math
import re
from typing import Dict, Any, Tuple
from app.config import settings
from app.services.symbolic import extract_numerical_values, compute_graph_slope, is_close
from app.services.ecf import evaluate_ecf
from app.services.rules.pairs import VERBAL_FORCE_MAP, gaya_disebut_verbal


def calculate_visual_rubric(visual: Dict[str, Any], key: Dict[str, Any]) -> int:
    if not visual:
        return 0

    objek = visual.get("objek", [])
    gaya = visual.get("gaya", [])
    key_gaya = key.get("visual", {}).get("gaya", [])

    # 1. Objek dan sistem (15)
    obj_types = {o.get("tipe") for o in objek if isinstance(o, dict)}
    has_balok = "balok" in obj_types
    has_bidang = "bidang_datar" in obj_types or "bidang_miring" in obj_types or "bidang" in obj_types
    if has_balok and has_bidang:
        skor_objek = 15
    elif has_balok or has_bidang:
        skor_objek = 8
    else:
        skor_objek = 0

    # 2. Kelengkapan gaya (30)
    key_labels = {kg["label"] for kg in key_gaya}
    student_labels = [g.get("label", "").strip() for g in gaya if g.get("label")]
    student_matched = set(student_labels) & key_labels
    excess_count = max(0, len(student_labels) - len(key_labels))
    skor_kelengkapan = max(0, int(30 * (len(student_matched) / max(1, len(key_labels)))) - (10 * excess_count))

    # 3. Arah (25) & 4. Panjang relatif (15)
    matching_forces = 0
    correct_angles = 0
    correct_lengths = 0

    tol_angle = settings.TOL_SUDUT
    tol_length = settings.TOL_PANJANG_REL

    for kg in key_gaya:
        target_label = kg["label"]
        sg = next((g for g in gaya if g.get("label") == target_label), None)
        if sg:
            matching_forces += 1
            # Check angle
            angle_diff = abs(float(sg.get("sudut", 0.0)) - float(kg["sudut"])) % 360
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            if angle_diff <= tol_angle:
                correct_angles += 1
            
            # Check rel length
            if abs(float(sg.get("panjang_rel", 1.0)) - float(kg["rel"])) <= tol_length:
                correct_lengths += 1

    skor_arah = int(25 * (correct_angles / max(1, matching_forces))) if matching_forces > 0 else 0
    skor_panjang = int(15 * (correct_lengths / max(1, matching_forces))) if matching_forces > 0 else 0

    # 5. Pelabelan (15)
    labeled_count = len([g for g in gaya if g.get("label")])
    skor_label = int(15 * (labeled_count / max(1, len(gaya)))) if gaya else 0

    return min(100, skor_objek + skor_kelengkapan + skor_arah + skor_panjang + skor_label)


def calculate_math_rubric(matematis: Dict[str, Any], key: Dict[str, Any], param: Dict[str, Any]) -> int:
    if not matematis:
        return 0

    baris = matematis.get("baris", [])
    all_text = " ".join([b.get("ekspresi", "").lower() for b in baris])

    # 1. Persamaan dasar (25)
    skor_dasar = 0
    if "sum_f = m*a" in all_text.replace(" ", "") or "sum_f=ma" in all_text.replace(" ", "") or "f-f_k=m*a" in all_text.replace(" ", "") or "f-fk=ma" in all_text.replace(" ", ""):
        skor_dasar = 25
    elif any("m*a" in b.get("ekspresi", "") or "ma" in b.get("ekspresi", "") for b in baris):
        skor_dasar = 20

    # 2. Substitusi (25) & 3. Hasil numerik (30)
    num_vals = extract_numerical_values(matematis)
    ecf = evaluate_ecf(param, num_vals)

    skor_substitusi = 0
    # Checks if substitution row exists: e.g. 30 - 10 = 5*a or 30 - 0.2*50 = 5*a
    has_subst = any(("30" in b.get("ekspresi", "") and "5" in b.get("ekspresi", "")) for b in baris)
    if has_subst:
        skor_substitusi = 25
    elif len(baris) >= 2:
        skor_substitusi = 15

    # Hasil numerik: 30 if a matches key within TOL_NILAI_REL; 15 if ECF
    key_a = float(key.get("matematis", {}).get("hasil", {}).get("a", 4.0))
    student_a = num_vals.get("a")

    skor_hasil = 0
    if student_a is not None:
        if is_close(student_a, key_a, settings.TOL_NILAI_REL):
            skor_hasil = 30
        elif ecf.get("is_ecf_valid_downstream"):
            skor_hasil = 15

    # 4. Satuan (20)
    skor_satuan = 0
    if "m/s^2" in all_text or "m/s2" in all_text:
        skor_satuan = 20
    elif "m/s" in all_text or "n" in all_text:
        skor_satuan = 10

    return min(100, skor_dasar + skor_substitusi + skor_hasil + skor_satuan)


def calculate_grafis_rubric(grafis: Dict[str, Any], key: Dict[str, Any]) -> int:
    if not grafis:
        return 0

    key_grafis = key.get("grafis", {})
    key_jenis = key_grafis.get("jenis", "v-t")
    key_bentuk = key_grafis.get("bentuk", "linear")
    key_kemiringan = float(key_grafis.get("kemiringan", 4.0))

    # 1. Jenis dan bentuk (30): 15 jenis + 15 bentuk
    skor_jenis_bentuk = 0
    if grafis.get("jenis") == key_jenis:
        skor_jenis_bentuk += 15
    if grafis.get("bentuk") == key_bentuk:
        skor_jenis_bentuk += 15

    # 2. Sumbu dan satuan (25)
    sumbu_x = grafis.get("sumbu_x", {})
    sumbu_y = grafis.get("sumbu_y", {})
    valid_items = 0
    if sumbu_x.get("nama") in ["t", "waktu"]:
        valid_items += 1
    if sumbu_x.get("satuan") in ["s", "sekon", "detik"]:
        valid_items += 1
    if sumbu_y.get("nama") in ["v", "kecepatan"]:
        valid_items += 1
    if sumbu_y.get("satuan") in ["m/s", "meter/sekon"]:
        valid_items += 1
    skor_sumbu = int(25 * (valid_items / 4))

    # 3. Nilai kunci / kemiringan (35)
    slope = compute_graph_slope(grafis)
    skor_nilai_kunci = 0
    if slope is not None:
        if is_close(slope, key_kemiringan, settings.TOL_KEMIRINGAN):
            skor_nilai_kunci = 35
        elif abs(slope - key_kemiringan) <= 0.15 * key_kemiringan:
            skor_nilai_kunci = 17

    # 4. Kelengkapan (10)
    titik = grafis.get("titik", [])
    skor_kelengkapan = 10 if len(titik) >= 2 else 0

    return min(100, skor_jenis_bentuk + skor_sumbu + skor_nilai_kunci + skor_kelengkapan)


def calculate_verbal_rubric(verbal: Dict[str, Any], key: Dict[str, Any]) -> int:
    if not verbal:
        return 0

    teks = verbal.get("teks", "")
    teks_lower = teks.lower()

    # 1. Prinsip (30)
    skor_prinsip = 0
    if "hukum ii newton" in teks_lower or "hukum 2 newton" in teks_lower or "sum_f = m*a" in teks_lower:
        skor_prinsip = 30
    elif "newton" in teks_lower:
        skor_prinsip = 15

    # 2. Gaya (30)
    disebut = gaya_disebut_verbal(teks)
    skor_gaya = int(30 * (len(disebut) / 4))

    # 3. Sebab-akibat (30)
    skor_sebab = 0
    if ("percepatan" in teks_lower or "mempercepat" in teks_lower) and ("searah" in teks_lower or "netto" in teks_lower or "melawan" in teks_lower or "gaya gesek" in teks_lower):
        skor_sebab = 30
    elif "percepatan" in teks_lower:
        skor_sebab = 15

    # 4. Kejelasan (10)
    words = teks.strip().split()
    skor_kejelasan = 10 if len(words) >= settings.MIN_KATA_VERBAL else int(10 * len(words) / max(1, settings.MIN_KATA_VERBAL))

    return min(100, skor_prinsip + skor_gaya + skor_sebab + skor_kejelasan)


def calculate_rubric_scores(canvases: Dict[str, Any], keys: Dict[str, Any], param: Dict[str, Any]) -> Dict[str, int]:
    return {
        "verbal": calculate_verbal_rubric(canvases.get("verbal", {}), keys),
        "visual": calculate_visual_rubric(canvases.get("visual", {}), keys),
        "matematis": calculate_math_rubric(canvases.get("matematis", {}), keys, param),
        "grafis": calculate_grafis_rubric(canvases.get("grafis", {}), keys)
    }
