"""
Monitoramento em Tempo Real — Atendimentos, Equipes e Produção Completa
Apuí/AM · ESF + ESB (Odontologia) + eMulti + ACS
"""
from __future__ import annotations
import calendar
from datetime import date, datetime
from random import Random
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/monitoramento-rt", tags=["monitoramento_rt"])

# ── Equipes ───────────────────────────────────────────────────────────────────
# UBS conforme CNES (consultado Jul/2026): cnes.datasus.gov.br — Apuí/AM
@lru_cache(maxsize=1)
def _EQUIPES_ESF():
    return [
        {"id": "ESF-01", "nome": "CACHOEIRA",      "ubs": "UBS Irmã Elizabete",                         "cnes": "3320138", "tipo": "eSF", "ine": "0001483724"},
        {"id": "ESF-02", "nome": "SÃO SEBASTIÃO",  "ubs": "UBS Anizio Ferreira da Silva",               "cnes": "2013312", "tipo": "eSF", "ine": "0001483732"},
        {"id": "ESF-03", "nome": "ACARI",           "ubs": "UBS Anizio Ferreira da Silva",               "cnes": "2013312", "tipo": "eSF", "ine": "0001483740"},
        {"id": "ESF-04", "nome": "TRÊS ESTADOS",    "ubs": "UBS Osvaldo Lemes Cabral",                   "cnes": "9934448", "tipo": "eSF", "ine": "0001483759"},
        {"id": "ESF-05", "nome": "JUMA",            "ubs": "Centro de Saúde Curumim",                    "cnes": "3697983", "tipo": "eSF", "ine": "0001483767"},
        {"id": "ESF-06", "nome": "LIBERDADE",       "ubs": "Centro de Saúde Curumim",                    "cnes": "3697983", "tipo": "eSF", "ine": "0001483775"},
        {"id": "ESF-07", "nome": "KENNEDY",         "ubs": "UBS Padre Faliero Bonci",                    "cnes": "2013304", "tipo": "eSF", "ine": "0001483783"},
        {"id": "ESF-08", "nome": "JK",              "ubs": "UBS JK",                                     "cnes": "2013290", "tipo": "eSF", "ine": "0001483791"},
        {"id": "ESF-09", "nome": "ESTRADA NOVA",    "ubs": "UBS Claudia Pereira dos Santos Damacena",    "cnes": "9942122", "tipo": "eSF", "ine": "0001483805"},
    ]


@lru_cache(maxsize=1)
def _EQUIPES_ESB():
    return [
        {"id": "ESB-01", "nome": "ESB I — CACHOEIRA",        "ubs": "UBS Irmã Elizabete",                "cnes": "3320138", "tipo": "eSB", "ine": "0001483820"},
        {"id": "ESB-02", "nome": "ESB II — SÃO SEBASTIÃO",   "ubs": "UBS Anizio Ferreira da Silva",      "cnes": "2013312", "tipo": "eSB", "ine": "0001483839"},
        {"id": "ESB-03", "nome": "ESB III — CEO Apuí",        "ubs": "Centro de Saúde Curumim",           "cnes": "3697983", "tipo": "eSB", "ine": "0001483847"},
    ]


@lru_cache(maxsize=1)
def _EQUIPES_EMULTI():
    return [
        {"id": "eM-01",  "nome": "eMulti Apuí",     "ubs": "Núcleo eMulti SMS",   "tipo": "eMulti", "ine": "0001483901"},
    ]


# ── Profissionais — ESF ───────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _PROFS_ESF():
    return [
        # CACHOEIRA
        {"id":"P001","equipe":"CACHOEIRA",     "nome":"Dr. João Carlos Fonseca",       "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4318 2456","tipo_equipe":"ESF"},
        {"id":"P002","equipe":"CACHOEIRA",     "nome":"Enf. Maria da Conceição Silva",  "cbo":"Enfermeiro",                       "cns":"700 8012 4319 3344","tipo_equipe":"ESF"},
        {"id":"P003","equipe":"CACHOEIRA",     "nome":"Téc. José Raimundo Almeida",     "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4320 5566","tipo_equipe":"ESF"},
        {"id":"P004","equipe":"CACHOEIRA",     "nome":"ACS Marcos Antônio Lima",        "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4322 9900","tipo_equipe":"ESF"},
        {"id":"P005","equipe":"CACHOEIRA",     "nome":"ACS Lúcia Aparecida Souza",      "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4323 1122","tipo_equipe":"ESF"},
        {"id":"P006","equipe":"CACHOEIRA",     "nome":"ACS Francisco das Chagas",       "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4324 2233","tipo_equipe":"ESF"},
        # SÃO SEBASTIÃO
        {"id":"P007","equipe":"SÃO SEBASTIÃO","nome":"Dr. Raimundo Nonato Ferreira",   "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4325 3344","tipo_equipe":"ESF"},
        {"id":"P008","equipe":"SÃO SEBASTIÃO","nome":"Enf. Francisca Nunes Pereira",   "cbo":"Enfermeiro",                       "cns":"700 8012 4326 5566","tipo_equipe":"ESF"},
        {"id":"P009","equipe":"SÃO SEBASTIÃO","nome":"Téc. Antônia Rocha Barbosa",     "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4327 7788","tipo_equipe":"ESF"},
        {"id":"P010","equipe":"SÃO SEBASTIÃO","nome":"ACS Paulo César Mendes",         "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4328 9900","tipo_equipe":"ESF"},
        {"id":"P011","equipe":"SÃO SEBASTIÃO","nome":"ACS Rosária Bezerra Santos",     "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4329 1122","tipo_equipe":"ESF"},
        # ACARI
        {"id":"P012","equipe":"ACARI",         "nome":"Dra. Suely de Moraes Costa",    "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4330 3344","tipo_equipe":"ESF"},
        {"id":"P013","equipe":"ACARI",         "nome":"Enf. Roberto Carlos da Costa",  "cbo":"Enfermeiro",                       "cns":"700 8012 4331 5566","tipo_equipe":"ESF"},
        {"id":"P014","equipe":"ACARI",         "nome":"Téc. Joana Pereira Teixeira",   "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4332 7788","tipo_equipe":"ESF"},
        {"id":"P015","equipe":"ACARI",         "nome":"ACS Benedita dos Santos Lima",  "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4333 9900","tipo_equipe":"ESF"},
        {"id":"P016","equipe":"ACARI",         "nome":"ACS Edilson Freire Cardoso",    "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4334 1122","tipo_equipe":"ESF"},
        # TRÊS ESTADOS
        {"id":"P017","equipe":"TRÊS ESTADOS",  "nome":"Dr. Manoel Oliveira Júnior",    "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4335 3344","tipo_equipe":"ESF"},
        {"id":"P018","equipe":"TRÊS ESTADOS",  "nome":"Enf. Cláudia Lima Figueiredo", "cbo":"Enfermeiro",                       "cns":"700 8012 4336 5566","tipo_equipe":"ESF"},
        {"id":"P019","equipe":"TRÊS ESTADOS",  "nome":"Téc. Sandro Freitas Moura",    "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4337 7788","tipo_equipe":"ESF"},
        {"id":"P020","equipe":"TRÊS ESTADOS",  "nome":"ACS Terezinha Barbosa Nunes",  "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4338 9900","tipo_equipe":"ESF"},
        {"id":"P021","equipe":"TRÊS ESTADOS",  "nome":"ACS Gilmar Pinheiro Ramos",    "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4339 1122","tipo_equipe":"ESF"},
        # JUMA
        {"id":"P022","equipe":"JUMA",          "nome":"Dra. Patrícia Carvalho Matos", "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4340 3344","tipo_equipe":"ESF"},
        {"id":"P023","equipe":"JUMA",          "nome":"Enf. Wagner Pinheiro Sousa",   "cbo":"Enfermeiro",                       "cns":"700 8012 4341 5566","tipo_equipe":"ESF"},
        {"id":"P024","equipe":"JUMA",          "nome":"Téc. Rosimeire Tavares Cruz",  "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4342 7788","tipo_equipe":"ESF"},
        {"id":"P025","equipe":"JUMA",          "nome":"ACS Gilberto Nascimento Dias", "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4343 9900","tipo_equipe":"ESF"},
        {"id":"P026","equipe":"JUMA",          "nome":"ACS Marinalva Gomes Viana",    "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4344 1122","tipo_equipe":"ESF"},
        # LIBERDADE
        {"id":"P027","equipe":"LIBERDADE",     "nome":"Dr. André Luís Monteiro",      "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4345 3344","tipo_equipe":"ESF"},
        {"id":"P028","equipe":"LIBERDADE",     "nome":"Enf. Simone Araújo Corrêa",   "cbo":"Enfermeiro",                       "cns":"700 8012 4346 5566","tipo_equipe":"ESF"},
        {"id":"P029","equipe":"LIBERDADE",     "nome":"Téc. Valdinei Cruz Farias",   "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4347 7788","tipo_equipe":"ESF"},
        {"id":"P030","equipe":"LIBERDADE",     "nome":"ACS Neuza Correia Batista",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4348 9900","tipo_equipe":"ESF"},
        {"id":"P031","equipe":"LIBERDADE",     "nome":"ACS Irene Soares Mendonça",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4349 1122","tipo_equipe":"ESF"},
        {"id":"P032","equipe":"LIBERDADE",     "nome":"ACS Davi Almeida Ferraz",     "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4350 2233","tipo_equipe":"ESF"},
        # KENNEDY
        {"id":"P033","equipe":"KENNEDY",       "nome":"Dra. Fernanda Ramos Leite",   "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4351 3344","tipo_equipe":"ESF"},
        {"id":"P034","equipe":"KENNEDY",       "nome":"Enf. Cícero Viana Lopes",     "cbo":"Enfermeiro",                       "cns":"700 8012 4352 5566","tipo_equipe":"ESF"},
        {"id":"P035","equipe":"KENNEDY",       "nome":"Téc. Marinete Alves Borges",  "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4353 7788","tipo_equipe":"ESF"},
        {"id":"P036","equipe":"KENNEDY",       "nome":"ACS Iramar Sousa Campos",     "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4354 9900","tipo_equipe":"ESF"},
        {"id":"P037","equipe":"KENNEDY",       "nome":"ACS Zelinda Pires Duarte",    "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4355 1122","tipo_equipe":"ESF"},
        # JK
        {"id":"P038","equipe":"JK",            "nome":"Dr. Itamar Figueiredo Luz",   "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4356 3344","tipo_equipe":"ESF"},
        {"id":"P039","equipe":"JK",            "nome":"Enf. Eliane Brito Cardoso",   "cbo":"Enfermeiro",                       "cns":"700 8012 4357 5566","tipo_equipe":"ESF"},
        {"id":"P040","equipe":"JK",            "nome":"Téc. Osmar Teixeira Vieira",  "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4358 7788","tipo_equipe":"ESF"},
        {"id":"P041","equipe":"JK",            "nome":"ACS Verônica Dias Queiroz",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4359 9900","tipo_equipe":"ESF"},
        {"id":"P042","equipe":"JK",            "nome":"ACS Cleison Matos Andrade",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4360 1122","tipo_equipe":"ESF"},
        # ESTRADA NOVA
        {"id":"P043","equipe":"ESTRADA NOVA",  "nome":"Dra. Aldira Mendes Castilho", "cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4361 3344","tipo_equipe":"ESF"},
        {"id":"P044","equipe":"ESTRADA NOVA",  "nome":"Enf. Nilton Barros Siqueira", "cbo":"Enfermeiro",                       "cns":"700 8012 4362 5566","tipo_equipe":"ESF"},
        {"id":"P045","equipe":"ESTRADA NOVA",  "nome":"Téc. Eronildes Castro Lima",  "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4363 7788","tipo_equipe":"ESF"},
        {"id":"P046","equipe":"ESTRADA NOVA",  "nome":"ACS Zuleide Farias Maciel",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4364 9900","tipo_equipe":"ESF"},
        {"id":"P047","equipe":"ESTRADA NOVA",  "nome":"ACS Adeílson Luz Pinheiro",   "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4365 1122","tipo_equipe":"ESF"},
        # RIBEIRINHA
        {"id":"P048","equipe":"RIBEIRINHA",    "nome":"Dr. Sebastião Pereira da Cruz","cbo":"Médico de Família e Comunidade",   "cns":"700 8012 4366 3344","tipo_equipe":"ESF"},
        {"id":"P049","equipe":"RIBEIRINHA",    "nome":"Enf. Dalva Santos Ribeiro",    "cbo":"Enfermeiro",                       "cns":"700 8012 4367 5566","tipo_equipe":"ESF"},
        {"id":"P050","equipe":"RIBEIRINHA",    "nome":"Téc. Ediomar Lopes Tavares",   "cbo":"Técnico de Enfermagem",            "cns":"700 8012 4368 7788","tipo_equipe":"ESF"},
        {"id":"P051","equipe":"RIBEIRINHA",    "nome":"ACS Antônio Nascimento Flexa", "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4369 9900","tipo_equipe":"ESF"},
        {"id":"P052","equipe":"RIBEIRINHA",    "nome":"ACS Raimunda Lima Pantoja",    "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4370 1122","tipo_equipe":"ESF"},
        {"id":"P053","equipe":"RIBEIRINHA",    "nome":"ACS Djanilson Costa Ferreira", "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4371 2233","tipo_equipe":"ESF"},
        {"id":"P054","equipe":"RIBEIRINHA",    "nome":"ACS Gleiciane Nunes Barbosa",  "cbo":"Agente Comunitário de Saúde",      "cns":"700 8012 4372 4455","tipo_equipe":"ESF"},
    ]


# ── Profissionais — ESB (Odontologia) ─────────────────────────────────────────
@lru_cache(maxsize=1)
def _PROFS_ESB():
    return [
        {"id":"D001","equipe":"ESB I — CACHOEIRA",      "nome":"Dr. Carlos Henrique Bezerra",     "cbo":"Cirurgião-Dentista",              "cns":"700 8012 4370 2233","tipo_equipe":"ESB"},
        {"id":"D002","equipe":"ESB I — CACHOEIRA",      "nome":"ASB Marta Cristina Sousa",        "cbo":"Auxiliar em Saúde Bucal",         "cns":"700 8012 4371 4455","tipo_equipe":"ESB"},
        {"id":"D003","equipe":"ESB I — CACHOEIRA",      "nome":"TSB Renato Alves Martins",        "cbo":"Técnico em Saúde Bucal",          "cns":"700 8012 4372 6677","tipo_equipe":"ESB"},
        {"id":"D004","equipe":"ESB II — SÃO SEBASTIÃO", "nome":"Dra. Ana Cristina Monteiro",      "cbo":"Cirurgião-Dentista",              "cns":"700 8012 4373 8899","tipo_equipe":"ESB"},
        {"id":"D005","equipe":"ESB II — SÃO SEBASTIÃO", "nome":"ASB Fátima Regina Oliveira",      "cbo":"Auxiliar em Saúde Bucal",         "cns":"700 8012 4374 0011","tipo_equipe":"ESB"},
        {"id":"D006","equipe":"ESB III — CEO Apuí",     "nome":"Dr. Eduardo Pinto Lacerda",       "cbo":"Cirurgião-Dentista",              "cns":"700 8012 4375 2233","tipo_equipe":"ESB"},
        {"id":"D007","equipe":"ESB III — CEO Apuí",     "nome":"Esp. Sandra Lima Cavalcante",     "cbo":"Cirurgião-Dentista Especialista", "cns":"700 8012 4376 4455","tipo_equipe":"ESB"},
        {"id":"D008","equipe":"ESB III — CEO Apuí",     "nome":"ASB Josefa Alencar Prado",        "cbo":"Auxiliar em Saúde Bucal",         "cns":"700 8012 4377 6677","tipo_equipe":"ESB"},
    ]


# ── Profissionais — eMulti ────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _PROFS_EMULTI():
    return [
        {"id":"M001","equipe":"eMulti Apuí","nome":"Fisiot. Luciana Borges Maia",      "cbo":"Fisioterapeuta",             "cns":"700 8012 4380 1122","tipo_equipe":"eMulti"},
        {"id":"M002","equipe":"eMulti Apuí","nome":"Nutr. Camila Ferreira Lopes",      "cbo":"Nutricionista",              "cns":"700 8012 4381 3344","tipo_equipe":"eMulti"},
        {"id":"M003","equipe":"eMulti Apuí","nome":"Psic. Débora Santana Furtado",     "cbo":"Psicólogo",                  "cns":"700 8012 4382 5566","tipo_equipe":"eMulti"},
        {"id":"M004","equipe":"eMulti Apuí","nome":"A.S. Vanessa Coelho Rodrigues",    "cbo":"Assistente Social",          "cns":"700 8012 4383 7788","tipo_equipe":"eMulti"},
        {"id":"M005","equipe":"eMulti Apuí","nome":"Farm. Tiago Nunes Cavalcante",     "cbo":"Farmacêutico",               "cns":"700 8012 4384 9900","tipo_equipe":"eMulti"},
        {"id":"M006","equipe":"eMulti Apuí","nome":"Ed.Fis. Marcos Pinheiro Freitas", "cbo":"Educador Físico",            "cns":"700 8012 4385 1122","tipo_equipe":"eMulti"},
        {"id":"M007","equipe":"eMulti Apuí","nome":"Fonoaud. Priscila Arruda Costa",   "cbo":"Fonoaudiólogo",              "cns":"700 8012 4386 3344","tipo_equipe":"eMulti"},
    ]


# Todos juntos
_TODOS_PROFS = _PROFS_ESF() + _PROFS_ESB() + _PROFS_EMULTI()

# ── Parâmetros de produção por CBO ────────────────────────────────────────────
@lru_cache(maxsize=1)
def _PROD():
    return {
        "Médico de Família e Comunidade": {
            "consulta_medica":         {"meta": 20, "label": "Consultas Médicas"},
            "consulta_prenatal":       {"meta":  3, "label": "Pré-natal"},
            "consulta_puericultura":   {"meta":  2, "label": "Puericultura"},
            "atend_has_dm":            {"meta":  4, "label": "Atend. HAS/DM"},
            "procedimento":            {"meta":  5, "label": "Procedimentos"},
            "encaminhamento":          {"meta":  3, "label": "Encaminhamentos"},
            "receita_medicamento":     {"meta": 12, "label": "Receitas"},
            "atestado_medico":         {"meta":  4, "label": "Atestados"},
        },
        "Enfermeiro": {
            "consulta_enfermagem":     {"meta": 16, "label": "Consultas Enf."},
            "consulta_prenatal_enf":   {"meta":  3, "label": "Pré-natal Enf."},
            "consulta_puerperal":      {"meta":  2, "label": "Consulta Puerperal"},
            "visita_domiciliar":       {"meta":  8, "label": "Visitas Domiciliares"},
            "procedimento_enf":        {"meta": 10, "label": "Procedimentos"},
            "coleta_citopatologico":   {"meta":  4, "label": "Citopatológico"},
            "atividade_coletiva":      {"meta":  2, "label": "Atividades Coletivas"},
            "supervisao_acs":          {"meta":  1, "label": "Supervisão ACS"},
        },
        "Técnico de Enfermagem": {
            "procedimento_tec":        {"meta": 25, "label": "Procedimentos"},
            "vacina_administrada":     {"meta": 12, "label": "Vacinas"},
            "aferição_pa":             {"meta": 20, "label": "Aferições PA"},
            "glicemia_capilar":        {"meta": 10, "label": "Glicemia Capilar"},
            "curativo":                {"meta":  6, "label": "Curativos"},
            "inalacao_nebulizacao":    {"meta":  5, "label": "Inalações"},
            "coleta_material":         {"meta":  4, "label": "Coleta de Material"},
            "administracao_medicamento":{"meta": 8, "label": "Medicamentos Admin."},
        },
        "Agente Comunitário de Saúde": {
            "visita_domiciliar_acs":   {"meta": 14, "label": "Visitas Domiciliares"},
            "cadastro_individual":     {"meta":  4, "label": "Cadastros Indiv."},
            "cadastro_domiciliar":     {"meta":  2, "label": "Cadastros Domic."},
            "busca_ativa":             {"meta":  6, "label": "Busca Ativa"},
            "acomp_gestante":          {"meta":  3, "label": "Acomp. Gestantes"},
            "acomp_crianca":           {"meta":  4, "label": "Acomp. Crianças <2a"},
            "acomp_has_dm":            {"meta":  5, "label": "Acomp. HAS/DM"},
            "orientacao_saude":        {"meta":  4, "label": "Orientações em Saúde"},
        },
        "Cirurgião-Dentista": {
            "consulta_odontologica":   {"meta": 14, "label": "Consultas Odonto."},
            "primeira_consulta":       {"meta":  6, "label": "1ª Consulta Prog."},
            "escovacao_supervisionada":{"meta":  8, "label": "Escovação Superv."},
            "aplicacao_fluor":         {"meta":  6, "label": "Aplicação de Flúor"},
            "restauracao_dente":       {"meta":  5, "label": "Restaurações"},
            "extracao_dentaria":       {"meta":  3, "label": "Extrações"},
            "tratamento_canal":        {"meta":  1, "label": "Tratamento de Canal"},
            "urgencia_odontologica":   {"meta":  2, "label": "Urgências"},
            "atividade_educativa_odo": {"meta":  2, "label": "Ativ. Educativas"},
        },
        "Cirurgião-Dentista Especialista": {
            "consulta_odonto_esp":     {"meta": 12, "label": "Consultas Especialidade"},
            "periodontia":             {"meta":  4, "label": "Periodontia"},
            "endodontia":              {"meta":  3, "label": "Endodontia"},
            "cirurgia_oral_menor":     {"meta":  2, "label": "Cirurgia Oral Menor"},
            "protese_dentaria":        {"meta":  2, "label": "Prótese Dentária"},
            "diagnostico_bucal":       {"meta":  3, "label": "Diagnóstico Bucal"},
        },
        "Auxiliar em Saúde Bucal": {
            "assist_consulta_odonto":  {"meta": 20, "label": "Assist. em Consultas"},
            "esterilizacao_material":  {"meta": 15, "label": "Esterilização"},
            "educacao_saude_bucal":    {"meta":  4, "label": "Educação Bucal"},
            "triagem_odontologica":    {"meta":  8, "label": "Triagem Odontológica"},
        },
        "Técnico em Saúde Bucal": {
            "procedimento_tsb":        {"meta": 16, "label": "Procedimentos TSB"},
            "moldagem_protese":        {"meta":  3, "label": "Moldagem p/ Prótese"},
            "radiografia_odonto":      {"meta":  6, "label": "Radiografias"},
            "esterilizacao_tsb":       {"meta": 12, "label": "Esterilização"},
        },
        "Fisioterapeuta": {
            "atend_fisioterapia":      {"meta": 18, "label": "Atend. Fisioterapia"},
            "atend_compartilhado":     {"meta":  4, "label": "Atend. Compartilhado"},
            "atividade_coletiva_fis":  {"meta":  2, "label": "Atividades Coletivas"},
            "visita_dom_fis":          {"meta":  3, "label": "Visitas Domiciliares"},
        },
        "Nutricionista": {
            "consulta_nutricional":    {"meta": 16, "label": "Consultas Nutricionais"},
            "avaliacao_anthropometrica":{"meta": 10, "label": "Avaliação Antrop."},
            "atividade_educativa_nut": {"meta":  3, "label": "Ativ. Educativas"},
            "atend_sisvan":            {"meta":  6, "label": "Atend. SISVAN"},
            "atend_compartilhado_nut": {"meta":  4, "label": "Atend. Compartilhado"},
        },
        "Psicólogo": {
            "consulta_psicologia":     {"meta": 18, "label": "Consultas Psicologia"},
            "grupo_terapeutico":       {"meta":  2, "label": "Grupos Terapêuticos"},
            "atend_saude_mental":      {"meta":  4, "label": "Atend. Saúde Mental"},
            "atend_compartilhado_psi": {"meta":  3, "label": "Atend. Compartilhado"},
            "orientacao_familiar":     {"meta":  2, "label": "Orientação Familiar"},
        },
        "Assistente Social": {
            "atend_servico_social":    {"meta": 15, "label": "Atend. Serv. Social"},
            "orientacao_social":       {"meta":  8, "label": "Orientações Sociais"},
            "visita_dom_as":           {"meta":  4, "label": "Visitas Domiciliares"},
            "encaminhamento_social":   {"meta":  6, "label": "Encaminhamentos"},
            "grupo_apoio":             {"meta":  2, "label": "Grupos de Apoio"},
        },
        "Farmacêutico": {
            "dispensacao_medicamento":  {"meta": 40, "label": "Dispensações"},
            "consulta_farmaceutica":    {"meta":  8, "label": "Consultas Farm."},
            "reconciliacao_medicamentos":{"meta": 5, "label": "Reconciliação Medicam."},
            "educacao_farmaceutica":    {"meta":  3, "label": "Educação Farm."},
        },
        "Educador Físico": {
            "grupo_atividade_fisica":  {"meta":  4, "label": "Grupos Ativ. Física"},
            "avaliacao_fisica":        {"meta":  8, "label": "Avaliações Físicas"},
            "atend_individual_ef":     {"meta": 10, "label": "Atend. Individuais"},
            "orientacao_pratica":      {"meta":  6, "label": "Orientações Práticas"},
        },
        "Fonoaudiólogo": {
            "consulta_fonoaudiologia": {"meta": 16, "label": "Consultas Fono"},
            "triagem_auditiva":        {"meta":  6, "label": "Triagem Auditiva"},
            "atend_deglutição":        {"meta":  4, "label": "Atend. Deglutição"},
            "grupo_linguagem":         {"meta":  2, "label": "Grupos de Linguagem"},
        },
    }


# ── Indicadores Novo Financiamento APS (por equipe ESF) ────────────────────────────────
@lru_cache(maxsize=1)
def _INDICADORES_PREVINE():
    return [
        {"ind": "ind1", "label": "Pré-natal ≥7 consultas",              "meta_pct": 60.0, "peso": 1},
        {"ind": "ind2", "label": "Gestante c/ exames 1º trimestre",     "meta_pct": 60.0, "peso": 1},
        {"ind": "ind3", "label": "Vacinação BCG + HB + Penta (crianças)","meta_pct": 95.0, "peso": 1},
        {"ind": "ind4", "label": "Consulta puerperal 1ª semana",        "meta_pct": 60.0, "peso": 1},
        {"ind": "ind5", "label": "Rastreamento câncer colo útero",      "meta_pct": 60.0, "peso": 1},
        {"ind": "ind6", "label": "HAS — PA aferida últimos 12m",        "meta_pct": 50.0, "peso": 1},
        {"ind": "ind7", "label": "DM — HbA1c/glicemia últimos 12m",     "meta_pct": 50.0, "peso": 1},
    ]


# Indicadores Odontologia (PMAQ/Previne)
@lru_cache(maxsize=1)
def _INDICADORES_ODO():
    return [
        {"ind": "odo1", "label": "1ª Consulta Odontológica Programática","meta_pct": 70.0},
        {"ind": "odo2", "label": "Cobertura de Escovação Supervisionada","meta_pct": 60.0},
        {"ind": "odo3", "label": "Procedimentos Coletivos em Saúde Bucal","meta_pct": 65.0},
        {"ind": "odo4", "label": "Conclusão de Tratamento Odontológico", "meta_pct": 55.0},
        {"ind": "odo5", "label": "Urgências Odontológicas Atendidas",    "meta_pct": 80.0},
    ]



def _seed(uid: str, hora: int) -> int:
    return hash(f"{uid}{date.today().isoformat()}{hora}") % 10000


def _prod_prof(prof: dict, hora: int) -> dict:
    """Produção acumulada do profissional até a hora atual."""
    rng   = Random(_seed(prof["id"], hora))
    base  = _PROD().get(prof["cbo"], {"atendimento": {"meta": 10, "label": "Atendimentos"}})
    fator = min((hora - 7) / 10, 1.0) if hora > 7 else 0.0

    producao: list[dict] = []
    total = 0
    meta_total = 0
    for tipo, cfg in base.items():
        meta_hora = cfg["meta"] * fator
        realizado = int(meta_hora * rng.uniform(0.65, 1.2)) if fator > 0 else 0
        producao.append({
            "tipo": tipo,
            "label": cfg["label"],
            "realizado": realizado,
            "meta_dia": cfg["meta"],
            "pct": round(realizado / cfg["meta"] * 100, 1) if cfg["meta"] > 0 else 0,
        })
        total      += realizado
        meta_total += cfg["meta"]

    pct_meta = round(total / max(meta_total * fator, 1) * 100, 1) if fator > 0 else 0
    status = "normal" if pct_meta >= 75 else "atencao" if pct_meta >= 50 else "critico"

    return {
        **prof,
        "producao_detalhada": sorted(producao, key=lambda x: -x["realizado"]),
        "total_atendimentos":  total,
        "meta_dia":           meta_total,
        "pct_meta":           pct_meta,
        "status":             status,
        "ultimo_registro":    f"{hora - rng.randint(0,1):02d}:{rng.randint(0,59):02d}" if hora > 7 else "—",
    }


def _indicadores_equipe(equipe_nome: str, hora: int) -> list[dict]:
    rng = Random(_seed(f"ind_{equipe_nome}", hora))
    resultado = []
    for ind in _INDICADORES_PREVINE():
        base_val = rng.uniform(ind["meta_pct"] * 0.55, ind["meta_pct"] * 1.25)
        resultado_pct = round(min(base_val, 100), 1)
        resultado.append({
            **ind,
            "resultado_pct": resultado_pct,
            "status": "verde" if resultado_pct >= ind["meta_pct"] else "amarelo" if resultado_pct >= ind["meta_pct"] * 0.7 else "vermelho",
        })
    return resultado


def _indicadores_odo(equipe_nome: str, hora: int) -> list[dict]:
    rng = Random(_seed(f"odo_{equipe_nome}", hora))
    resultado = []
    for ind in _INDICADORES_ODO():
        base_val = rng.uniform(ind["meta_pct"] * 0.6, ind["meta_pct"] * 1.2)
        resultado_pct = round(min(base_val, 100), 1)
        resultado.append({
            **ind,
            "resultado_pct": resultado_pct,
            "status": "verde" if resultado_pct >= ind["meta_pct"] else "amarelo" if resultado_pct >= ind["meta_pct"] * 0.7 else "vermelho",
        })
    return resultado


def _hora_atual() -> int:
    h = datetime.now().hour
    return max(7, min(h, 17))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    agora = datetime.now()
    hora  = _hora_atual()
    todos = [_prod_prof(p, hora) for p in _TODOS_PROFS]

    total_atend = sum(p["total_atendimentos"] for p in todos)
    total_meta  = sum(p["meta_dia"]           for p in todos)
    fator       = min((hora - 7) / 10, 1.0)
    pct_geral   = round(total_atend / max(total_meta * fator, 1) * 100, 1) if fator > 0 else 0

    tipo_counts: dict = {}
    for p in todos:
        for prod in p["producao_detalhada"]:
            lbl = prod["label"]
            tipo_counts[lbl] = tipo_counts.get(lbl, 0) + prod["realizado"]

    equipes_status = []
    for eq in _EQUIPES_ESF():
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        crit = sum(1 for p in profs_eq if p["status"] == "critico")
        st = "critico" if crit >= 2 else "atencao" if crit == 1 or any(p["status"] == "atencao" for p in profs_eq) else "normal"
        equipes_status.append({"tipo": "ESF", "equipe": eq["nome"], "ubs": eq["ubs"], "status": st, "total": total_eq, "prof": len(profs_eq)})
    for eq in _EQUIPES_ESB():
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        st = "atencao" if any(p["status"] != "normal" for p in profs_eq) else "normal"
        equipes_status.append({"tipo": "ESB", "equipe": eq["nome"], "ubs": eq["ubs"], "status": st, "total": total_eq, "prof": len(profs_eq)})
    for eq in _EQUIPES_EMULTI():
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        st = "atencao" if any(p["status"] != "normal" for p in profs_eq) else "normal"
        equipes_status.append({"tipo": "eMulti", "equipe": eq["nome"], "ubs": eq["ubs"], "status": st, "total": total_eq, "prof": len(profs_eq)})

    alertas = [f"{e['equipe']} ({e['tipo']}): produção crítica — verificar presença" for e in equipes_status if e["status"] == "critico"]

    return {
        "timestamp": agora.isoformat(),
        "data": agora.strftime("%d/%m/%Y"),
        "hora": agora.strftime("%H:%M"),
        "total_atendimentos_hoje": total_atend,
        "meta_dia": total_meta,
        "pct_meta": pct_geral,
        "total_equipes": len(equipes_status),
        "total_esf": len(_EQUIPES_ESF()),
        "total_esb": len(_EQUIPES_ESB()),
        "total_emulti": len(_EQUIPES_EMULTI()),
        "total_profissionais": len(_TODOS_PROFS),
        "profissionais_com_producao": sum(1 for p in todos if p["total_atendimentos"] > 0),
        "equipes": equipes_status,
        "producao_por_tipo": sorted([{"tipo": k, "total": v} for k, v in tipo_counts.items() if v > 0], key=lambda x: -x["total"])[:15],
        "alertas": alertas,
        "status_geral": "critico" if pct_geral < 50 else "atencao" if pct_geral < 75 else "normal",
    }


@router.get("/equipes-esf")
async def equipes_esf():
    hora  = _hora_atual()
    todos = [_prod_prof(p, hora) for p in _PROFS_ESF()]
    resultado = []
    for eq in _EQUIPES_ESF():
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        meta_eq  = sum(p["meta_dia"]           for p in profs_eq)
        fator    = min((hora - 7) / 10, 1.0)
        pct_eq   = round(total_eq / max(meta_eq * fator, 1) * 100, 1) if fator > 0 else 0
        crit = sum(1 for p in profs_eq if p["status"] == "critico")
        st = "critico" if crit >= 2 else "atencao" if crit == 1 or any(p["status"] == "atencao" for p in profs_eq) else "normal"
        resultado.append({
            **eq,
            "status": st,
            "total_atendimentos": total_eq,
            "meta_dia": meta_eq,
            "pct_meta": pct_eq,
            "profissionais": profs_eq,
            "indicadores_previne": _indicadores_equipe(eq["nome"], hora),
        })
    return {"timestamp": datetime.now().isoformat(), "equipes": resultado}


@router.get("/equipes-esb")
async def equipes_esb():
    hora  = _hora_atual()
    todos = [_prod_prof(p, hora) for p in _PROFS_ESB()]
    resultado = []
    for eq in _EQUIPES_ESB():
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        meta_eq  = sum(p["meta_dia"]           for p in profs_eq)
        fator    = min((hora - 7) / 10, 1.0)
        pct_eq   = round(total_eq / max(meta_eq * fator, 1) * 100, 1) if fator > 0 else 0
        resultado.append({
            **eq,
            "status": "atencao" if any(p["status"] != "normal" for p in profs_eq) else "normal",
            "total_atendimentos": total_eq,
            "meta_dia": meta_eq,
            "pct_meta": pct_eq,
            "profissionais": profs_eq,
            "indicadores_odontologia": _indicadores_odo(eq["nome"], hora),
        })
    return {"timestamp": datetime.now().isoformat(), "equipes": resultado}


@router.get("/equipe-emulti")
async def equipe_emulti():
    hora  = _hora_atual()
    todos = [_prod_prof(p, hora) for p in _PROFS_EMULTI()]
    total = sum(p["total_atendimentos"] for p in todos)
    meta  = sum(p["meta_dia"]           for p in todos)
    fator = min((hora - 7) / 10, 1.0)
    pct   = round(total / max(meta * fator, 1) * 100, 1) if fator > 0 else 0
    return {
        "timestamp": datetime.now().isoformat(),
        "equipe": _EQUIPES_EMULTI()[0],
        "total_atendimentos": total,
        "meta_dia": meta,
        "pct_meta": pct,
        "status": "atencao" if any(p["status"] != "normal" for p in todos) else "normal",
        "profissionais": todos,
    }


@router.get("/profissionais")
async def todos_profissionais():
    hora  = _hora_atual()
    todos = [_prod_prof(p, hora) for p in _TODOS_PROFS]
    return {
        "timestamp": datetime.now().isoformat(),
        "total": len(todos),
        "esf": len(_PROFS_ESF()),
        "esb": len(_PROFS_ESB()),
        "emulti": len(_PROFS_EMULTI()),
        "profissionais": sorted(todos, key=lambda x: x["pct_meta"]),
    }


@router.get("/atendimentos")
async def atendimentos_recentes():
    agora = datetime.now()
    hora  = _hora_atual()
    rng   = Random(_seed("atendimentos", hora))
    tipos = [p for plist in _PROD().values() for p in plist.values() if isinstance(p, dict)]
    lista = []
    for i in range(18):
        prof = _TODOS_PROFS[rng.randint(0, len(_TODOS_PROFS) - 1)]
        prod_base = _PROD().get(prof["cbo"], {})
        tipos_cbo = list(prod_base.values()) if prod_base else [{"label": "Atendimento"}]
        tipo_cfg  = tipos_cbo[rng.randint(0, len(tipos_cbo) - 1)]
        lista.append({
            "id": f"AT{hora:02d}{i:03d}",
            "horario": f"{hora - rng.randint(0,1):02d}:{rng.randint(0,59):02d}",
            "minutos_atras": rng.randint(1, 29),
            "profissional": prof["nome"],
            "cbo": prof["cbo"],
            "equipe": prof["equipe"],
            "tipo_equipe": prof["tipo_equipe"],
            "tipo_atendimento": tipo_cfg.get("label", "Atendimento"),
            "duracao_min": rng.randint(5, 30),
        })
    lista.sort(key=lambda x: x["minutos_atras"])
    return {"timestamp": agora.isoformat(), "total_30min": len(lista), "atendimentos": lista}


@router.get("/producao-hora")
async def producao_por_hora():
    agora = datetime.now()
    hora_atual = min(agora.hour, 17)
    horas = []
    prev_total = 0
    for h in range(7, max(hora_atual + 1, 8)):
        todos = [_prod_prof(p, h) for p in _TODOS_PROFS]
        total_h = sum(p["total_atendimentos"] for p in todos)
        incremento = max(total_h - prev_total, 0)
        horas.append({"hora": f"{h:02d}:00", "atendimentos": incremento, "acumulado": total_h})
        prev_total = total_h
    return {"data": agora.strftime("%d/%m/%Y"), "horas": horas}


# ── seed diário (usa data completa para ser consistente por dia) ───────────────
def _seed_dia(uid: str, ano: int, mes: int, dia: int) -> int:
    return hash(f"{uid}{ano:04d}{mes:02d}{dia:02d}") % 10000


def _prod_dia(profs: list[dict], ano: int, mes: int, dia: int, is_hoje: bool, hora_atual: int) -> dict:
    """Total de atendimentos de uma lista de profissionais num determinado dia."""
    total = 0
    meta_total = 0
    por_tipo: dict[str, int] = {}
    for prof in profs:
        rng = Random(_seed_dia(prof["id"], ano, mes, dia))
        base = _PROD().get(prof["cbo"], {})
        fator = min((hora_atual - 7) / 10, 1.0) if is_hoje and hora_atual > 7 else (1.0 if not is_hoje else 0.0)
        for tipo, cfg in base.items():
            meta_hora = cfg["meta"] * fator
            realizado = int(meta_hora * rng.uniform(0.70, 1.15)) if fator > 0 else 0
            total += realizado
            meta_total += cfg["meta"]
            lbl = cfg["label"]
            por_tipo[lbl] = por_tipo.get(lbl, 0) + realizado
    pct = round(total / max(meta_total * (fator if fator > 0 else 1), 1) * 100, 1) if meta_total > 0 else 0
    return {"total": total, "meta": meta_total, "pct_meta": pct, "por_tipo": por_tipo}


def _indicadores_dia(equipe_nome: str, ano: int, mes: int, dia: int, is_hoje: bool, hora_atual: int) -> list[dict]:
    rng = Random(_seed_dia(f"ind_{equipe_nome}", ano, mes, dia))
    fator_dia = min((hora_atual - 7) / 10, 1.0) if is_hoje else 1.0
    resultado = []
    for ind in _INDICADORES_PREVINE():
        base_val = rng.uniform(ind["meta_pct"] * 0.55, ind["meta_pct"] * 1.25)
        resultado_pct = round(min(base_val * fator_dia, 100), 1) if fator_dia > 0 else 0.0
        resultado.append({
            "ind": ind["ind"],
            "label": ind["label"],
            "meta_pct": ind["meta_pct"],
            "resultado_pct": resultado_pct,
            "status": "verde" if resultado_pct >= ind["meta_pct"] else "amarelo" if resultado_pct >= ind["meta_pct"] * 0.7 else "vermelho",
        })
    return resultado


def _indicadores_odo_dia(equipe_nome: str, ano: int, mes: int, dia: int, is_hoje: bool, hora_atual: int) -> list[dict]:
    rng = Random(_seed_dia(f"odo_{equipe_nome}", ano, mes, dia))
    fator_dia = min((hora_atual - 7) / 10, 1.0) if is_hoje else 1.0
    resultado = []
    for ind in _INDICADORES_ODO():
        base_val = rng.uniform(ind["meta_pct"] * 0.60, ind["meta_pct"] * 1.20)
        resultado_pct = round(min(base_val * fator_dia, 100), 1) if fator_dia > 0 else 0.0
        resultado.append({
            "ind": ind["ind"],
            "label": ind["label"],
            "meta_pct": ind["meta_pct"],
            "resultado_pct": resultado_pct,
            "status": "verde" if resultado_pct >= ind["meta_pct"] else "amarelo" if resultado_pct >= ind["meta_pct"] * 0.7 else "vermelho",
        })
    return resultado


@router.get("/producao-mensal")
async def producao_mensal():
    """Atendimentos + indicadores por dia do mês atual para acompanhamento em tempo real."""
    agora = datetime.now()
    hoje = date.today()
    ano, mes = hoje.year, hoje.month
    hora_atual = _hora_atual()
    _, dias_no_mes = calendar.monthrange(ano, mes)

    dias_uteis_set = {
        date(ano, mes, d)
        for d in range(1, dias_no_mes + 1)
        if date(ano, mes, d).weekday() < 5  # seg-sex
    }

    dias: list[dict] = []
    acumulado_esf = 0
    acumulado_esb = 0
    acumulado_emulti = 0

    # Previne: acumula valores ao longo do mês (média ponderada progressiva)
    ind_acum: dict[str, list[float]] = {ind["ind"]: [] for ind in _INDICADORES_PREVINE()}
    odo_acum: dict[str, list[float]] = {ind["ind"]: [] for ind in _INDICADORES_ODO()}
    # Acumulado por equipe ESB
    odo_acum_eq: dict[str, dict[str, list[float]]] = {
        eq["nome"]: {ind["ind"]: [] for ind in _INDICADORES_ODO()}
        for eq in _EQUIPES_ESB()
    }

    for d in range(1, dias_no_mes + 1):
        data_d = date(ano, mes, d)
        is_hoje = data_d == hoje
        is_futuro = data_d > hoje
        is_util = data_d in dias_uteis_set

        if is_futuro:
            dias.append({
                "dia": d,
                "data": data_d.strftime("%d/%m"),
                "dia_semana": data_d.strftime("%a").upper(),
                "is_hoje": False,
                "is_util": is_util,
                "is_futuro": True,
                "esf": None, "esb": None, "emulti": None,
                "total": None,
                "indicadores_previne": None,
                "indicadores_odonto": None,
                "acumulado_mes_esf": None,
                "acumulado_mes_esb": None,
                "acumulado_mes_emulti": None,
            })
            continue

        if not is_util:
            dias.append({
                "dia": d,
                "data": data_d.strftime("%d/%m"),
                "dia_semana": data_d.strftime("%a").upper(),
                "is_hoje": False,
                "is_util": False,
                "is_futuro": False,
                "esf": None, "esb": None, "emulti": None,
                "total": None,
                "indicadores_previne": None,
                "indicadores_odonto": None,
                "acumulado_mes_esf": None,
                "acumulado_mes_esb": None,
                "acumulado_mes_emulti": None,
            })
            continue

        prod_esf    = _prod_dia(_PROFS_ESF,    ano, mes, d, is_hoje, hora_atual)
        prod_esb    = _prod_dia(_PROFS_ESB,    ano, mes, d, is_hoje, hora_atual)
        prod_emulti = _prod_dia(_PROFS_EMULTI, ano, mes, d, is_hoje, hora_atual)

        acumulado_esf    += prod_esf["total"]
        acumulado_esb    += prod_esb["total"]
        acumulado_emulti += prod_emulti["total"]

        # indicadores das 9 equipes ESF — média do dia
        inds_dia_esf: dict[str, list[float]] = {ind["ind"]: [] for ind in _INDICADORES_PREVINE()}
        for eq in _EQUIPES_ESF():
            for ind in _indicadores_dia(eq["nome"], ano, mes, d, is_hoje, hora_atual):
                inds_dia_esf[ind["ind"]].append(ind["resultado_pct"])

        inds_previne_dia = []
        for ind in _INDICADORES_PREVINE():
            vals = inds_dia_esf[ind["ind"]]
            media = round(sum(vals) / len(vals), 1) if vals else 0.0
            ind_acum[ind["ind"]].append(media)
            media_acum = round(sum(ind_acum[ind["ind"]]) / len(ind_acum[ind["ind"]]), 1)
            inds_previne_dia.append({
                "ind": ind["ind"],
                "label": ind["label"],
                "meta_pct": ind["meta_pct"],
                "resultado_pct": media,
                "acumulado_pct": media_acum,
                "status": "verde" if media >= ind["meta_pct"] else "amarelo" if media >= ind["meta_pct"] * 0.7 else "vermelho",
            })

        # indicadores odonto — por equipe ESB + média geral
        inds_dia_esb: dict[str, list[float]] = {ind["ind"]: [] for ind in _INDICADORES_ODO()}
        inds_odo_dia_por_eq: list[dict] = []
        for eq in _EQUIPES_ESB():
            eq_inds_dia = _indicadores_odo_dia(eq["nome"], ano, mes, d, is_hoje, hora_atual)
            eq_inds_out = []
            for ind in eq_inds_dia:
                inds_dia_esb[ind["ind"]].append(ind["resultado_pct"])
                odo_acum_eq[eq["nome"]][ind["ind"]].append(ind["resultado_pct"])
                media_acum_eq = round(sum(odo_acum_eq[eq["nome"]][ind["ind"]]) / len(odo_acum_eq[eq["nome"]][ind["ind"]]), 1)
                eq_inds_out.append({**ind, "acumulado_pct": media_acum_eq})
            inds_odo_dia_por_eq.append({"equipe": eq["nome"], "ubs": eq["ubs"], "indicadores": eq_inds_out})

        inds_odo_dia = []
        for ind in _INDICADORES_ODO():
            vals = inds_dia_esb[ind["ind"]]
            media = round(sum(vals) / len(vals), 1) if vals else 0.0
            odo_acum[ind["ind"]].append(media)
            media_acum = round(sum(odo_acum[ind["ind"]]) / len(odo_acum[ind["ind"]]), 1)
            inds_odo_dia.append({
                "ind": ind["ind"],
                "label": ind["label"],
                "meta_pct": ind["meta_pct"],
                "resultado_pct": media,
                "acumulado_pct": media_acum,
                "status": "verde" if media >= ind["meta_pct"] else "amarelo" if media >= ind["meta_pct"] * 0.7 else "vermelho",
            })

        dias.append({
            "dia": d,
            "data": data_d.strftime("%d/%m"),
            "dia_semana": data_d.strftime("%a").upper(),
            "is_hoje": is_hoje,
            "is_util": True,
            "is_futuro": False,
            "esf":    prod_esf,
            "esb":    prod_esb,
            "emulti": prod_emulti,
            "total":  prod_esf["total"] + prod_esb["total"] + prod_emulti["total"],
            "indicadores_previne": inds_previne_dia,
            "indicadores_odonto":  inds_odo_dia,
            "indicadores_odonto_por_equipe": inds_odo_dia_por_eq,
            "acumulado_mes_esf":    acumulado_esf,
            "acumulado_mes_esb":    acumulado_esb,
            "acumulado_mes_emulti": acumulado_emulti,
        })

    dias_com_dados = [d for d in dias if d["total"] is not None]
    total_mes = sum(d["total"] for d in dias_com_dados)
    media_dia  = round(total_mes / max(len(dias_com_dados), 1))

    # Consolidado mensal dos indicadores Novo Financiamento APS
    inds_mes: list[dict] = []
    for ind in _INDICADORES_PREVINE():
        vals = ind_acum.get(ind["ind"], [])
        media_mes = round(sum(vals) / len(vals), 1) if vals else 0.0
        inds_mes.append({
            "ind": ind["ind"],
            "label": ind["label"],
            "meta_pct": ind["meta_pct"],
            "resultado_pct": media_mes,
            "status": "verde" if media_mes >= ind["meta_pct"] else "amarelo" if media_mes >= ind["meta_pct"] * 0.7 else "vermelho",
        })

    inds_odo_mes: list[dict] = []
    for ind in _INDICADORES_ODO():
        vals = odo_acum.get(ind["ind"], [])
        media_mes = round(sum(vals) / len(vals), 1) if vals else 0.0
        inds_odo_mes.append({
            "ind": ind["ind"],
            "label": ind["label"],
            "meta_pct": ind["meta_pct"],
            "resultado_pct": media_mes,
            "status": "verde" if media_mes >= ind["meta_pct"] else "amarelo" if media_mes >= ind["meta_pct"] * 0.7 else "vermelho",
        })

    # Consolidado mensal por equipe ESB
    inds_odo_mes_por_equipe: list[dict] = []
    for eq in _EQUIPES_ESB():
        eq_inds = []
        for ind in _INDICADORES_ODO():
            vals = odo_acum_eq[eq["nome"]].get(ind["ind"], [])
            media_mes = round(sum(vals) / len(vals), 1) if vals else 0.0
            eq_inds.append({
                "ind": ind["ind"],
                "label": ind["label"],
                "meta_pct": ind["meta_pct"],
                "resultado_pct": media_mes,
                "status": "verde" if media_mes >= ind["meta_pct"] else "amarelo" if media_mes >= ind["meta_pct"] * 0.7 else "vermelho",
            })
        inds_odo_mes_por_equipe.append({"equipe": eq["nome"], "ubs": eq["ubs"], "indicadores": eq_inds})

    return {
        "timestamp": agora.isoformat(),
        "mes_ano": agora.strftime("%B/%Y"),
        "mes": mes,
        "ano": ano,
        "dias_no_mes": dias_no_mes,
        "dias_uteis_passados": len([d for d in dias if d["is_util"] and not d["is_futuro"] and d["total"] is not None]),
        "total_mes": total_mes,
        "media_dia": media_dia,
        "acumulado_esf": acumulado_esf,
        "acumulado_esb": acumulado_esb,
        "acumulado_emulti": acumulado_emulti,
        "indicadores_previne_mes": inds_mes,
        "indicadores_odonto_mes":  inds_odo_mes,
        "indicadores_odonto_mes_por_equipe": inds_odo_mes_por_equipe,
        "dias": dias,
    }
