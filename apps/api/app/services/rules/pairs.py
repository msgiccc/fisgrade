import math
import re
from typing import Dict, Any, List, Optional, Set
from app.config import settings
from app.services.symbolic import extract_numerical_values, compute_graph_slope, is_close
from app.services.gate import (
    verbal_is_complete, visual_is_complete,
    matematis_is_complete, grafis_is_complete, is_pair_ready_for_check
)


# Dictionary mapping verbal keywords to standard force labels (TDD 20.5)
VERBAL_FORCE_MAP = {
    "N": ["gaya normal", "normal"],
    "W": ["gaya berat", "berat", "gravitasi"],
    "F": ["gaya tarik", "tarik"],
    "f_k": ["gaya gesek", "gesek kinetik", "gesekan", "gesek"]
}


def gaya_disebut_verbal(teks: str) -> Set[str]:
    teks_lower = teks.lower()
    disebut = set()
    for label, keywords in VERBAL_FORCE_MAP.items():
        if any(kw in teks_lower for kw in keywords):
            disebut.add(label)
    return disebut


def check_contradictions(
    canvases: Dict[str, Any],
    keys: Dict[str, Any],
    parameters: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Evaluates pairs P1..P6 according to TDD 20.5.
    Returns list of contradiction dictionaries.
    """
    verbal = canvases.get("verbal", {})
    visual = canvases.get("visual", {})
    matematis = canvases.get("matematis", {})
    grafis = canvases.get("grafis", {})

    contradictions: List[Dict[str, Any]] = []

    # 1. P1: Verbal <-> Matematis (R-MAT-03 / E-P1-01)
    if is_pair_ready_for_check("P1", canvases):
        disebut = gaya_disebut_verbal(verbal.get("teks", ""))
        baris_list = matematis.get("baris", [])
        all_expr = " ".join([b.get("ekspresi", "").lower() for b in baris_list])
        
        # If verbal mentions f_k or gesek, but equation has no f_k / fk / 0.2
        if "f_k" in disebut:
            has_fk = ("f_k" in all_expr or "fk" in all_expr or "gesek" in all_expr or "0.2" in all_expr)
            if not has_fk:
                # Find target element
                target_elem = baris_list[0].get("id", "m1") if baris_list else "matematis"
                for b in baris_list:
                    if "sum_f" in b.get("ekspresi", "").lower() or "=" in b.get("ekspresi", ""):
                        target_elem = b.get("id")
                        break
                contradictions.append({
                    "pasangan": "P1",
                    "kode_error": "E-P1-01",
                    "sumber": {"representasi": "verbal", "elemen": "verbal"},
                    "tujuan": {"representasi": "matematis", "elemen": target_elem, "token": "f_k"},
                    "representasi_menyimpang": ["matematis"]
                })

    # 2. P2: Verbal <-> Visual (R-VIS-01 / E-P2-01)
    if is_pair_ready_for_check("P2", canvases):
        disebut = gaya_disebut_verbal(verbal.get("teks", ""))
        visual_gaya = visual.get("gaya", [])
        digambar = {g.get("label", "").strip() for g in visual_gaya if g.get("label")}
        
        # Normalizing labels
        digambar_norm = set()
        for d in digambar:
            if d.lower() in ["n", "normal"]:
                digambar_norm.add("N")
            elif d.lower() in ["w", "berat", "mg"]:
                digambar_norm.add("W")
            elif d.lower() in ["f", "tarik"]:
                digambar_norm.add("F")
            elif d.lower() in ["f_k", "fk", "gesek"]:
                digambar_norm.add("f_k")
            else:
                digambar_norm.add(d)

        hilang = disebut - digambar_norm
        if hilang:
            label_hilang = sorted(list(hilang))[0]
            contradictions.append({
                "pasangan": "P2",
                "kode_error": "E-P2-01",
                "sumber": {"representasi": "verbal", "elemen": "verbal", "label": label_hilang},
                "tujuan": {"representasi": "visual", "elemen": "visual"},
                "representasi_menyimpang": ["visual"]
            })

    # 3. P3: Verbal <-> Grafis (R-GRA-01 / E-P3-01 / E-P3-02)
    if is_pair_ready_for_check("P3", canvases):
        teks_lower = verbal.get("teks", "").lower()
        jenis = grafis.get("jenis", "v-t")
        bentuk = grafis.get("bentuk", "linear")
        if "percepatan konstan" in teks_lower and jenis == "v-t" and bentuk != "linear":
            contradictions.append({
                "pasangan": "P3",
                "kode_error": "E-P3-01",
                "sumber": {"representasi": "verbal", "elemen": "verbal"},
                "tujuan": {"representasi": "grafis", "elemen": "kurva"},
                "representasi_menyimpang": ["grafis"]
            })
        elif "setengah jarak tempuh" in teks_lower or "setengah dari akhir dicapai pada setengah jarak" in teks_lower:
            contradictions.append({
                "pasangan": "P3",
                "kode_error": "E-P3-02",
                "sumber": {"representasi": "verbal", "elemen": "verbal"},
                "tujuan": {"representasi": "grafis", "elemen": "kurva"},
                "representasi_menyimpang": ["verbal"]
            })

    # 4. P4: Matematis <-> Visual (R-MAT-01 / E-P4-01)
    if is_pair_ready_for_check("P4", canvases):
        # Cari gaya f_k dan F di visual
        gaya_list = visual.get("gaya", [])
        g_fk = next((g for g in gaya_list if g.get("label") in ["f_k", "fk", "gesek"]), None)
        g_F = next((g for g in gaya_list if g.get("label") in ["F", "tarik"]), None)

        # Cari baris yang memuat f_k atau tanda gesek di matematis
        baris_list = matematis.get("baris", [])
        baris_fk = None
        for b in baris_list:
            expr = b.get("ekspresi", "").replace(" ", "")
            if "f_k" in expr or "fk" in expr or "-10" in expr or "+10" in expr or "-0.2" in expr or "+0.2" in expr:
                baris_fk = b
                break

        if g_fk and baris_fk:
            # Periksa sudut gaya f_k: seharusnya melawan arah gerak (180 derajat jika gerak ke 0 derajat)
            fk_sudut = float(g_fk.get("sudut", 180.0)) % 360
            f_sudut = float(g_F.get("sudut", 0.0)) % 360 if g_F else 0.0

            # Toleransi sudut
            tol_angle = settings.TOL_SUDUT
            # In visual, friction opposes pull if cos(fk - F) < 0
            rad_diff = math.radians(fk_sudut - f_sudut)
            vis_opposes = math.cos(rad_diff) < 0  # True if opposing (e.g. angle ~ 180)

            # In math, check if f_k is subtracted or added
            expr = baris_fk.get("ekspresi", "").replace(" ", "")
            # e.g. F - f_k or 30 - 10 vs F + f_k or 30 + 10
            math_opposes = True
            if "f_k" in expr:
                if "+f_k" in expr or "=f_k" in expr:
                    # check left side of =
                    lhs = expr.split("=")[0] if "=" in expr else expr
                    if "+f_k" in lhs:
                        math_opposes = False
            elif "+10" in expr and "30" in expr:
                math_opposes = False
            elif "-10" in expr or "-f_k" in expr:
                math_opposes = True

            # If visual has fk at 0 deg (same direction as pull) or math adds it
            # Notice Scenario 1: visual.gaya g4.sudut = 0 (same as F), while math has F - f_k (opposes)
            # They contradict!
            if vis_opposes != math_opposes:
                # Attribution: who is deviating from key?
                # Key: visual fk should be 180 (opposes), math fk should be - (opposes).
                rep_dev = []
                if not vis_opposes:
                    rep_dev.append("visual")
                if not math_opposes:
                    rep_dev.append("matematis")
                if not rep_dev:
                    rep_dev = ["visual"]

                contradictions.append({
                    "pasangan": "P4",
                    "kode_error": "E-P4-01",
                    "sumber": {"representasi": "visual", "elemen": g_fk.get("id", "g4")},
                    "tujuan": {"representasi": "matematis", "elemen": baris_fk.get("id", "m2"), "token": "f_k"},
                    "representasi_menyimpang": rep_dev
                })

    # 5. P5: Matematis <-> Grafis (R-GRA-02 / E-P5-01 / E-P5-02)
    if is_pair_ready_for_check("P5", canvases):
        num_vals = extract_numerical_values(matematis)
        a_mat = num_vals.get("a")
        jenis = grafis.get("jenis", "v-t")
        slope = compute_graph_slope(grafis)

        # E-P5-02: Kemiringan grafik posisi dibaca sebagai percepatan / salah tafsir
        if jenis == "x-t":
            contradictions.append({
                "pasangan": "P5",
                "kode_error": "E-P5-02",
                "sumber": {"representasi": "grafis", "elemen": "kurva"},
                "tujuan": {"representasi": "matematis", "elemen": "matematis"},
                "representasi_menyimpang": ["grafis"]
            })
        elif a_mat is not None and jenis == "v-t" and slope is not None:
            if not is_close(slope, a_mat, settings.TOL_KEMIRINGAN):
                # Cari baris a di matematis
                baris_a = "matematis"
                for b in matematis.get("baris", []):
                    if re.search(r'\ba\b', b.get("ekspresi", ""), re.IGNORECASE):
                        baris_a = b.get("id")
                        break

                # Atribusi: cek terhadap kunci (kunci a = 4.0, kunci slope = 4.0)
                rep_dev = []
                key_a = keys.get("matematis", {}).get("hasil", {}).get("a", 4.0)
                if not is_close(a_mat, key_a, settings.TOL_NILAI_REL):
                    rep_dev.append("matematis")
                if not is_close(slope, key_a, settings.TOL_KEMIRINGAN):
                    rep_dev.append("grafis")
                if not rep_dev:
                    rep_dev = ["grafis"]

                contradictions.append({
                    "pasangan": "P5",
                    "kode_error": "E-P5-01",
                    "sumber": {"representasi": "matematis", "elemen": baris_a},
                    "tujuan": {"representasi": "grafis", "elemen": "kurva"},
                    "representasi_menyimpang": rep_dev
                })

    # 6. P6: Visual <-> Grafis (R-VIS-03 / E-P6-01)
    if is_pair_ready_for_check("P6", canvases):
        gaya_list = visual.get("gaya", [])
        # Net force in x direction
        net_x = 0.0
        max_gaya = None
        for g in gaya_list:
            if g.get("label") and g.get("sudut") is not None and g.get("panjang_rel"):
                p_rel = float(g.get("panjang_rel", 0.0))
                sudut = float(g.get("sudut", 0.0))
                net_x += p_rel * math.cos(math.radians(sudut))
                if max_gaya is None or p_rel > float(max_gaya.get("panjang_rel", 0.0)):
                    max_gaya = g

        jenis = grafis.get("jenis", "v-t")
        slope = compute_graph_slope(grafis)
        if jenis == "v-t" and slope is not None and abs(net_x) > 0.05:
            # If net force sign != slope sign
            # For scenario 7: g4.panjang_rel = 1.0 (fk), F = 0.6. net_x is negative (-0.4), but slope is positive (+4.0)
            sign_net = 1 if net_x > 0 else -1
            sign_slope = 1 if slope > 0 else -1
            if sign_net != sign_slope:
                sumber_id = max_gaya.get("id", "g4") if max_gaya else "visual"
                contradictions.append({
                    "pasangan": "P6",
                    "kode_error": "E-P6-01",
                    "sumber": {"representasi": "visual", "elemen": sumber_id},
                    "tujuan": {"representasi": "grafis", "elemen": "kurva"},
                    "representasi_menyimpang": ["visual"]
                })

    # 7. E-X-01: Konsisten tetapi salah
    # After pair checking, if no contradictions were found, check whether all representations are complete
    # but deviate from key (Scenario 8)
    if not contradictions:
        all_complete = (
            verbal_is_complete(verbal) and
            visual_is_complete(visual) and
            matematis_is_complete(matematis) and
            grafis_is_complete(grafis)
        )
        if all_complete:
            # Check key deviations
            num_vals = extract_numerical_values(matematis)
            key_a = keys.get("matematis", {}).get("hasil", {}).get("a", 4.0)
            slope = compute_graph_slope(grafis)
            
            # Check if a or slope is not 4.0 (e.g. 6.0 in scenario 8)
            deviating_reps = []
            if "a" in num_vals and not is_close(num_vals["a"], key_a, settings.TOL_NILAI_REL):
                deviating_reps.append("matematis")
            if slope is not None and not is_close(slope, key_a, settings.TOL_KEMIRINGAN):
                deviating_reps.append("grafis")
            
            # Check visual fk missing or 0
            gaya_labels = {g.get("label") for g in visual.get("gaya", [])}
            if "f_k" not in gaya_labels and "fk" not in gaya_labels:
                deviating_reps.append("visual")

            # Check verbal missing friction
            disebut = gaya_disebut_verbal(verbal.get("teks", ""))
            if "f_k" not in disebut:
                deviating_reps.append("verbal")

            if len(deviating_reps) >= 2:
                for rep in deviating_reps:
                    contradictions.append({
                        "pasangan": "ALL",
                        "kode_error": "E-X-01",
                        "sumber": {"representasi": rep, "elemen": rep},
                        "tujuan": {"representasi": rep, "elemen": rep},
                        "representasi_menyimpang": [rep]
                    })

    return contradictions
