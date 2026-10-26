from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Class, User, Session as ClassSession
from app.schemas import CreateClassRequest, ClassResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("", response_model=List[ClassResponse])
def list_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    classes = db.query(Class).filter(
        Class.owner_id == current_user.id,
        Class.arsip == False
    ).order_by(Class.created_at.desc()).all()
    return [
        ClassResponse(
            id=c.id,
            nama=c.nama,
            mata_kuliah=c.mata_kuliah,
            semester=c.semester,
            arsip=c.arsip
        ) for c in classes
    ]


@router.post("", response_model=ClassResponse)
def create_class(
    req: CreateClassRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    kelas = Class(
        owner_id=current_user.id,
        nama=req.nama.strip(),
        mata_kuliah=req.mata_kuliah.strip() if req.mata_kuliah else None,
        semester=req.semester.strip() if req.semester else None
    )
    db.add(kelas)
    db.commit()
    db.refresh(kelas)
    return ClassResponse(
        id=kelas.id,
        nama=kelas.nama,
        mata_kuliah=kelas.mata_kuliah,
        semester=kelas.semester,
        arsip=kelas.arsip
    )


@router.get("/{id}")
def get_class_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    kelas = db.query(Class).filter(Class.id == id, Class.owner_id == current_user.id).first()
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")

    sessions = db.query(ClassSession).filter(ClassSession.class_id == kelas.id).all()
    return {
        "id": kelas.id,
        "nama": kelas.nama,
        "mata_kuliah": kelas.mata_kuliah,
        "semester": kelas.semester,
        "arsip": kelas.arsip,
        "sessions": [
            {
                "id": s.id,
                "judul": s.judul,
                "kode": s.kode,
                "status": s.status,
                "durasi_menit": s.durasi_menit,
                "rilis_hasil": s.rilis_hasil,
                "dibuka_at": s.dibuka_at.isoformat() if s.dibuka_at else None,
                "ditutup_at": s.ditutup_at.isoformat() if s.ditutup_at else None,
                "peserta_count": len(s.participants)
            } for s in sessions
        ]
    }
