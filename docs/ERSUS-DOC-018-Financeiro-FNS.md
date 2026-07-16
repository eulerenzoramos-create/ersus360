# ERSUS-DOC-018 — Financeiro e FNS
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo Financeiro do ERSUS 360, cobrindo repasses FNS, convênios, execução financeira por bloco de financiamento, prestação de contas, TransfereGov, emendas parlamentares e contas bancárias da Secretaria Municipal de Saúde de Apuí/AM.

---

## 2. Blocos de Financiamento Federal

| Bloco | Código | Descrição |
|---|---|---|
| Atenção Primária | PAB | PAB Fixo + ESF + ACS + Saúde Bucal |
| Atenção Especializada | MAC | Média e Alta Complexidade |
| Vigilância em Saúde | VS | Epidemiológica + Sanitária |
| Assistência Farmacêutica | AFB | Componente Básico + Estratégico |
| Gestão do SUS | GES | Qualificação da Gestão |
| Investimentos | INV | Construção e Equipamentos |

---

## 3. Repasses FNS — Transferências Regulares

### 3.1 Componentes do PAB (principais repasses Apuí/AM)
| Componente | Periodicidade | Valor referência |
|---|---|---|
| PAB Fixo | Mensal | R$ 16.800/mês |
| ESF (por equipe) | Mensal | R$ 10.222/equipe |
| eSB Tipo I | Mensal | R$ 3.000/equipe |
| ACS (por agente) | Mensal | R$ 2.400/ACS |
| Saúde Bucal (eSB II) | Mensal | R$ 5.000/equipe |
| NASF-AB / eMulti | Mensal | R$ 8.000/equipe |
| Novo Financiamento APS (Portaria 3.493/2024) | Quadrimestral | Variável (% metas) |
| PMAQ/IQDAQ | Quadrimestral | Variável |

### 3.2 Dados do repasse
| Campo | Tipo | Obrigatório |
|---|---|---|
| Competência (mês/ano) | string | ✅ |
| Componente | texto | ✅ |
| Bloco de financiamento | enum | ✅ |
| Valor creditado | decimal | ✅ |
| Data do crédito | data | ✅ |
| Conta bancária destino | FK | ✅ |
| Número da OB (Ordem Bancária) | texto | — |
| Situação | enum | ✅ |

---

## 4. Convênios e Instrumentos

### 4.1 Tipos de instrumento
| Tipo | Descrição |
|---|---|
| Convênio | Instrumento clássico — vigência máxima 5 anos |
| Contrato de Repasse | Quando há empresa intermediária (CEF/BB) |
| Termo de Fomento | Para OSCs sem fins lucrativos |
| TED | Transferência direta entre órgãos federais |
| Emenda Parlamentar | Transferência especial — 100% para saúde |

### 4.2 Dados do convênio
| Campo | Tipo | Obrigatório |
|---|---|---|
| Número SICONV/TransfereGov | texto | ✅ |
| Objeto | texto | ✅ |
| Concedente | texto | ✅ |
| Valor global | decimal | ✅ |
| Contrapartida municipal | decimal | ✅ |
| Data de início | data | ✅ |
| Data de fim | data | ✅ |
| Objeto (descrição) | texto | ✅ |
| Situação | enum | ✅ |
| % executado | decimal | ✅ |
| Prazo para prestação de contas | data | ✅ |

### 4.3 Status do convênio
```
em_captacao   → proposta enviada, aguardando aprovação
vigente       → aprovado, em execução
em_prestacao  → aguardando prestação de contas
concluido     → prestação aprovada, convênio encerrado
inadimplente  → pendências não resolvidas
```

---

## 5. Execução Financeira

### 5.1 Por bloco de financiamento
| Bloco | Receita prevista | Receita realizada | Despesa realizada | % exec. |
|---|---|---|---|---|
| PAB | R$ 890.000 | R$ 856.320 | R$ 812.100 | 94,8% |
| MAC | R$ 340.000 | R$ 318.750 | R$ 295.200 | 92,6% |
| VS | R$ 120.000 | R$ 115.400 | R$ 108.700 | 94,2% |
| AFB | R$ 85.000 | R$ 82.900 | R$ 79.400 | 95,8% |

*Valores de referência Apuí/AM 2026*

### 5.2 Categorias de despesa
```
pessoal              → servidores, contratos, terceirizados
custeio              → materiais, medicamentos, contratos serviços
investimento         → equipamentos, obras, reformas
transferencias       → repasses a OSCs, consórcios
```

---

## 6. Prestação de Contas

### 6.1 Prazos críticos
| Documento | Órgão | Prazo |
|---|---|---|
| RDQA | CMS + MS | 30/mai, 30/set, 30/mar |
| RAG | CMS + MS | 30 de março |
| Prestação convênios | TransfereGov | Até 60 dias após fim vigência |
| SIOPS | MS | Até 30/mar (anual) e mensalmente |
| RREO | TCM/AM | Bimestral (LRF) |
| RGF | TCM/AM | Quadrimestral (LRF) |

### 6.2 Alertas de prestação de contas
- **30 dias antes:** aviso de prazo se aproximando
- **15 dias antes:** alerta amarelo
- **5 dias antes:** alerta vermelho crítico

---

## 7. Endpoints da API (já implementados + extensão)

```
GET /api/fns/repasses              → ✅ implementado
GET /api/fns/convenios             → ✅ implementado
GET /api/fns/previne               → ✅ implementado
GET /api/execucao                  → ✅ implementado (blocos)
GET /api/emendas                   → ✅ implementado
GET /api/financeiro/alertas        → prazos críticos
GET /api/financeiro/siops          → dados SIOPS
GET /api/financeiro/dashboard      → KPIs financeiros
POST /api/financeiro/rdqa          → gerar RDQA financeiro
```

---

## 8. Regras de Negócio

- RN-018-01: Mínimo constitucional de saúde = 15% da receita corrente líquida (EC 29/2000)
- RN-018-02: Recursos FNS são vinculados — não podem ser usados para outras finalidades
- RN-018-03: Convênio vencido sem prestação gera inadimplência e bloqueia novos repasses
- RN-018-04: SIOPS deve ser preenchido mensalmente — atraso gera multa federal
- RN-018-05: Execução < 70% no bloco PAB no 2º quadrimestre gera alerta crítico
- RN-018-06: Emendas parlamentares destinadas a saúde não podem ser remanejadas

---

## 9. Critérios de Aceite

- [ ] Dashboard financeiro com receita/despesa por bloco
- [ ] Alertas de prazos de prestação de contas
- [ ] Status de todos os convênios vigentes com % execução
- [ ] Emendas parlamentares com valores e situação
- [ ] Integração FNS API retornando repasses reais
- [ ] Cálculo automático do mínimo constitucional

---

**Documento:** ERSUS-DOC-018
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-017 — Planejamento em Saúde
**Próximo:** ERSUS-DOC-019 — Obras e Infraestrutura
