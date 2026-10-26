from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, Package, Question, Session as ClassSession, Participant
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/status")
def admin_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya admin yang diizinkan mengakses panel ini")

    return {
        "packages": db.query(Package).count(),
        "questions": db.query(Question).count(),
        "sessions": db.query(ClassSession).count(),
        "participants": db.query(Participant).count()
    }
