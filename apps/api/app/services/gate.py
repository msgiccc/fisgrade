from typing import Dict, Any, List
from app.config import settings


def verbal_is_complete(verbal: Dict[str, Any]) -> bool:
    if not verbal:
        return False
    teks = verbal.get("teks", "")
    words = teks.strip().split()
    return len(words) >= settings.MIN_KATA_VERBAL


def visual_gaya_is_complete(gaya: Dict[str, Any]) -> bool:
    label = gaya.get("label", "")
    sudut = gaya.get("sudut")
    panjang_rel = gaya.get("panjang_rel")
    return bool(label and sudut is not None and panjang_rel is not None and panjang_rel > 0)


def visual_is_complete(visual: Dict[str, Any]) -> bool:
    if not visual:
        return False
    gaya_list = visual.get("gaya", [])
    if not gaya_list:
        return False
    # At least some gaya is complete
    return any(visual_gaya_is_complete(g) for g in gaya_list)


def math_line_is_complete(line: Dict[str, Any]) -> bool:
    ekspresi = line.get("ekspresi", "")
    sintaks_ok = line.get("sintaks_ok", True)
    return bool(sintaks_ok and "=" in ekspresi)


def matematis_is_complete(mat: Dict[str, Any]) -> bool:
    if not mat:
        return False
    baris = mat.get("baris", [])
    return any(math_line_is_complete(b) for b in baris)


def grafis_is_complete(graf: Dict[str, Any]) -> bool:
    if not graf:
        return False
    sumbu_x = graf.get("sumbu_x", {})
    sumbu_y = graf.get("sumbu_y", {})
    x_nama = sumbu_x.get("nama", "")
    x_sat = sumbu_x.get("satuan", "")
    y_nama = sumbu_y.get("nama", "")
    y_sat = sumbu_y.get("satuan", "")
    titik = graf.get("titik", [])
    return bool(x_nama and x_sat and y_nama and y_sat and len(titik) >= 2)


def is_pair_ready_for_check(pasangan: str, canvas_dict: Dict[str, Any]) -> bool:
    verbal = canvas_dict.get("verbal")
    visual = canvas_dict.get("visual")
    matematis = canvas_dict.get("matematis")
    grafis = canvas_dict.get("grafis")

    if pasangan == "P1":  # Verbal <-> Matematis
        return verbal_is_complete(verbal) and matematis_is_complete(matematis)
    elif pasangan == "P2":  # Verbal <-> Visual
        return verbal_is_complete(verbal) and visual_is_complete(visual)
    elif pasangan == "P3":  # Verbal <-> Grafis
        return verbal_is_complete(verbal) and grafis_is_complete(grafis)
    elif pasangan == "P4":  # Matematis <-> Visual
        return matematis_is_complete(matematis) and visual_is_complete(visual)
    elif pasangan == "P5":  # Matematis <-> Grafis
        return matematis_is_complete(matematis) and grafis_is_complete(grafis)
    elif pasangan == "P6":  # Visual <-> Grafis
        return visual_is_complete(visual) and grafis_is_complete(grafis)
    return False
