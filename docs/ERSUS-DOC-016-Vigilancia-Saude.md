# ERSUS-DOC-016 — Vigilância em Saúde
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo de Vigilância em Saúde do ERSUS 360, integrando SINAN, SIM, SINASC, GAL, SI-PNI e controle de endemias — fornecendo ao gestor municipal uma visão consolidada da situação epidemiológica de Apuí/AM.

---

## 2. Sub-módulos de Vigilância

| Sub-módulo | Sistema origem | Dados principais |
|---|---|---|
| Doenças e Agravos | SINAN | Notificações por CID, semana epidemiológica |
| Mortalidade | SIM | Óbitos por causa, faixa etária, local |
| Nascidos Vivos | SINASC | Partos, APGAR, peso, tipo de parto |
| Imunização | SI-PNI | Coberturas vacinais por vacina e faixa etária |
| Laboratório | GAL | Exames, resultados, surtos |
| Endemias | SINAN / local | Dengue, malária, leishmaniose |

---

## 3. Doenças e Agravos — SINAN

### 3.1 Principais agravos monitorados em Apuí/AM
| Agravo | CID | Periodicidade notificação |
|---|---|---|
| Malária | B50–B54 | Imediata |
| Dengue | A90–A91 | Semanal |
| Leishmaniose Visceral | B55 | Imediata |
| Leishmaniose Tegumentar | B55 | Semanal |
| Tuberculose | A15–A19 | Semanal |
| Hanseníase | A30 | Mensal |
| Hepatites Virais | B15–B19 | Semanal |
| COVID-19 | U07 | Semanal |
| Leptospirose | A27 | Semanal |
| Acidentes por animais | T63 | Mensal |

### 3.2 Painel epidemiológico
- Notificações por semana epidemiológica (curva epidêmica)
- Mapa de casos por bairro/microárea
- Taxa de incidência por 100 mil habitantes
- Alertas de surto (aumento > 2x média histórica)

---

## 4. Mortalidade — SIM

### 4.1 Indicadores
| Indicador | Fórmula |
|---|---|
| Coeficiente de mortalidade geral | Óbitos / população × 1000 |
| Mortalidade infantil | Óbitos < 1 ano / NV × 1000 |
| Mortalidade materna | Óbitos maternas / NV × 100.000 |
| Proporção de óbitos por causas externas | Óbitos externos / total × 100 |
| Proporção de óbitos por DCNT | Óbitos DCNT / total × 100 |

---

## 5. Nascidos Vivos — SINASC

### 5.1 Indicadores
| Indicador | Meta nacional |
|---|---|
| Proporção de pré-natal ≥ 7 consultas | ≥ 60% |
| Proporção de baixo peso ao nascer | < 10% |
| Proporção cesáreas | < 45% |
| Proporção prematuridade | < 10% |
| APGAR 5' < 7 | < 1% |

---

## 6. Imunização — SI-PNI

### 6.1 Coberturas monitoradas
| Vacina | Público-alvo | Meta |
|---|---|---|
| BCG | Recém-nascidos | ≥ 90% |
| Poliomielite | < 5 anos | ≥ 95% |
| Pentavalente (DTP+Hib+HepB) | < 1 ano | ≥ 95% |
| Tríplice viral (SCR) | 1 ano | ≥ 95% |
| Meningocócica C | < 2 anos | ≥ 90% |
| Pneumocócica 10V | < 2 anos | ≥ 90% |
| Febre Amarela | 9 meses+ (região endêmica) | ≥ 95% |
| COVID-19 | ≥ 12 anos | ≥ 90% |
| Influenza | Grupos prioritários | ≥ 90% |

---

## 7. Endemias — Foco Apuí/AM

### 7.1 Malária (principal endemia)
- Apuí/AM é região de transmissão ativa de malária
- IPA (Índice Parasitário Anual) — meta: IPA < 10/1.000
- Monitoramento por espécie (P. vivax, P. falciparum)
- Mapa de focos e criadouros

### 7.2 Leishmaniose
- Leishmaniose Tegumentar Americana (LTA) — endêmica
- Leishmaniose Visceral (LV) — monitoramento
- Controle vetorial (flebotomíneos)

---

## 8. Endpoints da API

```
GET /api/vigilancia/sinan/notificacoes       → notificações por agravo/período
GET /api/vigilancia/sinan/curva-epidemica    → série temporal por semana epi
GET /api/vigilancia/sim/obitos               → óbitos por causa/período
GET /api/vigilancia/sinasc/nascidos-vivos    → indicadores SINASC
GET /api/vigilancia/pni/coberturas           → coberturas vacinais por vacina
GET /api/vigilancia/endemias/malaria         → casos malária IPA
GET /api/vigilancia/endemias/leishmaniose    → casos leishmaniose
GET /api/vigilancia/alertas                  → alertas epidemiológicos ativos
GET /api/vigilancia/dashboard                → painel consolidado
```

---

## 9. Regras de Negócio

- RN-016-01: Notificações SINAN são obrigatórias — alertar casos não notificados
- RN-016-02: IPA > 50 em Apuí deve gerar alerta crítico imediato
- RN-016-03: Cobertura vacinal < 80% gera alerta no painel de gestão
- RN-016-04: Óbito materno deve gerar investigação automática (formulário)
- RN-016-05: Todos os indicadores devem exibir comparativo com ano anterior

---

## 10. Critérios de Aceite

- [ ] Painel epidemiológico com principais agravos de Apuí/AM
- [ ] Coberturas vacinais com semáforo por vacina
- [ ] Curva epidêmica de malária (principal endemia local)
- [ ] Indicadores SIM e SINASC calculados
- [ ] Alertas epidemiológicos ativos no painel
- [ ] API testada com dados de referência Apuí/AM

---

**Documento:** ERSUS-DOC-016
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-015 — Atenção Primária à Saúde
**Próximo:** ERSUS-DOC-017 — Planejamento em Saúde
