# ERSUS-DOC-014 — Assistência Farmacêutica
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo de Assistência Farmacêutica do ERSUS 360, cobrindo almoxarifado central, farmácias das UBS, dispensação, controle de estoque, vencimentos, lotes, inventário, compras e dashboard de consumo.

---

## 2. Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│              ASSISTÊNCIA FARMACÊUTICA                       │
│                                                             │
│  Almoxarifado Central → Farmácia Central → Farmácias UBS   │
│                                 │                          │
│                          Dispensação ao Paciente           │
│                                 │                          │
│                     ┌───────────┴──────────┐               │
│                 Receita                 Prontuário         │
│               Controlada               e-SUS APS           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Estoque e Almoxarifado

### 3.1 Estrutura de estoque
| Nível | Descrição |
|---|---|
| Almoxarifado Central | Estoque mestre — recebe compras e distribui |
| Farmácia Central | Dispensação de medicamentos básicos |
| Farmácia UBS | Estoque da unidade — recebe da Farmácia Central |

### 3.2 Campos do item de estoque
| Campo | Tipo | Obrigatório |
|---|---|---|
| Medicamento (FK) | FK → Medicamento | ✅ |
| Unidade de saúde | FK → Unidade | ✅ |
| Quantidade atual | decimal | ✅ |
| Quantidade mínima (ponto de pedido) | decimal | ✅ |
| Quantidade máxima | decimal | ✅ |
| Lote | texto | ✅ |
| Data de validade | data | ✅ |
| Fornecedor | FK | — |
| Data de entrada | data | ✅ |
| Status | enum | ✅ |

### 3.3 Status de estoque (semáforo)
| Status | Condição | Cor |
|---|---|---|
| ok | qtd_atual ≥ qtd_minima | Verde |
| critico | qtd_atual < qtd_minima e > 0 | Vermelho |
| zerado | qtd_atual = 0 | Vermelho escuro |
| excesso | qtd_atual > qtd_maxima | Amarelo |
| vencendo | validade ≤ 30 dias | Laranja |
| vencido | validade < hoje | Cinza |

---

## 4. Dispensação

### 4.1 Dados da dispensação
| Campo | Tipo | Obrigatório |
|---|---|---|
| Paciente (CNS/CPF) | texto | ✅ |
| Medicamento | FK | ✅ |
| Quantidade dispensada | decimal | ✅ |
| Unidade dispensadora | FK | ✅ |
| Profissional responsável | FK | ✅ |
| Número da receita | texto | — |
| Data da receita | data | — |
| Validade da receita | data | — |
| Data da dispensação | datetime | ✅ |
| Lote | texto | ✅ |
| Observações | texto | — |

---

## 5. Alertas Automáticos

| Alerta | Condição | Nível |
|---|---|---|
| Estoque zerado | qtd = 0 | Crítico |
| Estoque crítico | qtd < mínimo | Alerta |
| Vencimento em 30 dias | validade ≤ hoje+30 | Atenção |
| Medicamento vencido | validade < hoje | Crítico |
| Pedido de reposição | qtd ≤ ponto de pedido | Atenção |

---

## 6. Endpoints da API

```
GET  /api/farmacia/estoque            → estoque consolidado (todas UBS)
GET  /api/farmacia/estoque/{unidade}  → estoque por UBS
GET  /api/farmacia/alertas            → alertas ativos
GET  /api/farmacia/dispensacoes       → histórico de dispensação
GET  /api/farmacia/consumo-mensal     → consumo por medicamento/mês
GET  /api/farmacia/vencimentos        → itens vencendo em 30 dias
GET  /api/farmacia/dashboard          → KPIs consolidados
```

---

## 7. Regras de Negócio

- RN-014-01: Dispensação não pode ocorrer se estoque for zero
- RN-014-02: Medicamento controlado exige número de receita válido
- RN-014-03: Toda movimentação de estoque gera log de auditoria
- RN-014-04: Itens com validade vencida não podem ser dispensados
- RN-014-05: Inventário mensal obrigatório — divergências devem ser justificadas
- RN-014-06: Transferência entre UBS deve ter documento de remessa

---

## 8. Critérios de Aceite

- [ ] Dashboard farmácia com semáforo de estoque
- [ ] Alertas de vencimento e estoque crítico funcionando
- [ ] Dispensação com validação de receita para controlados
- [ ] Histórico de consumo por medicamento e período
- [ ] API de todos os endpoints testada

---

**Documento:** ERSUS-DOC-014
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-013 — Recursos Humanos
**Próximo:** ERSUS-DOC-015 — Atenção Primária à Saúde
