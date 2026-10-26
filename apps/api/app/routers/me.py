from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Participant, Submission, Question, CanvasSnapshot, Session as ClassSession
from app.schemas import QuestionResponse
from app.services.privacy import hash_participant_token

router = APIRouter(prefix="/api/me", tags=["me"])


def get_current_participant(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Participant:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token peserta diperlukan")

    token = authorization.split(" ")[1]
    thash = hash_participant_token(token)

    participant = db.query(Participant).filter(Participant.token_hash == thash).first()
    if not participant:
        raise HTTPException(status_code=401, detail="Token peserta tidak sah atau telah berakhir")
    return participant


@router.get("/question", response_model=QuestionResponse)
def get_my_question(
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    submission = db.query(Submission).filter(Submission.participant_id == participant.id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submisi pengerjaan tidak ditemukan")

    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan")

    session_obj = db.query(ClassSession).filter(ClassSession.id == participant.session_id).first()

    # Calculate remaining seconds based on server timer
    now = datetime.now(timezone.utc)
    start_time = participant.mulai_at or participant.joined_at
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    elapsed = (now - start_time).total_seconds()
    total_seconds = (session_obj.durasi_menit if session_obj else 45) * 60
    sisa_detik = max(0, int(total_seconds - elapsed))

    # Load latest canvas states
    kanvas = {"verbal": None, "matematis": None, "grafis": None, "visual": None}
    for rep in ["verbal", "matematis", "grafis", "visual"]:
        latest_snap = db.query(CanvasSnapshot).filter(
            CanvasSnapshot.submission_id == submission.id,
            CanvasSnapshot.representasi == rep
        ).order_by(CanvasSnapshot.rev.desc()).first()
        if latest_snap:
            kanvas[rep] = latest_snap.state_json

    # Strict compliance: NO keys or rubrics returned (AC-10)
    return QuestionResponse(
        submission_id=submission.id,
        nomor=question.urutan,
        total=1,
        teks=question.teks_soal,
        parameter=question.parameter_json,
        sisa_detik=sisa_detik,
        kanvas=kanvas
    )
