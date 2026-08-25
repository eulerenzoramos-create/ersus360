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

    # e-SUS PEC — Integração LEDI/MIVDT (Mapa de Visitas Domiciliares ACS)
    # Ver docs/DOC-PEC-INTEGRACAO.md para diagnóstico completo e passo a passo de ativação.
    PEC_BASE_URL: str = ""
    PEC_API_URL: str = ""
    PEC_CLIENT_ID: str = ""
    PEC_CLIENT_SECRET: str = ""
    PEC_CERTIFICATE_PATH: str = ""
    PEC_CERTIFICATE_PASSWORD: str = ""
    PEC_ESTABLISHMENT_CNES: str = ""
    PEC_REQUEST_TIMEOUT: int = 30
    PEC_ENVIRONMENT: str = "homologacao"   # homologacao | producao
    LEDI_VERSION: str = ""
    MIVDT_VERSION: str = ""
    ESUS_INTEGRATION_ENABLED: bool = False

    @property
    def pec_configurado(self) -> bool:
        """True somente se URL + credenciais estiverem presentes. Não indica conectividade real."""
        return bool(self.PEC_BASE_URL and self.PEC_CLIENT_ID and self.PEC_CLIENT_SECRET)

    # RNDS — Rede Nacional de Dados em Saúde (mTLS + FHIR R4)
    RNDS_AUTH_URL: str = "https://ehr-auth-hmg.saude.gov.br"
    RNDS_SERVICES_URL: str = ""          # vazio = auto por UF (ex: am-ehr-services.saude.gov.br)
    RNDS_CERT_PATH: str = ""             # Caminho do certificado ICP-Brasil PKCS12 (.pfx)
    RNDS_CERT_KEY_PATH: str = ""         # Chave privada do certificado
    RNDS_CNES: str = ""                  # CNES do estabelecimento de saúde
    RNDS_UF: str = "am"                  # UF para selecionar endpoint de produção correto
    RNDS_AMBIENTE: str = "homologacao"   # homologacao | producao
    RNDS_CNS_PROFISSIONAL: str = ""      # CNS do profissional autorizado para requisições FHIR

    # LEDI — e-SUS APS API LEDI v8.5.0 (fichas clínicas)
    LEDI_PEC_URL: str = ""               # URL base do PEC com HTTPS (ex: https://pec.municipio.gov.br)
    LEDI_USUARIO: str = ""               # Usuário gerado no PEC (Gestão → Integrações → Credenciais para API)
    LEDI_SENHA: str = ""                 # Senha LEDI (exibida uma vez — armazenar imediatamente)
    LEDI_AMBIENTE: str = "producao"      # homologacao | producao

    # SIAPS / gov.br — credenciais para busca de dados reais
    SIAPS_CPF: str = ""        # CPF sem pontos/traços (ex: 12345678901)
    SIAPS_SENHA: str = ""      # Senha gov.br
    SIAPS_TOKEN: str = ""      # Bearer JWT extraído da sessão autenticada do SIAPS

    # App
    APP_NAME: str = "ERSUS 360"
    MUNICIPIO_NOME: str = "Apuí"
    MUNICIPIO_UF: str = "AM"
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://ersus360.vercel.app,https://investsus.saude.gov.br"

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
