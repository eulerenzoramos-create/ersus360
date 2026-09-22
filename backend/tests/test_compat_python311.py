"""A produção (Dockerfile) roda Python 3.11. Aspas iguais aninhadas dentro de
f-strings só compilam a partir do 3.12 (PEP 701) e derrubam o servidor no
deploy, embora passem nos testes locais com Python mais novo."""
import pathlib
import tokenize

BACKEND = pathlib.Path(__file__).resolve().parents[1]


def _fstrings_incompativeis():
    ruins = []
    for arq in BACKEND.rglob("*.py"):
        if {"venv", "node_modules", "__pycache__"} & set(arq.parts):
            continue
        with open(arq, encoding="utf-8") as f:
            pilha = []
            for t in tokenize.generate_tokens(f.readline):
                if t.type == tokenize.FSTRING_START:
                    q = t.string.lstrip("rRbBfFuU")
                    pilha.append(q[:3] if q[:3] in ('"""', "'''") else q[:1])
                elif t.type == tokenize.FSTRING_END:
                    pilha.pop()
                elif pilha and len(pilha[-1]) == 1 and t.type in (tokenize.STRING, tokenize.FSTRING_START):
                    if t.string.lstrip("rRbBfFuU").startswith(pilha[-1]):
                        ruins.append(f"{arq.relative_to(BACKEND)}:{t.start[0]}")
    return ruins


def test_fstrings_compativeis_com_python_311():
    ruins = _fstrings_incompativeis()
    assert not ruins, "f-strings com aspas iguais aninhadas (quebram no Python 3.11): " + ", ".join(ruins)
