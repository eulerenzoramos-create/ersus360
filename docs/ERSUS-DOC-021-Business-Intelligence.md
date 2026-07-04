# ERSUS-DOC-021 — Business Intelligence
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo de Business Intelligence (BI) do ERSUS 360, fornecendo painéis analíticos avançados, visualizações de dados cruzados entre todos os módulos, rankings, comparativos históricos e exportação para tomada de decisão da gestão municipal de saúde.

---

## 2. Arquitetura de BI

```
Fontes de Dados (todos os módulos)
         ↓
   Data Warehouse (SQLite/PostgreSQL)
         ↓
   Camada Analítica (FastAPI + pandas)
         ↓
   Dashboards React (Recharts + D3.js)
         ↓
   Exportação (PDF / Excel / CSV)
```

---

## 3. Painéis de BI

### 3.1 Painel Executivo (Secretário e Prefeito)
| Indicador | Visualização |
|---|---|
| Score ERSUS 360 (0–100) | Gauge chart |
| Previne Brasil — média quadrimestral | Progress bars |
| Execução financeira PAB | Barra empilhada |
| Headcount por vínculo | Donut chart |
| Top 5 doenças notificadas | Ranking |
| Cobertura ESF (%) | KPI card |
| Alertas críticos ativos | Badge contador |

### 3.2 Painel APS (Coordenador)
| Indicador | Visualização |
|---|---|
| Produção por equipe (consultas/mês) | Barras horizontais |
| Indicadores Previne Brasil por equipe | Heatmap |
| Famílias com cadastro ativo vs. total | Stacked bar |
| Evolução mensal de atendimentos | Linha temporal |
| ACS: visitas realizadas vs. meta | Gauge por ACS |
| Inconsistências por tipo | Barras |

### 3.3 Painel Financeiro
| Indicador | Visualização |
|---|---|
| Receita vs. Despesa por bloco | Barras agrupadas |
| Evolução mensal FNS 12 meses | Linha temporal |
| % mínimo constitucional | Gauge (meta 15%) |
| Convênios por status | Donut |
| Emendas: captadas vs. executadas | Barras |

### 3.4 Painel Epidemiológico
| Indicador | Visualização |
|---|---|
| Curva epidêmica malária | Linha temporal |
| Notificações por semana epi | Barras |
| Coberturas vacinais | Radar chart |
| Mortalidade infantil histórico | Linha 5 anos |

---

## 4. Score ERSUS 360

### 4.1 Composição do score (0–100 pontos)
| Dimensão | Peso | Indicadores |
|---|---|---|
| Atenção Primária | 35% | Previne Brasil (média 7 ind.) |
| Financeiro | 25% | Execução PAB, mínimo const., adimplência |
| Epidemiologia | 20% | Coberturas vacinais, IPA malária |
| Gestão | 10% | Planilhas RDQA, indicadores PAS |
| Infraestrutura | 10% | Cadastros atualizados, equipes ativas |

### 4.2 Faixas do score
| Faixa | Cor | Classificação |
|---|---|---|
| 80–100 | Verde | Excelente gestão |
| 60–79 | Amarelo | Gestão em desenvolvimento |
| 40–59 | Laranja | Necessita atenção |
| 0–39 | Vermelho | Situação crítica |

---

## 5. Ranking de Municípios (Plano Diamante)

### 5.1 Comparativo regional
- Ranking de municípios do Amazonas por Score ERSUS
- Comparativo por porte (< 10k, 10–50k, 50–100k hab)
- Posição de Apuí/AM no ranking estadual
- Principais diferenciais positivos e negativos

---

## 6. Exportações e Relatórios

### 6.1 Formatos disponíveis
| Formato | Uso |
|---|---|
| PDF executivo | Apresentação ao prefeito/CMS |
| Excel (.xlsx) | Análise detalhada, auditoria |
| CSV | Importação em outros sistemas |
| JSON | Integração com sistemas externos |

### 6.2 Relatórios pré-formatados
- Relatório mensal de gestão (automático no dia 1)
- Relatório quadrimestral RDQA (template MS)
- Relatório de indicadores Previne Brasil
- Relatório financeiro por bloco
- Relatório epidemiológico semanal

---

## 7. Endpoints da API

```
GET /api/bi/score                    → Score ERSUS 360 atual
GET /api/bi/painel-executivo         → dados painel executivo
GET /api/bi/painel-aps               → dados painel APS
GET /api/bi/painel-financeiro        → dados painel financeiro
GET /api/bi/painel-epidemiologico    → dados painel epidemiológico
GET /api/bi/historico/{modulo}       → série histórica de indicadores
GET /api/bi/ranking                  → ranking municipal (Diamante)
POST /api/bi/relatorio/pdf           → gerar relatório PDF
POST /api/bi/relatorio/excel         → gerar relatório Excel
```

---

## 8. Regras de Negócio

- RN-021-01: Score ERSUS 360 é recalculado diariamente às 1h (job automático)
- RN-021-02: Relatório mensal é gerado automaticamente e enviado por e-mail ao gestor
- RN-021-03: Dados históricos são preservados indefinidamente para comparativos
- RN-021-04: Ranking de municípios só aparece no plano Diamante
- RN-021-05: Exportações em Excel têm limite de 50.000 linhas por arquivo

---

## 9. Critérios de Aceite

- [ ] Score ERSUS 360 calculado e exibido no dashboard
- [ ] Painel executivo com 7 indicadores visuais
- [ ] Painel APS com produção por equipe
- [ ] Série histórica de 12 meses para indicadores principais
- [ ] Exportação PDF e Excel funcionando
- [ ] Relatório mensal automático gerado no dia 1

---

**Documento:** ERSUS-DOC-021
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-020 — Patrimônio e Frota
**Próximo:** ERSUS-DOC-022 — OCIS: Centro de Operações em Saúde
