from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./fisgrade.db"
    SECRET_KEY: str = "fisgrade-super-secret-key-32-chars-long-2026"
    ENCRYPTION_KEY: str = "dGhpc2lzYWZha2VmZXJuZXRrZXlmb3JkZXZlbG9wbWVudDE="
    NIM_HASH_PEPPER: str = "fisgrade-nim-pepper-key-2026"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    # LLM Settings
    LLM_ENABLED: bool = True
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_TIMEOUT_MS: int = 15000
    LLM_MIN_CONFIDENCE: float = 0.6
    LLM_CALLS_PER_PARTICIPANT_PER_MIN: int = 6

    # Examination & Hint Settings
    CHECK_IDLE_MS: int = 7000
    CHECK_MIN_INTERVAL_MS: int = 3000
    MAX_ATTEMPTS: int = 3
    STAGNATION_SEC: int = 60
    HINT_PENALTIES: str = "5,10,10"
    HINT3_DELAY_SEC: int = 15
    DATA_RETENTION_DAYS: int = 365

    # Physics Engine Tolerances (TDD 20.5)
    TOL_SUDUT: float = 10.0  # derajat
    TOL_PANJANG_REL: float = 0.20
    TOL_NILAI_REL: float = 0.01
    TOL_KEMIRINGAN: float = 0.05
    MIN_KATA_VERBAL: int = 20

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def hint_penalties_list(self) -> List[int]:
        return [int(p.strip()) for p in self.HINT_PENALTIES.split(",") if p.strip()]

    @property
    def active_api_key(self) -> str:
        if self.GROQ_API_KEY:
            return self.GROQ_API_KEY
        return self.OPENROUTER_API_KEY

    @property
    def active_base_url(self) -> str:
        if self.GROQ_API_KEY:
            return self.GROQ_BASE_URL
        return self.OPENROUTER_BASE_URL

    @property
    def active_model(self) -> str:
        if self.GROQ_API_KEY:
            return self.GROQ_MODEL
        return self.OPENROUTER_MODEL

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
