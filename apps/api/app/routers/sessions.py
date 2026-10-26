import random
import string
import csv
import io
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Class, Package, Session as ClassSession, Participant, Identity, Submission, Score, Contradiction, User, CanvasSnapshot
from app.schemas import CreateSessionRequest, SessionResponse
from app.routers.auth import get_current_user
from app.services.privacy import decrypt_identity

router = APIRouter(tags=["sessions"])


def generate_session_code(db: Session) -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(chars, k=6))
        exists = db.query(ClassSession).filter(ClassSession.kode == code).first()
        if not exists:
            return code
    return "NEWT01"


@router.post("/api/classes/{class_id}/sessions", response_model=SessionResponse)
def create_session(
    class_id: str,
    req: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    kelas = db.query(Class).filter(Class.id == class_id, Class.owner_id == current_user.id).first()
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")

    pkg = db.query(Package).filter(Package.id == req.package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket soal tidak ditemukan")

    code = generate_session_code(db)
    now = datetime.now(timezone.utc)

    # Freeze version and parameter snapshot
    q = pkg.questions[0] if pkg.questions else None
    param_snap = q.parameter_json if q else {}

    session_obj = ClassSession(
        class_id=kelas.id,
        package_id=pkg.id,
        package_version=pkg.versi,
        judul=req.judul.strip(),
        kode=code,
        status="dibuka",
        durasi_menit=req.durasi_menit,
        rilis_hasil=req.rilis_hasil,
        parameter_snapshot_json=param_snap,
        dibuka_at=now
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)

    return SessionResponse(
        id=session_obj.id,
        class_id=session_obj.class_id,
        package_id=session_obj.package_id,
        package_version=session_obj.package_version,
        judul=session_obj.judul,
        kode=session_obj.kode,
        status=session_obj.status,
        durasi_menit=session_obj.durasi_menit,
        rilis_hasil=session_obj.rilis_hasil,
        hasil_dirilis=session_obj.hasil_dirilis,
        dibuka_at=session_obj.dibuka_at.isoformat() if session_obj.dibuka_at else None,
        ditutup_at=session_obj.ditutup_at.isoformat() if session_obj.ditutup_at else None
    )


@router.patch("/api/sessions/{id}", response_model=SessionResponse)
def update_session(
    id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sess = db.query(ClassSession).filter(ClassSession.id == id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    if "status" in payload:
        new_status = payload["status"]
        if new_status in ["draf", "dibuka", "ditutup"]:
            sess.status = new_status
            if new_status == "ditutup":
                sess.ditutup_at = datetime.now(timezone.utc)
                if sess.rilis_hasil == "otomatis":
                    sess.hasil_dirilis = True
            elif new_status == "dibuka" and not sess.dibuka_at:
                sess.dibuka_at = datetime.now(timezone.utc)

    if "durasi_menit" in payload:
        sess.durasi_menit = int(payload["durasi_menit"])
    if "rilis_hasil" in payload:
        sess.rilis_hasil = payload["rilis_hasil"]
    if "hasil_dirilis" in payload:
        sess.hasil_dirilis = bool(payload["hasil_dirilis"])

    db.commit()
    db.refresh(sess)

    return SessionResponse(
        id=sess.id,
        class_id=sess.class_id,
        package_id=sess.package_id,
        package_version=sess.package_version,
        judul=sess.judul,
        kode=sess.kode,
        status=sess.status,
        durasi_menit=sess.durasi_menit,
        rilis_hasil=sess.rilis_hasil,
        hasil_dirilis=sess.hasil_dirilis,
        dibuka_at=sess.dibuka_at.isoformat() if sess.dibuka_at else None,
        ditutup_at=sess.ditutup_at.isoformat() if sess.ditutup_at else None
    )


@router.get("/api/sessions/{id}/results")
def get_session_results(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sess = db.query(ClassSession).filter(ClassSession.id == id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    participants = db.query(Participant).filter(Participant.session_id == sess.id).all()

    mahasiswa_list = []
    error_counts: Dict[str, int] = {}
    total_scores = {"verbal": 0, "matematis": 0, "visual": 0, "grafis": 0}
    count_finished = 0

    for p in participants:
        # Decrypt identity for lecturer view
        identity = db.query(Identity).filter(Identity.participant_id == p.id).first()
        nama = "Peserta (anonim)"
        nim = "N/A"
        if identity:
            try:
                nama, nim = decrypt_identity(identity.nama_enc, identity.nim_enc)
            except Exception:
                pass

        sub = db.query(Submission).filter(Submission.participant_id == p.id).first()
        scores_map = {}
        sub_status = p.status
        if sub:
            sub_status = sub.status
            scores = db.query(Score).filter(Score.submission_id == sub.id).all()
            for s in scores:
                scores_map[s.representasi] = {
                    "id": s.id,
                    "skor_rubrik": s.skor_rubrik,
                    "penalti": s.penalti_total,
                    "skor_otomatis": s.skor_otomatis,
                    "skor_dosen": s.skor_dosen,
                    "skor_final": s.skor_dosen if s.skor_dosen is not None else s.skor_otomatis,
                    "status": s.status,
                    "alasan": s.alasan_override
                }
                if s.skor_otomatis is not None:
                    total_scores[s.representasi] += (s.skor_dosen if s.skor_dosen is not None else s.skor_otomatis)

            if sub.status in ["dikirim", "belum_terselesaikan"]:
                count_finished += 1

            # Count contradictions/misconceptions
            contras = db.query(Contradiction).filter(Contradiction.submission_id == sub.id).all()
            for c in contras:
                error_counts[c.kode_error] = error_counts.get(c.kode_error, 0) + 1

        mahasiswa_list.append({
            "participant_id": p.id,
            "nama": nama,
            "nim": nim,
            "status": sub_status,
            "submission_id": sub.id if sub else None,
            "scores": scores_map
        })

    # Sort: belum_terselesaikan at the top (PRD FR-H5 / UI/UX W-21)
    mahasiswa_list.sort(key=lambda m: 0 if m["status"] == "belum_terselesaikan" else 1)

    avg_radar = {}
    for rep in ["verbal", "matematis", "visual", "grafis"]:
        avg_radar[rep] = round(total_scores[rep] / max(1, count_finished), 1) if count_finished > 0 else 0

    return {
        "session": {
            "id": sess.id,
            "judul": sess.judul,
            "kode": sess.kode,
            "status": sess.status,
            "hasil_dirilis": sess.hasil_dirilis
        },
        "radar_rata_rata": avg_radar,
        "miskonsepsi": [
            {"kode": k, "jumlah": v, "persen": round((v / max(1, len(participants))) * 100)}
            for k, v in error_counts.items()
        ],
        "peserta": mahasiswa_list
    }


@router.get("/api/sessions/{id}/export")
def export_session_csv(
    id: str,
    pseudonim: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sess = db.query(ClassSession).filter(ClassSession.id == id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    participants = db.query(Participant).filter(Participant.session_id == sess.id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header AC-18
    writer.writerow([
        "Participant ID", "Nama", "NIM", "Status",
        "Verbal_Otomatis", "Verbal_Dosen", "Verbal_Penalti", "Verbal_Status",
        "Matematis_Otomatis", "Matematis_Dosen", "Matematis_Penalti", "Matematis_Status",
        "Visual_Otomatis", "Visual_Dosen", "Visual_Penalti", "Visual_Status",
        "Grafis_Otomatis", "Grafis_Dosen", "Grafis_Penalti", "Grafis_Status"
    ])

    for p in participants:
        nama = f"Mahasiswa_{p.id[:6]}" if pseudonim else "Anonim"
        nim = "PSEUDONIM" if pseudonim else "N/A"
        if not pseudonim:
            ident = db.query(Identity).filter(Identity.participant_id == p.id).first()
            if ident:
                try:
                    nama, nim = decrypt_identity(ident.nama_enc, ident.nim_enc)
                except Exception:
                    pass

        sub = db.query(Submission).filter(Submission.participant_id == p.id).first()
        sub_status = sub.status if sub else p.status

        scores_by_rep = {}
        if sub:
            for s in sub.scores:
                scores_by_rep[s.representasi] = s

        row = [p.id, nama, nim, sub_status]
        for rep in ["verbal", "matematis", "visual", "grafis"]:
            sc = scores_by_rep.get(rep)
            if sc:
                row.extend([sc.skor_otomatis, sc.skor_dosen or "", sc.penalti_total, sc.status])
            else:
                row.extend(["", "", 0, "belum_mulai"])

        writer.writerow(row)

    output.seek(0)
    filename = f"fisgrade_hasil_{sess.kode}_{'pseudonim' if pseudonim else 'lengkap'}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/api/sessions/{id}/stream")
async def session_events_stream(
    id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Server-Sent Events endpoint for lecturer live monitoring (FR-D4 / W-20).
    """
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            # Poll current session participant status
            sess = db.query(ClassSession).filter(ClassSession.id == id).first()
            if not sess:
                break

            participants = db.query(Participant).filter(Participant.session_id == id).all()
            data = {
                "session_id": id,
                "total_peserta": len(participants),
                "mengerjakan": len([p for p in participants if p.status == "mengerjakan"]),
                "dikirim": len([p for p in participants if p.status == "dikirim"]),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            yield f"data: {data}\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
