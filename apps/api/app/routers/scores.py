from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Score, ScoreAudit, User
from app.schemas import ScoreOverrideRequest
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/scores", tags=["scores"])


@router.patch("/{id}")
def override_score(
    id: str,
    req: ScoreOverrideRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    score = db.query(Score).filter(Score.id == id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Skor representasi tidak ditemukan")

    if not req.alasan or len(req.alasan.strip()) < 3:
        raise HTTPException(status_code=400, detail="Alasan perubahan skor wajib diisi secara memadai")

    old_val = score.skor_dosen if score.skor_dosen is not None else score.skor_otomatis
    now = datetime.now(timezone.utc)

    # Immutable audit record (TDD 20.3 & 20.4)
    audit = ScoreAudit(
        score_id=score.id,
        nilai_lama=old_val,
        nilai_baru=req.skor_dosen,
        alasan=req.alasan.strip(),
        editor_id=current_user.id,
        created_at=now
    )
    db.add(audit)

    score.skor_dosen = req.skor_dosen
    score.alasan_override = req.alasan.strip()
    score.updated_by = current_user.id
    score.updated_at = now
    db.commit()

    return {
        "id": score.id,
        "representasi": score.representasi,
        "skor_dosen": score.skor_dosen,
        "audit_id": audit.id,
        "status": "diubah"
    }
