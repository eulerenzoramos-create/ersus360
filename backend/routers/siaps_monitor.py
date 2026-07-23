# backend/routers/siaps_monitor.py — Monitor de Lotes SIAPS em Tempo Real
from fastapi import APIRouter, Query
from typing import Optional
import random

router = APIRouter(prefix="/api/siaps-monitor", tags=["siaps-monitor"])

# ── Dados de referência ───────────────────────────────────────────────────────

ERROS_POSSIVEIS = [
    {"codigo": "ERR-001", "descricao": "Campo obrigatório ausente (CNS)", "acao_corretiva": "Preencher CNS do cidadão no eSUS PEC e retransmitir"},
    {"codigo": "ERR-002", "descricao": "Data de nascimento inválida", "acao_corretiva": "Corrigir data de nascimento no cadastro individual"},
    {"codigo": "ERR-003", "descricao": "Duplicidade de CNES na ficha", "acao_corretiva": "Verificar CNES da unidade e retransmitir"},
    {"codigo": "ERR-004", "descricao": "INE da equipe não encontrado no SCNES", "acao_corretiva": "Sincronizar equipes no SCNES antes da transmissão"},
    {"codigo": "ERR-005", "descricao": "Competência fora do prazo de envio", "acao_corretiva": "Solicitar reabertura do prazo ao DAB/CGAB"},
    {"codigo": "ERR-006", "descricao": "CBO profissional inválido para o tipo de atendimento", "acao_corretiva": "Corrigir CBO do profissional no cadastro de profissionais"},
    {"codigo": "ERR-007", "descricao": "Ficha de atividade coletiva sem participantes", "acao_corretiva": "Incluir participantes ou excluir a ficha"},
    {"codigo": "ERR-008", "descricao": "Medicamento não consta na RENAME", "acao_corretiva": "Atualizar lista de medicamentos conforme RENAME vigente"},
]

ESFS = ["ESF I", "ESF II", "ESF III", "ESF IV", "ESF V"]
TIPOS_FICHA = ["Cadastro Individual", "Cadastro Domiciliar", "Visita Domiciliar", "Atendimento Individual", "Atividade Coletiva", "Procedimentos"]
COMPETENCIAS = ["2025/12", "2026/01", "2026/02", "2026/03", "2026/04", "2026/05"]
STATUSES = ["pendente", "processando", "processado", "rejeitado", "erro"]

def _gerar_lotes(status_filtro: Optional[str] = None, esf_filtro: Optional[str] = None):
    lotes = []
    random.seed(42)
    for i in range(24):
        esf = ESFS[i % len(ESFS)]
        comp = COMPETENCIAS[i % len(COMPETENCIAS)]
        status = STATUSES[i % len(STATUSES)]
        if i < 3:
            status = "processado"
        elif i == 3:
            status = "processando"
        elif i in [4, 5]:
            status = "rejeitado"
        elif i in [6, 7]:
            status = "erro"

        total = 80 + (i * 7) % 120
        taxa = 0 if status == "processado" else (i * 3) % 18
        rejeitadas = int(total * taxa / 100)
        processadas = total - rejeitadas if status != "processando" else int(total * 0.6)

        erros_lote = []
        if status in ["rejeitado", "erro"] and taxa > 0:
            for j in range(min(3, len(ERROS_POSSIVEIS))):
                e = ERROS_POSSIVEIS[(i + j) % len(ERROS_POSSIVEIS)]
                qtd = max(1, int(rejeitadas * (0.4 if j == 0 else 0.3 if j == 1 else 0.3)))
                erros_lote.append({
                    "codigo": e["codigo"],
                    "descricao": e["descricao"],
                    "quantidade": qtd,
                    "fichas_afetadas": [f"FC-{total+k:04d}" for k in range(min(qtd, 5))],
                    "acao_corretiva": e["acao_corretiva"],
                })

        tipos = {}
        for t in TIPOS_FICHA:
            tipos[t] = max(0, int(total * (0.1 + random.random() * 0.2)))

        lote = {
            "id": i + 1,
            "numero_lote": f"LOTE-{comp.replace('/','-')}-{esf.replace(' ','')}-{i+1:03d}",
            "competencia": comp,
            "esf": esf,
            "data_envio": f"2026-0{(i%6)+1}-{15+(i%10):02d}",
            "data_processamento": f"2026-0{(i%6)+1}-{16+(i%8):02d}" if status == "processado" else None,
            "status": status,
            "total_fichas": total,
            "fichas_processadas": processadas,
            "fichas_rejeitadas": rejeitadas,
            "taxa_rejeicao": taxa,
            "tipos_ficha": tipos,
            "erros": erros_lote,
        }
        if (not status_filtro or status_filtro == lote["status"]) and (not esf_filtro or esf_filtro == lote["esf"]):
            lotes.append(lote)
    return lotes


@router.get("/resumo")
def resumo_siaps():
    lotes = _gerar_lotes()
    processados = sum(1 for l in lotes if l["status"] == "processado")
    pendentes = sum(1 for l in lotes if l["status"] in ["pendente", "processando"])
    com_erro = sum(1 for l in lotes if l["status"] in ["rejeitado", "erro"])
    total_fichas = sum(l["total_fichas"] for l in lotes)
    fichas_ok = sum(l["fichas_processadas"] for l in lotes)
    fichas_rej = sum(l["fichas_rejeitadas"] for l in lotes)
    taxa_geral = round((fichas_rej / total_fichas) * 100, 1) if total_fichas > 0 else 0

    historico = [
        {"competencia": "2025/07", "taxa": 8.3},
        {"competencia": "2025/08", "taxa": 6.1},
        {"competencia": "2025/09", "taxa": 7.4},
        {"competencia": "2025/10", "taxa": 5.2},
        {"competencia": "2025/11", "taxa": 4.8},
        {"competencia": "2025/12", "taxa": 3.9},
        {"competencia": "2026/01", "taxa": 4.2},
        {"competencia": "2026/02", "taxa": 3.1},
        {"competencia": "2026/03", "taxa": 2.8},
        {"competencia": "2026/04", "taxa": 3.4},
        {"competencia": "2026/05", "taxa": taxa_geral},
    ]

    return {
        "competencia_atual": "2026/05",
        "total_lotes": len(lotes),
        "lotes_processados": processados,
        "lotes_pendentes": pendentes,
        "lotes_com_erro": com_erro,
        "total_fichas": total_fichas,
        "fichas_ok": fichas_ok,
        "fichas_rejeitadas": fichas_rej,
        "taxa_rejeicao_geral": taxa_geral,
        "ultima_transmissao": "2026-05-20 14:32",
        "status_conexao": "online",
        "historico_taxa": historico,
    }


@router.get("/lotes")
def listar_lotes(
    status: Optional[str] = Query(None),
    esf: Optional[str] = Query(None),
):
    return _gerar_lotes(status_filtro=status, esf_filtro=esf)
