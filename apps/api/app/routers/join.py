import secrets
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Session as ClassSession, Participant, Identity, Submission, Question, Score
from app.schemas import JoinRequest, JoinResponse
from app.services.privacy import encrypt_identity, hash_participant_token

router = APIRouter(prefix="/api", tags=["join"])


@router.post("/join", response_model=JoinResponse)
def join_session(req: JoinRequest, db: Session = Depends(get_db)):
    # 1. Enforce consent (AC-02: tanpa persetujuan tidak dapat lanjut)
    if not req.persetujuan:
        raise HTTPException(
            status_code=400,
            detail="Persetujuan penggunaan data diperlukan untuk melanjutkan asesmen."
        )

    # 2. Find session by code
    kode = req.kode.strip().upper()
    sess = db.query(ClassSession).filter(ClassSession.kode == kode).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau kode salah.")
    if sess.status == "ditutup":
        raise HTTPException(status_code=400, detail="Sesi ini telah ditutup.")

    # 3. Encrypt identity
    nama_enc, nim_enc, nim_hash = encrypt_identity(req.nama, req.nim)

    # 4. Check re-entry (AC-04: masuk ulang dengan kode dan NIM yang sama memulihkan pekerjaan)
    existing_ident = db.query(Identity).filter(
        Identity.session_id == sess.id,
        Identity.nim_hash == nim_hash
    ).first()

    now = datetime.now(timezone.utc)
    raw_token = secrets.token_hex(32)
    token_hash = hash_participant_token(raw_token)

    if existing_ident:
        participant = db.query(Participant).filter(Participant.id == existing_ident.participant_id).first()
        participant.token_hash = token_hash
        db.commit()
        sub = db.query(Submission).filter(Submission.participant_id == participant.id).first()
        return JoinResponse(
            token=raw_token,
            participant_id=participant.id,
            submission_id=sub.id if sub else "",
            sesi={
                "id": sess.id,
                "judul": sess.judul,
                "durasi_menit": sess.durasi_menit,
                "status": sess.status
            }
        )

    # 5. Create new participant with random UUID
    participant = Participant(
        session_id=sess.id,
        token_hash=token_hash,
        status="mengerjakan",
        consent_at=now,
        consent_version=req.versi_persetujuan,
        mulai_at=now
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    # 6. Store encrypted identity in separate table
    identity_rec = Identity(
        participant_id=participant.id,
        session_id=sess.id,
        nama_enc=nama_enc,
        nim_enc=nim_enc,
        nim_hash=nim_hash
    )
    db.add(identity_rec)

    # 7. Create Submission for Question 1
    question = db.query(Question).filter(Question.package_id == sess.package_id).order_by(Question.urutan).first()
    if not question:
        raise HTTPException(status_code=500, detail="Soal pada sesi ini belum tersedia.")

    submission = Submission(
        participant_id=participant.id,
        question_id=question.id,
        status="draf",
        started_at=now
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Initialize empty scores records
    for rep in ["verbal", "matematis", "visual", "grafis"]:
        sc = Score(
            submission_id=submission.id,
            representasi=rep,
            status="berjalan",
            penalti_total=0
        )
        db.add(sc)
    db.commit()

    return JoinResponse(
        token=raw_token,
        participant_id=participant.id,
        submission_id=submission.id,
        sesi={
            "id": sess.id,
            "judul": sess.judul,
            "durasi_menit": sess.durasi_menit,
            "status": sess.status
        }
    )
