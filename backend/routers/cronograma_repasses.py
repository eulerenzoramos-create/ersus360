from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models.repasse_fns import RepasseFNS
from services.consultafns_service import buscar_repasses_fns
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])

# ── Dados base (semente inicial — populado se banco estiver vazio) ─────────────

_REPASSES_BASE = [
    # Janeiro 2026
    {"id":"r01","competencia":"Jan/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/01/2026","data_credito":"14/01/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"Estimado com base no historico Jan/2026.","fonte":"manual"},
    {"id":"r01b","competencia":"Jan/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/01/2026","data_credito":"20/01/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"","fonte":"manual"},
    {"id":"r01c","competencia":"Jan/2026","bloco":"Media e Alta Complexidade","programa":"Procedimentos no MAC — Atencao Ambulatorial e Hospitalar","valor_previsto":312343.90,"valor_creditado":312343.90,"data_prevista":"25/01/2026","data_credito":"25/01/2026","status":"creditado","portaria":"Atencao de Media e Alta Complexidade","observacao":"","fonte":"manual"},
    {"id":"r01d","competencia":"Jan/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":15486.20,"data_prevista":"20/01/2026","data_credito":"20/01/2026","status":"creditado","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"","fonte":"manual"},
    # Fevereiro 2026
    {"id":"r02","competencia":"Fev/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/02/2026","data_credito":"14/02/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"","fonte":"manual"},
    {"id":"r02b","competencia":"Fev/2026","bloco":"Media e Alta Complexidade","programa":"Procedimentos no MAC — glosa parcial BPA-C","valor_previsto":312343.90,"valor_creditado":294500.00,"data_prevista":"25/02/2026","data_credito":"25/02/2026","status":"parcial","portaria":"Atencao de Media e Alta Complexidade","observacao":"Glosa parcial por inconsistencia no SIA/SIH.","fonte":"manual"},
    {"id":"r02c","competencia":"Fev/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/02/2026","data_credito":"19/02/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"","fonte":"manual"},
    # Marco 2026
    {"id":"r03","competencia":"Mar/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/03/2026","data_credito":"15/03/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"","fonte":"manual"},
    {"id":"r03b","competencia":"Mar/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/03/2026","data_credito":"20/03/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"","fonte":"manual"},
    {"id":"r03c","competencia":"Mar/2026","bloco":"Media e Alta Complexidade","programa":"Procedimentos no MAC — Atencao Ambulatorial e Hospitalar","valor_previsto":312343.90,"valor_creditado":312343.90,"data_prevista":"25/03/2026","data_credito":"25/03/2026","status":"creditado","portaria":"Atencao de Media e Alta Complexidade","observacao":"","fonte":"manual"},
    # Abril 2026
    {"id":"r04","competencia":"Abr/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/04/2026","data_credito":"15/04/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"","fonte":"manual"},
    {"id":"r04b","competencia":"Abr/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/04/2026","data_credito":"14/05/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"Creditado com atraso — pendencia documental regularizada em 13/05/2026.","fonte":"manual"},
    {"id":"r04c","competencia":"Abr/2026","bloco":"Media e Alta Complexidade","programa":"Procedimentos no MAC — Atencao Ambulatorial e Hospitalar","valor_previsto":312343.90,"valor_creditado":312343.90,"data_prevista":"25/04/2026","data_credito":"25/04/2026","status":"creditado","portaria":"Atencao de Media e Alta Complexidade","observacao":"","fonte":"manual"},
    # Maio 2026
    {"id":"r05","competencia":"Mai/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/05/2026","data_credito":"15/05/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"","fonte":"manual"},
    {"id":"r05b","competencia":"Mai/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/05/2026","data_credito":"20/05/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"","fonte":"manual"},
    {"id":"r05c","competencia":"Mai/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":15486.20,"data_prevista":"20/05/2026","data_credito":"19/05/2026","status":"creditado","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"","fonte":"manual"},
    # Junho 2026
    {"id":"r06","competencia":"Jun/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro APS — componentes ESF/EAP, Bucal, Per Capita","valor_previsto":416400.50,"valor_creditado":416400.50,"data_prevista":"15/06/2026","data_credito":"14/06/2026","status":"creditado","portaria":"Piso de Atencao Primaria a Saude","observacao":"","fonte":"manual"},
    {"id":"r06b","competencia":"Jun/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":45484.59,"data_prevista":"20/06/2026","data_credito":"19/06/2026","status":"creditado","portaria":"Apoio a Vigilancia em Saude","observacao":"","fonte":"manual"},
    {"id":"r06c","competencia":"Jun/2026","bloco":"Media e Alta Complexidade","programa":"Procedimentos no MAC — Atencao Ambulatorial e Hospitalar","valor_previsto":312343.90,"valor_creditado":312343.90,"data_prevista":"25/06/2026","data_credito":"25/06/2026","status":"creditado","portaria":"Atencao de Media e Alta Complexidade","observacao":"","fonte":"manual"},
    # Julho 2026 — DADOS REAIS consultafns.saude.gov.br (verificado 24/07/2026)
    {"id":"r07a","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro da APS - Equipes de Saude da Familia/ESF e EAP","valor_previsto":227826.00,"valor_creditado":None,"data_prevista":"15/07/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Dado real FNS — consultafns.saude.gov.br. Aguardando credito.","fonte":"fns_real"},
    {"id":"r07b","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro da APS - Atencao a Saude Bucal","valor_previsto":95439.00,"valor_creditado":None,"data_prevista":"15/07/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07c","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro da APS - Demais Programas, Servicos e Equipes","valor_previsto":65585.00,"valor_creditado":None,"data_prevista":"15/07/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07d","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro da APS - Equipes Multiprofissionais (EMULTI)","valor_previsto":16750.00,"valor_creditado":None,"data_prevista":"15/07/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07e","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Incentivo Financeiro da APS - Componente Per Capita de Base Populacional","valor_previsto":10799.75,"valor_creditado":None,"data_prevista":"15/07/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07f","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/07/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07g","competencia":"Jul/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF - Promocao da Assistencia Farmaceutica e Insumos Estrategicos na APS","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/07/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07h","competencia":"Jul/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"25/07/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Dado real FNS — consultafns.saude.gov.br. Aguardando credito.","fonte":"fns_real"},
    {"id":"r07i","competencia":"Jul/2026","bloco":"Vigilancia em Saude","programa":"Incentivo Financeiro para Vigilancia em Saude - Despesas Diversas","valor_previsto":19548.59,"valor_creditado":None,"data_prevista":"20/07/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    {"id":"r07j","competencia":"Jul/2026","bloco":"Vigilancia em Saude","programa":"Vencimentos dos Agentes de Combate as Endemias (ACE)","valor_previsto":25936.00,"valor_creditado":None,"data_prevista":"20/07/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACE","observacao":"Dado real FNS — consultafns.saude.gov.br.","fonte":"fns_real"},
    # Agosto 2026
    {"id":"r08a","competencia":"Ago/2026","bloco":"Atencao Primaria","programa":"Piso de Atencao Primaria a Saude — ESF/EAP, Bucal, Per Capita, Demais, EMULTI","valor_previsto":416400.75,"valor_creditado":None,"data_prevista":"15/08/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Previsao baseada em Jul/2026.","fonte":"manual"},
    {"id":"r08b","competencia":"Ago/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/08/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Previsao baseada em Jul/2026.","fonte":"manual"},
    {"id":"r08c","competencia":"Ago/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"25/08/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Previsao baseada em Jul/2026.","fonte":"manual"},
    {"id":"r08d","competencia":"Ago/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":None,"data_prevista":"20/08/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Previsao baseada em Jul/2026.","fonte":"manual"},
    {"id":"r08e","competencia":"Ago/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/08/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Previsao baseada em Jul/2026.","fonte":"manual"},
    # Setembro 2026
    {"id":"r09a","competencia":"Set/2026","bloco":"Atencao Primaria","programa":"Piso de Atencao Primaria a Saude — ESF/EAP, Bucal, Per Capita, Demais, EMULTI","valor_previsto":416400.75,"valor_creditado":None,"data_prevista":"15/09/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r09b","competencia":"Set/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/09/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r09c","competencia":"Set/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"25/09/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r09d","competencia":"Set/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":None,"data_prevista":"20/09/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r09e","competencia":"Set/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/09/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    # Outubro 2026
    {"id":"r10a","competencia":"Out/2026","bloco":"Atencao Primaria","programa":"Piso de Atencao Primaria a Saude — ESF/EAP, Bucal, Per Capita, Demais, EMULTI","valor_previsto":416400.75,"valor_creditado":None,"data_prevista":"15/10/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r10b","competencia":"Out/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/10/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r10c","competencia":"Out/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"25/10/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r10d","competencia":"Out/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":None,"data_prevista":"20/10/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r10e","competencia":"Out/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/10/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    # Novembro 2026
    {"id":"r11a","competencia":"Nov/2026","bloco":"Atencao Primaria","programa":"Piso de Atencao Primaria a Saude — ESF/EAP, Bucal, Per Capita, Demais, EMULTI","valor_previsto":416400.75,"valor_creditado":None,"data_prevista":"15/11/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r11b","competencia":"Nov/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/11/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r11c","competencia":"Nov/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"25/11/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r11d","competencia":"Nov/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":None,"data_prevista":"20/11/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r11e","competencia":"Nov/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/11/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    # Dezembro 2026
    {"id":"r12a","competencia":"Dez/2026","bloco":"Atencao Primaria","programa":"Piso de Atencao Primaria a Saude — ESF/EAP, Bucal, Per Capita, Demais, EMULTI","valor_previsto":416400.75,"valor_creditado":None,"data_prevista":"15/12/2026","data_credito":None,"status":"previsto","portaria":"Piso de Atencao Primaria a Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r12b","competencia":"Dez/2026","bloco":"Atencao Primaria","programa":"Vencimentos dos Agentes Comunitarios de Saude (ACS)","valor_previsto":213972.00,"valor_creditado":None,"data_prevista":"20/12/2026","data_credito":None,"status":"previsto","portaria":"Transferencia vencimentos ACS","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r12c","competencia":"Dez/2026","bloco":"Media e Alta Complexidade","programa":"Atencao a Saude da Populacao para Procedimentos no MAC","valor_previsto":312343.90,"valor_creditado":None,"data_prevista":"20/12/2026","data_credito":None,"status":"previsto","portaria":"Media e Alta Complexidade Ambulatorial e Hospitalar","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r12d","competencia":"Dez/2026","bloco":"Vigilancia em Saude","programa":"Vigilancia em Saude — Despesas Diversas e Vencimentos ACE","valor_previsto":45484.59,"valor_creditado":None,"data_prevista":"20/12/2026","data_credito":None,"status":"previsto","portaria":"Apoio a Vigilancia em Saude","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
    {"id":"r12e","competencia":"Dez/2026","bloco":"Assistencia Farmaceutica","programa":"CBAF — Componente Basico da Assistencia Farmaceutica","valor_previsto":15486.20,"valor_creditado":None,"data_prevista":"20/12/2026","data_credito":None,"status":"previsto","portaria":"Componente Basico da Assistencia Farmaceutica","observacao":"Previsao baseada em historico 2026.","fonte":"manual"},
]

CNPJ_FMS    = "12.834.320/0001-26"
MUNICIPIO   = "Apuí"
IBGE        = "1300144"

# ── Modelos Pydantic ───────────────────────────────────────────────────────────

class RepasseUpdate(BaseModel):
    competencia:     Optional[str]   = None
    bloco:           Optional[str]   = None
    programa:        Optional[str]   = None
    valor_previsto:  Optional[float] = None
    valor_creditado: Optional[float] = None
    data_prevista:   Optional[str]   = None
    data_credito:    Optional[str]   = None
    status:          Optional[str]   = None
    portaria:        Optional[str]   = None
    observacao:      Optional[str]   = None

class RepasseCreate(BaseModel):
    competencia:     str
    bloco:           str
    programa:        str
    valor_previsto:  float
    valor_creditado: Optional[float] = None
    data_prevista:   str
    data_credito:    Optional[str]   = None
    status:          str             = "previsto"
    portaria:        Optional[str]   = ""
    observacao:      Optional[str]   = ""

# ── Helpers ────────────────────────────────────────────────────────────────────

async def _seed_if_empty(db: AsyncSession) -> None:
    """Popula banco com dados base se estiver vazio."""
    result = await db.execute(select(RepasseFNS).limit(1))
    if result.first() is not None:
        return
    for item in _REPASSES_BASE:
        db.add(RepasseFNS(
            id=item["id"], competencia=item["competencia"], bloco=item["bloco"],
            programa=item["programa"], valor_previsto=item["valor_previsto"],
            valor_creditado=item.get("valor_creditado"),
            data_prevista=item.get("data_prevista"), data_credito=item.get("data_credito"),
            status=item["status"], portaria=item.get("portaria",""),
            observacao=item.get("observacao",""), fonte=item.get("fonte","manual"),
        ))
    await db.commit()

def _calc_resumo(repasses: list[dict], ultima_sync: str | None = None, fonte: str = "manual") -> dict:
    creditados = [r for r in repasses if r.get("status") == "creditado"]
    previstos  = [r for r in repasses if r.get("status") == "previsto"]
    atrasados  = [r for r in repasses if r.get("status") == "atrasado"]
    parciais   = [r for r in repasses if r.get("status") == "parcial"]
    total_prev = sum(r.get("valor_previsto", 0) or 0 for r in repasses)
    total_cred = sum(r.get("valor_creditado", 0) or 0 for r in repasses)
    proximo = next((r for r in repasses if r.get("status") == "previsto"), None)
    return {
        "total_previsto":        total_prev,
        "total_creditado":       total_cred,
        "total_aguardando":      total_prev - total_cred,
        "creditados":            len(creditados),
        "previstos":             len(previstos),
        "atrasados":             len(atrasados),
        "parciais":              len(parciais),
        "proximo_repasse":       proximo["data_prevista"] if proximo else "—",
        "proximo_valor":         proximo["valor_previsto"] if proximo else 0,
        "proximo_bloco":         proximo["bloco"] if proximo else "—",
        "ultima_sincronizacao":  ultima_sync,
        "fonte_dados":           fonte,
        "municipio":             MUNICIPIO,
        "ibge":                  IBGE,
        "cnpj_fms":              CNPJ_FMS,
    }

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
async def resumo(db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    result = await db.execute(select(RepasseFNS).order_by(RepasseFNS.competencia))
    rows = [r.to_dict() for r in result.scalars().all()]
    # Descobre ultima sync e fonte
    fns_rows = [r for r in rows if r["fonte"] in ("fns_real", "consultafns")]
    ultima = None
    fonte  = "manual"
    if fns_rows:
        syncs = [r["sincronizado_em"] for r in fns_rows if r.get("sincronizado_em")]
        ultima = max(syncs) if syncs else None
        fonte  = "consultafns.saude.gov.br"
    return _calc_resumo(rows, ultima, fonte)

@router.get("/lista")
async def lista(status: Optional[str] = None, bloco: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    q = select(RepasseFNS)
    if status and status != "todos":
        q = q.where(RepasseFNS.status == status)
    if bloco and bloco != "todos":
        q = q.where(RepasseFNS.bloco == bloco)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/{repasse_id}")
async def get_repasse(repasse_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RepasseFNS).where(RepasseFNS.id == repasse_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Repasse nao encontrado")
    return r.to_dict()

@router.post("")
async def criar_repasse(body: RepasseCreate, db: AsyncSession = Depends(get_db)):
    novo = RepasseFNS(
        id=f"manual-{uuid.uuid4().hex[:8]}",
        fonte="manual",
        **body.model_dump(),
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    return novo.to_dict()

@router.put("/{repasse_id}")
async def atualizar_repasse(repasse_id: str, body: RepasseUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RepasseFNS).where(RepasseFNS.id == repasse_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Repasse nao encontrado")
    for k, v in body.model_dump().items():
        if v is not None:
            setattr(r, k, v)
    r.fonte      = "manual"
    r.editado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(r)
    return r.to_dict()

@router.delete("/{repasse_id}")
async def deletar_repasse(repasse_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RepasseFNS).where(RepasseFNS.id == repasse_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Repasse nao encontrado")
    await db.delete(r)
    await db.commit()
    return {"ok": True}

@router.post("/sincronizar-fns")
async def sincronizar_fns(ano: int = 2026, db: AsyncSession = Depends(get_db)):
    """
    Busca dados reais do consultafns.saude.gov.br e atualiza o banco.
    Preserva registros editados manualmente.
    """
    resultado = await buscar_repasses_fns(ano)

    if not resultado["ok"]:
        return {
            "ok": False,
            "mensagem": "API do FNS nao retornou dados. Verifique conectividade ou tente novamente.",
            "erros": resultado.get("erros", []),
            "instrucao": "Acesse consultafns.saude.gov.br para verificar disponibilidade do sistema.",
        }

    novos_repasses = resultado["repasses"]
    agora = datetime.utcnow()
    inseridos = 0
    atualizados = 0

    for item in novos_repasses:
        result = await db.execute(select(RepasseFNS).where(RepasseFNS.id == item["id"]))
        existente = result.scalar_one_or_none()

        if existente:
            # Nao sobrescreve edicoes manuais
            if existente.fonte != "manual":
                for k, v in item.items():
                    if k != "id":
                        setattr(existente, k, v)
                existente.sincronizado_em = agora
                atualizados += 1
        else:
            db.add(RepasseFNS(
                sincronizado_em=agora,
                **{k: v for k, v in item.items()},
            ))
            inseridos += 1

    await db.commit()

    return {
        "ok":                True,
        "inseridos":         inseridos,
        "atualizados":       atualizados,
        "total_fns":         len(novos_repasses),
        "erros":             resultado.get("erros", []),
        "ultima_sincronizacao": agora.isoformat(),
        "fonte":             "consultafns.saude.gov.br",
        "aviso":             f"Sincronizacao concluida — {inseridos} novos + {atualizados} atualizados. Dados: consultafns.saude.gov.br",
    }
