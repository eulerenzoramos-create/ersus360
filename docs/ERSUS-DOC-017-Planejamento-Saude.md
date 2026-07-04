# ERSUS-DOC-017 — Planejamento em Saúde
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo de Planejamento em Saúde do ERSUS 360, cobrindo PMS (Plano Municipal de Saúde 4 anos), PAS (Programação Anual de Saúde), RAG (Relatório Anual de Gestão), RDQA (Relatório Detalhado Quadrimestral) e monitoramento de metas pactuadas.

---

## 2. Instrumentos de Planejamento do SUS

```
PMS (4 anos) → define objetivos, metas e estratégias
      ↓
PAS (1 ano) → programação de ações e metas anuais derivadas do PMS
      ↓
RDQA (4 meses) → monitoramento quadrimestral de execução
      ↓
RAG (1 ano) → relatório anual consolidado de gestão
```

---

## 3. PMS — Plano Municipal de Saúde

### 3.1 Estrutura do PMS
| Componente | Descrição |
|---|---|
| Análise situacional | Diagnóstico de saúde do município |
| Objetivos estratégicos | 5–8 objetivos por período |
| Metas quadrienais | Indicadores com valores baseline e meta 4 anos |
| Estratégias e ações | Como atingir cada meta |
| Fontes de financiamento | FNS, recurso próprio, convênios |
| Monitoramento | Responsáveis, prazos, frequência |

### 3.2 Eixos do PMS (DIGISUS)
| Eixo | Descrição |
|---|---|
| 1 | Garantia do acesso e atenção de qualidade |
| 2 | Vigilância em saúde |
| 3 | Gestão do trabalho e educação em saúde |
| 4 | Gestão do SUS |
| 5 | Assistência farmacêutica |

---

## 4. PAS — Programação Anual de Saúde

### 4.1 Estrutura do PAS
- Metas anuais derivadas do PMS
- Ações programadas por trimestre
- Responsáveis por ação
- Recursos financeiros programados (por bloco de financiamento)
- Produção esperada (consultas, procedimentos, visitas)

### 4.2 Indicadores de pactuação — Apuí/AM 2026
| Indicador | Meta anual | Quadrimestre |
|---|---|---|
| Cobertura ESF | 80% | Anual |
| Previne Brasil — Média | 75% | Quadrimestral |
| Cobertura vacinal poliomielite | 95% | Anual |
| Cobertura vacinal pentavalente | 95% | Anual |
| IPA malária | < 10/1.000 hab | Anual |
| Mortalidade infantil | < 15/1.000 NV | Anual |
| Consultas médicas/hab/ano | ≥ 1,0 | Anual |

---

## 5. RDQA — Relatório Quadrimestral

### 5.1 Estrutura
- Período: 1º (jan–abr), 2º (mai–ago), 3º (set–dez)
- Execução financeira por bloco
- Cumprimento de metas do PAS
- Justificativas para metas não atingidas
- Aprovação pelo Conselho Municipal de Saúde (CMS)
- Encaminhamento ao TCE e Ministério da Saúde

### 5.2 Prazo de apresentação ao CMS
| Relatório | Prazo |
|---|---|
| 1º RDQA | até 30 de maio |
| 2º RDQA | até 30 de setembro |
| RAG/3º RDQA | até 30 de março do ano seguinte |

---

## 6. RAG — Relatório Anual de Gestão

### 6.1 Conteúdo obrigatório
- Análise da execução do PAS
- Cumprimento de metas anuais (% por indicador)
- Execução financeira anual (receita vs. despesa por bloco)
- Principais resultados e dificuldades
- Propostas para o próximo período

---

## 7. Endpoints da API

```
GET  /api/planejamento/pms               → objetivos e metas PMS vigente
GET  /api/planejamento/pas               → programação anual e metas
GET  /api/planejamento/pas/execucao      → % execução do PAS atual
GET  /api/planejamento/rdqa/{periodo}    → relatório quadrimestral
GET  /api/planejamento/rag/{ano}         → RAG do ano
GET  /api/planejamento/indicadores       → todos os indicadores monitorados
GET  /api/planejamento/alertas           → metas em risco
POST /api/planejamento/rdqa              → gerar RDQA automático
```

---

## 8. Regras de Negócio

- RN-017-01: RDQA não pode ser gerado sem execução financeira do período preenchida
- RN-017-02: Meta do PAS não pode ser alterada após aprovação do CMS sem nova deliberação
- RN-017-03: Indicadores fora da meta por 2 quadrimestres consecutivos geram alerta crítico
- RN-017-04: RAG deve incluir comparativo com os 3 anos anteriores
- RN-017-05: PMS deve ser revisado quando há mudança de gestão municipal

---

## 9. Critérios de Aceite

- [ ] PMS com objetivos e metas visualizados por eixo
- [ ] PAS com % de execução por ação programada
- [ ] RDQA gerado automaticamente com dados dos módulos
- [ ] Alertas de metas em risco no painel de gestão
- [ ] Comparativo trimestral: previsto vs. realizado
- [ ] Exportação do RDQA em PDF estruturado

---

**Documento:** ERSUS-DOC-017
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-016 — Vigilância em Saúde
**Próximo:** ERSUS-DOC-018 — Financeiro e FNS
