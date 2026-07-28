"""
Router: /api/mapa-visitas-domiciliares — dados para "ACS → Mapa de Visitas Domiciliares"

Regras (ver docs/ERSUS-DOC-PEC-INTEGRACAO.md e CLAUDE.md):
- Nunca expõe nome do cidadão, CPF, CNS, diagnóstico, condição clínica, prontuário
  ou endereço completo — apenas coordenadas e os campos operacionais/administrativos
  explicitamente autorizados para o mapa.
- A localização "ao vivo" do ACS em campo é dado operacional do ERSUS 360 (via
  /ws/acs-geo), não um dado oficial do PEC — servida por routers/ws_acs.py,
  não duplicada aqui.
- UBS vêm de services/cnes_service.py (CNES/DATASUS, dado público real).
- Domicílios e visitas vêm das tabelas novas (pec_cadastro/visita_domiciliar); como
  ainda não existe nenhum mecanismo de registro de visita (app do ACS — ver DOC-024),
  essas listas ficam vazias até a Fase 3 ser implementada. Nenhum dado é fabricado.
"""
from __future__ import annotations
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.pec_cadastro import Domicilio
from models.visita_domiciliar import VisitaDomiciliar, StatusFilaVisita, StatusLocalizacao
from routers.auth import get_current_user, UserOut
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/mapa-visitas-domiciliares", tags=["Mapa de Visitas Domiciliares"])

# Mapeamento status_fila -> cor da legenda pedida (7 cores para 12 estados da fila).
# Estados ainda não enviados => amarelo; em trânsito/aguardando processamento => laranja;
# aceito => verde; rejeitado => vermelho; incluído no fluxo oficial => roxo.
_COR_POR_STATUS: dict[StatusFilaVisita, str] = {
    StatusFilaVisita.CRIADO_LOCALMENTE: "amarelo",
    StatusFilaVisita.SINCRONIZADO_ERSUS: "amarelo",
    StatusFilaVisita.VALIDADO_ERSUS: "amarelo",
    StatusFilaVisita.PREPARADO_LEDI: "amarelo",
    StatusFilaVisita.ENVIADO_PEC: "laranja",
    StatusFilaVisita.RECEBIDO_PEC: "laranja",
    StatusFilaVisita.PROCESSANDO_PEC: "laranja",
    StatusFilaVisita.ACEITO_PEC: "verde",
    StatusFilaVisita.REJEITADO_PEC: "vermelho",
    StatusFilaVisita.CORRIGIDO: "laranja",
    StatusFilaVisita.REENVIADO: "laranja",
    StatusFilaVisita.PROCESSADO_FLUXO_OFICIAL: "roxo",
}


@router.get("/dados")
async def dados_mapa(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    estabelecimentos = await buscar_estabelecimentos()
    ubs = [
        {"cnes": e.get("cnes"), "nome": e.get("nome"), "tipo": e.get("tipo"),
         "latitude": e.get("latitude"), "longitude": e.get("longitude")}
        for e in estabelecimentos if e.get("latitude") and e.get("longitude")
    ]

    domicilios_rows = (await db.execute(select(Domicilio))).scalars().all()
    domicilios = [
        {
            "id": d.id,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "status_localizacao": "desatualizada" if d.latitude is None or d.longitude is None else "atual",
        }
        for d in domicilios_rows
    ]

    visitas_rows = (await db.execute(
        select(VisitaDomiciliar).options(
            selectinload(VisitaDomiciliar.profissional),
            selectinload(VisitaDomiciliar.equipe),
            selectinload(VisitaDomiciliar.microarea),
            selectinload(VisitaDomiciliar.domicilio),
        )
    )).scalars().all()

    visitas = []
    for v in visitas_rows:
        lat = v.latitude_visita if v.latitude_visita is not None else (v.domicilio.latitude if v.domicilio else None)
        lng = v.longitude_visita if v.longitude_visita is not None else (v.domicilio.longitude if v.domicilio else None)
        hora_conclusao = None
        if v.duracao_segundos is not None:
            hora_conclusao = (v.data_hora_dispositivo + timedelta(seconds=v.duracao_segundos)).isoformat()

        visitas.append({
            "id": v.id,
            "numero_controle": v.uuid_local,
            "latitude": lat,
            "longitude": lng,
            "status_localizacao": v.status_localizacao.value,
            "cor_legenda": _COR_POR_STATUS.get(v.status_fila, "cinza"),
            # Campos autorizados no clique — ver docstring do módulo
            "acs": v.profissional.nome if v.profissional else None,
            "equipe": v.equipe.nome if v.equipe else None,
            "microarea": v.microarea.codigo if v.microarea else None,
            "data": v.data_hora_dispositivo.date().isoformat(),
            "hora_inicio": v.data_hora_dispositivo.isoformat(),
            "hora_conclusao": hora_conclusao,
            "duracao_segundos": v.duracao_segundos,
            "precisao_gps_metros": v.precisao_gps_metros,
            "status_sincronizacao": v.status_fila.value,
            "status_pec": v.status_fila.value,
            "data_ultimo_processamento": v.data_processamento_pec.isoformat() if v.data_processamento_pec else None,
        })

    return {"ubs": ubs, "domicilios": domicilios, "visitas": visitas}
