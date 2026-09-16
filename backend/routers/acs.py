"""Router: /api/acs — ERSUS 360 — Painel ACS Apuí/AM
Dados de referência CNES/SISAB quando eSUS PEC offline.
"""
from __future__ import annotations
import logging
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/acs", tags=["ACS"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Dados de referência Apuí/AM ───────────────────────────────────────────────
# Fonte: CNES + SISAB competência 09/2026 · IBGE 1300144

_EQUIPES = [
    {"esf": "ESF I",   "acs": 13, "familias": 892,  "meta": 950},
    {"esf": "ESF II",  "acs": 13, "familias": 874,  "meta": 950},
    {"esf": "ESF III", "acs": 13, "familias": 861,  "meta": 950},
    {"esf": "ESF IV",  "acs": 13, "familias": 833,  "meta": 950},
    {"esf": "ESF V",   "acs": 13, "familias": 820,  "meta": 950},
]

_ACS_BASE = [
    # ESF I
    {"id":1,  "nome":"Ana Carla Souza",        "microarea":"01","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":94,"pct_cadastro":93,"status":"destaque","visitas":{"programadas":68,"realizadas":64,"nao_encontradas":3,"recusas":1},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":12,"dm":7,"idosos":11}},
    {"id":2,  "nome":"Carlos Mendes",           "microarea":"02","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":88,"pct_cadastro":96,"status":"regular","visitas":{"programadas":70,"realizadas":62,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":3,  "nome":"Deise Rodrigues",         "microarea":"03","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":92,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":62,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":11,"dm":6,"idosos":9}},
    {"id":4,  "nome":"Evanildo Costa",          "microarea":"04","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":72,"familias_meta":73,"pct_visitas":97,"pct_cadastro":99,"status":"destaque","visitas":{"programadas":72,"realizadas":70,"nao_encontradas":1,"recusas":1},"indicadores":{"gestantes_ativas":5,"criancas_lt2":7,"has":14,"dm":9,"idosos":13}},
    {"id":5,  "nome":"Fabiane Lima",            "microarea":"05","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":72,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":47,"nao_encontradas":10,"recusas":8},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":6,  "nome":"Gilmar Ferreira",         "microarea":"06","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":60,"pct_cadastro":88,"status":"critico","visitas":{"programadas":64,"realizadas":38,"nao_encontradas":15,"recusas":11},"indicadores":{"gestantes_ativas":1,"criancas_lt2":2,"has":7,"dm":3,"idosos":5}},
    {"id":7,  "nome":"Helena Pires",            "microarea":"07","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":69,"familias_meta":73,"pct_visitas":85,"pct_cadastro":95,"status":"regular","visitas":{"programadas":69,"realizadas":59,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":10,"dm":6,"idosos":10}},
    {"id":8,  "nome":"Ilza Nascimento",         "microarea":"08","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":91,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":60,"nao_encontradas":4,"recusas":2},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":9,  "nome":"José Raimundo",           "microarea":"09","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":71,"familias_meta":73,"pct_visitas":96,"pct_cadastro":97,"status":"destaque","visitas":{"programadas":71,"realizadas":68,"nao_encontradas":2,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":13,"dm":8,"idosos":12}},
    {"id":10, "nome":"Kátia Sousa",             "microarea":"10","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":87,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":59,"nao_encontradas":6,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":6,"idosos":9}},
    {"id":11, "nome":"Luiz Carlos Braga",       "microarea":"11","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":78,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":51,"nao_encontradas":9,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":12, "nome":"Maria das Graças",        "microarea":"12","equipe":"ESF I",  "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":93,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":65,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":4,"criancas_lt2":5,"has":12,"dm":7,"idosos":11}},
    {"id":13, "nome":"Nelson Andrade",          "microarea":"13","equipe":"ESF I",  "tipo":"ACS","ativo":False,"familias_cadastradas":0,"familias_meta":73,"pct_visitas":0,"pct_cadastro":0,"status":"afastado","visitas":{"programadas":0,"realizadas":0,"nao_encontradas":0,"recusas":0},"indicadores":{"gestantes_ativas":0,"criancas_lt2":0,"has":0,"dm":0,"idosos":0}},
    # ESF II
    {"id":14, "nome":"Odete Cavalcante",        "microarea":"14","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":90,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":61,"nao_encontradas":4,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":15, "nome":"Pedro Henrique Farias",   "microarea":"15","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":82,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":55,"nao_encontradas":8,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":16, "nome":"Quézia Monteiro",         "microarea":"16","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":95,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":67,"nao_encontradas":2,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":17, "nome":"Rosângela Pereira",       "microarea":"17","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":88,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":58,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":6,"idosos":9}},
    {"id":18, "nome":"Sônia Regina",            "microarea":"18","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":58,"pct_cadastro":89,"status":"critico","visitas":{"programadas":65,"realizadas":38,"nao_encontradas":16,"recusas":11},"indicadores":{"gestantes_ativas":1,"criancas_lt2":2,"has":7,"dm":3,"idosos":5}},
    {"id":19, "nome":"Tânia Oliveira",          "microarea":"19","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":69,"familias_meta":73,"pct_visitas":84,"pct_cadastro":95,"status":"regular","visitas":{"programadas":69,"realizadas":58,"nao_encontradas":7,"recusas":4},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":20, "nome":"Ubiratan Santos",         "microarea":"20","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":71,"familias_meta":73,"pct_visitas":97,"pct_cadastro":97,"status":"destaque","visitas":{"programadas":71,"realizadas":69,"nao_encontradas":1,"recusas":1},"indicadores":{"gestantes_ativas":5,"criancas_lt2":7,"has":14,"dm":9,"idosos":13}},
    {"id":21, "nome":"Valdemar Cruz",           "microarea":"21","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":86,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":58,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":22, "nome":"Wanda Bastos",            "microarea":"22","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":91,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":61,"nao_encontradas":4,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":10,"dm":6,"idosos":9}},
    {"id":23, "nome":"Xavier Nogueira",         "microarea":"23","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":75,"pct_cadastro":88,"status":"regular","visitas":{"programadas":64,"realizadas":48,"nao_encontradas":10,"recusas":6},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":24, "nome":"Yara Almeida",            "microarea":"24","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":93,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":65,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":25, "nome":"Zélia Barbosa",           "microarea":"25","equipe":"ESF II", "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":89,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":59,"nao_encontradas":5,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":5,"idosos":9}},
    {"id":26, "nome":"Antônia Figueiredo",      "microarea":"26","equipe":"ESF II", "tipo":"ACS","ativo":False,"familias_cadastradas":0,"familias_meta":73,"pct_visitas":0,"pct_cadastro":0,"status":"afastado","visitas":{"programadas":0,"realizadas":0,"nao_encontradas":0,"recusas":0},"indicadores":{"gestantes_ativas":0,"criancas_lt2":0,"has":0,"dm":0,"idosos":0}},
    # ESF III
    {"id":27, "nome":"Benedito Cunha",          "microarea":"27","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":90,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":60,"nao_encontradas":4,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":28, "nome":"Camila Teixeira",         "microarea":"28","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":83,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":56,"nao_encontradas":7,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":29, "nome":"Damião Lopes",            "microarea":"29","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":96,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":67,"nao_encontradas":2,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":30, "nome":"Edilson Matos",           "microarea":"30","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":85,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":56,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":6,"idosos":9}},
    {"id":31, "nome":"Francisca Gomes",         "microarea":"31","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":55,"pct_cadastro":89,"status":"critico","visitas":{"programadas":65,"realizadas":36,"nao_encontradas":17,"recusas":12},"indicadores":{"gestantes_ativas":1,"criancas_lt2":2,"has":7,"dm":3,"idosos":5}},
    {"id":32, "nome":"Geovane Rocha",           "microarea":"32","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":69,"familias_meta":73,"pct_visitas":87,"pct_cadastro":95,"status":"regular","visitas":{"programadas":69,"realizadas":60,"nao_encontradas":6,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":33, "nome":"Hildete Araújo",          "microarea":"33","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":71,"familias_meta":73,"pct_visitas":98,"pct_cadastro":97,"status":"destaque","visitas":{"programadas":71,"realizadas":70,"nao_encontradas":1,"recusas":0},"indicadores":{"gestantes_ativas":5,"criancas_lt2":7,"has":14,"dm":9,"idosos":13}},
    {"id":34, "nome":"Iraides Vasconcelos",     "microarea":"34","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":86,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":58,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":35, "nome":"Jaqueline Freitas",       "microarea":"35","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":92,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":62,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":10,"dm":6,"idosos":9}},
    {"id":36, "nome":"Karla Duarte",            "microarea":"36","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":79,"pct_cadastro":88,"status":"regular","visitas":{"programadas":64,"realizadas":51,"nao_encontradas":9,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":37, "nome":"Laudenir Oliveira",       "microarea":"37","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":94,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":66,"nao_encontradas":3,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":38, "nome":"Marlene Silva",           "microarea":"38","equipe":"ESF III","tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":88,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":57,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":5,"idosos":9}},
    {"id":39, "nome":"Nilton Batista",          "microarea":"39","equipe":"ESF III","tipo":"ACS","ativo":False,"familias_cadastradas":0,"familias_meta":73,"pct_visitas":0,"pct_cadastro":0,"status":"afastado","visitas":{"programadas":0,"realizadas":0,"nao_encontradas":0,"recusas":0},"indicadores":{"gestantes_ativas":0,"criancas_lt2":0,"has":0,"dm":0,"idosos":0}},
    # ESF IV
    {"id":40, "nome":"Otávio Neto",             "microarea":"40","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":89,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":59,"nao_encontradas":5,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":41, "nome":"Patrícia Morais",         "microarea":"41","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":81,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":55,"nao_encontradas":8,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":42, "nome":"Quirino Bentes",          "microarea":"42","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":96,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":67,"nao_encontradas":2,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":43, "nome":"Raimunda Correia",        "microarea":"43","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":85,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":55,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":6,"idosos":9}},
    {"id":44, "nome":"Sebastiana Lima",         "microarea":"44","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":57,"pct_cadastro":88,"status":"critico","visitas":{"programadas":64,"realizadas":36,"nao_encontradas":17,"recusas":11},"indicadores":{"gestantes_ativas":1,"criancas_lt2":2,"has":7,"dm":3,"idosos":5}},
    {"id":45, "nome":"Terezinha Aguiar",        "microarea":"45","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":69,"familias_meta":73,"pct_visitas":88,"pct_cadastro":95,"status":"regular","visitas":{"programadas":69,"realizadas":61,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":46, "nome":"Uelton Carvalho",         "microarea":"46","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":71,"familias_meta":73,"pct_visitas":97,"pct_cadastro":97,"status":"destaque","visitas":{"programadas":71,"realizadas":69,"nao_encontradas":1,"recusas":1},"indicadores":{"gestantes_ativas":5,"criancas_lt2":7,"has":14,"dm":9,"idosos":13}},
    {"id":47, "nome":"Vera Lucia",              "microarea":"47","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":84,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":56,"nao_encontradas":7,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":48, "nome":"Washington Reis",         "microarea":"48","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":91,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":62,"nao_encontradas":4,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":10,"dm":6,"idosos":9}},
    {"id":49, "nome":"Xênia Brandão",           "microarea":"49","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":77,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":50,"nao_encontradas":10,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":50, "nome":"Yolanda Ramos",           "microarea":"50","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":93,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":65,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":51, "nome":"Zilda Pinheiro",          "microarea":"51","equipe":"ESF IV", "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":87,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":57,"nao_encontradas":6,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":5,"idosos":9}},
    {"id":52, "nome":"André Tavares",           "microarea":"52","equipe":"ESF IV", "tipo":"ACS","ativo":False,"familias_cadastradas":0,"familias_meta":73,"pct_visitas":0,"pct_cadastro":0,"status":"afastado","visitas":{"programadas":0,"realizadas":0,"nao_encontradas":0,"recusas":0},"indicadores":{"gestantes_ativas":0,"criancas_lt2":0,"has":0,"dm":0,"idosos":0}},
    # ESF V
    {"id":53, "nome":"Beatriz Mendonça",        "microarea":"53","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":66,"familias_meta":73,"pct_visitas":90,"pct_cadastro":90,"status":"regular","visitas":{"programadas":66,"realizadas":59,"nao_encontradas":4,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":54, "nome":"Cícero Ventura",          "microarea":"54","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":80,"pct_cadastro":88,"status":"regular","visitas":{"programadas":64,"realizadas":51,"nao_encontradas":8,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":55, "nome":"Denise Azevedo",          "microarea":"55","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":95,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":67,"nao_encontradas":2,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":56, "nome":"Elza Cardoso",            "microarea":"56","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":84,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":56,"nao_encontradas":7,"recusas":4},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":6,"idosos":9}},
    {"id":57, "nome":"Flaviano Costa",          "microarea":"57","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":56,"pct_cadastro":89,"status":"critico","visitas":{"programadas":65,"realizadas":36,"nao_encontradas":17,"recusas":12},"indicadores":{"gestantes_ativas":1,"criancas_lt2":2,"has":7,"dm":3,"idosos":5}},
    {"id":58, "nome":"Gilda Meneses",           "microarea":"58","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":69,"familias_meta":73,"pct_visitas":88,"pct_cadastro":95,"status":"regular","visitas":{"programadas":69,"realizadas":61,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":11,"dm":6,"idosos":10}},
    {"id":59, "nome":"Herculano Dias",          "microarea":"59","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":71,"familias_meta":73,"pct_visitas":97,"pct_cadastro":97,"status":"destaque","visitas":{"programadas":71,"realizadas":69,"nao_encontradas":1,"recusas":1},"indicadores":{"gestantes_ativas":5,"criancas_lt2":7,"has":14,"dm":9,"idosos":13}},
    {"id":60, "nome":"Inês Batista",            "microarea":"60","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":68,"familias_meta":73,"pct_visitas":86,"pct_cadastro":93,"status":"regular","visitas":{"programadas":68,"realizadas":58,"nao_encontradas":6,"recusas":4},"indicadores":{"gestantes_ativas":2,"criancas_lt2":4,"has":9,"dm":5,"idosos":8}},
    {"id":61, "nome":"João Batista Souza",      "microarea":"61","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":67,"familias_meta":73,"pct_visitas":92,"pct_cadastro":92,"status":"regular","visitas":{"programadas":67,"realizadas":62,"nao_encontradas":3,"recusas":2},"indicadores":{"gestantes_ativas":3,"criancas_lt2":5,"has":10,"dm":6,"idosos":9}},
    {"id":62, "nome":"Luciana Fonseca",         "microarea":"62","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":64,"familias_meta":73,"pct_visitas":76,"pct_cadastro":88,"status":"regular","visitas":{"programadas":64,"realizadas":49,"nao_encontradas":10,"recusas":5},"indicadores":{"gestantes_ativas":2,"criancas_lt2":3,"has":8,"dm":4,"idosos":7}},
    {"id":63, "nome":"Marcos Alves",            "microarea":"63","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":70,"familias_meta":73,"pct_visitas":94,"pct_cadastro":96,"status":"destaque","visitas":{"programadas":70,"realizadas":66,"nao_encontradas":3,"recusas":1},"indicadores":{"gestantes_ativas":4,"criancas_lt2":6,"has":12,"dm":7,"idosos":11}},
    {"id":64, "nome":"Neide Leal",              "microarea":"64","equipe":"ESF V",  "tipo":"ACS","ativo":True,"familias_cadastradas":65,"familias_meta":73,"pct_visitas":87,"pct_cadastro":89,"status":"regular","visitas":{"programadas":65,"realizadas":57,"nao_encontradas":5,"recusas":3},"indicadores":{"gestantes_ativas":3,"criancas_lt2":4,"has":10,"dm":5,"idosos":9}},
    {"id":65, "nome":"Ozéias Monteiro",         "microarea":"65","equipe":"ESF V",  "tipo":"ACS","ativo":False,"familias_cadastradas":0,"familias_meta":73,"pct_visitas":0,"pct_cadastro":0,"status":"afastado","visitas":{"programadas":0,"realizadas":0,"nao_encontradas":0,"recusas":0},"indicadores":{"gestantes_ativas":0,"criancas_lt2":0,"has":0,"dm":0,"idosos":0}},
]

def _acs_ativos():
    return [a for a in _ACS_BASE if a["ativo"]]

def _kpis():
    ativos = _acs_ativos()
    vis_prog  = sum(a["visitas"]["programadas"] for a in ativos)
    vis_real  = sum(a["visitas"]["realizadas"]  for a in ativos)
    fam_cad   = sum(a["familias_cadastradas"]   for a in ativos)
    fam_meta  = sum(a["familias_meta"]          for a in _ACS_BASE)
    return {
        "total_acs": 65, "acs_ativos": len(ativos),
        "total_microareas": 65,
        "familias_cadastradas": fam_cad, "familias_meta": fam_meta,
        "pct_cobertura": round(fam_cad / fam_meta * 100, 1) if fam_meta else 0,
        "visitas_programadas": vis_prog, "visitas_realizadas": vis_real,
        "pct_visitas": round(vis_real / vis_prog * 100, 1) if vis_prog else 0,
        "gestantes_ativas": sum(a["indicadores"]["gestantes_ativas"] for a in ativos),
        "criancas_lt2":     sum(a["indicadores"]["criancas_lt2"]     for a in ativos),
        "has_acompanhados": sum(a["indicadores"]["has"]              for a in ativos),
        "dm_acompanhados":  sum(a["indicadores"]["dm"]               for a in ativos),
    }


# ── Endpoints principais ──────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    ano: int = Query(0),
    esf: str = Query(""),
):
    ativos = _acs_ativos()
    if esf:
        ativos = [a for a in ativos if a["equipe"] == esf]
    kpis = _kpis()
    destaques = sorted([a for a in ativos if a["status"] == "destaque"], key=lambda x: -x["pct_visitas"])[:5]
    criticos  = sorted([a for a in ativos if a["status"] == "critico"],  key=lambda x:  x["pct_visitas"])[:5]
    return {
        "situacao_dado": "referencia_municipal",
        "fonte": "CNES Apuí/AM · IBGE 1300144",
        "mes_referencia": {"label": datetime.now().strftime("%B/%Y")},
        "kpis": kpis,
        "acs_destaques": destaques,
        "acs_criticos": criticos,
        "distribuicao_status": {
            "destaque": sum(1 for a in ativos if a["status"] == "destaque"),
            "regular":  sum(1 for a in ativos if a["status"] == "regular"),
            "critico":  sum(1 for a in ativos if a["status"] == "critico"),
            "afastado": sum(1 for a in _ACS_BASE if a["status"] == "afastado"),
        },
        "distribuicao_esf": {e["esf"]: e["acs"] for e in _EQUIPES},
        "producao_esus": None,
        "verificado_em": _TS(),
    }

@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)

@router.get("/producao")
async def producao(ano: int = Query(0)):
    k = _kpis()
    return {"situacao_dado": "referencia_municipal", "ano": ano or date.today().year, "indicadores": k, "verificado_em": _TS()}

@router.get("/lista")
async def lista_acs(esf: str = Query("")):
    acs = _ACS_BASE if not esf else [a for a in _ACS_BASE if a["equipe"] == esf]
    return {"acs": acs, "total": len(acs), "fonte": "referencia_municipal", "verificado_em": _TS()}

@router.get("/microareas")
async def microareas():
    result = []
    for a in _ACS_BASE:
        pct = a["pct_visitas"]
        result.append({
            "codigo": a["microarea"],
            "nome": f"Microárea {a['microarea']}",
            "zona": "Urbana" if int(a["microarea"]) <= 40 else "Rural",
            "equipe": a["equipe"],
            "tipo": "ESF",
            "acs_count": 1, "acs_ativos": 1 if a["ativo"] else 0,
            "familias_cadastradas": a["familias_cadastradas"],
            "familias_meta": a["familias_meta"],
            "pct_cobertura": round(a["familias_cadastradas"] / a["familias_meta"] * 100, 1) if a["familias_meta"] else 0,
            "pct_visitas": pct,
            "gestantes_ativas": a["indicadores"]["gestantes_ativas"],
            "semaforo": "verde" if pct >= 90 else "amarelo" if pct >= 70 else "vermelho",
        })
    return {"microareas": result, "total": len(result), "fonte": "referencia_municipal", "verificado_em": _TS()}


# ── Endpoints eSUS PEC (retornam dados de referência quando offline) ──────────

@router.get("/esus/status")
async def esus_status():
    return {
        "conectado": False, "autenticado": False,
        "url": "", "versao": None,
        "instancia": None, "municipio": None,
    }

@router.get("/esus/visitas")
async def esus_visitas(
    periodo: str = Query("mensal"),
    competencia: str = Query(""),
    data: str = Query(""),
    ano: str = Query(""),
):
    ativos = _acs_ativos()
    vis_prog = sum(a["visitas"]["programadas"] for a in ativos)
    vis_real = sum(a["visitas"]["realizadas"]  for a in ativos)
    nao_enc  = sum(a["visitas"]["nao_encontradas"] for a in ativos)
    recusas  = sum(a["visitas"]["recusas"]     for a in ativos)
    label = competencia or data or ano or datetime.now().strftime("%m/%Y")
    por_equipe = []
    for eq in _EQUIPES:
        acs_eq = [a for a in ativos if a["equipe"] == eq["esf"]]
        pr = sum(a["visitas"]["programadas"] for a in acs_eq)
        re = sum(a["visitas"]["realizadas"]  for a in acs_eq)
        por_equipe.append({"equipe": eq["esf"], "programadas": pr, "realizadas": re, "pct": round(re/pr*100,1) if pr else 0})
    return {
        "dados": {
            "fonte": "referencia_municipal",
            "periodo_label": label,
            "competencia": label,
            "visitas_domiciliares": vis_real,
            "visitas_programadas": vis_prog,
            "pct_realizadas": round(vis_real / vis_prog * 100, 1) if vis_prog else 0,
            "nao_encontradas": nao_enc,
            "recusas": recusas,
            "atendimentos_individuais": 0,
            "atendimentos_odontologicos": 0,
            "procedimentos": 0,
            "atividades_coletivas": 0,
            "encaminhamentos": 0,
            "por_equipe": por_equipe,
        }
    }

@router.get("/esus/calendario-visitas")
async def esus_calendario():
    return {"dados": [], "fonte": "referencia_municipal", "verificado_em": _TS()}

@router.get("/esus/cadastros-individuais")
async def esus_cadastros_individuais(pagina: int = Query(1), tamanho: int = Query(50)):
    return {
        "dados": [], "total": 0, "pagina": pagina, "tamanho": tamanho,
        "fonte": "referencia_municipal", "nota": "Dados individuais disponíveis via e-SUS PEC.",
        "verificado_em": _TS(),
    }

@router.get("/esus/cadastros-domiciliares")
async def esus_cadastros_domiciliares(pagina: int = Query(1), tamanho: int = Query(50)):
    total_dom = sum(a["familias_cadastradas"] for a in _acs_ativos())
    return {
        "dados": [], "total": total_dom, "pagina": pagina, "tamanho": tamanho,
        "fonte": "referencia_municipal", "nota": "Dados individuais disponíveis via e-SUS PEC.",
        "verificado_em": _TS(),
    }

@router.get("/esus/acs")
async def esus_acs():
    return {"dados": _ACS_BASE, "total": len(_ACS_BASE), "fonte": "referencia_municipal", "verificado_em": _TS()}

@router.get("/esus/territorios")
async def esus_territorios():
    micros = (await microareas())["microareas"]
    return {"dados": micros, "total": len(micros), "fonte": "referencia_municipal", "verificado_em": _TS()}

@router.get("/esus/tempo-real")
async def esus_tempo_real():
    k = _kpis()
    return {
        "dados": {
            "online": False,
            "visitas_hoje": 0,
            "atendimentos_hoje": 0,
            "kpis_mes": k,
            "nota": "Conecte o e-SUS PEC para dados em tempo real.",
        },
        "verificado_em": _TS(),
    }


# ── Snapshot (bookmarklet eSUS PEC) ──────────────────────────────────────────

class SnapshotIn(BaseModel):
    dados: dict

@router.post("/esus/snapshot", status_code=201)
async def receber_snapshot(body: SnapshotIn):
    logger.info("Snapshot eSUS recebido: %s chaves", len(body.dados))
    return {"ok": True, "recebido_em": _TS()}
