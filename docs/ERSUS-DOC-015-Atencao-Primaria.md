# ERSUS-DOC-015 — Atenção Primária à Saúde
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Detalhar o módulo de Atenção Primária à Saúde (APS) do ERSUS 360, integrando Saúde Brasil 360, Novo Financiamento APS, Busca Ativa, ACS, Inconsistências, POEPS e Programa Saúde na Escola — todos alimentados pelo e-SUS PEC de Apuí/AM.

---

## 2. Visão Geral dos Sub-módulos APS

| Sub-módulo | Fonte | Status |
|---|---|---|
| Saúde Brasil 360 | SISAB / e-SUS | 🟡 Telas criadas |
| Novo Financiamento APS (7 ind.) | FNS API / SISAB | ✅ Produção |
| Busca Ativa — Gestante | e-SUS PEC | 🟡 Telas criadas |
| Busca Ativa — Vacinas | e-SUS PEC / SI-PNI | 🟡 Telas criadas |
| ACS — Painel e Produção | e-SUS PEC | 🟡 Telas criadas |
| Inconsistências (6 tipos) | e-SUS PEC | 🟡 Telas criadas |
| POEPS (7 indicadores) | SISAB / e-SUS | 🟡 Telas criadas |
| Programa Saúde na Escola | e-SUS PSE | 🟡 Telas criadas |

---

## 3. Saúde Brasil 360

### 3.1 Painéis disponíveis
| Painel | Descrição | Indicadores |
|---|---|---|
| Vínculo e Acompanhamento | % famílias com vínculo ativo | Cadastros, visitas, cobertura |
| Qualidade Clínica | Procedimentos realizados | Consultas, exames, vacinas |
| Saúde da Mulher | Pré-natal, citopatológico | Gestantes, puérperas |
| Saúde Bucal | Produção odontológica | 1ª consulta, procedimentos |
| Saúde do Adulto | HAS, DM, obesidade | Cadastros, acompanhamento |
| Saúde da Criança | Crescimento, desenvolvimento | < 2 anos, < 5 anos |
| Saúde do Idoso | 60+ anos | Visitas domiciliares, fragilidade |

---

## 4. Novo Financiamento APS — 7 Indicadores

| # | Indicador | Eixo | Meta | Fórmula |
|---|---|---|---|---|
| 1 | Proporção gestantes pré-natal 6+ consultas | Saúde da Mulher | ≥ 60% | Gestantes c/ 6+cons / total gestantes |
| 2 | Proporção gestantes sífilis/HIV | Saúde da Mulher | ≥ 60% | Testadas / total gestantes |
| 3 | Proporção gestantes odontológica | Saúde da Mulher | ≥ 40% | Com consulta dental / total gestantes |
| 4 | Proporção HAS pressão aferida | Doenças Crônicas | ≥ 60% | Aferidos / cadastrados HAS |
| 5 | Proporção DM hemoglobina glicada | Doenças Crônicas | ≥ 60% | Com exame / cadastrados DM |
| 6 | Cobertura vacinal poliomielite | Imunização | ≥ 95% | Vacinados / público-alvo |
| 7 | Cobertura vacinal pentavalente | Imunização | ≥ 95% | Vacinados / público-alvo |

---

## 5. Busca Ativa

### 5.1 Busca Ativa — Gestante
- Lista de gestantes sem consulta de pré-natal nos últimos 30 dias
- Alertas por trimestre gestacional
- Nome do ACS responsável pela microárea
- Status: ativa, encerrada (parto), transferida

### 5.2 Busca Ativa — Vacinas
- Crianças com vacinas em atraso por faixa etária
- Calendário vacinal vs. situação real
- Lista por ACS para busca em campo
- Alertas de multivacinação (campanha)

---

## 6. Inconsistências — 6 Tipos

| # | Tipo | Descrição | Impacto |
|---|---|---|---|
| 1 | Gestante sem ACS | Gestante sem agente responsável | Novo Financiamento APS Ind. 1 |
| 2 | Cadastro desatualizado | > 24 meses sem atualização | Financiamento PAB |
| 3 | Óbito sem encerramento | Paciente óbito no SIM sem encerramento no e-SUS | Indicadores distorcidos |
| 4 | Duplicidade de cadastro | Mesmo CNS em duas fichas | Dupla contagem |
| 5 | Profissional sem CBO | Atendimento sem classificação ocupacional | SISAB rejeitado |
| 6 | Produção sem identificação | Atendimento sem CNS ou CPF | Não conta para Novo Financiamento APS |

---

## 7. POEPS — 7 Indicadores

| # | Indicador | Componente |
|---|---|---|
| 1 | Cobertura de Atenção Básica | Estrutura |
| 2 | Proporção de gestantes pré-natal 1ª trimestre | Processo |
| 3 | Vigilância alimentar e nutricional SISVAN | Processo |
| 4 | Cobertura vacinal DTP | Resultado |
| 5 | Vigilância alimentar e nutricional obesidade | Processo |
| 6 | Saúde bucal — 1ª consulta | Processo |
| 7 | Proporção internações sensíveis APS | Resultado |

---

## 8. Programa Saúde na Escola (PSE)

### 8.1 Ações obrigatórias
- Avaliação de saúde dos escolares (triagem visual, auditiva, bucal)
- Atualização do calendário vacinal
- Promoção da alimentação saudável
- Prevenção ao uso de álcool/drogas
- Saúde mental e prevenção à violência

### 8.2 Integração
- Escolas cadastradas por município (INEP)
- Estudantes: faixa etária, série, escola
- Ações realizadas por escola e por profissional

---

## 9. Endpoints da API

```
GET /api/aps/saude-brasil-360          → painéis SB360
GET /api/aps/previne/consolidado       → Novo Financiamento APS consolidado
GET /api/aps/previne/indicadores       → 7 indicadores detalhados
GET /api/aps/busca-ativa/gestantes     → gestantes sem acompanhamento
GET /api/aps/busca-ativa/vacinas       → crianças com vacinas em atraso
GET /api/aps/inconsistencias           → 6 tipos de inconsistências
GET /api/aps/poeps                     → 7 indicadores POEPS
GET /api/aps/pse                       → ações PSE por escola
GET /api/aps/producao                  → produção APS por equipe/período
```

---

## 10. Regras de Negócio

- RN-015-01: Todos os indicadores Novo Financiamento APS devem exibir o quadrimestre atual
- RN-015-02: Busca Ativa deve listar apenas pacientes da área de abrangência do ACS logado
- RN-015-03: Inconsistências devem ser resolvidas em até 30 dias após identificação
- RN-015-04: Dados do e-SUS PEC são a fonte primária — fallback usa SISAB público
- RN-015-05: POEPS é calculado com base na produção registrada no e-SUS do período

---

## 11. Critérios de Aceite

- [ ] Novo Financiamento APS exibindo 7 indicadores com semáforo e evolução
- [ ] Busca Ativa com lista filtrável por ACS e microárea
- [ ] Inconsistências com contagem por tipo e botão de exportação
- [ ] POEPS com 7 indicadores e comparativo com meta
- [ ] PSE com ações por escola
- [ ] Integração e-SUS PEC retornando dados reais quando online

---

**Documento:** ERSUS-DOC-015
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-014 — Assistência Farmacêutica
**Próximo:** ERSUS-DOC-016 — Vigilância em Saúde
