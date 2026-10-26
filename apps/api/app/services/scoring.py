from typing import Dict, Any, List, Optional
from app.config import settings


def compute_final_score(skor_rubrik: int, penalti_total: int) -> int:
    """
    BR-01: Skor representasi final = min(skor rubrik, 100 - total penalti), batas bawah 0
    """
    batas_skor = max(0, 100 - penalti_total)
    return max(0, min(skor_rubrik, batas_skor))


def determine_display_status(
    rep: str,
    active_contradictions: List[Dict[str, Any]],
    session_ended: bool
) -> str:
    """
    Returns 'ditahan' if contradiction involves this rep and session is ongoing,
    'belum_terselesaikan' if session ended with unresolved contradiction,
    or 'selesai'.
    """
    has_active = any(
        rep in c.get("representasi_menyimpang", [])
        or rep == c.get("sumber", {}).get("representasi")
        or rep == c.get("tujuan", {}).get("representasi")
        for c in active_contradictions
    )

    if has_active:
        return "belum_terselesaikan" if session_ended else "ditahan"
    return "selesai"
