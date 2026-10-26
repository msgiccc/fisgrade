import hashlib
import hmac
import base64
from typing import Tuple
from argon2 import PasswordHasher
from cryptography.fernet import Fernet
from app.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except Exception:
        return False


def get_fernet() -> Fernet:
    # Key must be 32 url-safe base64-encoded bytes
    key = settings.ENCRYPTION_KEY.encode("utf-8")
    if len(key) < 32:
        key = base64.urlsafe_b64encode(key.ljust(32, b"0"))
    elif len(key) > 44:
        key = key[:44]
    try:
        return Fernet(key)
    except Exception:
        # Fallback to padded key
        padded = base64.urlsafe_b64encode(settings.SECRET_KEY.encode("utf-8")[:32].ljust(32, b"0"))
        return Fernet(padded)


def encrypt_identity(nama: str, nim: str) -> Tuple[bytes, bytes, str]:
    fernet = get_fernet()
    nama_enc = fernet.encrypt(nama.strip().encode("utf-8"))
    nim_enc = fernet.encrypt(nim.strip().encode("utf-8"))

    # HMAC hash for searchable lookup without decrypting
    nim_hash = hmac.new(
        settings.NIM_HASH_PEPPER.encode("utf-8"),
        nim.strip().encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return nama_enc, nim_enc, nim_hash


def decrypt_identity(nama_enc: bytes, nim_enc: bytes) -> Tuple[str, str]:
    fernet = get_fernet()
    nama = fernet.decrypt(nama_enc).decode("utf-8")
    nim = fernet.decrypt(nim_enc).decode("utf-8")
    return nama, nim


def hash_participant_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
