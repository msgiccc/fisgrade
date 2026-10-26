from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import jwt
from app.db import get_db
from app.models import Package, Question, QuestionKey
from app.config import settings

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("")
def list_packages(db: Session = Depends(get_db)):
    packages = db.query(Package).filter(Package.status == "aktif").all()
    results = []
    for p in packages:
        q_count = db.query(Question).filter(Question.package_id == p.id).count()
        results.append({
            "id": p.id,
            "kode": p.kode,
            "judul": p.judul,
            "topik": p.topik,
            "versi": p.versi,
            "status": p.status,
            "jumlah_soal": q_count
        })
    return results


@router.get("/{id}")
def get_package_detail(
    id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    pkg = db.query(Package).filter(Package.id == id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket soal tidak ditemukan")

    is_dosen = False
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            is_dosen = True
        except Exception:
            pass

    questions = db.query(Question).filter(Question.package_id == pkg.id).order_by(Question.urutan).all()
    q_list = []
    for q in questions:
        item = {
            "id": q.id,
            "urutan": q.urutan,
            "teks_soal": q.teks_soal,
            "parameter": q.parameter_json
        }
        if is_dosen:
            keys = db.query(QuestionKey).filter(QuestionKey.question_id == q.id).all()
            item["kunci"] = {k.representasi: k.kunci_json for k in keys}
            item["rubrik"] = {k.representasi: k.rubrik_json for k in keys}
        q_list.append(item)

    return {
        "id": pkg.id,
        "kode": pkg.kode,
        "judul": pkg.judul,
        "topik": pkg.topik,
        "versi": pkg.versi,
        "status": pkg.status,
        "soal": q_list
    }
