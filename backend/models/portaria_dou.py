"""
Model: PortariaDOU — portarias do MS capturadas do DOU pelo agente automático.

Campos conforme especificação ERSUS360 seção 1 (o que armazenar por publicação).
Chave de deduplicação: chave_dedup (MD5 de órgão+número+data+título).
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Boolean, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class PortariaDOU(Base):
    __tablename__ = "portarias_dou"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Identificação do ato ──────────────────────────────────────────────────
    titulo: Mapped[str] = mapped_column(Text)
    numero: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    tipo_ato: Mapped[str | None] = mapped_column(String(50), nullable=True)   # Portaria, Resolução…
    data_assinatura: Mapped[str | None] = mapped_column(String(10), nullable=True)   # YYYY-MM-DD
    data_publicacao: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    edicao_dou: Mapped[str | None] = mapped_column(String(10), nullable=True)
    secao_dou: Mapped[str | None] = mapped_column(String(5), nullable=True)   # DO1, DO2, DO3
    pagina_dou: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # ── Órgão e unidade ──────────────────────────────────────────────────────
    orgao: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    unidade_responsavel: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Conteúdo ─────────────────────────────────────────────────────────────
    ementa: Mapped[str | None] = mapped_column(Text, nullable=True)
    corpo_completo: Mapped[str | None] = mapped_column(Text, nullable=True)
    resumo: Mapped[str | None] = mapped_column(Text, nullable=True)          # até 600 chars

    # ── Referência ao DOU ────────────────────────────────────────────────────
    url_oficial: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    id_dou: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)

    # ── Classificação ERSUS360 ───────────────────────────────────────────────
    relevancia: Mapped[str] = mapped_column(
        String(20), default="sem_impacto", index=True
    )  # apui | amazonas | federal | sem_impacto
    prioridade: Mapped[str] = mapped_column(
        String(20), default="normativo"
    )  # urgente | prazo | financeiro | normativo | sem_impacto

    # ── Valores identificados (JSON list) ────────────────────────────────────
    valores_identificados: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON: ["R$ 50.000,00", ...]

    # ── Análise de impacto (JSON dict) ───────────────────────────────────────
    impacto_financeiro: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON list
    impacto_assistencial: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    impacto_administrativo: Mapped[str | None] = mapped_column(Text, nullable=True)# JSON list
    providencias: Mapped[str | None] = mapped_column(Text, nullable=True)          # JSON list

    # ── Deduplicação ─────────────────────────────────────────────────────────
    chave_dedup: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    # ── Controle interno ─────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20), default="processado"
    )  # processado | revisao_manual | descartado | retificado
    motivo_descarte: Mapped[str | None] = mapped_column(Text, nullable=True)
    portaria_original_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # FK lógica para retificações/republicações (sem FK hard p/ evitar circular)
    capturado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    processado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ExecucaoPortarias(Base):
    """Log de cada execução do agente de portarias (manual ou automática)."""
    __tablename__ = "execucao_portarias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_referencia: Mapped[str] = mapped_column(String(10), index=True)  # "2026-08-26"
    iniciado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Fonte e estratégia usada
    estrategia_usada: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fontes_tentadas: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON list

    # Contadores
    total_bruto: Mapped[int] = mapped_column(Integer, default=0)
    total_descartados: Mapped[int] = mapped_column(Integer, default=0)
    total_aceitos: Mapped[int] = mapped_column(Integer, default=0)
    total_apui: Mapped[int] = mapped_column(Integer, default=0)
    total_amazonas: Mapped[int] = mapped_column(Integer, default=0)
    total_federal: Mapped[int] = mapped_column(Integer, default=0)
    total_sem_impacto: Mapped[int] = mapped_column(Integer, default=0)
    total_duplicatas: Mapped[int] = mapped_column(Integer, default=0)

    # Detalhes do log
    descartados_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    falhas_json: Mapped[str | None] = mapped_column(Text, nullable=True)        # JSON list

    # E-mail
    email_enviado: Mapped[bool] = mapped_column(Boolean, default=False)
    email_erro: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Execução manual ou automática
    modo: Mapped[str] = mapped_column(String(10), default="auto")  # auto | manual
    usuario: Mapped[str | None] = mapped_column(String(100), nullable=True)
