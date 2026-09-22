"""
Armazenamento de arquivos separado por município.

    {ARMAZENAMENTO_DIR}/municipios/{municipio_uuid}/documentos/
    {ARMAZENAMENTO_DIR}/municipios/{municipio_uuid}/relatorios/
    {ARMAZENAMENTO_DIR}/municipios/{municipio_uuid}/importacoes/
    {ARMAZENAMENTO_DIR}/municipios/{municipio_uuid}/exportacoes/
    {ARMAZENAMENTO_DIR}/municipios/{municipio_uuid}/cache/
    {ARMAZENAMENTO_DIR}/global/...        (conteúdo nacional, ex.: PDFs de portarias MS)
    {ARMAZENAMENTO_DIR}/backups/...       (backups criptografados)

Nada aqui é servido diretamente: todo download passa por um router que confere
o município da sessão. Em produção ARMAZENAMENTO_DIR deve apontar para um
volume persistente (no Railway, /tmp é apagado a cada deploy).
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from tenancy.contexto import MunicipioContexto, municipio_atual

logger = logging.getLogger(__name__)

AREAS_MUNICIPIO = {"documentos", "relatorios", "importacoes", "exportacoes", "cache"}


def raiz() -> Path:
    base = os.getenv("ARMAZENAMENTO_DIR") or os.getenv("UPLOAD_DIR") or "/tmp/ersus360"
    return Path(base)


def armazenamento_persistente() -> bool:
    return not str(raiz()).replace("\\", "/").startswith("/tmp")


def chave_municipio(ctx: MunicipioContexto) -> str:
    return ctx.uuid or ctx.ibge


def pasta_municipio(area: str, subpasta: str = "", ctx: MunicipioContexto | None = None) -> Path:
    """Pasta de uma área do município (o da sessão, salvo `ctx` explícito)."""
    raiz_area = area.split("/")[0]
    if raiz_area not in AREAS_MUNICIPIO:
        raise ValueError(f"Área de arquivos inválida: {area}")
    ctx = ctx or municipio_atual()
    pasta = raiz() / "municipios" / chave_municipio(ctx) / area
    if subpasta:
        pasta = caminho_seguro(pasta, subpasta)
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


def pasta_raiz_municipio(uuid_ou_ibge: str) -> Path:
    return raiz() / "municipios" / uuid_ou_ibge


def pasta_global(area: str) -> Path:
    pasta = raiz() / "global" / area
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


def pasta_backups() -> Path:
    pasta = Path(os.getenv("BACKUP_DIR") or (raiz() / "backups"))
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


def caminho_seguro(base: Path, relativo: str) -> Path:
    """Resolve `relativo` dentro de `base`, recusando '..' e caminhos absolutos."""
    destino = (base / relativo).resolve()
    if base.resolve() not in destino.parents and destino != base.resolve():
        raise ValueError("Caminho fora da área do município")
    return destino
