"""
Catálogo oficial dos indicadores do Componente III – Qualidade, por modalidade de equipe.

Fontes (conferidas em 17/10/2026):
  - Lista e links das notas metodológicas/fichas: sisaps.saude.gov.br/sistemas/siaps/docs/manual/notas-metodologicas/
  - Pesos: Nota Técnica nº 8/2026-DEAPS/SAPS/MS (eSF/eAP, eSB, eMulti) e nº 12/2026-DEAPS/SAPS/MS (eSFR, eCR, eAPP)
Meta/parâmetro, unidade e fórmula ficam na ficha técnica oficial (link): o ERSUS360 não reescreve essas regras.
"""
from __future__ import annotations

from services.siaps_quadrimestral import PESOS_NT

_FT = "https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/"
_APS = _FT + "equipe-de-atencao-primaria-e-saude-da-familia/"
_ESB = _FT + "equipe-de-saude-bucal/"
_EMU = _FT + "equipes-multiprofissionais-emulti/"
_APP = _FT + "equipe-de-atencao-primaria-prisional/"
_ECR = _FT + "equipe-de-consultorio-na-rua/"
_RIB = _FT + "equipe-de-saude-da-familia-ribeirinha/"

NT_8 = "Nota Técnica nº 8/2026-DEAPS/SAPS/MS"
NT_12 = "Nota Técnica nº 12/2026-DEAPS/SAPS/MS"

# codigo: (nome oficial, modalidades, ficha, nota técnica do cálculo quadrimestral)
_INDICADORES = {
    "C1": ("Mais acesso à APS", "eSF, eAP", _APS + "nota-metodologica-c1-mais-acesso/view", NT_8),
    "C2": ("Cuidado no desenvolvimento infantil", "eSF, eAP", _APS + "nota-metodologica-c2-cuidado-no-desenvolvimento-infantil/view", NT_8),
    "C3": ("Cuidado na gestação e puerpério", "eSF, eAP", _APS + "nota-metodologica-c3-cuidado-na-gestacao-e-puerperio/view", NT_8),
    "C4": ("Cuidado da pessoa com diabetes", "eSF, eAP", _APS + "nota-metodologica-c4-cuidado-da-pessoa-com-diabetes/view", NT_8),
    "C5": ("Cuidado da pessoa com hipertensão", "eSF, eAP", _APS + "nota-metodologica-c5-cuidado-da-pessoa-com-hipertensao/view", NT_8),
    "C6": ("Cuidado da pessoa idosa", "eSF, eAP", _APS + "nota-metodologica-c6-cuidado-da-pessoa-idosa/view", NT_8),
    "C7": ("Cuidado da mulher na prevenção do câncer", "eSF, eAP", _APS + "nota-metodologica-c7-cuidado-da-mulher-na-prevencao-do-cancer/view", NT_8),
    "B1": ("Primeira consulta odontológica programada", "eSB", _ESB + "nota-metodologica-b1-primeira-consulta-programada/view", NT_8),
    "B2": ("Tratamento odontológico concluído", "eSB", _ESB + "nota-metodologica-b2-tratamento-concluido/view", NT_8),
    "B3": ("Taxa de exodontia", "eSB", _ESB + "nota-metodologica-b3-taxa-de-exodontia/view", NT_8),
    "B4": ("Escovação supervisionada em faixa etária escolar (6 a 12 anos)", "eSB",
           _ESB + "nota-metodologica-b4-escovacao-supervisionada-em-faixa-etaria-escolar-de-6-a-12-anos/view", NT_8),
    "B5": ("Procedimentos odontológicos preventivos", "eSB", _ESB + "nota-metodologica-b5-procedimentos-odontologicos-preventivos/view", NT_8),
    "B6": ("Tratamento restaurador atraumático", "eSB", _ESB + "nota-metodologica-b6-tratamento-restaurador-atraumatico/view", NT_8),
    "M1": ("Média de atendimentos por pessoa pela eMulti na APS", "eMulti",
           _EMU + "nota-metodologica-m1-media-de-atendimentos-por-pessoa-pela-emulti-na-aps/view", NT_8),
    "M2": ("Ações interprofissionais realizadas pela eMulti na APS", "eMulti",
           _EMU + "nota-metodologica-m2-acoes-interprofissionais-realizadas-pela-emulti-na-aps/view", NT_8),
    "R1": ("Mais acesso à equipe de Saúde da Família Ribeirinha (eSFR)", "eSFR",
           _RIB + "r1-mais-acesso-a-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "R2": ("Cuidado no desenvolvimento infantil pela eSFR", "eSFR",
           _RIB + "r2-cuidado-no-desenvolvimento-infantil-pela-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "R3": ("Cuidado na gestação e puerpério realizados pela eSFR", "eSFR",
           _RIB + "r3-cuidado-na-gestacao-e-puerperio-realizados-pela-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "R4": ("Cuidado da pessoa com diabetes realizado pela eSFR", "eSFR",
           _RIB + "r4-cuidado-da-pessoa-com-diabetes-realizado-pela-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "R5": ("Cuidado da pessoa com hipertensão pela eSFR", "eSFR",
           _RIB + "r5-cuidado-da-pessoa-com-hipertensao-pela-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "R6": ("Cuidado da mulher na prevenção do câncer pela eSFR", "eSFR",
           _RIB + "r6-cuidado-da-mulher-na-prevencao-do-cancer-pela-equipe-de-saude-da-familia-ribeirinha-esfr.pdf/view", NT_12),
    "CR1": ("Mais acesso à eCR", "eCR", _ECR + "nota-metodologica-cr1-mais-acesso-a-ecr/view", NT_12),
    "CR2": ("Cuidado na gestação", "eCR", _ECR + "nota-metodologica-cr2-cuidado-na-gestacao/view", NT_12),
    "CR3": ("Rastreio de infecções sexualmente transmissíveis", "eCR",
            _ECR + "nota-metodologica-cr3-rastreio-de-infeccoes-sexualmente-transmissiveis/view", NT_12),
    "CR4": ("Cuidado da pessoa com tuberculose", "eCR", _ECR + "nota-metodologica-cr4-cuidado-da-pessoa-com-tuberculose/view", NT_12),
    "P1": ("Mais acesso à Atenção Primária Prisional", "eAPP", _APP + "nota-metodologica-p1-mais-acesso-a-atencao-primaria-prisional/view", NT_12),
    "P2": ("Cuidado na gestação", "eAPP", _APP + "nota-metodologica-p2-cuidado-na-gestacao/view", NT_12),
    "P3": ("Cuidado da pessoa com diabetes e/ou hipertensão", "eAPP",
           _APP + "nota-metodologica-p3-cuidado-da-pessoa-com-diabetes-e-ou-hipertensao/view", NT_12),
    "P4": ("Rastreio de infecções sexualmente transmissíveis", "eAPP",
           _APP + "nota-metodologica-p4-rastreio-de-infeccoes-sexualmente-transmissiveis/view", NT_12),
    "P5": ("Cuidado da pessoa com tuberculose", "eAPP", _APP + "nota-metodologica-p5-cuidado-da-pessoa-com-tuberculose.pdf/view", NT_12),
    "P6": ("Cuidado da mulher na prevenção do câncer", "eAPP", _APP + "nota-metodologica-p6-cuidado-da-mulher-na-prevencao-do-cancer/view", NT_12),
}

URL_NOTAS = "https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/notas-metodologicas/"


def catalogo() -> list[dict]:
    return [{"codigo": c, "nome": nome, "modalidades": mod, "peso_quadrimestral": PESOS_NT.get(c),
             "nota_tecnica": nt, "ficha_tecnica": ficha} for c, (nome, mod, ficha, nt) in _INDICADORES.items()]


def do_codigo(codigo: str) -> dict | None:
    d = _INDICADORES.get(codigo)
    if not d:
        return None
    nome, mod, ficha, nt = d
    return {"codigo": codigo, "nome": nome, "modalidades": mod, "peso_quadrimestral": PESOS_NT.get(codigo),
            "nota_tecnica": nt, "ficha_tecnica": ficha}
