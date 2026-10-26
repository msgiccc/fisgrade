import hashlib
import json
from typing import Dict, Any, Tuple


def compute_hash(data: Any) -> str:
    # Deterministic JSON serialization
    serialized = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def normalize_verbal(data: Dict[str, Any]) -> Dict[str, Any]:
    teks = data.get("teks", "")
    return {
        "representasi": "verbal",
        "teks": teks.strip() if isinstance(teks, str) else "",
        "rev": data.get("rev", 1)
    }


def normalize_matematis(data: Dict[str, Any]) -> Dict[str, Any]:
    baris = data.get("baris", [])
    normalized_baris = []
    for idx, b in enumerate(baris):
        if isinstance(b, dict):
            bid = b.get("id", f"m{idx+1}")
            ekspresi = b.get("ekspresi", "").strip()
            sintaks_ok = bool(b.get("sintaks_ok", True))
            normalized_baris.append({
                "id": bid,
                "ekspresi": ekspresi,
                "sintaks_ok": sintaks_ok
            })
    return {
        "representasi": "matematis",
        "baris": normalized_baris,
        "rev": data.get("rev", 1)
    }


def normalize_grafis(data: Dict[str, Any]) -> Dict[str, Any]:
    sumbu_x = data.get("sumbu_x", {})
    sumbu_y = data.get("sumbu_y", {})
    titik = data.get("titik", [])
    return {
        "representasi": "grafis",
        "jenis": data.get("jenis", "v-t"),
        "sumbu_x": {
            "nama": str(sumbu_x.get("nama", "")).strip(),
            "satuan": str(sumbu_x.get("satuan", "")).strip()
        },
        "sumbu_y": {
            "nama": str(sumbu_y.get("nama", "")).strip(),
            "satuan": str(sumbu_y.get("satuan", "")).strip()
        },
        "titik": titik if isinstance(titik, list) else [],
        "bentuk": data.get("bentuk", "linear"),
        "kemiringan": float(data.get("kemiringan", 0.0)) if data.get("kemiringan") is not None else None,
        "dihaluskan": bool(data.get("dihaluskan", False)),
        "goresan_asli_disimpan": bool(data.get("goresan_asli_disimpan", False)),
        "rev": data.get("rev", 1)
    }


def normalize_visual(data: Dict[str, Any]) -> Dict[str, Any]:
    objek = data.get("objek", [])
    gaya = data.get("gaya", [])
    normalized_gaya = []
    for idx, g in enumerate(gaya):
        if isinstance(g, dict):
            gid = g.get("id", f"g{idx+1}")
            label = str(g.get("label", "")).strip()
            sudut = float(g.get("sudut", 0.0)) if g.get("sudut") is not None else 0.0
            panjang_rel = float(g.get("panjang_rel", 1.0)) if g.get("panjang_rel") is not None else 1.0
            obj_id = g.get("objek", "o1")
            normalized_gaya.append({
                "id": gid,
                "label": label,
                "objek": obj_id,
                "sudut": sudut,
                "panjang_rel": panjang_rel
            })
    return {
        "representasi": "visual",
        "objek": objek if isinstance(objek, list) else [],
        "gaya": normalized_gaya,
        "sumbu": data.get("sumbu", {"x": "kanan"}),
        "rev": data.get("rev", 1)
    }


def normalize_canvas(rep: str, data: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    if rep == "verbal":
        norm = normalize_verbal(data)
    elif rep == "matematis":
        norm = normalize_matematis(data)
    elif rep == "grafis":
        norm = normalize_grafis(data)
    elif rep == "visual":
        norm = normalize_visual(data)
    else:
        norm = data
    return norm, compute_hash(norm)
