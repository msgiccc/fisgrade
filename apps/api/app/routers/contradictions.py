from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Contradiction, HintEvent, Score, Submission, Participant, CanvasSnapshot, Question, QuestionKey
from app.schemas import AttemptResponse, HintResponse
from app.services.hints import build_hint_text, get_penalty_for_level
from app.routers.me import get_current_participant
from app.config import settings

router = APIRouter(prefix="/api/contradictions", tags=["contradictions"])


@router.post("/{id}/attempt", response_model=AttemptResponse)
def record_attempt(
    id: str,
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    contra = db.query(Contradiction).filter(Contradiction.id == id).first()
    if not contra:
        raise HTTPException(status_code=404, detail="Kontradiksi tidak ditemukan")

    contra.percobaan_terpakai += 1
    if contra.percobaan_terpakai >= settings.MAX_ATTEMPTS:
        contra.terkunci = True
        # Unlock hint level 1 automatically if not opened yet
        if contra.hint_level == 0:
            contra.hint_level = 1

    db.commit()
    db.refresh(contra)

    return AttemptResponse(
        percobaan_terpakai=contra.percobaan_terpakai,
        terkunci=contra.terkunci
    )


@router.post("/{id}/hint", response_model=HintResponse)
def unlock_next_hint(
    id: str,
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    contra = db.query(Contradiction).filter(Contradiction.id == id).first()
    if not contra:
        raise HTTPException(status_code=404, detail="Kontradiksi tidak ditemukan")

    current_level = contra.hint_level
    next_level = min(3, current_level + 1)
    if current_level == 3:
        next_level = 3

    now = datetime.now(timezone.utc)

    # Check 15-second cooldown delay for Level 3 (AC-07 / BR-04 / TDD 20.4)
    if next_level == 3 and current_level == 2:
        last_hint = db.query(HintEvent).filter(
            HintEvent.contradiction_id == contra.id,
            HintEvent.level == 2
        ).first()
        if last_hint:
            last_opened = last_hint.opened_at
            if last_opened.tzinfo is None:
                last_opened = last_opened.replace(tzinfo=timezone.utc)
            elapsed_sec = (now - last_opened).total_seconds()
            delay_sec = settings.HINT3_DELAY_SEC
            if elapsed_sec < delay_sec:
                tunggu = int(delay_sec - elapsed_sec)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "kode": "HINT_TERKUNCI",
                        "pesan": "Hint level 3 belum dapat dibuka",
                        "tunggu_detik": tunggu
                    }
                )

    penalty = get_penalty_for_level(next_level)
    rep_dibantu = contra.representasi_menyimpang or []

    # Check if this level event already recorded
    existing_event = db.query(HintEvent).filter(
        HintEvent.contradiction_id == contra.id,
        HintEvent.level == next_level
    ).first()

    if not existing_event:
        event = HintEvent(
            contradiction_id=contra.id,
            level=next_level,
            penalti=penalty,
            representasi_dibantu=rep_dibantu,
            opened_at=now
        )
        db.add(event)

        # Apply penalty to deviating representations only (BR-02 / AC-07)
        for r in rep_dibantu:
            sc = db.query(Score).filter(
                Score.submission_id == contra.submission_id,
                Score.representasi == r
            ).first()
            if sc:
                sc.penalti_total += penalty

        contra.hint_level = next_level
        db.commit()

    # Determine representations that are correct (bagian yang sudah benar)
    all_reps = {"verbal", "matematis", "visual", "grafis"}
    rep_benar = sorted(list(all_reps - set(rep_dibantu)))

    hint_text = build_hint_text(
        kode_error=contra.kode_error,
        level=next_level,
        rep_benar=rep_benar,
        label=contra.sumber_json.get("label", "f_k"),
        baris="2",
        rep_menyimpang=", ".join([r.capitalize() for r in rep_dibantu])
    )

    return HintResponse(
        level=next_level,
        teks=hint_text,
        bagian_benar=rep_benar,
        penalti=penalty,
        representasi_dibantu=rep_dibantu
    )
