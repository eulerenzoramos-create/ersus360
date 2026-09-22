"""
Backups por município: escopo isolado, criptografia, teste de restauração e
restauração de um município sem misturar nem sobrescrever dados de outro.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from sqlalchemy import select

from models.backup import BackupExecucao
from models.convenio import Convenio
from models.documento import Documento
from models.municipio import Municipio
from tenancy import backup as bk
from tests.test_isolamento_tenant import SENHA_ADMIN, _h, _token, ambiente  # noqa: F401 (fixture)


@pytest.fixture
def armazenamento(tmp_path, monkeypatch):
    monkeypatch.setenv("ARMAZENAMENTO_DIR", str(tmp_path / "armazenamento"))
    monkeypatch.setenv("BACKUP_DIR", str(tmp_path / "backups"))
    return tmp_path


async def _admin(c):
    return await _token(c, "euler", SENHA_ADMIN)


async def _gerar(c, admin, uuid=None):
    r = await c.post("/api/admin-geral/backups", json={"municipio_uuid": uuid}, headers=_h(admin))
    assert r.status_code == 201, r.text
    return r.json()


def _conteudo(caminho: str) -> tuple[dict, dict]:
    z = bk._abrir(Path(caminho))
    manifesto = json.loads(z.read("manifest.json"))
    dados = {n: json.loads(z.read(f"dados/{n}.json")) for n in manifesto["tabelas"]}
    return manifesto, dados


async def _caminho(Session, backup_id: int) -> str:
    async with Session() as db:
        return (await db.get(BackupExecucao, backup_id)).arquivo


async def test_backup_do_municipio_contem_somente_dados_dele(ambiente, armazenamento):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    # arquivo do município B na área dele
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    r = await c.post("/api/documentos/upload?titulo=Oficio+B&tipo=Outro", headers=_h(tok_b),
                     files={"arquivo": ("b.pdf", b"conteudo-B", "application/pdf")})
    assert r.status_code == 201

    admin = await _admin(c)
    info = await _gerar(c, admin, ids["apui_uuid"])
    assert info["status"] == "ok" and info["verificacao_ok"] is True, info
    manifesto, dados = _conteudo(await _caminho(Session, info["id"]))

    assert manifesto["municipio"]["uuid"] == ids["apui_uuid"]
    assert {u["email"] for u in dados["usuarios"]} == {
        "gestor.apui@teste.gov.br", "ana.consulta@apui.gov.br", "suspenso@apui.gov.br", "multi@teste.gov.br"}
    assert [d["titulo"] for d in dados["documentos"]] == ["Relatório Apuí sigiloso"]
    for tabela, linhas in dados.items():
        for linha in linhas:
            if "municipio_id" in linha and tabela != "usuario_municipios":
                assert linha["municipio_id"] == ids["apui"], (tabela, linha)
    assert not any("conteudo-B" in rel or "b.pdf" in rel for rel in manifesto["arquivos"])
    assert "municipios" not in dados  # cadastro-mestre fica fora do backup municipal

    info_b = await _gerar(c, admin, ids["b_uuid"])
    _, dados_b = _conteudo(await _caminho(Session, info_b["id"]))
    assert [d["titulo"] for d in dados_b["documentos"]] == ["Relatório B sigiloso", "Oficio B"]


async def test_backup_criptografado_e_verificacao_detecta_adulteracao(ambiente, armazenamento):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    admin = await _admin(c)
    info = await _gerar(c, admin, ids["apui_uuid"])
    caminho = Path(await _caminho(Session, info["id"]))
    bruto = caminho.read_bytes()
    assert b"gestor.apui" not in bruto and b"sigiloso" not in bruto.decode("latin-1").encode()

    caminho.write_bytes(bruto[:-10] + b"0123456789")
    r = await c.post(f"/api/admin-geral/backups/{info['id']}/verificar", headers=_h(admin))
    assert r.json()["verificacao_ok"] is False


async def test_backup_geral_inclui_todos_os_municipios(ambiente, armazenamento):
    c, Session = ambiente["client"], ambiente["Session"]
    info = await _gerar(c, await _admin(c))
    assert info["tipo"] == "geral" and info["verificacao_ok"] is True
    _, dados = _conteudo(await _caminho(Session, info["id"]))
    assert len(dados["municipios"]) == 3
    assert {d["titulo"] for d in dados["documentos"]} == {"Relatório Apuí sigiloso", "Relatório B sigiloso"}


async def test_restaurar_apui_nao_toca_no_municipio_b(ambiente, armazenamento):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    admin = await _admin(c)
    info = await _gerar(c, admin, ids["apui_uuid"])

    # depois do backup: Apuí perde um documento e ganha um convênio; B ganha dados novos
    async with Session() as db:
        doc = (await db.execute(select(Documento).where(Documento.municipio_id == ids["apui"]))).scalar_one()
        await db.delete(doc)
        db.add(Convenio(municipio_id=ids["apui"], numero="POS-BACKUP", objeto="criado depois"))
        db.add(Convenio(municipio_id=ids["b"], numero="B-NOVO", objeto="dado atual de B"))
        await db.commit()

    async def estado_b():
        async with Session() as db:
            convs = sorted(c.numero for c in (await db.execute(
                select(Convenio).where(Convenio.municipio_id == ids["b"]))).scalars())
            docs = sorted(d.titulo for d in (await db.execute(
                select(Documento).where(Documento.municipio_id == ids["b"]))).scalars())
            return convs, docs

    antes_b = await estado_b()
    r = await c.post(f"/api/admin-geral/backups/{info['id']}/restaurar", headers=_h(admin),
                     json={"confirmacao": "APUÍ"})
    assert r.status_code == 200, r.text
    assert r.json()["backup_seguranca_id"]

    async with Session() as db:
        convs_apui = [c.numero for c in (await db.execute(
            select(Convenio).where(Convenio.municipio_id == ids["apui"]))).scalars()]
        docs_apui = [d.titulo for d in (await db.execute(
            select(Documento).where(Documento.municipio_id == ids["apui"]))).scalars()]
        seguranca = await db.get(BackupExecucao, r.json()["backup_seguranca_id"])
    assert convs_apui == [] and docs_apui == ["Relatório Apuí sigiloso"]  # voltou ao backup
    assert await estado_b() == antes_b                                     # B intacto
    assert seguranca.origem == "pre-restauracao" and seguranca.status == "ok"

    from tests.test_isolamento_tenant import _auditoria
    assert [a.acao for a in await _auditoria(Session, "RESTAURACAO_MUNICIPIO")] == ["RESTAURACAO_MUNICIPIO"]


async def test_backup_de_um_municipio_nao_restaura_outro(ambiente, armazenamento):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    info = await _gerar(c, await _admin(c), ids["apui_uuid"])
    caminho = Path(await _caminho(Session, info["id"]))
    async with Session() as db:
        mun_b = await db.get(Municipio, ids["b"])
        engine = db.bind
    with pytest.raises(bk.ErroBackup, match="não pertence a este município"):
        await bk.restaurar_municipio(engine, caminho, None, bk.alvo_de(mun_b))


async def test_restauracao_exige_confirmacao_e_admin_geral(ambiente, armazenamento):
    c, ids = ambiente["client"], ambiente["ids"]
    admin = await _admin(c)
    info = await _gerar(c, admin, ids["apui_uuid"])
    r = await c.post(f"/api/admin-geral/backups/{info['id']}/restaurar", headers=_h(admin),
                     json={"confirmacao": "Município Teste B"})
    assert r.status_code == 422

    gestor = await _token(c, "gestor.apui@teste.gov.br")
    for metodo, rota in (("get", "/api/admin-geral/backups"),
                         ("post", f"/api/admin-geral/backups/{info['id']}/restaurar")):
        r = await getattr(c, metodo)(rota, headers=_h(gestor),
                                     **({"json": {"confirmacao": "APUÍ"}} if metodo == "post" else {}))
        assert r.status_code == 403, rota


async def test_retencao_preserva_os_mais_recentes(ambiente, armazenamento, monkeypatch):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    admin = await _admin(c)
    gerados = [await _gerar(c, admin, ids["apui_uuid"]) for _ in range(5)]
    async with Session() as db:
        for i, g in enumerate(gerados):  # todos "antigos"; o último é o mais recente
            reg = await db.get(BackupExecucao, g["id"])
            reg.iniciado_em = datetime.utcnow() - timedelta(days=90 - i)
        await db.commit()
        monkeypatch.setenv("BACKUP_RETENCAO_DIAS", "30")
        expirados = await bk.aplicar_retencao(db, minimo_por_escopo=3)
        regs = {r.id: r for r in (await db.execute(select(BackupExecucao))).scalars()}
    assert expirados == 2
    for g in gerados[:2]:
        assert regs[g["id"]].status == "expirado" and not Path(regs[g["id"]].arquivo).exists()
    for g in gerados[2:]:
        assert regs[g["id"]].status == "ok" and Path(regs[g["id"]].arquivo).exists()
