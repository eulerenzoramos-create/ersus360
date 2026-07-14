"""
Relatórios de Produção por Tipo de Atendimento
Apuí/AM — ESF + ESB + eMulti
"""
from __future__ import annotations
import calendar
from datetime import date, datetime
from random import Random
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

# ── Dados base (reutilizados do monitoramento) ────────────────────────────────
_EQUIPES = [
    {"id": "ESF-01", "nome": "CACHOEIRA",      "tipo": "ESF", "ubs": "UBS Irmã Elizabete"},
    {"id": "ESF-02", "nome": "SÃO SEBASTIÃO",  "tipo": "ESF", "ubs": "UBS São Sebastião"},
    {"id": "ESF-03", "nome": "ACARI",           "tipo": "ESF", "ubs": "UBS Acari"},
    {"id": "ESF-04", "nome": "TRÊS ESTADOS",    "tipo": "ESF", "ubs": "UBS Três Estados"},
    {"id": "ESF-05", "nome": "JUMA",            "tipo": "ESF", "ubs": "UBS Juma"},
    {"id": "ESF-06", "nome": "LIBERDADE",       "tipo": "ESF", "ubs": "UBS Liberdade"},
    {"id": "ESF-07", "nome": "KENNEDY",         "tipo": "ESF", "ubs": "UBS Kennedy"},
    {"id": "ESF-08", "nome": "JK",              "tipo": "ESF", "ubs": "UBS JK"},
    {"id": "ESF-09", "nome": "ESTRADA NOVA",    "tipo": "ESF", "ubs": "UBS Estrada Nova"},
    {"id": "ESF-10", "nome": "RIBEIRINHA",      "tipo": "ESF", "ubs": "UBS Fluvial Ribeirinha"},
    {"id": "ESB-01", "nome": "ESB I — CACHOEIRA",       "tipo": "ESB", "ubs": "UBS Irmã Elizabete"},
    {"id": "ESB-02", "nome": "ESB II — SÃO SEBASTIÃO",  "tipo": "ESB", "ubs": "UBS São Sebastião"},
    {"id": "ESB-03", "nome": "ESB III — CEO Apuí",       "tipo": "ESB", "ubs": "CEO Apuí"},
    {"id": "eM-01",  "nome": "eMulti Apuí",     "tipo": "eMulti", "ubs": "Núcleo eMulti SMS"},
]

# Todos os profissionais com equipe e CBO
_PROFISSIONAIS = [
    # ESF CACHOEIRA
    {"id":"P001","nome":"Dr. João Carlos Fonseca",        "cbo":"Médico de Família e Comunidade","equipe":"CACHOEIRA","tipo":"ESF"},
    {"id":"P002","nome":"Enf. Maria da Conceição Silva",   "cbo":"Enfermeiro",                    "equipe":"CACHOEIRA","tipo":"ESF"},
    {"id":"P003","nome":"Téc. José Raimundo Almeida",      "cbo":"Técnico de Enfermagem",         "equipe":"CACHOEIRA","tipo":"ESF"},
    {"id":"P004","nome":"ACS Marcos Antônio Lima",         "cbo":"Agente Comunitário de Saúde",   "equipe":"CACHOEIRA","tipo":"ESF"},
    {"id":"P005","nome":"ACS Lúcia Aparecida Souza",       "cbo":"Agente Comunitário de Saúde",   "equipe":"CACHOEIRA","tipo":"ESF"},
    {"id":"P006","nome":"ACS Francisco das Chagas",        "cbo":"Agente Comunitário de Saúde",   "equipe":"CACHOEIRA","tipo":"ESF"},
    # ESF SÃO SEBASTIÃO
    {"id":"P007","nome":"Dr. Raimundo Nonato Ferreira",    "cbo":"Médico de Família e Comunidade","equipe":"SÃO SEBASTIÃO","tipo":"ESF"},
    {"id":"P008","nome":"Enf. Francisca Nunes Pereira",    "cbo":"Enfermeiro",                    "equipe":"SÃO SEBASTIÃO","tipo":"ESF"},
    {"id":"P009","nome":"Téc. Antônia Rocha Barbosa",      "cbo":"Técnico de Enfermagem",         "equipe":"SÃO SEBASTIÃO","tipo":"ESF"},
    {"id":"P010","nome":"ACS Paulo César Mendes",          "cbo":"Agente Comunitário de Saúde",   "equipe":"SÃO SEBASTIÃO","tipo":"ESF"},
    {"id":"P011","nome":"ACS Rosária Bezerra Santos",      "cbo":"Agente Comunitário de Saúde",   "equipe":"SÃO SEBASTIÃO","tipo":"ESF"},
    # ESF ACARI
    {"id":"P012","nome":"Dra. Suely de Moraes Costa",      "cbo":"Médico de Família e Comunidade","equipe":"ACARI","tipo":"ESF"},
    {"id":"P013","nome":"Enf. Roberto Carlos da Costa",    "cbo":"Enfermeiro",                    "equipe":"ACARI","tipo":"ESF"},
    {"id":"P014","nome":"Téc. Joana Pereira Teixeira",     "cbo":"Técnico de Enfermagem",         "equipe":"ACARI","tipo":"ESF"},
    {"id":"P015","nome":"ACS Benedita dos Santos Lima",    "cbo":"Agente Comunitário de Saúde",   "equipe":"ACARI","tipo":"ESF"},
    {"id":"P016","nome":"ACS Edilson Freire Cardoso",      "cbo":"Agente Comunitário de Saúde",   "equipe":"ACARI","tipo":"ESF"},
    # ESF TRÊS ESTADOS
    {"id":"P017","nome":"Dr. Manoel Oliveira Júnior",      "cbo":"Médico de Família e Comunidade","equipe":"TRÊS ESTADOS","tipo":"ESF"},
    {"id":"P018","nome":"Enf. Cláudia Lima Figueiredo",    "cbo":"Enfermeiro",                    "equipe":"TRÊS ESTADOS","tipo":"ESF"},
    {"id":"P019","nome":"Téc. Sandro Freitas Moura",       "cbo":"Técnico de Enfermagem",         "equipe":"TRÊS ESTADOS","tipo":"ESF"},
    {"id":"P020","nome":"ACS Terezinha Barbosa Nunes",     "cbo":"Agente Comunitário de Saúde",   "equipe":"TRÊS ESTADOS","tipo":"ESF"},
    {"id":"P021","nome":"ACS Gilmar Pinheiro Ramos",       "cbo":"Agente Comunitário de Saúde",   "equipe":"TRÊS ESTADOS","tipo":"ESF"},
    # ESF JUMA
    {"id":"P022","nome":"Dra. Patrícia Carvalho Matos",    "cbo":"Médico de Família e Comunidade","equipe":"JUMA","tipo":"ESF"},
    {"id":"P023","nome":"Enf. Wagner Pinheiro Sousa",      "cbo":"Enfermeiro",                    "equipe":"JUMA","tipo":"ESF"},
    {"id":"P024","nome":"Téc. Rosimeire Tavares Cruz",     "cbo":"Técnico de Enfermagem",         "equipe":"JUMA","tipo":"ESF"},
    {"id":"P025","nome":"ACS Gilberto Nascimento Dias",    "cbo":"Agente Comunitário de Saúde",   "equipe":"JUMA","tipo":"ESF"},
    {"id":"P026","nome":"ACS Marinalva Gomes Viana",       "cbo":"Agente Comunitário de Saúde",   "equipe":"JUMA","tipo":"ESF"},
    # ESF LIBERDADE
    {"id":"P027","nome":"Dr. André Luís Monteiro",         "cbo":"Médico de Família e Comunidade","equipe":"LIBERDADE","tipo":"ESF"},
    {"id":"P028","nome":"Enf. Simone Araújo Corrêa",       "cbo":"Enfermeiro",                    "equipe":"LIBERDADE","tipo":"ESF"},
    {"id":"P029","nome":"Téc. Valdinei Cruz Farias",       "cbo":"Técnico de Enfermagem",         "equipe":"LIBERDADE","tipo":"ESF"},
    {"id":"P030","nome":"ACS Neuza Correia Batista",       "cbo":"Agente Comunitário de Saúde",   "equipe":"LIBERDADE","tipo":"ESF"},
    {"id":"P031","nome":"ACS Irene Soares Mendonça",       "cbo":"Agente Comunitário de Saúde",   "equipe":"LIBERDADE","tipo":"ESF"},
    {"id":"P032","nome":"ACS Davi Almeida Ferraz",         "cbo":"Agente Comunitário de Saúde",   "equipe":"LIBERDADE","tipo":"ESF"},
    # ESF KENNEDY
    {"id":"P033","nome":"Dra. Fernanda Ramos Leite",       "cbo":"Médico de Família e Comunidade","equipe":"KENNEDY","tipo":"ESF"},
    {"id":"P034","nome":"Enf. Cícero Viana Lopes",         "cbo":"Enfermeiro",                    "equipe":"KENNEDY","tipo":"ESF"},
    {"id":"P035","nome":"Téc. Marinete Alves Borges",      "cbo":"Técnico de Enfermagem",         "equipe":"KENNEDY","tipo":"ESF"},
    {"id":"P036","nome":"ACS Iramar Sousa Campos",         "cbo":"Agente Comunitário de Saúde",   "equipe":"KENNEDY","tipo":"ESF"},
    {"id":"P037","nome":"ACS Zelinda Pires Duarte",        "cbo":"Agente Comunitário de Saúde",   "equipe":"KENNEDY","tipo":"ESF"},
    # ESF JK
    {"id":"P038","nome":"Dr. Itamar Figueiredo Luz",       "cbo":"Médico de Família e Comunidade","equipe":"JK","tipo":"ESF"},
    {"id":"P039","nome":"Enf. Eliane Brito Cardoso",       "cbo":"Enfermeiro",                    "equipe":"JK","tipo":"ESF"},
    {"id":"P040","nome":"Téc. Osmar Teixeira Vieira",      "cbo":"Técnico de Enfermagem",         "equipe":"JK","tipo":"ESF"},
    {"id":"P041","nome":"ACS Verônica Dias Queiroz",       "cbo":"Agente Comunitário de Saúde",   "equipe":"JK","tipo":"ESF"},
    {"id":"P042","nome":"ACS Cleison Matos Andrade",       "cbo":"Agente Comunitário de Saúde",   "equipe":"JK","tipo":"ESF"},
    # ESF ESTRADA NOVA
    {"id":"P043","nome":"Dra. Aldira Mendes Castilho",     "cbo":"Médico de Família e Comunidade","equipe":"ESTRADA NOVA","tipo":"ESF"},
    {"id":"P044","nome":"Enf. Nilton Barros Siqueira",     "cbo":"Enfermeiro",                    "equipe":"ESTRADA NOVA","tipo":"ESF"},
    {"id":"P045","nome":"Téc. Eronildes Castro Lima",      "cbo":"Técnico de Enfermagem",         "equipe":"ESTRADA NOVA","tipo":"ESF"},
    {"id":"P046","nome":"ACS Zuleide Farias Maciel",       "cbo":"Agente Comunitário de Saúde",   "equipe":"ESTRADA NOVA","tipo":"ESF"},
    {"id":"P047","nome":"ACS Adeílson Luz Pinheiro",       "cbo":"Agente Comunitário de Saúde",   "equipe":"ESTRADA NOVA","tipo":"ESF"},
    # ESF RIBEIRINHA
    {"id":"P048","nome":"Dr. Sebastião Pereira da Cruz",  "cbo":"Médico de Família e Comunidade","equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P049","nome":"Enf. Dalva Santos Ribeiro",      "cbo":"Enfermeiro",                    "equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P050","nome":"Téc. Ediomar Lopes Tavares",     "cbo":"Técnico de Enfermagem",         "equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P051","nome":"ACS Antônio Nascimento Flexa",   "cbo":"Agente Comunitário de Saúde",   "equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P052","nome":"ACS Raimunda Lima Pantoja",      "cbo":"Agente Comunitário de Saúde",   "equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P053","nome":"ACS Djanilson Costa Ferreira",   "cbo":"Agente Comunitário de Saúde",   "equipe":"RIBEIRINHA","tipo":"ESF"},
    {"id":"P054","nome":"ACS Gleiciane Nunes Barbosa",    "cbo":"Agente Comunitário de Saúde",   "equipe":"RIBEIRINHA","tipo":"ESF"},
    # ESB
    {"id":"D001","nome":"Dr. Carlos Henrique Bezerra",     "cbo":"Cirurgião-Dentista",             "equipe":"ESB I — CACHOEIRA",       "tipo":"ESB"},
    {"id":"D002","nome":"ASB Marta Cristina Sousa",        "cbo":"Auxiliar em Saúde Bucal",        "equipe":"ESB I — CACHOEIRA",       "tipo":"ESB"},
    {"id":"D003","nome":"TSB Renato Alves Martins",        "cbo":"Técnico em Saúde Bucal",         "equipe":"ESB I — CACHOEIRA",       "tipo":"ESB"},
    {"id":"D004","nome":"Dra. Ana Cristina Monteiro",      "cbo":"Cirurgião-Dentista",             "equipe":"ESB II — SÃO SEBASTIÃO",  "tipo":"ESB"},
    {"id":"D005","nome":"ASB Fátima Regina Oliveira",      "cbo":"Auxiliar em Saúde Bucal",        "equipe":"ESB II — SÃO SEBASTIÃO",  "tipo":"ESB"},
    {"id":"D006","nome":"Dr. Eduardo Pinto Lacerda",       "cbo":"Cirurgião-Dentista",             "equipe":"ESB III — CEO Apuí",      "tipo":"ESB"},
    {"id":"D007","nome":"Esp. Sandra Lima Cavalcante",     "cbo":"Cirurgião-Dentista Especialista","equipe":"ESB III — CEO Apuí",      "tipo":"ESB"},
    {"id":"D008","nome":"ASB Josefa Alencar Prado",        "cbo":"Auxiliar em Saúde Bucal",        "equipe":"ESB III — CEO Apuí",      "tipo":"ESB"},
    # eMulti
    {"id":"M001","nome":"Fisiot. Luciana Borges Maia",     "cbo":"Fisioterapeuta",                "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M002","nome":"Nutr. Camila Ferreira Lopes",     "cbo":"Nutricionista",                 "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M003","nome":"Psic. Débora Santana Furtado",    "cbo":"Psicólogo",                     "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M004","nome":"A.S. Vanessa Coelho Rodrigues",   "cbo":"Assistente Social",             "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M005","nome":"Farm. Tiago Nunes Cavalcante",    "cbo":"Farmacêutico",                  "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M006","nome":"Ed.Fis. Marcos Pinheiro Freitas", "cbo":"Educador Físico",               "equipe":"eMulti Apuí","tipo":"eMulti"},
    {"id":"M007","nome":"Fonoaud. Priscila Arruda Costa",  "cbo":"Fonoaudiólogo",                 "equipe":"eMulti Apuí","tipo":"eMulti"},
]

# Parâmetros completos de produção por CBO (label, meta_dia, grupo)
_TIPOS_ATENDIMENTO: dict[str, list[dict]] = {
    "Médico de Família e Comunidade": [
        {"tipo":"consulta_medica",       "label":"Consulta Médica Individual",    "meta":20,"grupo":"Consultas"},
        {"tipo":"consulta_prenatal",     "label":"Pré-natal",                     "meta": 3,"grupo":"Saúde da Mulher"},
        {"tipo":"consulta_puericultura", "label":"Puericultura",                  "meta": 2,"grupo":"Saúde da Criança"},
        {"tipo":"atend_has_dm",          "label":"Atend. HAS/DM",                 "meta": 4,"grupo":"Doenças Crônicas"},
        {"tipo":"procedimento",          "label":"Procedimento Clínico",           "meta": 5,"grupo":"Procedimentos"},
        {"tipo":"encaminhamento",        "label":"Encaminhamento Especialidade",   "meta": 3,"grupo":"Regulação"},
        {"tipo":"receita_medicamento",   "label":"Prescrição de Medicamento",      "meta":12,"grupo":"Prescrições"},
        {"tipo":"atestado_medico",       "label":"Atestado Médico",               "meta": 4,"grupo":"Prescrições"},
    ],
    "Enfermeiro": [
        {"tipo":"consulta_enfermagem",   "label":"Consulta de Enfermagem",        "meta":16,"grupo":"Consultas"},
        {"tipo":"consulta_prenatal_enf", "label":"Pré-natal (Enf.)",              "meta": 3,"grupo":"Saúde da Mulher"},
        {"tipo":"consulta_puerperal",    "label":"Consulta Puerperal",            "meta": 2,"grupo":"Saúde da Mulher"},
        {"tipo":"visita_domiciliar",     "label":"Visita Domiciliar",             "meta": 8,"grupo":"Visitas"},
        {"tipo":"procedimento_enf",      "label":"Procedimento de Enfermagem",    "meta":10,"grupo":"Procedimentos"},
        {"tipo":"coleta_citopatologico", "label":"Coleta Citopatológico",         "meta": 4,"grupo":"Rastreamento"},
        {"tipo":"atividade_coletiva",    "label":"Atividade Coletiva em Saúde",   "meta": 2,"grupo":"Ações Coletivas"},
        {"tipo":"supervisao_acs",        "label":"Supervisão de ACS",             "meta": 1,"grupo":"Gestão"},
    ],
    "Técnico de Enfermagem": [
        {"tipo":"procedimento_tec",      "label":"Procedimento Técnico",          "meta":25,"grupo":"Procedimentos"},
        {"tipo":"vacina_administrada",   "label":"Vacina Administrada",           "meta":12,"grupo":"Imunização"},
        {"tipo":"aferição_pa",           "label":"Aferição de Pressão Arterial",  "meta":20,"grupo":"Triagem"},
        {"tipo":"glicemia_capilar",      "label":"Glicemia Capilar",              "meta":10,"grupo":"Triagem"},
        {"tipo":"curativo",              "label":"Curativo",                      "meta": 6,"grupo":"Procedimentos"},
        {"tipo":"inalacao_nebulizacao",  "label":"Inalação/Nebulização",          "meta": 5,"grupo":"Procedimentos"},
        {"tipo":"coleta_material",       "label":"Coleta de Material Biológico",  "meta": 4,"grupo":"Diagnóstico"},
        {"tipo":"administracao_med",     "label":"Administração de Medicamento",  "meta": 8,"grupo":"Procedimentos"},
    ],
    "Agente Comunitário de Saúde": [
        {"tipo":"visita_dom_acs",        "label":"Visita Domiciliar",             "meta":14,"grupo":"Visitas"},
        {"tipo":"cadastro_individual",   "label":"Cadastro Individual",           "meta": 4,"grupo":"Cadastros"},
        {"tipo":"cadastro_domiciliar",   "label":"Cadastro Domiciliar",           "meta": 2,"grupo":"Cadastros"},
        {"tipo":"busca_ativa",           "label":"Busca Ativa",                   "meta": 6,"grupo":"Vigilância"},
        {"tipo":"acomp_gestante",        "label":"Acompanhamento de Gestante",    "meta": 3,"grupo":"Saúde da Mulher"},
        {"tipo":"acomp_crianca",         "label":"Acompanhamento Criança <2a",    "meta": 4,"grupo":"Saúde da Criança"},
        {"tipo":"acomp_has_dm",          "label":"Acompanhamento HAS/DM",         "meta": 5,"grupo":"Doenças Crônicas"},
        {"tipo":"orientacao_saude",      "label":"Orientação em Saúde",           "meta": 4,"grupo":"Educação em Saúde"},
    ],
    "Cirurgião-Dentista": [
        {"tipo":"consulta_odonto",       "label":"Consulta Odontológica",         "meta":14,"grupo":"Consultas"},
        {"tipo":"primeira_consulta",     "label":"1ª Consulta Programática",      "meta": 6,"grupo":"Consultas"},
        {"tipo":"escovacao_superv",      "label":"Escovação Supervisionada",      "meta": 8,"grupo":"Prevenção"},
        {"tipo":"aplicacao_fluor",       "label":"Aplicação de Flúor",            "meta": 6,"grupo":"Prevenção"},
        {"tipo":"restauracao",           "label":"Restauração Dentária",          "meta": 5,"grupo":"Tratamento"},
        {"tipo":"extracao",              "label":"Extração Dentária",             "meta": 3,"grupo":"Tratamento"},
        {"tipo":"tratamento_canal",      "label":"Tratamento de Canal (Endo.)",   "meta": 1,"grupo":"Tratamento"},
        {"tipo":"urgencia_odonto",       "label":"Urgência Odontológica",         "meta": 2,"grupo":"Urgência"},
        {"tipo":"ativ_educativa_odo",    "label":"Atividade Educativa Bucal",     "meta": 2,"grupo":"Educação"},
    ],
    "Cirurgião-Dentista Especialista": [
        {"tipo":"consulta_esp",          "label":"Consulta Especialidade",        "meta":12,"grupo":"Consultas"},
        {"tipo":"periodontia",           "label":"Procedimento de Periodontia",   "meta": 4,"grupo":"Especialidade"},
        {"tipo":"endodontia",            "label":"Endodontia",                    "meta": 3,"grupo":"Especialidade"},
        {"tipo":"cirurgia_oral",         "label":"Cirurgia Oral Menor",           "meta": 2,"grupo":"Cirurgia"},
        {"tipo":"protese",               "label":"Prótese Dentária",              "meta": 2,"grupo":"Reabilitação"},
        {"tipo":"diagnostico_bucal",     "label":"Diagnóstico Bucal",             "meta": 3,"grupo":"Diagnóstico"},
    ],
    "Auxiliar em Saúde Bucal": [
        {"tipo":"assist_consulta",       "label":"Assistência em Consultas",      "meta":20,"grupo":"Suporte"},
        {"tipo":"esterilizacao",         "label":"Esterilização de Material",     "meta":15,"grupo":"Suporte"},
        {"tipo":"educacao_bucal",        "label":"Educação em Saúde Bucal",       "meta": 4,"grupo":"Educação"},
        {"tipo":"triagem_odonto",        "label":"Triagem Odontológica",          "meta": 8,"grupo":"Triagem"},
    ],
    "Técnico em Saúde Bucal": [
        {"tipo":"procedimento_tsb",      "label":"Procedimento TSB",              "meta":16,"grupo":"Procedimentos"},
        {"tipo":"moldagem",              "label":"Moldagem para Prótese",         "meta": 3,"grupo":"Reabilitação"},
        {"tipo":"radiografia_odonto",    "label":"Radiografia Odontológica",      "meta": 6,"grupo":"Diagnóstico"},
        {"tipo":"esterilizacao_tsb",     "label":"Esterilização de Material",     "meta":12,"grupo":"Suporte"},
    ],
    "Fisioterapeuta": [
        {"tipo":"atend_fisio",           "label":"Atendimento Fisioterapêutico",  "meta":18,"grupo":"Atendimentos"},
        {"tipo":"atend_compartilhado",   "label":"Atendimento Compartilhado",     "meta": 4,"grupo":"eMulti"},
        {"tipo":"ativ_coletiva_fis",     "label":"Atividade Coletiva",            "meta": 2,"grupo":"Coletivo"},
        {"tipo":"visita_dom_fis",        "label":"Visita Domiciliar",             "meta": 3,"grupo":"Visitas"},
    ],
    "Nutricionista": [
        {"tipo":"consulta_nutri",        "label":"Consulta Nutricional",          "meta":16,"grupo":"Consultas"},
        {"tipo":"avaliacao_antrop",      "label":"Avaliação Antropométrica",      "meta":10,"grupo":"Avaliação"},
        {"tipo":"ativ_educativa_nut",    "label":"Atividade Educativa",           "meta": 3,"grupo":"Coletivo"},
        {"tipo":"atend_sisvan",          "label":"Atendimento SISVAN",            "meta": 6,"grupo":"Vigilância"},
        {"tipo":"atend_comp_nut",        "label":"Atendimento Compartilhado",     "meta": 4,"grupo":"eMulti"},
    ],
    "Psicólogo": [
        {"tipo":"consulta_psico",        "label":"Consulta Psicológica",          "meta":18,"grupo":"Consultas"},
        {"tipo":"grupo_terapeutico",     "label":"Grupo Terapêutico",             "meta": 2,"grupo":"Coletivo"},
        {"tipo":"atend_saude_mental",    "label":"Atend. Saúde Mental",           "meta": 4,"grupo":"Saúde Mental"},
        {"tipo":"atend_comp_psi",        "label":"Atendimento Compartilhado",     "meta": 3,"grupo":"eMulti"},
        {"tipo":"orientacao_familiar",   "label":"Orientação Familiar",           "meta": 2,"grupo":"Família"},
    ],
    "Assistente Social": [
        {"tipo":"atend_social",          "label":"Atendimento Social",            "meta":15,"grupo":"Atendimentos"},
        {"tipo":"orientacao_social",     "label":"Orientação Social",             "meta": 8,"grupo":"Orientação"},
        {"tipo":"visita_dom_as",         "label":"Visita Domiciliar",             "meta": 4,"grupo":"Visitas"},
        {"tipo":"encaminhamento_social", "label":"Encaminhamento Social",         "meta": 6,"grupo":"Regulação"},
        {"tipo":"grupo_apoio",           "label":"Grupo de Apoio",               "meta": 2,"grupo":"Coletivo"},
    ],
    "Farmacêutico": [
        {"tipo":"dispensacao",           "label":"Dispensação de Medicamento",    "meta":40,"grupo":"Farmácia"},
        {"tipo":"consulta_farm",         "label":"Consulta Farmacêutica",         "meta": 8,"grupo":"Consultas"},
        {"tipo":"reconciliacao_med",     "label":"Reconciliação de Medicamentos", "meta": 5,"grupo":"Segurança"},
        {"tipo":"educacao_farm",         "label":"Educação Farmacêutica",         "meta": 3,"grupo":"Educação"},
    ],
    "Educador Físico": [
        {"tipo":"grupo_ativ_fisica",     "label":"Grupo Atividade Física",        "meta": 4,"grupo":"Coletivo"},
        {"tipo":"avaliacao_fisica",      "label":"Avaliação Física",              "meta": 8,"grupo":"Avaliação"},
        {"tipo":"atend_individual_ef",   "label":"Atendimento Individual",        "meta":10,"grupo":"Atendimentos"},
        {"tipo":"orientacao_pratica",    "label":"Orientação de Prática Física",  "meta": 6,"grupo":"Orientação"},
    ],
    "Fonoaudiólogo": [
        {"tipo":"consulta_fono",         "label":"Consulta Fonoaudiológica",      "meta":16,"grupo":"Consultas"},
        {"tipo":"triagem_auditiva",      "label":"Triagem Auditiva",              "meta": 6,"grupo":"Triagem"},
        {"tipo":"atend_degluticao",      "label":"Atend. Deglutição",             "meta": 4,"grupo":"Tratamento"},
        {"tipo":"grupo_linguagem",       "label":"Grupo de Linguagem",            "meta": 2,"grupo":"Coletivo"},
    ],
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def _seed(uid: str, ano: int, mes: int, dia: int) -> int:
    return hash(f"{uid}{ano:04d}{mes:02d}{dia:02d}") % 10000


def _prod_prof_dia(prof: dict, ano: int, mes: int, dia: int, fator: float) -> list[dict]:
    rng = Random(_seed(prof["id"], ano, mes, dia))
    tipos = _TIPOS_ATENDIMENTO.get(prof["cbo"], [])
    resultado = []
    for t in tipos:
        meta_h = t["meta"] * fator
        realizado = int(meta_h * rng.uniform(0.68, 1.18)) if fator > 0 else 0
        resultado.append({
            **t,
            "realizado": realizado,
            "pct": round(realizado / t["meta"] * 100, 1) if t["meta"] > 0 else 0,
        })
    return resultado


def _fator_dia(ano: int, mes: int, dia: int, hoje: date, hora_atual: int) -> float:
    d = date(ano, mes, dia)
    if d > hoje:
        return -1.0  # futuro
    if d.weekday() >= 5:
        return -2.0  # FDS
    if d == hoje:
        return min((hora_atual - 7) / 10, 1.0) if hora_atual > 7 else 0.0
    return 1.0


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/equipes")
async def listar_equipes():
    return {"equipes": _EQUIPES}


@router.get("/profissionais")
async def listar_profissionais(equipe: Optional[str] = None, tipo: Optional[str] = None):
    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo:
        profs = [p for p in profs if p["tipo"] == tipo]
    return {"profissionais": profs}


@router.get("/tipos-atendimento")
async def listar_tipos():
    """Lista todos os tipos de atendimento agrupados por CBO."""
    grupos: dict[str, list] = {}
    for cbo, tipos in _TIPOS_ATENDIMENTO.items():
        for t in tipos:
            g = t["grupo"]
            if g not in grupos:
                grupos[g] = []
            if not any(x["tipo"] == t["tipo"] for x in grupos[g]):
                grupos[g].append({"tipo": t["tipo"], "label": t["label"], "cbos": [cbo]})
            else:
                for x in grupos[g]:
                    if x["tipo"] == t["tipo"] and cbo not in x["cbos"]:
                        x["cbos"].append(cbo)
    return {"grupos": grupos, "cbos": list(_TIPOS_ATENDIMENTO.keys())}


@router.get("/por-tipo")
async def producao_por_tipo(
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    equipe: Optional[str] = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
):
    """Produção agregada por tipo de atendimento no período."""
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    hora_atual = min(datetime.now().hour, 17)

    _, dias_no_mes = calendar.monthrange(ano, mes)
    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo_equipe:
        profs = [p for p in profs if p["tipo"] == tipo_equipe]
    if profissional_id:
        profs = [p for p in profs if p["id"] == profissional_id]

    # Acumula por tipo de atendimento
    acum: dict[str, dict] = {}
    dias_uteis = 0

    for d in range(1, dias_no_mes + 1):
        fator = _fator_dia(ano, mes, d, hoje, hora_atual)
        if fator < 0:
            continue
        dias_uteis += 1
        for prof in profs:
            for prod in _prod_prof_dia(prof, ano, mes, d, fator):
                k = prod["tipo"]
                if k not in acum:
                    acum[k] = {
                        "tipo": k,
                        "label": prod["label"],
                        "grupo": prod["grupo"],
                        "realizado": 0,
                        "meta_total": 0,
                        "dias": 0,
                    }
                acum[k]["realizado"]  += prod["realizado"]
                acum[k]["meta_total"] += prod["meta"]
                acum[k]["dias"]       += 1

    resultado = []
    for item in acum.values():
        pct = round(item["realizado"] / max(item["meta_total"], 1) * 100, 1)
        resultado.append({
            **item,
            "pct_meta": pct,
            "media_dia": round(item["realizado"] / max(dias_uteis, 1), 1),
            "status": "normal" if pct >= 75 else "atencao" if pct >= 50 else "critico",
        })

    resultado.sort(key=lambda x: -x["realizado"])

    # Agrupa por grupo
    por_grupo: dict[str, list] = {}
    for r in resultado:
        g = r["grupo"]
        por_grupo.setdefault(g, []).append(r)

    return {
        "periodo": f"{mes:02d}/{ano}",
        "dias_uteis": dias_uteis,
        "total_atendimentos": sum(r["realizado"] for r in resultado),
        "total_tipos": len(resultado),
        "profissionais_filtro": len(profs),
        "por_tipo": resultado,
        "por_grupo": [{"grupo": g, "tipos": ts, "total": sum(t["realizado"] for t in ts)} for g, ts in sorted(por_grupo.items())],
    }


@router.get("/por-profissional")
async def producao_por_profissional(
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    equipe: Optional[str] = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
):
    """Produção total por profissional no período."""
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    hora_atual = min(datetime.now().hour, 17)
    _, dias_no_mes = calendar.monthrange(ano, mes)

    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo_equipe:
        profs = [p for p in profs if p["tipo"] == tipo_equipe]

    resultado = []
    for prof in profs:
        total_real = 0
        total_meta = 0
        tipos_detalhe: dict[str, dict] = {}
        dias_uteis = 0

        for d in range(1, dias_no_mes + 1):
            fator = _fator_dia(ano, mes, d, hoje, hora_atual)
            if fator < 0:
                continue
            dias_uteis += 1
            for prod in _prod_prof_dia(prof, ano, mes, d, fator):
                k = prod["tipo"]
                if k not in tipos_detalhe:
                    tipos_detalhe[k] = {"tipo": k, "label": prod["label"], "grupo": prod["grupo"], "realizado": 0, "meta": 0}
                tipos_detalhe[k]["realizado"] += prod["realizado"]
                tipos_detalhe[k]["meta"]      += prod["meta"]
                total_real += prod["realizado"]
                total_meta += prod["meta"]

        pct = round(total_real / max(total_meta, 1) * 100, 1)
        detalhe = sorted(tipos_detalhe.values(), key=lambda x: -x["realizado"])
        for item in detalhe:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        resultado.append({
            **prof,
            "total_realizado": total_real,
            "total_meta": total_meta,
            "pct_meta": pct,
            "media_dia": round(total_real / max(dias_uteis, 1), 1),
            "dias_uteis": dias_uteis,
            "status": "normal" if pct >= 75 else "atencao" if pct >= 50 else "critico",
            "tipos_detalhe": detalhe,
        })

    resultado.sort(key=lambda x: -x["total_realizado"])
    return {
        "periodo": f"{mes:02d}/{ano}",
        "total_profissionais": len(resultado),
        "total_atendimentos": sum(r["total_realizado"] for r in resultado),
        "profissionais": resultado,
    }


@router.get("/por-equipe")
async def producao_por_equipe(
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
):
    """Produção por equipe no período, com detalhamento por tipo."""
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    hora_atual = min(datetime.now().hour, 17)
    _, dias_no_mes = calendar.monthrange(ano, mes)

    equipes_filtro = _EQUIPES
    if tipo_equipe:
        equipes_filtro = [e for e in _EQUIPES if e["tipo"] == tipo_equipe]

    resultado = []
    for eq in equipes_filtro:
        profs_eq = [p for p in _PROFISSIONAIS if p["equipe"] == eq["nome"]]
        acum: dict[str, dict] = {}
        total_real = 0
        total_meta = 0
        dias_uteis = 0

        for d in range(1, dias_no_mes + 1):
            fator = _fator_dia(ano, mes, d, hoje, hora_atual)
            if fator < 0:
                continue
            dias_uteis += 1
            for prof in profs_eq:
                for prod in _prod_prof_dia(prof, ano, mes, d, fator):
                    k = prod["tipo"]
                    if k not in acum:
                        acum[k] = {"tipo": k, "label": prod["label"], "grupo": prod["grupo"], "realizado": 0, "meta": 0}
                    acum[k]["realizado"] += prod["realizado"]
                    acum[k]["meta"]      += prod["meta"]
                    total_real += prod["realizado"]
                    total_meta += prod["meta"]

        pct = round(total_real / max(total_meta, 1) * 100, 1)
        detalhe = sorted(acum.values(), key=lambda x: -x["realizado"])
        for item in detalhe:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        resultado.append({
            **eq,
            "total_realizado": total_real,
            "total_meta": total_meta,
            "pct_meta": pct,
            "media_dia": round(total_real / max(dias_uteis, 1), 1),
            "dias_uteis": dias_uteis,
            "n_profissionais": len(profs_eq),
            "status": "normal" if pct >= 75 else "atencao" if pct >= 50 else "critico",
            "tipos_detalhe": detalhe,
        })

    resultado.sort(key=lambda x: -x["total_realizado"])
    return {
        "periodo": f"{mes:02d}/{ano}",
        "total_equipes": len(resultado),
        "total_atendimentos": sum(r["total_realizado"] for r in resultado),
        "equipes": resultado,
    }


@router.get("/diario")
async def relatorio_diario(
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    equipe: Optional[str] = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
    grupo: Optional[str] = Query(default=None),
):
    """Produção dia a dia com detalhamento por tipo de atendimento."""
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    hora_atual = min(datetime.now().hour, 17)
    _, dias_no_mes = calendar.monthrange(ano, mes)

    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo_equipe:
        profs = [p for p in profs if p["tipo"] == tipo_equipe]
    if profissional_id:
        profs = [p for p in profs if p["id"] == profissional_id]

    dias = []
    acumulado = 0
    for d in range(1, dias_no_mes + 1):
        data_d = date(ano, mes, d)
        fator = _fator_dia(ano, mes, d, hoje, hora_atual)
        is_futuro = fator == -1.0
        is_fds    = fator == -2.0
        is_hoje   = data_d == hoje

        if is_futuro or is_fds:
            dias.append({
                "dia": d, "data": data_d.strftime("%d/%m"),
                "dia_semana": data_d.strftime("%a").upper(),
                "is_util": not is_fds, "is_futuro": is_futuro, "is_hoje": False,
                "total": None, "acumulado": None, "tipos": None,
            })
            continue

        acum_tipos: dict[str, dict] = {}
        total_dia = 0
        for prof in profs:
            for prod in _prod_prof_dia(prof, ano, mes, d, fator):
                if grupo and prod["grupo"] != grupo:
                    continue
                k = prod["tipo"]
                if k not in acum_tipos:
                    acum_tipos[k] = {"tipo": k, "label": prod["label"], "grupo": prod["grupo"], "realizado": 0, "meta": 0}
                acum_tipos[k]["realizado"] += prod["realizado"]
                acum_tipos[k]["meta"]      += prod["meta"]
                total_dia += prod["realizado"]

        acumulado += total_dia
        tipos_lista = sorted(acum_tipos.values(), key=lambda x: -x["realizado"])
        for item in tipos_lista:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        dias.append({
            "dia": d, "data": data_d.strftime("%d/%m"),
            "dia_semana": data_d.strftime("%a").upper(),
            "is_util": True, "is_futuro": False, "is_hoje": is_hoje,
            "total": total_dia, "acumulado": acumulado,
            "tipos": tipos_lista,
        })

    dias_com = [d for d in dias if d["total"] is not None]
    return {
        "periodo": f"{mes:02d}/{ano}",
        "total_mes": acumulado,
        "dias_uteis": len(dias_com),
        "media_dia": round(acumulado / max(len(dias_com), 1)),
        "dias": dias,
    }


@router.get("/anual")
async def relatorio_anual(
    ano: int = Query(default=None),
    equipe: Optional[str] = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
):
    """Produção mês a mês do ano, com totais por tipo de atendimento."""
    hoje = date.today()
    if not ano:
        ano = hoje.year
    hora_atual = min(datetime.now().hour, 17)

    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo_equipe:
        profs = [p for p in profs if p["tipo"] == tipo_equipe]
    if profissional_id:
        profs = [p for p in profs if p["id"] == profissional_id]

    MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

    meses_resultado = []
    total_ano = 0
    acum_tipos_ano: dict[str, dict] = {}

    for mes in range(1, 13):
        _, dias_no_mes = calendar.monthrange(ano, mes)
        total_mes = 0
        acum_tipos: dict[str, dict] = {}
        dias_uteis = 0
        mes_passado = (date(ano, mes, 1) <= hoje)

        if not mes_passado:
            meses_resultado.append({
                "mes": mes, "label": MESES_PT[mes - 1],
                "total": None, "dias_uteis": 0,
                "tipos": [], "is_futuro": True,
            })
            continue

        for d in range(1, dias_no_mes + 1):
            fator = _fator_dia(ano, mes, d, hoje, hora_atual)
            if fator < 0:
                continue
            dias_uteis += 1
            for prof in profs:
                for prod in _prod_prof_dia(prof, ano, mes, d, fator):
                    k = prod["tipo"]
                    if k not in acum_tipos:
                        acum_tipos[k] = {"tipo": k, "label": prod["label"], "grupo": prod["grupo"], "realizado": 0, "meta": 0}
                    acum_tipos[k]["realizado"] += prod["realizado"]
                    acum_tipos[k]["meta"]      += prod["meta"]
                    total_mes += prod["realizado"]
                    # acumulado anual por tipo
                    if k not in acum_tipos_ano:
                        acum_tipos_ano[k] = {"tipo": k, "label": prod["label"], "grupo": prod["grupo"], "realizado": 0, "meta": 0}
                    acum_tipos_ano[k]["realizado"] += prod["realizado"]
                    acum_tipos_ano[k]["meta"]      += prod["meta"]

        total_ano += total_mes
        tipos_lista = sorted(acum_tipos.values(), key=lambda x: -x["realizado"])
        for item in tipos_lista:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        meses_resultado.append({
            "mes": mes, "label": MESES_PT[mes - 1],
            "total": total_mes, "dias_uteis": dias_uteis,
            "tipos": tipos_lista, "is_futuro": False,
            "media_dia": round(total_mes / max(dias_uteis, 1), 1),
        })

    tipos_ano = sorted(acum_tipos_ano.values(), key=lambda x: -x["realizado"])
    for item in tipos_ano:
        item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

    return {
        "ano": ano,
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "total_ano": total_ano,
        "total_tipos": len(tipos_ano),
        "profissionais_filtro": len(profs),
        "meses": meses_resultado,
        "por_tipo_ano": tipos_ano,
    }


@router.get("/gerar")
async def gerar_relatorio(
    tipo: str = Query(default="mensal"),   # diario | mensal | anual
    dia: int = Query(default=None),
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    equipe: Optional[str] = Query(default=None),
    tipo_equipe: Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
):
    """Dados estruturados para geração de relatório imprimível."""
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    if not dia:
        dia = hoje.day
    hora_atual = min(datetime.now().hour, 17)

    profs = _PROFISSIONAIS
    if equipe:
        profs = [p for p in profs if p["equipe"] == equipe]
    if tipo_equipe:
        profs = [p for p in profs if p["tipo"] == tipo_equipe]
    if profissional_id:
        profs = [p for p in profs if p["id"] == profissional_id]

    MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

    cabecalho = {
        "municipio": "Apuí / AM",
        "ibge": "1300144",
        "secretaria": "Secretaria Municipal de Saúde",
        "sistema": "ERSUS 360",
        "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "gerado_por": "Gestor Municipal de Saúde",
        "tipo": tipo,
        "equipe_filtro": equipe or tipo_equipe or "Todas as equipes",
        "profissional_filtro": next((p["nome"] for p in _PROFISSIONAIS if p["id"] == profissional_id), "Todos") if profissional_id else "Todos",
    }

    if tipo == "diario":
        data_ref = date(ano, mes, dia)
        fator = _fator_dia(ano, mes, dia, hoje, hora_atual)
        fator = max(fator, 0)
        acum: dict[str, dict] = {}
        profs_prod = []
        for prof in profs:
            tipos_p = _prod_prof_dia(prof, ano, mes, dia, fator)
            total_p = sum(t["realizado"] for t in tipos_p)
            meta_p  = sum(t["meta"]      for t in tipos_p)
            pct_p   = round(total_p / max(meta_p, 1) * 100, 1)
            profs_prod.append({**prof, "total": total_p, "meta": meta_p, "pct": pct_p,
                               "tipos": sorted(tipos_p, key=lambda x: -x["realizado"])})
            for t in tipos_p:
                k = t["tipo"]
                if k not in acum:
                    acum[k] = {"tipo": k, "label": t["label"], "grupo": t["grupo"], "realizado": 0, "meta": 0}
                acum[k]["realizado"] += t["realizado"]
                acum[k]["meta"]      += t["meta"]

        tipos_list = sorted(acum.values(), key=lambda x: -x["realizado"])
        for item in tipos_list:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        return {
            "cabecalho": {**cabecalho, "periodo": f"{dia:02d}/{mes:02d}/{ano}", "titulo": f"Relatório Diário de Produção — {data_ref.strftime('%d/%m/%Y')}"},
            "resumo": {"total": sum(t["realizado"] for t in tipos_list), "meta": sum(t["meta"] for t in tipos_list), "n_profissionais": len(profs_prod)},
            "por_tipo": tipos_list,
            "por_profissional": sorted(profs_prod, key=lambda x: -x["total"]),
        }

    elif tipo == "anual":
        resp = await relatorio_anual(ano=ano, equipe=equipe, tipo_equipe=tipo_equipe, profissional_id=profissional_id)
        return {
            "cabecalho": {**cabecalho, "periodo": str(ano), "titulo": f"Relatório Anual de Produção — {ano}"},
            **resp,
        }

    else:  # mensal (default)
        _, dias_no_mes = calendar.monthrange(ano, mes)
        acum: dict[str, dict] = {}
        profs_acum: dict[str, dict] = {}
        dias_result = []
        total_mes = 0
        dias_uteis = 0

        for d in range(1, dias_no_mes + 1):
            fator = _fator_dia(ano, mes, d, hoje, hora_atual)
            is_futuro = fator == -1.0
            is_fds    = fator == -2.0
            if is_futuro or is_fds:
                dias_result.append({"dia": d, "data": date(ano,mes,d).strftime("%d/%m"), "is_util": not is_fds, "is_futuro": is_futuro, "total": None})
                continue
            dias_uteis += 1
            total_dia = 0
            for prof in profs:
                pid = prof["id"]
                if pid not in profs_acum:
                    profs_acum[pid] = {**prof, "total": 0, "meta": 0, "tipos": {}}
                for t in _prod_prof_dia(prof, ano, mes, d, fator):
                    k = t["tipo"]
                    profs_acum[pid]["total"] += t["realizado"]
                    profs_acum[pid]["meta"]  += t["meta"]
                    if k not in profs_acum[pid]["tipos"]:
                        profs_acum[pid]["tipos"][k] = {"label": t["label"], "grupo": t["grupo"], "realizado": 0, "meta": 0}
                    profs_acum[pid]["tipos"][k]["realizado"] += t["realizado"]
                    profs_acum[pid]["tipos"][k]["meta"]      += t["meta"]
                    if k not in acum:
                        acum[k] = {"tipo": k, "label": t["label"], "grupo": t["grupo"], "realizado": 0, "meta": 0}
                    acum[k]["realizado"] += t["realizado"]
                    acum[k]["meta"]      += t["meta"]
                    total_dia += t["realizado"]
            total_mes += total_dia
            dias_result.append({"dia": d, "data": date(ano,mes,d).strftime("%d/%m"), "dia_semana": date(ano,mes,d).strftime("%a").upper(), "is_util": True, "is_futuro": False, "total": total_dia})

        tipos_list = sorted(acum.values(), key=lambda x: -x["realizado"])
        for item in tipos_list:
            item["pct"] = round(item["realizado"] / max(item["meta"], 1) * 100, 1)

        profs_list = sorted(profs_acum.values(), key=lambda x: -x["total"])
        for p in profs_list:
            p["pct"] = round(p["total"] / max(p["meta"], 1) * 100, 1)
            p["tipos"] = sorted(p["tipos"].values(), key=lambda x: -x["realizado"])
            for t in p["tipos"]:
                t["pct"] = round(t["realizado"] / max(t["meta"], 1) * 100, 1)

        # por grupo
        por_grupo: dict[str, list] = {}
        for t in tipos_list:
            por_grupo.setdefault(t["grupo"], []).append(t)

        return {
            "cabecalho": {**cabecalho, "periodo": f"{MESES_PT[mes-1]}/{ano}", "titulo": f"Relatório Mensal de Produção — {MESES_PT[mes-1]}/{ano}"},
            "resumo": {"total": total_mes, "meta": sum(t["meta"] for t in tipos_list), "dias_uteis": dias_uteis, "n_profissionais": len(profs_list), "media_dia": round(total_mes / max(dias_uteis, 1))},
            "por_tipo": tipos_list,
            "por_grupo": [{"grupo": g, "tipos": ts, "total": sum(t["realizado"] for t in ts)} for g, ts in sorted(por_grupo.items())],
            "por_profissional": profs_list,
            "dias": dias_result,
        }
