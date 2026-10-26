import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import (
    Submission, Participant, Question, QuestionKey, CanvasSnapshot,
    Check, Contradiction, Score, Event, Session as ClassSession
)
from app.schemas import (
    CanvasUpdateResponse, CheckResponse, ContradictionItem,
    StudentResultResponse, ScoreItem
)
from app.services.normalizer import normalize_canvas, compute_hash
from app.services.rules.pairs import check_contradictions
from app.services.rubric import calculate_rubric_scores
from app.services.scoring import compute_final_score, determine_display_status
from app.routers.me import get_current_participant
from app.config import settings

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.put("/{id}/canvas/{rep}", response_model=CanvasUpdateResponse)
def update_canvas(
    id: str,
    rep: str,
    payload: Dict[str, Any],
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == id, Submission.participant_id == participant.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")
    if sub.status == "dikirim":
        raise HTTPException(status_code=400, detail="Jawaban sudah dikirim dan tidak dapat diubah")

    rep = rep.lower()
    if rep not in ["verbal", "matematis", "grafis", "visual"]:
        raise HTTPException(status_code=400, detail="Representasi tidak valid")

    # Normalize canvas data
    norm_data, state_hash = normalize_canvas(rep, payload)

    # Latest revision
    last_snap = db.query(CanvasSnapshot).filter(
        CanvasSnapshot.submission_id == sub.id,
        CanvasSnapshot.representasi == rep
    ).order_by(CanvasSnapshot.rev.desc()).first()

    next_rev = (last_snap.rev + 1) if last_snap else 1

    snap = CanvasSnapshot(
        submission_id=sub.id,
        representasi=rep,
        state_json=norm_data,
        state_hash=state_hash,
        rev=next_rev
    )
    db.add(snap)

    # Log event for replay (TDD 12)
    last_event = db.query(Event).filter(Event.submission_id == sub.id).order_by(Event.seq.desc()).first()
    seq = (last_event.seq + 1) if last_event else 1
    now = datetime.now(timezone.utc)
    start_t = sub.started_at
    if start_t.tzinfo is None:
        start_t = start_t.replace(tzinfo=timezone.utc)
    t_ms = int((now - start_t).total_seconds() * 1000)

    event = Event(
        submission_id=sub.id,
        seq=seq,
        type="canvas_op",
        payload_json={"representasi": rep, "rev": next_rev, "state_hash": state_hash},
        t_ms=t_ms
    )
    db.add(event)
    db.commit()

    return CanvasUpdateResponse(rev=next_rev, state_hash=state_hash)


@router.post("/{id}/check", response_model=CheckResponse)
def check_submission_consistency(
    id: str,
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    start_ms = time.time()
    sub = db.query(Submission).filter(Submission.id == id, Submission.participant_id == participant.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    session_obj = db.query(ClassSession).filter(ClassSession.id == participant.session_id).first()

    # Load question, keys, parameters
    question = db.query(Question).filter(Question.id == sub.question_id).first()
    keys_rows = db.query(QuestionKey).filter(QuestionKey.question_id == question.id).all()
    keys = {k.representasi: k.kunci_json for k in keys_rows}
    params = question.parameter_json

    # Load latest snapshots for 4 canvases
    canvases = {}
    for rep in ["verbal", "matematis", "grafis", "visual"]:
        snap = db.query(CanvasSnapshot).filter(
            CanvasSnapshot.submission_id == sub.id,
            CanvasSnapshot.representasi == rep
        ).order_by(CanvasSnapshot.rev.desc()).first()
        canvases[rep] = snap.state_json if snap else {}

    combined_hash = compute_hash(canvases)

    # Run deterministic rules & attribution
    rule_findings = check_contradictions(canvases, keys, params)

    now = datetime.now(timezone.utc)
    skor_ditahan = set()
    result_items = []

    # Map current active contradictions
    existing_contras = db.query(Contradiction).filter(
        Contradiction.submission_id == sub.id,
        Contradiction.status == "aktif"
    ).all()

    existing_by_code = {c.kode_error: c for c in existing_contras}
    current_finding_codes = set()

    for f in rule_findings:
        kode = f["kode_error"]
        current_finding_codes.add(kode)
        contra = existing_by_code.get(kode)

        if not contra:
            contra = Contradiction(
                submission_id=sub.id,
                pasangan=f["pasangan"],
                kode_error=kode,
                sumber_json=f["sumber"],
                tujuan_json=f["tujuan"],
                representasi_menyimpang=f["representasi_menyimpang"],
                status="aktif",
                percobaan_terpakai=0,
                hint_level=0,
                terkunci=False,
                detected_at=now,
                last_change_at=now
            )
            db.add(contra)
            db.commit()
            db.refresh(contra)
        else:
            contra.last_change_at = now
            contra.representasi_menyimpang = f["representasi_menyimpang"]
            db.commit()

        for r in f["representasi_menyimpang"]:
            skor_ditahan.add(r)
        skor_ditahan.add(f["sumber"]["representasi"])
        skor_ditahan.add(f["tujuan"]["representasi"])

        result_items.append(ContradictionItem(
            id=contra.id,
            pasangan=contra.pasangan,
            kode_error=contra.kode_error,
            status=contra.status,
            representasi_menyimpang=contra.representasi_menyimpang,
            sumber=contra.sumber_json,
            tujuan=contra.tujuan_json,
            percobaan_terpakai=contra.percobaan_terpakai,
            percobaan_maks=settings.MAX_ATTEMPTS,
            hint_level=contra.hint_level,
            coba_perbaiki_terkunci=contra.terkunci
        ))

    # Mark resolved contradictions
    for code, c in existing_by_code.items():
        if code not in current_finding_codes:
            c.status = "selesai"
            c.resolved_at = now
            db.commit()

    latency_ms = int((time.time() - start_ms) * 1000)

    # Save check audit
    check_rec = Check(
        submission_id=sub.id,
        state_hash=combined_hash,
        mode="aturan+llm" if settings.LLM_ENABLED else "aturan",
        hasil_json={"findings": rule_findings},
        latency_ms=latency_ms
    )
    db.add(check_rec)
    db.commit()

    return CheckResponse(
        mode="aturan+llm" if settings.LLM_ENABLED else "aturan",
        state_hash=combined_hash,
        kontradiksi=result_items,
        skor_ditahan=sorted(list(skor_ditahan)),
        pemeriksaan_makna_tertunda=not settings.LLM_ENABLED
    )


@router.post("/{id}/submit")
def submit_answer(
    id: str,
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == id, Submission.participant_id == participant.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    # Idempotent (TDD 20.4)
    if sub.status == "dikirim":
        return {"status": "dikirim"}

    now = datetime.now(timezone.utc)
    question = db.query(Question).filter(Question.id == sub.question_id).first()
    keys_rows = db.query(QuestionKey).filter(QuestionKey.question_id == question.id).all()
    keys = {k.representasi: k.kunci_json for k in keys_rows}

    # Canvases
    canvases = {}
    for rep in ["verbal", "matematis", "grafis", "visual"]:
        snap = db.query(CanvasSnapshot).filter(
            CanvasSnapshot.submission_id == sub.id,
            CanvasSnapshot.representasi == rep
        ).order_by(CanvasSnapshot.rev.desc()).first()
        canvases[rep] = snap.state_json if snap else {}

    # Check active contradictions
    active_contras = db.query(Contradiction).filter(
        Contradiction.submission_id == sub.id,
        Contradiction.status == "aktif"
    ).all()

    # Calculate rubric scores
    rubric_scores = calculate_rubric_scores(canvases, keys, question.parameter_json)

    # Update or insert scores
    has_unresolved = len(active_contras) > 0
    sub.status = "belum_terselesaikan" if has_unresolved else "dikirim"
    sub.submitted_at = now
    participant.status = "dikirim"

    for rep in ["verbal", "matematis", "visual", "grafis"]:
        score_rec = db.query(Score).filter(
            Score.submission_id == sub.id,
            Score.representasi == rep
        ).first()

        skor_r = rubric_scores.get(rep, 0)
        penalti = score_rec.penalti_total if score_rec else 0
        final_auto = compute_final_score(skor_r, penalti)

        rep_status = determine_display_status(rep, [
            {"representasi_menyimpang": c.representasi_menyimpang, "sumber": c.sumber_json, "tujuan": c.tujuan_json}
            for c in active_contras
        ], session_ended=True)

        if not score_rec:
            score_rec = Score(
                submission_id=sub.id,
                representasi=rep,
                skor_rubrik=skor_r,
                penalti_total=penalti,
                skor_otomatis=final_auto,
                status=rep_status
            )
            db.add(score_rec)
        else:
            score_rec.skor_rubrik = skor_r
            score_rec.skor_otomatis = final_auto
            score_rec.status = rep_status

    db.commit()
    return {"status": sub.status}


@router.get("/{id}/result", response_model=StudentResultResponse)
def get_submission_result(
    id: str,
    participant: Participant = Depends(get_current_participant),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == id, Submission.participant_id == participant.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    session_obj = db.query(ClassSession).filter(ClassSession.id == participant.session_id).first()
    # Check if results are released (FR-H4)
    if not session_obj.hasil_dirilis and session_obj.status != "ditutup":
        raise HTTPException(status_code=403, detail="Hasil asesmen belum dirilis oleh dosen.")

    scores = db.query(Score).filter(Score.submission_id == sub.id).all()
    score_items = []
    kekuatan = []
    perbaiki = []

    for s in scores:
        display_score = s.skor_dosen if s.skor_dosen is not None else s.skor_otomatis
        score_items.append(ScoreItem(
            representasi=s.representasi,
            skor_rubrik=s.skor_rubrik,
            penalti=s.penalti_total,
            skor=display_score,
            skor_dosen=s.skor_dosen,
            status=s.status,
            alasan_override=s.alasan_override
        ))
        if display_score is not None and display_score >= 80:
            kekuatan.append(s.representasi.capitalize())
        else:
            perbaiki.append(f"{s.representasi.capitalize()}: periksa kesesuaian dan kelengkapan konsep")

    if not kekuatan:
        kekuatan = ["Semangat belajar! Lakukan evaluasi mandiri."]

    return StudentResultResponse(
        skor=score_items,
        umpan_balik={"kekuatan": kekuatan, "perbaiki": perbaiki}
    )


@router.get("/{id}/events")
def get_submission_events(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Log kejadian proses pengerjaan mahasiswa untuk tinjauan dosen (FR-I4 / W-22).
    Mengagregasikan event kanvas, kontradiksi, hint, dan pengiriman.
    """
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    timeline = []

    # 1. Start event
    start_t = sub.started_at
    timeline.append({
        "id": "ev-start",
        "waktu": start_t.strftime("%H:%M:%S") if start_t else "00:00:00",
        "timestamp": start_t.isoformat() if start_t else "",
        "jenis": "info",
        "judul": "Mulai pengerjaan kanvas",
        "deskripsi": "Mahasiswa menyetujui persetujuan dan mulai mengerjakan empat kanvas."
    })

    # 2. Contradictions & Hints
    contras = db.query(Contradiction).filter(Contradiction.submission_id == sub.id).all()
    for c in contras:
        det_t = c.detected_at
        timeline.append({
            "id": f"ev-contra-{c.id}",
            "waktu": det_t.strftime("%H:%M:%S") if det_t else "00:00:00",
            "timestamp": det_t.isoformat() if det_t else "",
            "jenis": "kontradiksi",
            "judul": f"Kontradiksi {c.kode_error} ({c.pasangan}) terdeteksi",
            "deskripsi": f"Ketidaksesuaian antara {c.sumber_json.get('representasi', '')} dan {c.tujuan_json.get('representasi', '')}."
        })

        if c.percobaan_terpakai > 0:
            timeline.append({
                "id": f"ev-att-{c.id}",
                "waktu": det_t.strftime("%H:%M:%S") if det_t else "00:00:00",
                "timestamp": det_t.isoformat() if det_t else "",
                "jenis": "attempt",
                "judul": f"Percobaan perbaikan ({c.percobaan_terpakai}x)",
                "deskripsi": "Mahasiswa memilih opsi Coba Perbaiki mandiri."
            })

        for h in c.hints:
            h_t = h.opened_at
            timeline.append({
                "id": f"ev-hint-{h.id}",
                "waktu": h_t.strftime("%H:%M:%S") if h_t else "00:00:00",
                "timestamp": h_t.isoformat() if h_t else "",
                "jenis": "hint",
                "judul": f"Hint level {h.level} dibuka",
                "deskripsi": f"Penalti -{h.penalti} diberikan pada representasi {', '.join(h.representasi_dibantu)}."
            })

        if c.status == "selesai" and c.resolved_at:
            res_t = c.resolved_at
            timeline.append({
                "id": f"ev-res-{c.id}",
                "waktu": res_t.strftime("%H:%M:%S") if res_t else "00:00:00",
                "timestamp": res_t.isoformat() if res_t else "",
                "jenis": "selesai",
                "judul": f"Kontradiksi {c.kode_error} terselesaikan",
                "deskripsi": "Pemeriksaan ulang konsistensi menghasilkan kesesuaian antarrepresentasi."
            })

    # 3. Canvas snapshot operations count
    snaps = db.query(CanvasSnapshot).filter(CanvasSnapshot.submission_id == sub.id).all()
    if snaps:
        by_rep = {}
        for s in snaps:
            by_rep[s.representasi] = by_rep.get(s.representasi, 0) + 1
        summary_ops = ", ".join([f"{rep}: {cnt} revisi" for rep, cnt in by_rep.items()])
        last_snap = max(snaps, key=lambda s: s.created_at)
        timeline.append({
            "id": "ev-snaps",
            "waktu": last_snap.created_at.strftime("%H:%M:%S"),
            "timestamp": last_snap.created_at.isoformat(),
            "jenis": "canvas",
            "judul": "Aktivitas penyimpanan kanvas",
            "deskripsi": f"Total pembaruan: {summary_ops}."
        })

    # 4. Submit event
    if sub.submitted_at:
        sub_t = sub.submitted_at
        timeline.append({
            "id": "ev-submit",
            "waktu": sub_t.strftime("%H:%M:%S"),
            "timestamp": sub_t.isoformat(),
            "jenis": "submit",
            "judul": f"Jawaban diserahkan ({sub.status})",
            "deskripsi": "Pengiriman final jawaban untuk penilaian dosen."
        })

    # Sort timeline by timestamp
    timeline.sort(key=lambda x: x.get("timestamp", ""))

    return {
        "submission_id": sub.id,
        "total_event": len(timeline),
        "events": timeline
    }


@router.get("/{id}/canvases")
def get_submission_canvases(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Mengambil data terkini keempat kanvas mahasiswa (Verbal, Visual, Matematis, Grafis)
    agar dosen dapat memeriksa jawaban kanvas secara visual (W-21 / W-22).
    """
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    canvases = {"verbal": None, "visual": None, "matematis": None, "grafis": None}
    for rep in ["verbal", "visual", "matematis", "grafis"]:
        snap = db.query(CanvasSnapshot).filter(
            CanvasSnapshot.submission_id == sub.id,
            CanvasSnapshot.representasi == rep
        ).order_by(CanvasSnapshot.rev.desc()).first()
        if snap:
            canvases[rep] = snap.state_json

    return {
        "submission_id": sub.id,
        "status": sub.status,
        "canvases": canvases
    }


@router.get("/{id}/replay")
def get_submission_replay(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Menyusun frame reka ulang (replay) proses pengerjaan mahasiswa langkah demi langkah (W-23 / TDD 12).
    Dosen dapat memutar ulang (play/pause), menggeser timeline, dan melihat evolusi 4 kanvas.
    """
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submisi tidak ditemukan")

    # Ambil semua snapshot kanvas berurutan
    all_snaps = db.query(CanvasSnapshot).filter(
        CanvasSnapshot.submission_id == sub.id
    ).order_by(CanvasSnapshot.created_at.asc()).all()

    # Ambil semua kontradiksi & hint
    contras = db.query(Contradiction).filter(
        Contradiction.submission_id == sub.id
    ).all()

    frames = []

    # Frame 0: Keadaan awal
    current_canvases = {
        "verbal": {"representasi": "verbal", "teks": ""},
        "visual": {"representasi": "visual", "objek": [{"id": "o1", "tipe": "balok"}, {"id": "o2", "tipe": "bidang_datar", "kasar": True}], "gaya": [], "sumbu": {"x": "kanan"}},
        "matematis": {"representasi": "matematis", "baris": []},
        "grafis": {"representasi": "grafis", "jenis": "v-t", "sumbu_x": {"nama": "t", "satuan": "s"}, "sumbu_y": {"nama": "v", "satuan": "m/s"}, "titik": [], "kemiringan": 0}
    }

    start_t = sub.started_at
    frames.append({
        "step": 0,
        "waktu": start_t.strftime("%H:%M:%S") if start_t else "00:00:00",
        "label": "Mulai Asesmen",
        "deskripsi": "Kanvas awal dibuka oleh mahasiswa.",
        "canvases": {k: dict(v) for k, v in current_canvases.items()},
        "kontradiksi_aktif": None
    })

    step_idx = 1
    for snap in all_snaps:
        rep = snap.representasi
        current_canvases[rep] = snap.state_json
        t_str = snap.created_at.strftime("%H:%M:%S")

        # Cek apakah ada kontradiksi aktif pada saat snapshot ini
        active_c = next((c for c in contras if c.detected_at <= snap.created_at and (not c.resolved_at or c.resolved_at > snap.created_at)), None)

        desc = f"Pembaruan pada kanvas {rep.capitalize()} (revisi {snap.rev})"
        if rep == "visual":
            force_labels = [g.get("label") for g in snap.state_json.get("gaya", [])]
            desc = f"Visual: Gaya digambar: {', '.join(force_labels) if force_labels else 'belum ada gaya'}"
        elif rep == "matematis":
            line_count = len(snap.state_json.get("baris", []))
            desc = f"Matematis: {line_count} baris persamaan tersimpan"
        elif rep == "grafis":
            slope = snap.state_json.get("kemiringan")
            desc = f"Grafis: kemiringan kurva = {slope} m/s²"

        frames.append({
            "step": step_idx,
            "waktu": t_str,
            "label": f"Ubah {rep.capitalize()}",
            "deskripsi": desc,
            "canvases": {k: dict(v) if isinstance(v, dict) else v for k, v in current_canvases.items()},
            "kontradiksi_aktif": active_c.kode_error if active_c else None
        })
        step_idx += 1

    return {
        "submission_id": sub.id,
        "total_frames": len(frames),
        "frames": frames
    }
