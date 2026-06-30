from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Banco
    DATABASE_URL: str = "postgresql://postgres:senha@localhost:5432/ersus360"

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # FNS
    FNS_BASE_URL: str = "https://consultafns.saude.gov.br"
    FNS_MUNICIPIO_IBGE: str = "1300144"
    FNS_SYNC_HORA: str = "06:00"
    FNS_TIMEOUT_SECONDS: int = 30

    # FNS API (apifns.saude.gov.br)
    FNS_API_BASE: str = "https://apifns.saude.gov.br"
    FNS_API_CPF: str = ""       # CPF do gestor (sem pontos/traços)
    FNS_API_SENHA: str = ""     # Senha do gestor FNS

    # e-SUS PEC
    ESUS_URL: str = "https://esus.apui.am.gov.br"
    ESUS_USUARIO: str = ""      # Login do e-SUS PEC
    ESUS_SENHA: str = ""        # Senha do e-SUS PEC

    # CNES (DATASUS — sem credencial)
    CNES_API: str = "https://cnes.datasus.gov.br/services"

    # App
    APP_NAME: str = "ERSUS 360"
    MUNICIPIO_NOME: str = "Apuí"
    MUNICIPIO_UF: str = "AM"
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
