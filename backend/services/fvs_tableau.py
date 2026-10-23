"""
Leitura das pastas de trabalho públicas da FVS-RCP/AM no Tableau Public.

Mecanismos usados (os mesmos que o site do Tableau Public oferece a qualquer visitante, sem login):
  GET https://public.tableau.com/profile/api/workbook/{pasta}
      → metadados: autor, perfil, lastUpdateDate (quando a FVS republicou a pasta)
  GET https://public.tableau.com/workbooks/{pasta}.twb
      → download da pasta de trabalho (.twbx), que só funciona quando o autor deixa o download
        liberado. Dentro dela vêm as extrações de dados (.hyper), lidas com a Tableau Hyper API.

Proteção de dados (LGPD): antes de ler qualquer número, todas as tabelas de todas as extrações são
inspecionadas. Se alguma tiver coluna identificadora (nome, nome da mãe, CNS, CPF, data de
nascimento, número da notificação/DO…), a pasta inteira é recusada e os arquivos são apagados — o
coletor nunca grava nem devolve linha individual, só agregados por município e período.
Os arquivos ficam numa pasta temporária apagada ao final de cada leitura.
"""
from __future__ import annotations

import html
import logging
import os
import re
import shutil
import tempfile
import zipfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

import httpx

logger = logging.getLogger(__name__)

BASE = "https://public.tableau.com"
TIMEOUT = httpx.Timeout(30.0, read=300.0)
TAMANHO_MAXIMO = 400 * 1024 * 1024          # o .twbx da malária tem ~67 MB
USER_AGENT = "ERSUS360-VigilanciaFVS/1.0 (+https://ersus360.vercel.app)"

# Colunas que identificam pessoas. Comparação sem acento, em minúsculas, sem separadores.
_IDENTIFICADORAS = [
    r"nomepaciente", r"nonome", r"nomemae", r"nomepai", r"nomedamae",
    r"numsus", r"cns", r"cpf", r"nascimento", r"dtnasc", r"datanasc", r"telefone", r"celular",
    r"logradouro", r"endereco", r"email", r"nunotificacao", r"numerodo", r"numerodv", r"numregcart",
    r"nomesocial", r"rg$",
]
_RE_ID = re.compile("|".join(_IDENTIFICADORAS))
# "Nome"/"Mãe" sozinhos só identificam pessoa em tabela de registros individuais (a pasta da malária
# tem uma tabela de 9 estados com a coluna "Nome" = nome da UF).
_AMBIGUAS = {"nome", "mae"}
LINHAS_REGISTRO_INDIVIDUAL = 500


class TableauIndisponivel(RuntimeError):
    """Falha de rede/HTTP ou download desativado pela FVS."""


class DadoPessoalDetectado(RuntimeError):
    """A pasta de trabalho pública contém colunas que identificam pessoas: leitura recusada."""


def _normalizar(nome: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", s)


def coluna_identificadora(nome: str, linhas_da_tabela: int | None = None) -> bool:
    n = _normalizar(nome)
    if n in _AMBIGUAS:
        return linhas_da_tabela is None or linhas_da_tabela > LINHAS_REGISTRO_INDIVIDUAL
    return bool(_RE_ID.search(n))


# ── Metadados e download ──────────────────────────────────────────────────────

def metadados(pasta: str) -> dict:
    """lastUpdateDate (UTC), autor e perfil publicados pelo Tableau Public."""
    try:
        r = httpx.get(f"{BASE}/profile/api/workbook/{pasta}", timeout=30, headers={"User-Agent": USER_AGENT})
        r.raise_for_status()
        d = r.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise TableauIndisponivel(f"Tableau Public não respondeu aos metadados de {pasta}: {exc}") from exc
    atualizado = d.get("lastUpdateDate")
    return {
        "titulo": d.get("title"), "autor": d.get("authorName"), "perfil": d.get("profileName"),
        "visualizacoes": d.get("viewCount"),
        "publicado_em": datetime.fromtimestamp(atualizado / 1000, tz=timezone.utc).replace(tzinfo=None)
        if atualizado else None,
    }


def _baixar(pasta: str, destino: Path) -> Path:
    arq = destino / f"{pasta}.twbx"
    total = 0
    try:
        with httpx.stream("GET", f"{BASE}/workbooks/{pasta}.twb", timeout=TIMEOUT, follow_redirects=True,
                          headers={"User-Agent": USER_AGENT}) as r:
            if r.status_code == 404:
                raise TableauIndisponivel(f"A FVS desativou o download da pasta {pasta} no Tableau Public.")
            r.raise_for_status()
            with open(arq, "wb") as fh:
                for bloco in r.iter_bytes(1024 * 1024):
                    total += len(bloco)
                    if total > TAMANHO_MAXIMO:
                        raise TableauIndisponivel(f"Pasta {pasta} maior que o limite de leitura.")
                    fh.write(bloco)
    except httpx.HTTPError as exc:
        raise TableauIndisponivel(f"Falha ao baixar a pasta {pasta}: {exc}") from exc
    if not zipfile.is_zipfile(arq):
        raise TableauIndisponivel(f"A pasta {pasta} veio sem extração de dados (não é .twbx).")
    return arq


def _extrair(arq: Path, destino: Path) -> tuple[list[Path], str]:
    """Extrai só as extrações .hyper (inclusive as gravadas como TableauTemp/*.tmp) e o .twb."""
    hypers: list[Path] = []
    twb = ""
    with zipfile.ZipFile(arq) as z:
        for i, info in enumerate(z.infolist()):
            nome = info.filename
            if info.is_dir() or ".." in Path(nome).parts or nome.startswith("/"):
                continue
            if nome.lower().endswith(".twb"):
                twb = z.read(info).decode("utf-8", "replace")
                continue
            if not nome.startswith("Data/"):
                continue
            with z.open(info) as fh:
                if fh.read(5) != b"Hyper":
                    continue
            alvo = destino / f"extracao_{i}.hyper"
            with z.open(info) as src, open(alvo, "wb") as dst:
                shutil.copyfileobj(src, dst)
            hypers.append(alvo)
    return hypers, twb


def parametro_twb(twb: str, legenda: str) -> str | None:
    """Valor de um parâmetro da pasta (ex.: 'Data de atualização' do painel de malária)."""
    m = re.search(r"<column caption='" + re.escape(legenda) + r"'[^>]*value='([^']*)'", twb)
    return html.unescape(m.group(1)).strip("#") if m else None


# ── Leitura ───────────────────────────────────────────────────────────────────

class Extracao:
    """Conjunto de tabelas das extrações de uma pasta, já verificadas contra dado pessoal."""

    def __init__(self, processo, arquivos: list[Path], twb: str):
        from tableauhyperapi import Connection
        self.twb = twb
        self._conexoes = []
        self.tabelas: list[tuple[object, object, list[str]]] = []   # (conexão, TableName, colunas)
        proibidas: set[str] = set()
        try:
            for arq in arquivos:
                c = Connection(processo.endpoint, str(arq))
                self._conexoes.append(c)
                for esquema in c.catalog.get_schema_names():
                    for t in c.catalog.get_table_names(esquema):
                        cols = [col.name.unescaped for col in c.catalog.get_table_definition(t).columns]
                        self.tabelas.append((c, t, cols))
                        n = None
                        if any(_normalizar(x) in _AMBIGUAS for x in cols):
                            n = c.execute_scalar_query(f"SELECT COUNT(*) FROM {t}")
                        proibidas |= {x for x in cols if coluna_identificadora(x, n)}
            if proibidas:
                raise DadoPessoalDetectado(
                    f"{len(proibidas)} coluna(s) identificadora(s) na pasta pública — leitura recusada")
        except Exception:
            self.fechar()
            raise

    def fechar(self):
        for c in self._conexoes:
            try:
                c.close()
            except Exception:  # noqa: BLE001
                pass

    def tabela(self, obrigatorias: set[str]):
        """Primeira tabela que tem todas as colunas pedidas (nomes de arquivo mudam a cada publicação)."""
        for c, t, cols in self.tabelas:
            if obrigatorias <= set(cols):
                return Tabela(c, t, cols)
        return None

    def tabelas_com(self, obrigatorias: set[str]):
        return [Tabela(c, t, cols) for c, t, cols in self.tabelas if obrigatorias <= set(cols)]


class Tabela:
    def __init__(self, conexao, nome, colunas: list[str]):
        self.c, self.nome, self.colunas = conexao, nome, colunas

    def col(self, nome: str) -> str:
        from tableauhyperapi import escape_name
        return escape_name(nome)

    def consulta(self, sql: str) -> list[list]:
        """`sql` usa {t} para a tabela; colunas devem vir de self.col()."""
        return self.c.execute_list_query(sql.format(t=self.nome))


@contextmanager
def abrir_pasta(pasta: str, arquivo_local: Path | None = None) -> Iterator[Extracao]:
    """Baixa, verifica e abre a pasta de trabalho; apaga tudo ao sair (inclusive em erro).
    `arquivo_local` (testes): lê um .twbx já baixado em vez de baixar."""
    try:
        from tableauhyperapi import HyperProcess, Telemetry
    except ImportError as exc:  # pragma: no cover — dependência de produção
        raise TableauIndisponivel("Biblioteca tableauhyperapi não instalada no servidor.") from exc

    tmp = Path(tempfile.mkdtemp(prefix="fvs_"))
    ext = None
    try:
        arq = arquivo_local or _baixar(pasta, tmp)
        hypers, twb = _extrair(arq, tmp)
        if not arquivo_local:
            arq.unlink(missing_ok=True)
        if not hypers:
            raise TableauIndisponivel(f"A pasta {pasta} não trouxe extração de dados.")
        logs = tmp / "logs"
        logs.mkdir()
        with HyperProcess(Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU,
                          parameters={"log_dir": str(logs)}) as processo:
            try:
                ext = Extracao(processo, hypers, twb)
                yield ext
            finally:
                if ext:
                    ext.fechar()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
