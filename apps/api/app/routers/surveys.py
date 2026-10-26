from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import SurveyResponse, QualitativeNote, Participant
from app.schemas import SurveySubmitRequest, QualitativeNoteRequest
from app.routers.me import get_current_participant

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


@router.post("")
def submit_survey(
    payload: Dict[str, Any],
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    # Expects ratings: dict of indicator -> score (1..5), notes: dict of category -> text
    ratings = payload.get("ratings", {})
    for ind, score in ratings.items():
        if isinstance(score, int) and 1 <= score <= 5:
            resp = SurveyResponse(
                participant_id=participant.id,
                indikator=ind,
                butir=ind,
                skor_likert=score
            )
            db.add(resp)

    notes = payload.get("notes", {})
    for cat, isi in notes.items():
        if isi and str(isi).strip():
            note = QualitativeNote(
                participant_id=participant.id,
                kategori=cat,
                isi=str(isi).strip()
            )
            db.add(note)

    db.commit()
    return {"status": "ok", "pesan": "Terima kasih atas penilaian Anda."}


@router.get("/summary")
def get_survey_summary(db: Session = Depends(get_db)):
    responses = db.query(SurveyResponse).all()
    if not responses:
        return {
            "total_responden": 0,
            "P": 0.0,
            "kategori": "Belum ada data",
            "per_indikator": {}
        }

    total_skor = sum(r.skor_likert for r in responses)
    max_skor = len(responses) * 5
    P = round((total_skor / max_skor) * 100, 2)

    # Determine practicality category
    if P >= 81.0:
        kategori = "Sangat Praktis"
    elif P >= 61.0:
        kategori = "Praktis"
    elif P >= 41.0:
        kategori = "Cukup Praktis"
    else:
        kategori = "Kurang Praktis"

    # Per indicator breakdown
    by_ind = {}
    for r in responses:
        if r.indikator not in by_ind:
            by_ind[r.indikator] = []
        by_ind[r.indikator].append(r.skor_likert)

    breakdown = {}
    for ind, scores in by_ind.items():
        breakdown[ind] = {
            "rata_rata": round(sum(scores) / len(scores), 2),
            "persen": round((sum(scores) / (len(scores) * 5)) * 100, 2)
        }

    return {
        "total_responden": len(set(r.participant_id for r in responses)),
        "total_jawaban": len(responses),
        "P": P,
        "kategori": kategori,
        "per_indikator": breakdown
    }
