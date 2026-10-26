import pytest
from app.services.scoring import compute_final_score, determine_display_status
from app.services.hints import get_penalty_for_level


def test_score_calculation_with_penalties():
    # AC-07: skor akhir = min(skor_rubrik, 100 - penalti_total)
    skor_rubrik = 95
    penalti_total = 15  # level 1 (5) + level 2 (10)
    final_score = compute_final_score(skor_rubrik, penalti_total)
    assert final_score == 85  # 100 - 15 = 85, min(95, 85) = 85
    assert compute_final_score(70, 15) == 70  # rubrik 70 is lower than cap 85
    assert compute_final_score(100, 25) == 75


def test_penalties_per_level():
    # AC-07: Penalti hint level 1, 2, 3 adalah 5, 10, 10
    assert get_penalty_for_level(1) == 5
    assert get_penalty_for_level(2) == 10
    assert get_penalty_for_level(3) == 10


def test_score_withholding_when_active():
    # AC-05: Skor representasi terkait ditahan selama kontradiksi aktif
    active_c = [{
        "representasi_menyimpang": ["visual"],
        "sumber": {"representasi": "visual"},
        "tujuan": {"representasi": "matematis"}
    }]
    # Ongoing session
    assert determine_display_status("visual", active_c, session_ended=False) == "ditahan"
    assert determine_display_status("matematis", active_c, session_ended=False) == "ditahan"
    assert determine_display_status("verbal", active_c, session_ended=False) == "selesai"

    # AC-08: Session ended with unresolved contradiction -> belum_terselesaikan
    assert determine_display_status("visual", active_c, session_ended=True) == "belum_terselesaikan"
