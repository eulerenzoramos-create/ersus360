#!/usr/bin/env python3
"""Bloqueia segredos e dados pessoais (CPF/CNS) antes de entrarem no repositório.

O repositório já foi público com backend/.env e um CPF de login versionados (21/10/2026). Este verificador
roda no CI em todo pull request e pode rodar localmente antes do commit.

Uso:
  python scripts/seguranca/verificar_dados_sensiveis.py --base origin/main   # linhas adicionadas no PR
  python scripts/seguranca/verificar_dados_sensiveis.py --staged             # o que está no `git add`
  python scripts/seguranca/verificar_dados_sensiveis.py --todos              # todos os arquivos versionados

Dado fictício de teste: coloque `dado-ficticio` na mesma linha (ex.: comentário) para liberar.
Saída 1 = encontrou algo; os valores aparecem mascarados.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

LIBERAR = re.compile(r"dado-ficticio|seguranca:\s*ignorar", re.I)

# Arquivos gerados/terceiros: o código-fonte de origem já é verificado.
IGNORAR_CAMINHO = re.compile(
    r"(^|/)(node_modules|dist|frontend_dist|static/assets|__pycache__|\.git)/|"
    r"(package-lock\.json|\.lock|\.min\.js|\.map|\.png|\.jpe?g|\.gif|\.ico|\.pdf|\.woff2?|\.ttf|\.zip|\.db|\.sqlite3?|\.xlsx?|\.pyc)$",
    re.I,
)

# .env de verdade nunca entra (os .example entram, sem valores reais)
ENV_REAL = re.compile(r"(^|/)\.env(\.[^/]*)?$", re.I)
ENV_EXEMPLO = re.compile(r"\.(example|exemplo|sample|template)$", re.I)

PLACEHOLDER = re.compile(
    r"(?i:^(\$\{|\{\{|<|\[|os\.|settings\.|getenv|process\.env|import\.meta|none|null|undefined|true|false|"
    r"x{3,}|\*{3,}|\.{3}|troque|change|example|exemplo|sua[_-]|seu[_-]|your[_-]|dev-|teste|test|fake|placeholder|"
    r"senha$|password$|secret$|changeme|redacted|gere[_-]|escolha[_-]|minioadmin|pass$|https?://))"
    r"|\.\.\.|^[A-Z][A-Z0-9_]+$|^[a-z][a-z_]*$",   # "...", PLACEHOLDER_EM_MAIUSCULAS, nome_de_chave
)

SEGREDOS = [
    ("chave Anthropic", re.compile(r"sk-ant-[A-Za-z0-9_-]{20,}")),
    ("chave OpenAI", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9]{32,}")),
    ("token GitHub", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})")),
    ("chave AWS", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("chave Google", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("token Slack", re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}")),
    ("chave Resend", re.compile(r"\bre_[A-Za-z0-9]{20,}")),
    ("chave privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("token JWT", re.compile(r"\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}")),
]
URL_COM_SENHA = re.compile(r"\b[a-z][a-z0-9+.-]*://([^/\s:@'\"]+):([^@\s'\"/]+)@", re.I)
ATRIBUICAO_SEGREDO = re.compile(
    r"\b([A-Z0-9_]*(?:SECRET|SENHA|PASSWORD|PASSWD|TOKEN|API_KEY|APIKEY|CHAVE|PRIVATE_KEY)[A-Z0-9_]*)\b"
    r"\s*[:=]\s*[\"']?([^\s\"',;)]{8,})",   # '#' só é comentário depois de espaço
)
CPF = re.compile(r"(?<!\d)(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})(?!\d)")
CNS = re.compile(r"(?<!\d)([1-9]\d{2})\s?(\d{4})\s?(\d{4})\s?(\d{4})(?!\d)")
CONTEXTO_CPF = re.compile(r"cpf", re.I)
CONTEXTO_CNS = re.compile(r"\bcns|cart[aã]o\s*(do\s*)?sus|co_?cns|coCns", re.I)


def env_so_publico(caminho: str) -> bool:
    """frontend/.env.production etc.: só variáveis VITE_ (expostas no navegador por definição)."""
    try:
        with open(caminho, encoding="utf-8", errors="ignore") as fh:
            chaves = [l.split("=", 1)[0].strip() for l in fh if "=" in l and not l.lstrip().startswith("#")]
    except OSError:
        return False
    return bool(chaves) and all(k.startswith("VITE_") for k in chaves)


def env_proibido(caminho: str) -> bool:
    return bool(ENV_REAL.search(caminho)) and not ENV_EXEMPLO.search(caminho) and not env_so_publico(caminho)


def cpf_valido(d: str) -> bool:
    if len(d) != 11 or d == d[0] * 11:
        return False
    for n in (9, 10):
        s = sum(int(d[i]) * (n + 1 - i) for i in range(n))
        dv = (s * 10) % 11 % 10
        if dv != int(d[n]):
            return False
    return True


def cns_valido(d: str) -> bool:
    if len(d) != 15 or d[0] not in "126789":
        return False
    return sum(int(c) * (15 - i) for i, c in enumerate(d)) % 11 == 0


def mascarar(v: str) -> str:
    v = v.strip()
    return v[:3] + "*" * max(3, len(v) - 5) + v[-2:] if len(v) > 6 else "***"


def achados_na_linha(texto: str, caminho: str) -> list[str]:
    if LIBERAR.search(texto):
        return []
    out = []
    for nome, rx in SEGREDOS:
        for m in rx.finditer(texto):
            out.append(f"{nome}: {mascarar(m.group(0))}")
    for m in URL_COM_SENHA.finditer(texto):
        senha = m.group(2)
        if not PLACEHOLDER.search(senha) and len(senha) >= 4:
            out.append(f"URL com senha: {m.group(0).split('://')[0]}://{m.group(1)}:{mascarar(senha)}@")
    eh_env = bool(ENV_REAL.search(caminho)) or caminho.endswith((".env.example", ".env.prod.example"))
    for m in ATRIBUICAO_SEGREDO.finditer(texto):
        nome, valor = m.group(1), m.group(2)
        literal_em_codigo = bool(re.search(re.escape(nome) + r"\s*[:=]\s*[\"']", texto))
        if (eh_env or literal_em_codigo) and not PLACEHOLDER.search(valor):
            out.append(f"{nome} com valor: {mascarar(valor)}")
    for m in CPF.finditer(texto):
        d = "".join(m.groups())
        formatado = "." in m.group(0) and "-" in m.group(0)
        ficticio = d.startswith("000") or d.count(d[0]) >= 9
        if cpf_valido(d) and not ficticio and (formatado or CONTEXTO_CPF.search(texto)):
            out.append(f"CPF: {mascarar(d)}")
    for m in CNS.finditer(texto):
        d = "".join(m.groups())
        ficticio = d.count("0") >= 10                       # ex.: 700000000000005
        if cns_valido(d) and not ficticio:
            out.append(f"CNS (cartão SUS): {mascarar(d)}")
    return out


def git(*args: str) -> str:
    return subprocess.run(["git", "-c", "core.quotepath=off", *args], capture_output=True, text=True, encoding="utf-8",
                          errors="replace", check=True).stdout


def linhas_adicionadas(diff: str):
    """(arquivo, nº da linha, texto) das linhas adicionadas num diff unificado (-U0)."""
    arquivo, linha = None, 0
    for l in diff.splitlines():
        if l.startswith("+++ "):
            arquivo = None if l[4:] == "/dev/null" else l[6:] if l.startswith("+++ b/") else l[4:]
        elif l.startswith("@@"):
            m = re.search(r"\+(\d+)", l)
            linha = int(m.group(1)) if m else 0
        elif l.startswith("+") and arquivo:
            yield arquivo, linha, l[1:]
            linha += 1


def arquivos_novos(diff_names: str) -> list[str]:
    return [l.split("\t", 1)[1] for l in diff_names.splitlines() if l.startswith(("A\t", "M\t", "R"))
            and "\t" in l]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--base", help="ref de comparação (ex.: origin/main)")
    g.add_argument("--staged", action="store_true")
    g.add_argument("--todos", action="store_true")
    a = ap.parse_args()

    problemas: list[tuple[str, int, str]] = []
    if a.todos:
        for caminho in git("ls-files").splitlines():
            if IGNORAR_CAMINHO.search(caminho):
                continue
            if env_proibido(caminho):
                problemas.append((caminho, 1, "arquivo .env versionado (use variáveis de ambiente)"))
                continue
            try:
                with open(caminho, encoding="utf-8", errors="ignore") as fh:
                    for n, texto in enumerate(fh, 1):
                        problemas += [(caminho, n, x) for x in achados_na_linha(texto, caminho)]
            except (IsADirectoryError, FileNotFoundError):
                pass
    else:
        faixa = ["--cached"] if a.staged else [f"{a.base}...HEAD"]
        nomes = git("diff", "--name-status", "--diff-filter=AMR", *faixa)
        for caminho in nomes.splitlines():
            partes = caminho.split("\t")
            alvo = partes[-1]
            if env_proibido(alvo):
                problemas.append((alvo, 1, "arquivo .env adicionado (use variáveis de ambiente)"))
        for caminho, n, texto in linhas_adicionadas(git("diff", "-U0", "--no-color", *faixa)):
            if IGNORAR_CAMINHO.search(caminho):
                continue
            problemas += [(caminho, n, x) for x in achados_na_linha(texto, caminho)]

    no_ci = os.getenv("GITHUB_ACTIONS") == "true"
    for caminho, n, msg in problemas:
        if no_ci:
            print(f"::error file={caminho},line={n},title=Dado sensível::{msg}")
        else:
            print(f"{caminho}:{n}: {msg}")
    if problemas:
        print(f"\n{len(problemas)} ocorrência(s) de segredo ou dado pessoal. Remova do código (use variável de "
              "ambiente) ou, se for dado fictício de teste, marque a linha com 'dado-ficticio'.", file=sys.stderr)
        return 1
    print("Nenhum segredo ou dado pessoal encontrado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
