"""
Router: /api/acs — Módulo ACS (Agentes Comunitários de Saúde)
Apuí/AM — 5 equipes ESF, 65 microáreas, 65 ACS
Integração eSUS PEC com fallback para dados de referência.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from functools import lru_cache
from services.esus_pec import (
    status_pec, visitas_domiciliares,
    cadastros_individuais, cadastros_domiciliares, cidadaos
)

router = APIRouter(prefix="/api/acs", tags=["ACS"])

# ── Dados de referência ───────────────────────────────────────────────────────

_ACS: list[dict] = [
    # ── KENNEDY (eSF) — Zona Urbana Centro (MA-01 a MA-03) ─────────────────────
    {"id":  1, "nome": "Maria Aparecida Silva",        "microarea": "MA-01", "equipe": "KENNEDY", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 148, "familias_meta": 150},
    {"id":  2, "nome": "João Carlos Nascimento",       "microarea": "MA-02", "equipe": "KENNEDY", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 132, "familias_meta": 150},
    {"id":  3, "nome": "Ana Paula Ferreira",           "microarea": "MA-03", "equipe": "KENNEDY", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 141, "familias_meta": 150},
    {"id":  4, "nome": "Raimundo Nonato Costa",        "microarea": "MA-04", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 155, "familias_meta": 150},
    {"id":  5, "nome": "Francisca Lima Santos",        "microarea": "MA-05", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 137, "familias_meta": 150},
    {"id":  6, "nome": "Antônio Mendes Rocha",         "microarea": "MA-06", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 122, "familias_meta": 150},
    {"id":  7, "nome": "Benedita Sousa Oliveira",      "microarea": "MA-07", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 163, "familias_meta": 150},
    {"id":  8, "nome": "Sebastião Alves Teixeira",     "microarea": "MA-08", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 118, "familias_meta": 150},
    {"id":  9, "nome": "Rosa Maria Barbosa",           "microarea": "MA-09", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 144, "familias_meta": 150},
    {"id": 10, "nome": "Teresinha Gomes Peixoto",      "microarea": "MA-10", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 136, "familias_meta": 150},
    {"id": 11, "nome": "Manoel Ferreira Nunes",        "microarea": "MA-11", "equipe": "JK", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 152, "familias_meta": 150},
    {"id": 12, "nome": "Luzia dos Santos Pereira",     "microarea": "MA-12", "equipe": "ACARI", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 138, "familias_meta": 150},
    {"id": 13, "nome": "Carlos Eduardo Martins",       "microarea": "MA-13", "equipe": "ACARI", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 129, "familias_meta": 150},
    {"id": 14, "nome": "Joana Melo Araújo",            "microarea": "MA-14", "equipe": "ACARI", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 143, "familias_meta": 150},
    {"id": 15, "nome": "José Pereira Rodrigues",       "microarea": "MA-15", "equipe": "ACARI", "tipo": "eSF",   "ativo": True,  "familias_cadastradas": 157, "familias_meta": 150},
    # ── JK / ACARI / JUMA (eSF) — Zona Urbana/Periurbana (MA-04 a MA-28) ──────
    {"id": 16, "nome": "Deuzarina Farias Monteiro",    "microarea": "MA-16", "equipe": "ACARI", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 126, "familias_meta": 150},
    {"id": 17, "nome": "Aldenice Castro Ribeiro",      "microarea": "MA-17", "equipe": "ACARI", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 138, "familias_meta": 150},
    {"id": 18, "nome": "Valdeci Lopes Cardoso",        "microarea": "MA-18", "equipe": "ACARI", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 117, "familias_meta": 150},
    {"id": 19, "nome": "Creuza Brito Moraes",          "microarea": "MA-19", "equipe": "ACARI", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 144, "familias_meta": 150},
    {"id": 20, "nome": "Edilson Santos Carvalho",      "microarea": "MA-20", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 151, "familias_meta": 150},
    {"id": 21, "nome": "Nazaré Corrêa Lima",           "microarea": "MA-21", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 133, "familias_meta": 150},
    {"id": 22, "nome": "Erisvaldo Alves Mendes",       "microarea": "MA-22", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 108, "familias_meta": 150},
    {"id": 23, "nome": "Ilma Rocha Barbosa",           "microarea": "MA-23", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 142, "familias_meta": 150},
    {"id": 24, "nome": "Lindomar Costa Araújo",        "microarea": "MA-24", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 119, "familias_meta": 150},
    {"id": 25, "nome": "Sueli Gomes Ferreira",         "microarea": "MA-25", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 147, "familias_meta": 150},
    {"id": 26, "nome": "Neilton Oliveira Silva",       "microarea": "MA-26", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 135, "familias_meta": 150},
    {"id": 27, "nome": "Vânia Nascimento Pereira",     "microarea": "MA-27", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 124, "familias_meta": 150},
    {"id": 28, "nome": "Raimundinho Teixeira Costa",   "microarea": "MA-28", "equipe": "JUMA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 131, "familias_meta": 150},
    {"id": 29, "nome": "Jacira Sousa Rodrigues",       "microarea": "MA-29", "equipe": "ESTRADA NOVA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 128, "familias_meta": 150},
    {"id": 30, "nome": "Paulo Mendes Nunes",           "microarea": "MA-30", "equipe": "ESTRADA NOVA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas": 139, "familias_meta": 150},
    # ── ESTRADA NOVA / LIBERDADE (eSF) — Zona Rural/Periurbana (MA-29 a MA-41) ─
    {"id": 31, "nome": "Iraci Barbosa Santos",         "microarea": "MA-31", "equipe": "ESTRADA NOVA", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  98, "familias_meta": 120},
    {"id": 32, "nome": "Cleber Martins Lopes",         "microarea": "MA-32", "equipe": "ESTRADA NOVA", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 107, "familias_meta": 120},
    {"id": 33, "nome": "Leonizia Peixoto Lima",        "microarea": "MA-33", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  89, "familias_meta": 120},
    {"id": 34, "nome": "Sandro Farias Castro",         "microarea": "MA-34", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 113, "familias_meta": 120},
    {"id": 35, "nome": "Graça Maria Ribeiro",          "microarea": "MA-35", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 102, "familias_meta": 120},
    {"id": 36, "nome": "Wander Cardoso Alves",         "microarea": "MA-36", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  94, "familias_meta": 120},
    {"id": 37, "nome": "Fátima Araújo Corrêa",         "microarea": "MA-37", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 116, "familias_meta": 120},
    {"id": 38, "nome": "Marcos Moraes Carvalho",       "microarea": "MA-38", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  85, "familias_meta": 120},
    {"id": 39, "nome": "Edilene Rodrigues Brito",      "microarea": "MA-39", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 101, "familias_meta": 120},
    {"id": 40, "nome": "André Luiz Monteiro",          "microarea": "MA-40", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 118, "familias_meta": 120},
    {"id": 41, "nome": "Lúcia Ferreira Gomes",         "microarea": "MA-41", "equipe": "LIBERDADE", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  92, "familias_meta": 120},
    {"id": 42, "nome": "Rogério Pereira Costa",        "microarea": "MA-42", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 110, "familias_meta": 120},
    {"id": 43, "nome": "Neuza Lima Oliveira",          "microarea": "MA-43", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  97, "familias_meta": 120},
    {"id": 44, "nome": "Lindinalva Costa Barbosa",     "microarea": "MA-44", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF", "ativo": True,  "familias_cadastradas":  88, "familias_meta": 120},
    {"id": 45, "nome": "Cláudia Sousa Nascimento",     "microarea": "MA-45", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF", "ativo": True,  "familias_cadastradas": 104, "familias_meta": 120},
    # ── SÃO SEBASTIÃO / CACHOEIRA (eSF) — Zona Rural (MA-42 a MA-57) ──────────
    {"id": 46, "nome": "Adenize Mendes Rocha",         "microarea": "MA-46", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  76, "familias_meta": 100},
    {"id": 47, "nome": "Pedro Alves Teixeira",         "microarea": "MA-47", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  83, "familias_meta": 100},
    {"id": 48, "nome": "Cristina Nunes Ferreira",      "microarea": "MA-48", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  91, "familias_meta": 100},
    {"id": 49, "nome": "Luís Rodrigues Santos",        "microarea": "MA-49", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  68, "familias_meta": 100},
    {"id": 50, "nome": "Eliene Peixoto Gomes",         "microarea": "MA-50", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  87, "familias_meta": 100},
    {"id": 51, "nome": "Valdilene Carvalho Lopes",     "microarea": "MA-51", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  79, "familias_meta": 100},
    {"id": 52, "nome": "Fábio Ribeiro Martins",        "microarea": "MA-52", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  94, "familias_meta": 100},
    {"id": 53, "nome": "Conceição Barbosa Araújo",     "microarea": "MA-53", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  72, "familias_meta": 100},
    {"id": 54, "nome": "Jucilene Moraes Castro",       "microarea": "MA-54", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  85, "familias_meta": 100},
    {"id": 55, "nome": "Márcia Farias Corrêa",         "microarea": "MA-55", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  81, "familias_meta": 100},
    {"id": 56, "nome": "Sebastiana Monteiro Silva",    "microarea": "MA-56", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  63, "familias_meta": 100},
    {"id": 57, "nome": "Raimunda Brito Cardoso",       "microarea": "MA-57", "equipe": "CACHOEIRA", "tipo": "eSF",  "ativo": True,  "familias_cadastradas":  77, "familias_meta": 100},
    # ── TRÊS ESTADOS (eSF) / AREAL (eRibeirinha) — Zona Rural Remota (MA-58 a MA-65)
    {"id": 58, "nome": "Izabel Costa Lima",            "microarea": "MA-58", "equipe": "TRÊS ESTADOS", "tipo": "eSF",   "ativo": True,  "familias_cadastradas":  54, "familias_meta":  80},
    {"id": 59, "nome": "Luzia Nascimento Rocha",       "microarea": "MA-59", "equipe": "TRÊS ESTADOS", "tipo": "eSF",   "ativo": True,  "familias_cadastradas":  61, "familias_meta":  80},
    {"id": 60, "nome": "Neilson Alves Pereira",        "microarea": "MA-60", "equipe": "TRÊS ESTADOS", "tipo": "eSF",   "ativo": True,  "familias_cadastradas":  48, "familias_meta":  80},
    {"id": 61, "nome": "Joselma Ribeiro Santos",       "microarea": "MA-61", "equipe": "TRÊS ESTADOS", "tipo": "eSF",   "ativo": True,  "familias_cadastradas":  67, "familias_meta":  80},
    {"id": 62, "nome": "Arnaldo Gomes Barbosa",        "microarea": "MA-62", "equipe": "TRÊS ESTADOS", "tipo": "eSF",   "ativo": True,  "familias_cadastradas":  55, "familias_meta":  80},
    {"id": 63, "nome": "Deuzorene Carvalho Lopes",     "microarea": "MA-63", "equipe": "AREAL", "tipo": "eRibeirinha",   "ativo": False, "familias_cadastradas":  43, "familias_meta":  80},
    {"id": 64, "nome": "Eliete Martins Costa",         "microarea": "MA-64", "equipe": "AREAL", "tipo": "eRibeirinha",   "ativo": True,  "familias_cadastradas":  58, "familias_meta":  80},
    {"id": 65, "nome": "Neusa Ferreira Rodrigues",     "microarea": "MA-65", "equipe": "AREAL", "tipo": "eRibeirinha",   "ativo": True,  "familias_cadastradas":  51, "familias_meta":  80},
]

@lru_cache(maxsize=1)
def _MES_REF():
    return {"mes": 7, "ano": 2026, "label": "Julho/2026"}


_VISITAS: list[dict] = [
    # ESF I — alta performance urbana
    {"acs_id":  1, "programadas": 148, "realizadas": 141, "nao_encontradas": 12, "recusas": 3},
    {"acs_id":  2, "programadas": 132, "realizadas": 108, "nao_encontradas": 18, "recusas": 5},
    {"acs_id":  3, "programadas": 141, "realizadas": 138, "nao_encontradas":  8, "recusas": 1},
    {"acs_id":  4, "programadas": 155, "realizadas": 155, "nao_encontradas":  7, "recusas": 0},
    {"acs_id":  5, "programadas": 137, "realizadas": 124, "nao_encontradas": 15, "recusas": 4},
    {"acs_id":  6, "programadas": 122, "realizadas": 110, "nao_encontradas": 22, "recusas": 6},
    {"acs_id":  7, "programadas": 163, "realizadas": 152, "nao_encontradas": 14, "recusas": 2},
    {"acs_id":  8, "programadas": 118, "realizadas":  97, "nao_encontradas": 19, "recusas": 7},
    {"acs_id":  9, "programadas": 144, "realizadas": 140, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 10, "programadas": 136, "realizadas": 129, "nao_encontradas": 11, "recusas": 3},
    {"acs_id": 11, "programadas": 152, "realizadas": 148, "nao_encontradas":  6, "recusas": 1},
    {"acs_id": 12, "programadas": 138, "realizadas": 131, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 13, "programadas": 129, "realizadas": 117, "nao_encontradas": 14, "recusas": 4},
    {"acs_id": 14, "programadas": 143, "realizadas": 138, "nao_encontradas":  8, "recusas": 1},
    {"acs_id": 15, "programadas": 157, "realizadas": 149, "nao_encontradas": 12, "recusas": 3},
    # ESF II — performance média-alta
    {"acs_id": 16, "programadas": 126, "realizadas": 118, "nao_encontradas": 13, "recusas": 3},
    {"acs_id": 17, "programadas": 138, "realizadas": 128, "nao_encontradas": 16, "recusas": 4},
    {"acs_id": 18, "programadas": 117, "realizadas": 103, "nao_encontradas": 20, "recusas": 5},
    {"acs_id": 19, "programadas": 144, "realizadas": 135, "nao_encontradas": 11, "recusas": 2},
    {"acs_id": 20, "programadas": 151, "realizadas": 144, "nao_encontradas":  9, "recusas": 1},
    {"acs_id": 21, "programadas": 133, "realizadas": 122, "nao_encontradas": 15, "recusas": 3},
    {"acs_id": 22, "programadas": 108, "realizadas":  89, "nao_encontradas": 24, "recusas": 7},
    {"acs_id": 23, "programadas": 142, "realizadas": 133, "nao_encontradas": 12, "recusas": 2},
    {"acs_id": 24, "programadas": 119, "realizadas": 108, "nao_encontradas": 18, "recusas": 4},
    {"acs_id": 25, "programadas": 147, "realizadas": 141, "nao_encontradas":  8, "recusas": 1},
    {"acs_id": 26, "programadas": 135, "realizadas": 125, "nao_encontradas": 13, "recusas": 3},
    {"acs_id": 27, "programadas": 124, "realizadas": 115, "nao_encontradas": 16, "recusas": 4},
    {"acs_id": 28, "programadas": 131, "realizadas": 120, "nao_encontradas": 14, "recusas": 3},
    {"acs_id": 29, "programadas": 128, "realizadas": 116, "nao_encontradas": 17, "recusas": 4},
    {"acs_id": 30, "programadas": 139, "realizadas": 131, "nao_encontradas": 10, "recusas": 2},
    # ESF III — rural próxima, variável
    {"acs_id": 31, "programadas":  98, "realizadas":  91, "nao_encontradas":  8, "recusas": 2},
    {"acs_id": 32, "programadas": 107, "realizadas":  99, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 33, "programadas":  89, "realizadas":  79, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 34, "programadas": 113, "realizadas": 106, "nao_encontradas":  9, "recusas": 1},
    {"acs_id": 35, "programadas": 102, "realizadas":  95, "nao_encontradas":  8, "recusas": 2},
    {"acs_id": 36, "programadas":  94, "realizadas":  82, "nao_encontradas": 14, "recusas": 3},
    {"acs_id": 37, "programadas": 116, "realizadas": 110, "nao_encontradas":  7, "recusas": 1},
    {"acs_id": 38, "programadas":  85, "realizadas":  73, "nao_encontradas": 15, "recusas": 4},
    {"acs_id": 39, "programadas": 101, "realizadas":  93, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 40, "programadas": 118, "realizadas": 112, "nao_encontradas":  8, "recusas": 1},
    {"acs_id": 41, "programadas":  92, "realizadas":  84, "nao_encontradas": 11, "recusas": 3},
    {"acs_id": 42, "programadas": 110, "realizadas": 102, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 43, "programadas":  97, "realizadas":  88, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 44, "programadas":  88, "realizadas":  76, "nao_encontradas": 14, "recusas": 4},
    {"acs_id": 45, "programadas": 104, "realizadas":  97, "nao_encontradas":  9, "recusas": 2},
    # ESF IV — rural ramais, dificuldade de acesso
    {"acs_id": 46, "programadas":  76, "realizadas":  65, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 47, "programadas":  83, "realizadas":  74, "nao_encontradas": 11, "recusas": 2},
    {"acs_id": 48, "programadas":  91, "realizadas":  84, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 49, "programadas":  68, "realizadas":  55, "nao_encontradas": 16, "recusas": 4},
    {"acs_id": 50, "programadas":  87, "realizadas":  79, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 51, "programadas":  79, "realizadas":  69, "nao_encontradas": 13, "recusas": 3},
    {"acs_id": 52, "programadas":  94, "realizadas":  88, "nao_encontradas":  8, "recusas": 1},
    {"acs_id": 53, "programadas":  72, "realizadas":  60, "nao_encontradas": 15, "recusas": 4},
    {"acs_id": 54, "programadas":  85, "realizadas":  77, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 55, "programadas":  81, "realizadas":  72, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 56, "programadas":  63, "realizadas":  51, "nao_encontradas": 14, "recusas": 4},
    {"acs_id": 57, "programadas":  77, "realizadas":  68, "nao_encontradas": 11, "recusas": 3},
    # ESF V — remota / assentamentos
    {"acs_id": 58, "programadas":  54, "realizadas":  46, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 59, "programadas":  61, "realizadas":  54, "nao_encontradas":  8, "recusas": 1},
    {"acs_id": 60, "programadas":  48, "realizadas":  38, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 61, "programadas":  67, "realizadas":  59, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 62, "programadas":  55, "realizadas":  47, "nao_encontradas": 10, "recusas": 2},
    {"acs_id": 63, "programadas":   0, "realizadas":   0, "nao_encontradas":  0, "recusas": 0},
    {"acs_id": 64, "programadas":  58, "realizadas":  50, "nao_encontradas":  9, "recusas": 2},
    {"acs_id": 65, "programadas":  51, "realizadas":  43, "nao_encontradas": 10, "recusas": 3},
]

_INDICADORES_ACS: list[dict] = [
    # ESF I
    {"acs_id":  1, "gestantes_ativas":  8, "criancas_lt2": 12, "has": 34, "dm": 11, "idosos": 22},
    {"acs_id":  2, "gestantes_ativas":  6, "criancas_lt2":  9, "has": 29, "dm":  8, "idosos": 17},
    {"acs_id":  3, "gestantes_ativas":  7, "criancas_lt2": 11, "has": 31, "dm":  9, "idosos": 20},
    {"acs_id":  4, "gestantes_ativas":  9, "criancas_lt2": 14, "has": 38, "dm": 12, "idosos": 25},
    {"acs_id":  5, "gestantes_ativas":  5, "criancas_lt2":  8, "has": 27, "dm":  7, "idosos": 16},
    {"acs_id":  6, "gestantes_ativas":  4, "criancas_lt2":  7, "has": 24, "dm":  6, "idosos": 14},
    {"acs_id":  7, "gestantes_ativas": 10, "criancas_lt2": 16, "has": 40, "dm": 14, "idosos": 28},
    {"acs_id":  8, "gestantes_ativas":  4, "criancas_lt2":  6, "has": 21, "dm":  5, "idosos": 12},
    {"acs_id":  9, "gestantes_ativas":  7, "criancas_lt2": 11, "has": 33, "dm": 10, "idosos": 21},
    {"acs_id": 10, "gestantes_ativas":  6, "criancas_lt2": 10, "has": 30, "dm":  9, "idosos": 19},
    {"acs_id": 11, "gestantes_ativas":  8, "criancas_lt2": 13, "has": 36, "dm": 11, "idosos": 24},
    {"acs_id": 12, "gestantes_ativas":  6, "criancas_lt2": 10, "has": 31, "dm":  9, "idosos": 20},
    {"acs_id": 13, "gestantes_ativas":  5, "criancas_lt2":  9, "has": 28, "dm":  8, "idosos": 17},
    {"acs_id": 14, "gestantes_ativas":  7, "criancas_lt2": 11, "has": 32, "dm": 10, "idosos": 21},
    {"acs_id": 15, "gestantes_ativas":  9, "criancas_lt2": 13, "has": 37, "dm": 12, "idosos": 24},
    # ESF II
    {"acs_id": 16, "gestantes_ativas":  5, "criancas_lt2":  9, "has": 28, "dm":  8, "idosos": 18},
    {"acs_id": 17, "gestantes_ativas":  6, "criancas_lt2": 10, "has": 31, "dm":  9, "idosos": 20},
    {"acs_id": 18, "gestantes_ativas":  4, "criancas_lt2":  8, "has": 25, "dm":  7, "idosos": 15},
    {"acs_id": 19, "gestantes_ativas":  7, "criancas_lt2": 11, "has": 33, "dm": 10, "idosos": 21},
    {"acs_id": 20, "gestantes_ativas":  8, "criancas_lt2": 13, "has": 36, "dm": 11, "idosos": 23},
    {"acs_id": 21, "gestantes_ativas":  6, "criancas_lt2":  9, "has": 30, "dm":  9, "idosos": 19},
    {"acs_id": 22, "gestantes_ativas":  3, "criancas_lt2":  7, "has": 23, "dm":  6, "idosos": 13},
    {"acs_id": 23, "gestantes_ativas":  7, "criancas_lt2": 11, "has": 32, "dm": 10, "idosos": 20},
    {"acs_id": 24, "gestantes_ativas":  4, "criancas_lt2":  8, "has": 26, "dm":  7, "idosos": 16},
    {"acs_id": 25, "gestantes_ativas":  7, "criancas_lt2": 12, "has": 34, "dm": 10, "idosos": 22},
    {"acs_id": 26, "gestantes_ativas":  6, "criancas_lt2": 10, "has": 30, "dm":  9, "idosos": 19},
    {"acs_id": 27, "gestantes_ativas":  5, "criancas_lt2":  9, "has": 27, "dm":  8, "idosos": 17},
    {"acs_id": 28, "gestantes_ativas":  5, "criancas_lt2":  9, "has": 29, "dm":  8, "idosos": 18},
    {"acs_id": 29, "gestantes_ativas":  5, "criancas_lt2":  9, "has": 28, "dm":  8, "idosos": 17},
    {"acs_id": 30, "gestantes_ativas":  6, "criancas_lt2": 11, "has": 31, "dm":  9, "idosos": 20},
    # ESF III
    {"acs_id": 31, "gestantes_ativas":  3, "criancas_lt2":  6, "has": 21, "dm":  6, "idosos": 13},
    {"acs_id": 32, "gestantes_ativas":  4, "criancas_lt2":  7, "has": 24, "dm":  7, "idosos": 15},
    {"acs_id": 33, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 19, "dm":  5, "idosos": 11},
    {"acs_id": 34, "gestantes_ativas":  4, "criancas_lt2":  8, "has": 25, "dm":  7, "idosos": 16},
    {"acs_id": 35, "gestantes_ativas":  4, "criancas_lt2":  6, "has": 22, "dm":  6, "idosos": 14},
    {"acs_id": 36, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 20, "dm":  5, "idosos": 12},
    {"acs_id": 37, "gestantes_ativas":  5, "criancas_lt2":  8, "has": 26, "dm":  7, "idosos": 16},
    {"acs_id": 38, "gestantes_ativas":  2, "criancas_lt2":  5, "has": 18, "dm":  4, "idosos": 10},
    {"acs_id": 39, "gestantes_ativas":  4, "criancas_lt2":  6, "has": 22, "dm":  6, "idosos": 13},
    {"acs_id": 40, "gestantes_ativas":  5, "criancas_lt2":  8, "has": 26, "dm":  7, "idosos": 16},
    {"acs_id": 41, "gestantes_ativas":  3, "criancas_lt2":  6, "has": 20, "dm":  5, "idosos": 12},
    {"acs_id": 42, "gestantes_ativas":  4, "criancas_lt2":  7, "has": 24, "dm":  7, "idosos": 15},
    {"acs_id": 43, "gestantes_ativas":  3, "criancas_lt2":  6, "has": 21, "dm":  6, "idosos": 13},
    {"acs_id": 44, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 19, "dm":  5, "idosos": 11},
    {"acs_id": 45, "gestantes_ativas":  4, "criancas_lt2":  7, "has": 23, "dm":  6, "idosos": 14},
    # ESF IV
    {"acs_id": 46, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 16, "dm":  4, "idosos":  9},
    {"acs_id": 47, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 18, "dm":  5, "idosos": 11},
    {"acs_id": 48, "gestantes_ativas":  3, "criancas_lt2":  6, "has": 20, "dm":  5, "idosos": 12},
    {"acs_id": 49, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 14, "dm":  3, "idosos":  8},
    {"acs_id": 50, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 19, "dm":  5, "idosos": 11},
    {"acs_id": 51, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 17, "dm":  4, "idosos": 10},
    {"acs_id": 52, "gestantes_ativas":  3, "criancas_lt2":  6, "has": 20, "dm":  5, "idosos": 12},
    {"acs_id": 53, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 15, "dm":  4, "idosos":  9},
    {"acs_id": 54, "gestantes_ativas":  3, "criancas_lt2":  5, "has": 18, "dm":  5, "idosos": 11},
    {"acs_id": 55, "gestantes_ativas":  2, "criancas_lt2":  5, "has": 17, "dm":  4, "idosos": 10},
    {"acs_id": 56, "gestantes_ativas":  2, "criancas_lt2":  3, "has": 13, "dm":  3, "idosos":  7},
    {"acs_id": 57, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 16, "dm":  4, "idosos":  9},
    # ESF V
    {"acs_id": 58, "gestantes_ativas":  2, "criancas_lt2":  3, "has": 11, "dm":  3, "idosos":  6},
    {"acs_id": 59, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 13, "dm":  3, "idosos":  7},
    {"acs_id": 60, "gestantes_ativas":  1, "criancas_lt2":  3, "has":  9, "dm":  2, "idosos":  5},
    {"acs_id": 61, "gestantes_ativas":  2, "criancas_lt2":  4, "has": 14, "dm":  4, "idosos":  8},
    {"acs_id": 62, "gestantes_ativas":  2, "criancas_lt2":  3, "has": 11, "dm":  3, "idosos":  6},
    {"acs_id": 63, "gestantes_ativas":  0, "criancas_lt2":  0, "has":  0, "dm":  0, "idosos":  0},
    {"acs_id": 64, "gestantes_ativas":  2, "criancas_lt2":  3, "has": 12, "dm":  3, "idosos":  7},
    {"acs_id": 65, "gestantes_ativas":  2, "criancas_lt2":  3, "has": 10, "dm":  2, "idosos":  6},
]

@lru_cache(maxsize=1)
def _MICROAREAS():
    return [
        # ESF I — Urbana Centro
        {"codigo": "MA-01", "nome": "Centro",                    "zona": "urbana", "equipe": "KENNEDY", "tipo": "eSF"},
        {"codigo": "MA-02", "nome": "Bairro Novo",               "zona": "urbana", "equipe": "KENNEDY", "tipo": "eSF"},
        {"codigo": "MA-03", "nome": "Santo Antônio",             "zona": "urbana", "equipe": "KENNEDY", "tipo": "eSF"},
        {"codigo": "MA-04", "nome": "Industrial",                "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-05", "nome": "Jardim Europa",             "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-06", "nome": "São Raimundo",              "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-07", "nome": "Aeroporto",                 "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-08", "nome": "Canaranas",                 "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-09", "nome": "Cajueiro",                  "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-10", "nome": "Novo Horizonte",            "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-11", "nome": "Cidade Nova",               "zona": "urbana", "equipe": "JK", "tipo": "eSF"},
        {"codigo": "MA-12", "nome": "Nova Esperança",            "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-13", "nome": "Baixa Verde",               "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-14", "nome": "João Paulo II",             "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-15", "nome": "Santa Luzia",               "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        # ESF II — Urbana Expansão / Periurbana
        {"codigo": "MA-16", "nome": "Vila Nova",                 "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-17", "nome": "Bela Vista",                "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-18", "nome": "Parque das Flores",         "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-19", "nome": "Residencial Sul",           "zona": "urbana", "equipe": "ACARI", "tipo": "eSF"},
        {"codigo": "MA-20", "nome": "Setor Leste",               "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-21", "nome": "Conj. Habitacional",        "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-22", "nome": "Expansão Norte",            "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-23", "nome": "Setor Oeste",               "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-24", "nome": "Jardim Primavera",          "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-25", "nome": "Dom Pedro I",               "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-26", "nome": "Boa Vista",                 "zona": "urbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-27", "nome": "Jardim Tropical",           "zona": "periurbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-28", "nome": "Setor B",                   "zona": "periurbana", "equipe": "JUMA", "tipo": "eSF"},
        {"codigo": "MA-29", "nome": "Nova Apuí",                 "zona": "periurbana", "equipe": "ESTRADA NOVA", "tipo": "eSF"},
        {"codigo": "MA-30", "nome": "Bairro do Porto",           "zona": "periurbana", "equipe": "ESTRADA NOVA", "tipo": "eSF"},
        # ESF III — Rural Próxima
        {"codigo": "MA-31", "nome": "Rio Apuí",                  "zona": "rural", "equipe": "ESTRADA NOVA", "tipo": "eSF"},
        {"codigo": "MA-32", "nome": "Setor Norte",               "zona": "rural", "equipe": "ESTRADA NOVA", "tipo": "eSF"},
        {"codigo": "MA-33", "nome": "Ramal do Cupim",            "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-34", "nome": "Assentamento Trop. Úm.",    "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-35", "nome": "Ramal km 20",               "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-36", "nome": "Comunidade São João",       "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-37", "nome": "Ramal do Maracajá",         "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-38", "nome": "Comunidade Boa Esperança",  "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-39", "nome": "Ramal 30 Sul",              "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-40", "nome": "Ramal Tucumã",              "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-41", "nome": "Comunidade São Francisco",  "zona": "rural", "equipe": "LIBERDADE", "tipo": "eSF"},
        {"codigo": "MA-42", "nome": "Ramal do Castanhal",        "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-43", "nome": "Assentamento Terra Nova",   "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-44", "nome": "Ramal 40",                  "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-45", "nome": "Comunidade do Pedral",      "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        # ESF IV — Rural Ramais Distantes
        {"codigo": "MA-46", "nome": "Ramal Guaraná",             "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-47", "nome": "Assentamento Camucuim",     "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-48", "nome": "Comunidade São Paulo",      "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-49", "nome": "Ramal 50",                  "zona": "rural", "equipe": "SÃO SEBASTIÃO", "tipo": "eSF"},
        {"codigo": "MA-50", "nome": "Assentamento Açaí",         "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-51", "nome": "Comunidade Esperança",      "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-52", "nome": "Ramal Seringueiro",         "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-53", "nome": "Assen. Novo Amanhã",        "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-54", "nome": "Comunidade Santa Maria",    "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-55", "nome": "Ramal 60",                  "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-56", "nome": "Assentamento Ipiranga",     "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        {"codigo": "MA-57", "nome": "Comunidade São Pedro",      "zona": "rural", "equipe": "CACHOEIRA", "tipo": "eSF"},
        # ESF V — Rural Remota / Assentamentos
        {"codigo": "MA-58", "nome": "Ramal 70 Norte",            "zona": "rural", "equipe": "TRÊS ESTADOS", "tipo": "eSF"},
        {"codigo": "MA-59", "nome": "Assen. Agroflor.",          "zona": "rural", "equipe": "TRÊS ESTADOS", "tipo": "eSF"},
        {"codigo": "MA-60", "nome": "Comunidade Gavião",         "zona": "rural", "equipe": "TRÊS ESTADOS", "tipo": "eSF"},
        {"codigo": "MA-61", "nome": "Ramal Guariba",             "zona": "rural", "equipe": "TRÊS ESTADOS", "tipo": "eSF"},
        {"codigo": "MA-62", "nome": "Assentamento Itamarati",    "zona": "rural", "equipe": "TRÊS ESTADOS", "tipo": "eSF"},
        {"codigo": "MA-63", "nome": "Comunidade Novo Éden",      "zona": "rural", "equipe": "AREAL", "tipo": "eRibeirinha"},
        {"codigo": "MA-64", "nome": "Ramal dos Seixos",          "zona": "rural", "equipe": "AREAL", "tipo": "eRibeirinha"},
        {"codigo": "MA-65", "nome": "Assen. São Cristóvão",      "zona": "rural", "equipe": "AREAL", "tipo": "eRibeirinha"},
    ]



def _enriquecer_acs(acs: dict) -> dict:
    vis = next((v for v in _VISITAS if v["acs_id"] == acs["id"]), {})
    ind = next((i for i in _INDICADORES_ACS if i["acs_id"] == acs["id"]), {})

    prog = vis.get("programadas", 0)
    real = vis.get("realizadas", 0)
    pct_visitas = round(real / prog * 100, 1) if prog > 0 else 0
    pct_cad = round(acs["familias_cadastradas"] / acs["familias_meta"] * 100, 1) if acs["familias_meta"] > 0 else 0

    status = (
        "afastado" if not acs["ativo"] else
        "destaque" if pct_visitas >= 95 and pct_cad >= 90 else
        "critico"  if pct_visitas < 70 or pct_cad < 60 else
        "regular"
    )

    return {
        **acs,
        "visitas": vis,
        "indicadores": ind,
        "pct_visitas": pct_visitas,
        "pct_cadastro": pct_cad,
        "status": status,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_acs(_: UserOut = Depends(get_current_user)):
    acs_ativos = [a for a in _ACS if a["ativo"]]
    total_familias  = sum(a["familias_cadastradas"] for a in acs_ativos)
    total_meta      = sum(a["familias_meta"] for a in acs_ativos)
    total_prog      = sum(v["programadas"] for v in _VISITAS)
    total_real      = sum(v["realizadas"]  for v in _VISITAS)
    total_gestantes = sum(i["gestantes_ativas"] for i in _INDICADORES_ACS)
    total_criancas  = sum(i["criancas_lt2"] for i in _INDICADORES_ACS)
    total_has       = sum(i["has"] for i in _INDICADORES_ACS)
    total_dm        = sum(i["dm"]  for i in _INDICADORES_ACS)

    acs_enriquecidos = [_enriquecer_acs(a) for a in _ACS]
    destaques = [a for a in acs_enriquecidos if a["status"] == "destaque"]
    criticos  = [a for a in acs_enriquecidos if a["status"] == "critico"]

    equipes_ordem = ["KENNEDY","JK","ACARI","JUMA","ESTRADA NOVA","LIBERDADE","SÃO SEBASTIÃO","CACHOEIRA","TRÊS ESTADOS","AREAL"]
    return {
        "municipio": "Apuí/AM",
        "mes_referencia": _MES_REF,
        "kpis": {
            "total_acs":            len(_ACS),
            "acs_ativos":           len(acs_ativos),
            "total_microareas":     len(_MICROAREAS()),
            "familias_cadastradas": total_familias,
            "familias_meta":        total_meta,
            "pct_cobertura":        round(total_familias / total_meta * 100, 1) if total_meta else 0,
            "visitas_programadas":  total_prog,
            "visitas_realizadas":   total_real,
            "pct_visitas":          round(total_real / total_prog * 100, 1) if total_prog else 0,
            "gestantes_ativas":     total_gestantes,
            "criancas_lt2":         total_criancas,
            "has_acompanhados":     total_has,
            "dm_acompanhados":      total_dm,
        },
        "acs_destaques":  destaques[:5],
        "acs_criticos":   criticos,
        "distribuicao_equipe": {
            eq: sum(1 for a in acs_ativos if a["equipe"] == eq)
            for eq in equipes_ordem
        },
        "fonte": "referencia",
    }


@router.get("/lista")
async def lista_acs(
    esf: str | None = Query(None),
    _: UserOut = Depends(get_current_user),
):
    acs_list = _ACS if not esf else [a for a in _ACS if a["equipe"] == esf]
    return {
        "mes_referencia": _MES_REF,
        "acs": [_enriquecer_acs(a) for a in acs_list],
        "fonte": "referencia",
    }


@router.get("/microareas")
async def microareas(_: UserOut = Depends(get_current_user)):
    resultado = []
    for ma in _MICROAREAS():
        acs_ma = [a for a in _ACS if a["microarea"] == ma["codigo"]]
        acs_ativos_ma = [a for a in acs_ma if a["ativo"]]
        familias  = sum(a["familias_cadastradas"] for a in acs_ativos_ma)
        meta      = sum(a["familias_meta"] for a in acs_ma)
        ids_ma    = [a["id"] for a in acs_ma]
        ids_at    = [a["id"] for a in acs_ativos_ma]
        vis_prog  = sum(v["programadas"] for v in _VISITAS if v["acs_id"] in ids_ma)
        vis_real  = sum(v["realizadas"]  for v in _VISITAS if v["acs_id"] in ids_ma)
        gestantes = sum(i["gestantes_ativas"] for i in _INDICADORES_ACS if i["acs_id"] in ids_at)

        pct_cad = round(familias / meta * 100, 1) if meta else 0
        pct_vis = round(vis_real / vis_prog * 100, 1) if vis_prog else 0
        sem = "verde" if pct_cad >= 90 and pct_vis >= 90 else "amarelo" if pct_cad >= 70 else "vermelho"

        resultado.append({
            **ma,
            "acs_count":            len(acs_ma),
            "acs_ativos":           len(acs_ativos_ma),
            "familias_cadastradas": familias,
            "familias_meta":        meta,
            "pct_cobertura":        pct_cad,
            "visitas_realizadas":   vis_real,
            "visitas_programadas":  vis_prog,
            "pct_visitas":          pct_vis,
            "gestantes_ativas":     gestantes,
            "semaforo":             sem,
        })

    return {"microareas": resultado, "fonte": "referencia"}


@router.get("/{acs_id}")
async def detalhe_acs(
    acs_id: int,
    _: UserOut = Depends(get_current_user),
):
    acs = next((a for a in _ACS if a["id"] == acs_id), None)
    if not acs:
        from fastapi import HTTPException
        raise HTTPException(404, "ACS não encontrado")

    meta = acs["familias_meta"]
    historico_visitas = [
        {"mes": "Jan/26", "realizadas": round(meta * 0.88), "programadas": meta},
        {"mes": "Fev/26", "realizadas": round(meta * 0.91), "programadas": meta},
        {"mes": "Mar/26", "realizadas": round(meta * 0.93), "programadas": meta},
        {"mes": "Abr/26", "realizadas": round(meta * 0.95), "programadas": meta},
        {"mes": "Mai/26", "realizadas": round(meta * 0.90), "programadas": meta},
        {"mes": "Jun/26", "realizadas": round(meta * 0.93), "programadas": meta},
        {"mes": "Jul/26", "realizadas": next(
            (v["realizadas"] for v in _VISITAS if v["acs_id"] == acs_id), 0
        ), "programadas": meta},
    ]

    return {
        "acs": _enriquecer_acs(acs),
        "historico_visitas": historico_visitas,
        "fonte": "referencia",
    }


# ── eSUS PEC endpoints ────────────────────────────────────────────────────────

@router.get("/esus/status")
async def esus_status(_: UserOut = Depends(get_current_user)):
    """Verifica conectividade com o eSUS PEC."""
    return await status_pec()


@router.get("/esus/visitas")
async def esus_visitas(
    competencia: str | None = Query(None, description="AAAAMM ex: 202607"),
    _: UserOut = Depends(get_current_user),
):
    """
    Visitas domiciliares do eSUS PEC para o mês/competência.
    Se PEC indisponível, retorna dados de referência enriquecidos.
    """
    pec_data = await visitas_domiciliares(competencia=competencia)
    if pec_data:
        return {"fonte": "esus_pec", "competencia": competencia, "dados": pec_data}

    # Fallback: dados de referência em formato compatível
    acs_enriq = [_enriquecer_acs(a) for a in _ACS]
    visitas_ref = []
    for a in acs_enriq:
        if not a["ativo"]:
            continue
        v = a["visitas"]
        for i in range(v["realizadas"]):
            s = i + a["id"] * 100
            visitas_ref.append({
                "acs_id": a["id"],
                "acs_nome": a["nome"],
                "microarea": a["microarea"],
                "equipe": a["equipe"], "tipo": a["tipo"],
                "tipo_visita": ["visita_periodica","busca_ativa","acompanhamento_gestante","acompanhamento_crianca","outros"][s % 5],
                "turno": ["manha","tarde","noite"][s % 3],
                "desfecho": ["visita_realizada","ausente","recusa"][(s // 3) % 3],
                "data": f"2026-07-{(s % 28) + 1:02d}",
                "grupos_prioritarios": {
                    "gestante": bool(s % 7 == 0),
                    "crianca_lt2": bool(s % 11 == 0),
                    "idoso": bool(s % 5 == 0),
                },
            })
    return {
        "fonte": "referencia",
        "competencia": competencia or "202607",
        "total": len(visitas_ref),
        "dados": visitas_ref[:500],
    }


@router.get("/esus/cadastros-individuais")
async def esus_cadastros_individuais(
    pagina: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Fichas de cadastro individual do eSUS PEC."""
    pec_data = await cadastros_individuais(pagina=pagina)
    if pec_data:
        return {"fonte": "esus_pec", "dados": pec_data}

    # Fallback: gera fichas sintéticas a partir dos ACS
    fichas = []
    for a in [a for a in _ACS if a["ativo"]]:
        ind = next((i for i in _INDICADORES_ACS if i["acs_id"] == a["id"]), {})
        total_pessoas = a["familias_cadastradas"] * 3
        for n in range(min(total_pessoas, 12)):
            s = a["id"] * 37 + n * 13
            ano_nasc = 1940 + (s % 80)
            fichas.append({
                "id": len(fichas) + 1,
                "cns": f"7{a['id']:02d}{n:04d}000000000",
                "cpf_mascarado": f"***.{(s%999):03d}.{(s%999):03d}-**",
                "nome": f"Cidadão {n+1} — {a['microarea']}",
                "data_nascimento": f"{ano_nasc}-{(s%12)+1:02d}-{(s%28)+1:02d}",
                "sexo": "F" if s % 2 == 0 else "M",
                "raca_cor": ["Branca","Preta","Parda","Amarela","Indígena"][s % 5],
                "microarea": a["microarea"],
                "equipe": a["equipe"], "tipo": a["tipo"],
                "acs_nome": a["nome"],
                "acs_id": a["id"],
                "condicoes_saude": {
                    "gestante": bool(n < ind.get("gestantes_ativas", 0)),
                    "crianca_lt2": bool(n < ind.get("criancas_lt2", 0)),
                    "hipertensao": bool(s % 4 == 0),
                    "diabetes": bool(s % 7 == 0),
                    "doenca_respiratoria": bool(s % 11 == 0),
                },
                "situacao_moradia": ["propria","alugada","cedida","irregular"][s % 4],
                "escolaridade": ["sem_escolaridade","fundamental_incompleto","fundamental_completo","medio_completo","superior"][s % 5],
                "pct_completo": min(100, 40 + (s % 60)),
                "status_cadastro": "completo" if s % 3 == 0 else ("parcial" if s % 3 == 1 else "incompleto"),
                "ultima_atualizacao": f"2026-0{(s%6)+1:d}-{(s%28)+1:02d}",
            })
    return {
        "fonte": "referencia",
        "pagina": pagina,
        "total": len(fichas),
        "dados": fichas[pagina*50:(pagina+1)*50],
    }


@router.get("/esus/cadastros-domiciliares")
async def esus_cadastros_domiciliares(
    pagina: int = Query(0),
    _: UserOut = Depends(get_current_user),
):
    """Fichas de cadastro domiciliar do eSUS PEC."""
    pec_data = await cadastros_domiciliares(pagina=pagina)
    if pec_data:
        return {"fonte": "esus_pec", "dados": pec_data}

    fichas = []
    for a in [a for a in _ACS if a["ativo"]]:
        for n in range(min(a["familias_cadastradas"], 12)):
            s = a["id"] * 41 + n * 17
            fichas.append({
                "id": len(fichas) + 1,
                "logradouro": f"Rua {['das Flores','Principal','do Bosque','Nova','do Sol'][s%5]}, {(s%200)+1}",
                "microarea": a["microarea"],
                "equipe": a["equipe"], "tipo": a["tipo"],
                "acs_nome": a["nome"],
                "acs_id": a["id"],
                "moradores": (s % 6) + 1,
                "tipo_moradia": ["casa","apartamento","comodo","improviso"][s % 4],
                "abastecimento_agua": ["rede_publica","poco","rio_lago","outro"][s % 4],
                "destino_lixo": ["coletado","queimado","enterrado","ceu_aberto"][s % 4],
                "energia_eletrica": bool(s % 9 != 0),
                "animais_domicilio": bool(s % 3 == 0),
                "ultima_atualizacao": f"2026-0{(s%6)+1:d}-{(s%28)+1:02d}",
                "status_cadastro": "completo" if s % 3 == 0 else ("parcial" if s % 3 == 1 else "incompleto"),
            })
    return {
        "fonte": "referencia",
        "pagina": pagina,
        "total": len(fichas),
        "dados": fichas[pagina*50:(pagina+1)*50],
    }


@router.get("/esus/calendario-visitas")
async def calendario_visitas(
    mes: int = Query(7),
    ano: int = Query(2026),
    esf: str | None = Query(None),
    acs_id: int | None = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """Calendário de visitas domiciliares programadas e realizadas."""
    import calendar
    _, dias_no_mes = calendar.monthrange(ano, mes)
    acs_list = [
        a for a in _ACS if a["ativo"]
        and (not acs_id or a["id"] == acs_id)
        and (not esf or a["equipe"] == esf)
    ]

    eventos = []
    for a in acs_list:
        v = next((x for x in _VISITAS if x["acs_id"] == a["id"]), {})
        prog = v.get("programadas", 0)
        real = v.get("realizadas", 0)
        visitas_por_dia = max(1, prog // 22)  # ~22 dias úteis/mês

        for dia in range(1, dias_no_mes + 1):
            s = (a["id"] * 31 + dia * 7) % 100
            realizada = dia <= (dias_no_mes * real // max(prog, 1))
            eventos.append({
                "acs_id": a["id"],
                "acs_nome": a["nome"],
                "microarea": a["microarea"],
                "equipe": a["equipe"], "tipo": a["tipo"],
                "data": f"{ano}-{mes:02d}-{dia:02d}",
                "dia": dia,
                "programadas": visitas_por_dia,
                "realizadas": visitas_por_dia if realizada else (visitas_por_dia - 1 if s > 20 else 0),
                "status": "realizado" if realizada else ("parcial" if s > 50 else "pendente"),
            })

    return {
        "mes": mes, "ano": ano, "dias": dias_no_mes,
        "acs_count": len(acs_list),
        "eventos": eventos,
        "fonte": "referencia",
    }
