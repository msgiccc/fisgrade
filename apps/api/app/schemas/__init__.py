from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# Auth Schemas
class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=10)
    nama_tampil: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    nama_tampil: str


# Class & Session Schemas
class CreateClassRequest(BaseModel):
    nama: str
    mata_kuliah: Optional[str] = None
    semester: Optional[str] = None


class ClassResponse(BaseModel):
    id: str
    nama: str
    mata_kuliah: Optional[str]
    semester: Optional[str]
    arsip: bool


class CreateSessionRequest(BaseModel):
    package_id: str
    judul: str
    durasi_menit: int = 45
    rilis_hasil: str = "otomatis"


class SessionResponse(BaseModel):
    id: str
    class_id: str
    package_id: str
    package_version: str
    judul: str
    kode: str
    status: str
    durasi_menit: int
    rilis_hasil: str
    hasil_dirilis: bool
    dibuka_at: Optional[str] = None
    ditutup_at: Optional[str] = None


# Student Join & Canvas Schemas
class JoinRequest(BaseModel):
    kode: str
    nama: str
    nim: str
    persetujuan: bool
    versi_persetujuan: str = "1.0"


class JoinResponse(BaseModel):
    token: str
    participant_id: str
    submission_id: str
    sesi: Dict[str, Any]


class QuestionResponse(BaseModel):
    submission_id: str
    nomor: int = 1
    total: int = 1
    teks: str
    parameter: Dict[str, Any]
    sisa_detik: int
    kanvas: Dict[str, Any]


class CanvasUpdateRequest(BaseModel):
    representasi: str
    data: Dict[str, Any]
    rev: int = 1


class CanvasUpdateResponse(BaseModel):
    rev: int
    state_hash: str


# Contradiction, Check & Hint Schemas
class ContradictionItem(BaseModel):
    id: str
    pasangan: str
    kode_error: str
    status: str
    representasi_menyimpang: List[str]
    sumber: Dict[str, Any]
    tujuan: Dict[str, Any]
    percobaan_terpakai: int
    percobaan_maks: int = 3
    hint_level: int
    coba_perbaiki_terkunci: bool


class CheckResponse(BaseModel):
    mode: str
    state_hash: str
    kontradiksi: List[ContradictionItem]
    skor_ditahan: List[str]
    pemeriksaan_makna_tertunda: bool


class AttemptResponse(BaseModel):
    percobaan_terpakai: int
    terkunci: bool


class HintResponse(BaseModel):
    level: int
    teks: str
    bagian_benar: List[str]
    penalti: int
    representasi_dibantu: List[str]


# Scoring & Override Schemas
class ScoreItem(BaseModel):
    representasi: str
    skor_rubrik: Optional[int]
    penalti: int
    skor: Optional[int]
    skor_dosen: Optional[int] = None
    status: str
    alasan_override: Optional[str] = None


class StudentResultResponse(BaseModel):
    skor: List[ScoreItem]
    umpan_balik: Dict[str, List[str]]


class ScoreOverrideRequest(BaseModel):
    skor_dosen: int = Field(ge=0, le=100)
    alasan: str = Field(min_length=3)


# Survey & Notes Schemas
class SurveySubmitRequest(BaseModel):
    indikator: str
    butir: str
    skor_likert: int = Field(ge=1, le=5)


class QualitativeNoteRequest(BaseModel):
    kategori: str
    isi: str
