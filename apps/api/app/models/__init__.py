import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, 
    BigInteger, LargeBinary, UniqueConstraint, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from app.db import Base, database_url

is_sqlite = database_url.startswith("sqlite")
identity_schema = None if is_sqlite else "identity"


def generate_uuid() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, default="dosen")
    nama_tampil = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    classes = relationship("Class", back_populates="owner")


class Class(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    nama = Column(String(255), nullable=False)
    mata_kuliah = Column(String(255), nullable=True)
    semester = Column(String(50), nullable=True)
    arsip = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    owner = relationship("User", back_populates="classes")
    sessions = relationship("Session", back_populates="kelas")


class Package(Base):
    __tablename__ = "packages"
    __table_args__ = (
        UniqueConstraint("kode", "versi", name="uq_packages_kode_versi"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    kode = Column(String(50), nullable=False)
    judul = Column(String(255), nullable=False)
    topik = Column(String(255), nullable=False)
    versi = Column(String(20), nullable=False)
    status = Column(String(20), default="aktif", nullable=False)

    questions = relationship("Question", back_populates="package")
    sessions = relationship("Session", back_populates="package")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    package_id = Column(String(36), ForeignKey("packages.id"), nullable=False)
    urutan = Column(Integer, nullable=False, default=1)
    teks_soal = Column(Text, nullable=False)
    parameter_json = Column(JSON, nullable=False)

    package = relationship("Package", back_populates="questions")
    keys = relationship("QuestionKey", back_populates="question")


class QuestionKey(Base):
    __tablename__ = "question_keys"
    __table_args__ = (
        UniqueConstraint("question_id", "representasi", name="uq_question_key_rep"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    representasi = Column(String(20), nullable=False)  # verbal, matematis, grafis, visual
    kunci_json = Column(JSON, nullable=False)
    rubrik_json = Column(JSON, nullable=False)

    question = relationship("Question", back_populates="keys")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    package_id = Column(String(36), ForeignKey("packages.id"), nullable=False)
    package_version = Column(String(20), nullable=False, default="1.0")
    judul = Column(String(255), nullable=False)
    kode = Column(String(6), unique=True, nullable=False, index=True)
    status = Column(String(20), default="draf", nullable=False)  # draf, dibuka, ditutup
    durasi_menit = Column(Integer, default=45, nullable=False)
    rilis_hasil = Column(String(20), default="otomatis", nullable=False)  # otomatis, manual
    hasil_dirilis = Column(Boolean, default=False, nullable=False)
    parameter_snapshot_json = Column(JSON, nullable=False, default=dict)
    dibuka_at = Column(DateTime(timezone=True), nullable=True)
    ditutup_at = Column(DateTime(timezone=True), nullable=True)

    kelas = relationship("Class", back_populates="sessions")
    package = relationship("Package", back_populates="sessions")
    participants = relationship("Participant", back_populates="session")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    token_hash = Column(String(64), nullable=False, index=True)
    status = Column(String(20), default="belum_mulai", nullable=False)  # belum_mulai, mengerjakan, dikirim
    consent_at = Column(DateTime(timezone=True), nullable=True)
    consent_version = Column(String(20), nullable=True)
    mulai_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    session = relationship("Session", back_populates="participants")
    submission = relationship("Submission", back_populates="participant", uselist=False)


class Identity(Base):
    __tablename__ = "identities"
    __table_args__ = (
        UniqueConstraint("session_id", "nim_hash", name="uq_identity_session_nim"),
        {"schema": identity_schema} if identity_schema else {}
    )

    participant_id = Column(String(36), primary_key=True)
    session_id = Column(String(36), nullable=False, index=True)
    nama_enc = Column(LargeBinary, nullable=False)
    nim_enc = Column(LargeBinary, nullable=False)
    nim_hash = Column(String(64), nullable=False, index=True)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    participant_id = Column(String(36), ForeignKey("participants.id"), unique=True, nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    status = Column(String(20), default="draf", nullable=False)  # draf, dikirim, belum_terselesaikan
    started_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    participant = relationship("Participant", back_populates="submission")
    snapshots = relationship("CanvasSnapshot", back_populates="submission")
    checks = relationship("Check", back_populates="submission")
    contradictions = relationship("Contradiction", back_populates="submission")
    scores = relationship("Score", back_populates="submission")
    events = relationship("Event", back_populates="submission")


class CanvasSnapshot(Base):
    __tablename__ = "canvas_snapshots"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    representasi = Column(String(20), nullable=False)
    state_json = Column(JSON, nullable=False)
    state_hash = Column(String(64), nullable=False)
    rev = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    submission = relationship("Submission", back_populates="snapshots")


class Check(Base):
    __tablename__ = "checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    state_hash = Column(String(64), nullable=False)
    mode = Column(String(20), nullable=False)  # aturan, aturan+llm
    hasil_json = Column(JSON, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    model = Column(String(100), nullable=True)
    prompt_version = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    submission = relationship("Submission", back_populates="checks")


class Contradiction(Base):
    __tablename__ = "contradictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    pasangan = Column(String(10), nullable=False)  # P1, P2, P3, P4, P5, P6
    kode_error = Column(String(20), nullable=False)  # E-P4-01, E-P2-01, etc.
    sumber_json = Column(JSON, nullable=False)
    tujuan_json = Column(JSON, nullable=False)
    representasi_menyimpang = Column(JSON, nullable=False)  # list of strings e.g. ["visual"]
    status = Column(String(25), default="aktif", nullable=False)  # aktif, selesai, belum_terselesaikan
    percobaan_terpakai = Column(Integer, default=0, nullable=False)
    hint_level = Column(Integer, default=0, nullable=False)
    terkunci = Column(Boolean, default=False, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)
    last_change_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    submission = relationship("Submission", back_populates="contradictions")
    hints = relationship("HintEvent", back_populates="contradiction")


class HintEvent(Base):
    __tablename__ = "hint_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    contradiction_id = Column(String(36), ForeignKey("contradictions.id"), nullable=False)
    level = Column(Integer, nullable=False)  # 1, 2, 3
    penalti = Column(Integer, nullable=False)
    representasi_dibantu = Column(JSON, nullable=False)  # list of strings
    opened_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    contradiction = relationship("Contradiction", back_populates="hints")


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (
        UniqueConstraint("submission_id", "representasi", name="uq_score_sub_rep"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    representasi = Column(String(20), nullable=False)  # verbal, matematis, grafis, visual
    skor_rubrik = Column(Integer, nullable=True)
    penalti_total = Column(Integer, default=0, nullable=False)
    skor_otomatis = Column(Integer, nullable=True)
    skor_dosen = Column(Integer, nullable=True)
    status = Column(String(25), default="berjalan", nullable=False)  # berjalan, selesai, belum_terselesaikan
    alasan_override = Column(Text, nullable=True)
    updated_by = Column(String(36), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    submission = relationship("Submission", back_populates="scores")
    audits = relationship("ScoreAudit", back_populates="score")


class ScoreAudit(Base):
    __tablename__ = "score_audit"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    score_id = Column(String(36), ForeignKey("scores.id"), nullable=False)
    nilai_lama = Column(Integer, nullable=True)
    nilai_baru = Column(Integer, nullable=False)
    alasan = Column(Text, nullable=False)
    editor_id = Column(String(36), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc, nullable=False)

    score = relationship("Score", back_populates="audits")


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        UniqueConstraint("submission_id", "seq", name="uq_events_sub_seq"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    seq = Column(Integer, nullable=False)
    type = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=False)
    t_ms = Column(Integer, nullable=False)

    submission = relationship("Submission", back_populates="events")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    participant_id = Column(String(36), ForeignKey("participants.id"), nullable=False)
    indikator = Column(String(100), nullable=False)
    butir = Column(String(100), nullable=False)
    skor_likert = Column(Integer, nullable=False)


class QualitativeNote(Base):
    __tablename__ = "qualitative_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    participant_id = Column(String(36), ForeignKey("participants.id"), nullable=False)
    kategori = Column(String(50), nullable=False)  # substansi materi, tampilan, operasional teknis
    isi = Column(Text, nullable=False)


class Config(Base):
    __tablename__ = "config"

    key = Column(String(100), primary_key=True)
    scope = Column(String(50), primary_key=True, default="global")
    value_json = Column(JSON, nullable=False)
