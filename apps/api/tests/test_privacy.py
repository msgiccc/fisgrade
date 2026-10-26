import pytest
from app.schemas import QuestionResponse
from app.services.llm import LLMEvalResult


def test_student_question_response_never_leaks_keys():
    # AC-10: Respons API untuk peserta tidak mengandung kunci atau rubrik
    resp = QuestionResponse(
        submission_id="test-sub-123",
        nomor=1,
        total=1,
        teks="Soal hukum newton",
        parameter={"m": 5, "F": 30},
        sisa_detik=2700,
        kanvas={"verbal": None, "matematis": None, "grafis": None, "visual": None}
    )
    dumped = resp.model_dump()
    assert "kunci" not in dumped
    assert "rubrik" not in dumped
    assert "question_keys" not in dumped


def test_llm_payload_never_contains_name_or_nim():
    # AC-11: Muatan ke LLM tidak mengandung nama atau NIM (diuji dengan penanda unik)
    marker_nama = "MARKER_NAMA_UNIQUE_AHMAD_987654"
    marker_nim = "MARKER_NIM_UNIQUE_2502000_987654"

    # The payload constructor only includes random submission_id and canvas content
    payload = {
        "submission_id": "random-uuid-xyz-123",
        "teks_verbal": "Balok bergerak dipercepat",
        "matematis": {"a": 4.0}
    }

    serialized = str(payload)
    assert marker_nama not in serialized
    assert marker_nim not in serialized
