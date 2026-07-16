# ERSUS-DOC-007 — Roadmap do Produto
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o roadmap oficial de desenvolvimento do ERSUS 360, detalhando as 20 fases, prioridades, dependências, critérios de entrega e prazos estimados.

---

## 2. Princípios do Roadmap

1. **Um documento por vez** — cada documento é desenvolvido, testado e homologado antes do próximo
2. **Valor incremental** — cada fase entrega valor real ao município, não apenas código
3. **Piloto primeiro** — tudo é validado em Apuí/AM antes de escalar
4. **Feedback contínuo** — gestores municipais participam da validação de cada fase
5. **Sem big bang** — nunca entregar tudo de uma vez; entregas pequenas e frequentes

---

## 3. Status Atual

| Item | Status | Observação |
|---|---|---|
| Backend FastAPI (Railway) | ✅ Produção | ersus360-production.up.railway.app |
| Frontend React/Vite (Vercel) | ✅ Produção | ersus360.vercel.app |
| Autenticação JWT | ✅ Produção | gestor/ersus2026 |
| Integração CNES | ✅ Produção | Dados públicos DATASUS |
| Integração FNS API | ✅ Produção | Credenciais configuradas |
| Integração e-SUS PEC | ✅ Produção | Apuí/AM |
| Sidebar VersaSaúde (11 módulos) | ✅ Produção | Modelo completo |
| Novo Financiamento APS (7 indicadores) | ✅ Produção | Com dados reais |
| SUS 360° integrado (iframe) | ✅ Produção | MS |
| DOC-001 a DOC-006 | ✅ Concluídos | Fase 1 Governança |

---

## 4. As 20 Fases — Visão Geral

```
2026                    2027                    2028+
│                       │                       │
Fase 1  ████ (Governança — concluído)
Fase 2  ████████ (Infraestrutura — em andamento)
Fase 3       ████ (Cadastros Mestres)
Fase 4           ████ (RH)
Fase 5               ████ (Farmácia)
Fase 6                   ████ (APS)
Fase 7                       ████ (Vigilância)
Fase 8                           ████ (Planejamento)
Fase 9                               ████ (Financeiro)
Fase 10                                  ████ (Obras)
Fase 11                                      ██ (Patrimônio)
Fase 12                                        ██ (Frota)
Fase 13                                          ████ (BI)
Fase 14                                              ████ (OCIS)
Fase 15                                                  ████ (IA)
Fase 16                                                      ██ (App)
Fase 17                                                        ██ (Portal Gestor)
Fase 18                                                          ██ (Portal Cidadão)
Fase 19                                                            ██ (Compliance)
Fase 20                                                              ██ (Marketplace)
```

---

## 5. Detalhamento das Fases

---

### FASE 1 — GOVERNANÇA DO PRODUTO
**Status:** 🟡 Em andamento
**Prazo:** Jul–Ago/2026
**Plano:** Todos

| Doc | Título | Status |
|---|---|---|
| DOC-001 | Visão Estratégica | ✅ Concluído |
| DOC-002 | Missão, Visão e Valores | ✅ Concluído |
| DOC-003 | Estudo de Mercado | ✅ Concluído |
| DOC-004 | Personas | ✅ Concluído |
| DOC-005 | Modelo de Negócio | ✅ Concluído |
| DOC-006 | Planos Comerciais | ✅ Concluído |
| DOC-007 | Roadmap do Produto | ✅ Este documento |
| DOC-008 | Arquitetura Geral | 🔜 Próximo |
| DOC-009 | Framework ERSUS | — |
| DOC-010 | Guia do Desenvolvedor | — |

**Critério de conclusão:** Todos os 10 documentos aprovados e versionados no GitHub

---

### FASE 2 — INFRAESTRUTURA
**Status:** 🟡 Parcialmente implementado
**Prazo:** Ago–Set/2026
**Plano:** Todos

| Módulo | Status | Prioridade |
|---|---|---|
| Login / Autenticação JWT | ✅ Produção | — |
| Controle de Usuários | ✅ Básico | Alta |
| Controle de Permissões (RBAC) | 🔜 Roadmap | Alta |
| Perfis (Gestor, Admin, ACS, Financeiro) | 🔜 Roadmap | Alta |
| Empresas / Tenants | 🔜 Roadmap | Alta |
| Municípios (multi-tenant) | 🔜 Roadmap | Alta |
| Auditoria completa | 🔜 Roadmap | Alta |
| Logs de acesso | 🔜 Roadmap | Média |
| Configurações Gerais | 🔜 Roadmap | Média |
| IA Base (Anthropic Claude) | ✅ Produção (IA Gestora) | — |

---

### FASE 3 — CADASTROS MESTRES
**Status:** ⚪ Não iniciado
**Prazo:** Set–Out/2026
**Plano:** Prata+

| Cadastro | Descrição |
|---|---|
| Profissionais | CRM, CRN, CBO, vínculo, lotação |
| Pacientes | CNS, CPF, dados demográficos |
| UBS | Endereço, equipes, horários |
| CNES | Integração automática DATASUS |
| CBO | Tabela de ocupações do SUS |
| Equipes (ESF, eSB, eMulti, eSFR) | Composição, área de abrangência |
| ACS / ACE | Microáreas, famílias acompanhadas |
| Medicamentos | DCB, apresentação, concentração |
| Fornecedores | CNPJ, contatos, histórico |
| Contas Bancárias | Banco, agência, conta por programa |
| Fontes de Recursos | FNS, emendas, recursos próprios |

---

### FASE 4 — RECURSOS HUMANOS
**Status:** ⚪ Não iniciado
**Prazo:** Out–Nov/2026
**Plano:** Ouro+

| Módulo | Descrição |
|---|---|
| Cadastro de servidores | Dados pessoais, documentos, foto |
| Lotação | UBS, setor, cargo |
| Movimentações | Transferências, afastamentos |
| Vínculos | CLT, estatutário, temporário, terceirizado |
| Fontes de pagamento | Recurso próprio, FNS, emenda |
| Contratos | Temporários, terceirizados |
| Férias | Programação, histórico, saldo |
| Escalas | Plantões, turnos, folgas |
| Avaliações | Desempenho, competências |
| Painel RH | KPIs de pessoal, absenteísmo |

---

### FASE 5 — ASSISTÊNCIA FARMACÊUTICA
**Status:** ⚪ Não iniciado
**Prazo:** Nov–Dez/2026
**Plano:** Prata+

| Módulo | Descrição |
|---|---|
| Cadastro de medicamentos | DCB, RENAME, controlados |
| Almoxarifado Central | Estoque central, lotes, validade |
| Farmácia Central | Saídas, entradas, saldo |
| Farmácias das UBS | Estoque por unidade |
| Dispensação | Registro por paciente, receita |
| Controle de receitas | Validade, renovação, histórico |
| Lotes | Rastreamento por lote/fabricante |
| Validade | Alertas de vencimento automáticos |
| Inventário | Contagem periódica, ajustes |
| Compras | Processo licitatório, fornecedores |
| Distribuição | Transferência entre unidades |
| Dashboard Farmácia | Consumo, estoque crítico, projeção |

---

### FASE 6 — ATENÇÃO PRIMÁRIA
**Status:** 🟡 Parcialmente implementado
**Prazo:** Dez/2026–Jan/2027
**Plano:** Bronze+

| Módulo | Status |
|---|---|
| Saúde Brasil 360 | 🔜 Telas criadas, dados pendentes |
| Novo Financiamento APS (7 ind.) | ✅ Produção |
| Painel de Gestão | ✅ Produção |
| Busca Ativa | 🔜 Telas criadas, dados pendentes |
| ACS | 🔜 Telas criadas, dados pendentes |
| Inconsistências | 🔜 Telas criadas |
| POEPS | 🔜 Telas criadas |
| Programa Saúde na Escola | 🔜 Telas criadas |
| e-SUS APS (integração) | ✅ Produção |
| SIAPS | 🔜 Roadmap |
| Informatiza APS | 🔜 Roadmap |

---

### FASE 7 — VIGILÂNCIA EM SAÚDE
**Status:** ⚪ Não iniciado
**Prazo:** Jan–Fev/2027
**Plano:** Prata+

| Módulo | Sistema de origem |
|---|---|
| SINAN | Doenças e agravos de notificação |
| SIM | Sistema de Informação de Mortalidade |
| SINASC | Nascidos vivos |
| GAL | Gerenciador de ambiente laboratorial |
| Imunização (SI-PNI) | Coberturas vacinais |
| Endemias | Dengue, malária, leishmaniose |

---

### FASE 8 — PLANEJAMENTO
**Status:** ⚪ Não iniciado
**Prazo:** Fev–Mar/2027
**Plano:** Prata+

| Documento | Descrição |
|---|---|
| PMS | Plano Municipal de Saúde (4 anos) |
| PAS | Programação Anual de Saúde |
| RAG | Relatório Anual de Gestão |
| Programação Financeira | Receitas e despesas previstas |
| Indicadores de pactuação | Metas anuais pactuadas |

---

### FASE 9 — FINANCEIRO
**Status:** 🟡 Parcialmente implementado
**Prazo:** Mar–Abr/2027
**Plano:** Bronze+

| Módulo | Status |
|---|---|
| FNS — Repasses | ✅ Integração básica |
| Convênios | ✅ Básico |
| Execução financeira | ✅ Básico |
| Contas bancárias | 🔜 Roadmap |
| Prestação de contas | 🔜 Roadmap |
| TransfereGov | 🔜 Roadmap |
| Emendas parlamentares | ✅ Básico |

---

### FASE 10 — OBRAS
**Status:** 🟡 Básico implementado
**Prazo:** Abr/2027
**Plano:** Ouro+

| Módulo | Status |
|---|---|
| Acompanhamento de obras | ✅ Básico |
| SISMOB | 🔜 Roadmap |
| PAC Saúde | 🔜 Roadmap |
| Cronogramas | 🔜 Roadmap |
| Medições | 🔜 Roadmap |

---

### FASES 11–20 — EXPANSÃO
**Status:** ⚪ Não iniciado
**Prazo:** Mai/2027–Dez/2028

| Fase | Módulo | Prazo |
|---|---|---|
| 11 | Patrimônio | Mai/2027 |
| 12 | Frota | Jun/2027 |
| 13 | Business Intelligence avançado | Jul–Ago/2027 |
| 14 | OCIS — Centro de Operações | Set–Out/2027 |
| 15 | Inteligência Artificial avançada | Nov–Dez/2027 |
| 16 | App Mobile (Android/iOS) | Jan–Mar/2028 |
| 17 | Portal do Gestor | Abr/2028 |
| 18 | Portal do Cidadão | Mai/2028 |
| 19 | Compliance SUS | Jun/2028 |
| 20 | Marketplace e Academia ERSUS | Set–Dez/2028 |

---

## 6. Critérios de Entrega por Fase

Cada fase só é considerada concluída quando:
1. ✅ Documentação técnica aprovada
2. ✅ Backend implementado e testado
3. ✅ Frontend implementado e testado
4. ✅ Integração com sistemas SUS validada
5. ✅ Piloto em Apuí/AM aprovado pelo gestor
6. ✅ Deploy em produção (Railway + Vercel)
7. ✅ Documentação de usuário publicada

---

## 7. Regras de Negócio

- RN-007-01: Nenhuma fase pode ser iniciada sem a anterior concluída (exceto fases paralelas indicadas)
- RN-007-02: O roadmap deve ser revisado trimestralmente
- RN-007-03: Qualquer desvio de prazo superior a 30 dias deve ser comunicado formalmente
- RN-007-04: Funcionalidades não previstas no roadmap entram como "backlog" e são priorizadas na revisão trimestral

---

## 8. Critérios de Aceite

- [ ] Roadmap publicado no GitHub e acessível ao time
- [ ] Fases 1–6 com prazo confirmado pelo fundador
- [ ] Critérios de entrega validados com time técnico
- [ ] Revisão trimestral agendada (Out/2026, Jan/2027, Abr/2027)

---

**Documento:** ERSUS-DOC-007
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-006 — Planos Comerciais
**Próximo:** ERSUS-DOC-008 — Arquitetura Geral
