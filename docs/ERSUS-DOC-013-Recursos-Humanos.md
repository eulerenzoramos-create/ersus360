# ERSUS-DOC-013 — Recursos Humanos
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir e implementar o módulo de Recursos Humanos do ERSUS 360, cobrindo gestão de servidores, vínculos empregatícios, lotação, férias, escalas, avaliações de desempenho e painel de KPIs de pessoal da Secretaria Municipal de Saúde.

---

## 2. Visão Geral

```
┌────────────────────────────────────────────────────────────────┐
│                  MÓDULO RECURSOS HUMANOS                       │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │  SERVIDORES │  │    FÉRIAS   │  │       ESCALAS       │    │
│  │  Cadastro   │  │ Programação │  │  Plantões · Turnos  │    │
│  │  Documentos │  │  Saldo      │  │  Folgas · Coberturas│    │
│  │  Lotação    │  │  Histórico  │  └─────────────────────┘    │
│  └─────────────┘  └─────────────┘                             │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │  CONTRATOS  │  │  MOVIMENT.  │  │    PAINEL RH (KPIs) │    │
│  │  Temporário │  │ Transferênc.│  │  Headcount          │    │
│  │  Terceirized│  │ Afastamento │  │  Absenteísmo        │    │
│  │  Residentes │  │ Aposentadoria│  │  Folha por fonte    │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Cadastro de Servidores

### 3.1 Dados pessoais
| Campo | Tipo | Obrigatório | LGPD |
|---|---|---|---|
| Nome completo | texto | ✅ | Dado pessoal |
| CPF | string(11) | ✅ | Dado sensível |
| Data de nascimento | data | ✅ | Dado pessoal |
| Sexo | enum | ✅ | — |
| RG | texto | — | Dado pessoal |
| Órgão emissor RG | texto | — | — |
| PIS/PASEP | string(11) | — | Dado sensível |
| CNS | string(15) | — | Dado sensível |
| Endereço | texto | ✅ | Dado pessoal |
| Telefone | string(20) | ✅ | Dado pessoal |
| E-mail | email | — | Dado pessoal |
| Foto | imagem | — | Dado pessoal |

### 3.2 Dados funcionais
| Campo | Tipo | Obrigatório |
|---|---|---|
| Matrícula | string | ✅ |
| Cargo | texto | ✅ |
| CBO | string(6) | ✅ |
| Vínculo | enum | ✅ |
| Carga horária semanal | inteiro | ✅ |
| UBS / Setor de lotação | FK | ✅ |
| Equipe de saúde | FK | — |
| Data de admissão | data | ✅ |
| Data de posse (estatutário) | data | — |
| Fonte de pagamento | enum | ✅ |
| Salário base | decimal | ✅ |
| Ativo | boolean | ✅ |

### 3.3 Tipos de vínculo
| Código | Descrição | Regime |
|---|---|---|
| estatutario | Servidor público efetivo | Estatuto municipal |
| clt | Celetista direto | CLT |
| temporario | Contrato temporário | Lei municipal |
| terceirizado | Via empresa terceira | Contrato serviços |
| comissionado | Cargo de confiança | Decreto |
| residente | Médico residente | Programa de residência |
| estagiario | Estudante em estágio | Contrato estágio |
| voluntario | Serviço voluntário | Termo voluntariado |

---

## 4. Férias

### 4.1 Regras gerais
- Período aquisitivo: 12 meses trabalhados
- Período de gozo: até 12 meses após aquisição (estatutário) / 12 meses (CLT)
- Duração: 30 dias corridos (pode ser parcelado em até 3 períodos — CLT)
- Abono pecuniário: até 1/3 das férias pode ser convertido em dinheiro (CLT)

### 4.2 Dados do registro de férias
| Campo | Tipo | Obrigatório |
|---|---|---|
| Servidor | FK | ✅ |
| Período aquisitivo (início/fim) | data | ✅ |
| Data início do gozo | data | ✅ |
| Data fim do gozo | data | ✅ |
| Dias de gozo | inteiro | ✅ |
| Dias de abono pecuniário | inteiro | — |
| Substituto | FK → Servidor | — |
| Status | enum | ✅ |
| Observações | texto | — |

### 4.3 Status de férias
```
programada   → aprovada, aguardando início
em_gozo      → servidor em férias agora
concluida    → férias encerradas
cancelada    → férias canceladas (necessidade do serviço)
```

### 4.4 Alertas automáticos de férias
- **Alerta laranja:** férias vencendo em 60 dias (aquisitivo expirando)
- **Alerta vermelho:** férias vencidas (aquisitivo expirado — risco trabalhista)
- **Alerta amarelo:** período de gozo conflita com outra ausência

---

## 5. Escalas e Plantões

### 5.1 Tipos de escala
| Tipo | Descrição | Exemplos |
|---|---|---|
| Plantão | Turno de 12h ou 24h com folga de 36h | Médicos, enfermeiros UPA |
| Turno | Manhã (6–12h), tarde (12–18h), noite (18–0h) | UBS, CAPS |
| Diurno | Jornada normal 8h/dia | Administrativos |
| Sobreaviso | Disponibilidade sem presença física | Médicos regulação |

### 5.2 Dados da escala
| Campo | Tipo | Obrigatório |
|---|---|---|
| Servidor | FK | ✅ |
| Unidade | FK | ✅ |
| Tipo de escala | enum | ✅ |
| Data e hora início | datetime | ✅ |
| Data e hora fim | datetime | ✅ |
| Turno | enum | ✅ |
| Cobertura (substituto) | FK → Servidor | — |
| Status | enum | ✅ |

---

## 6. Movimentações de Pessoal

### 6.1 Tipos de movimentação
| Tipo | Descrição | Documento |
|---|---|---|
| transferencia | Mudança de UBS/setor | Portaria |
| afastamento_saude | INSS / licença médica | Atestado + CID |
| afastamento_gestante | Licença maternidade 180 dias | Certidão nascimento |
| afastamento_paternidade | Licença paternidade 20 dias | Certidão nascimento |
| licenca_interesse | Licença sem vencimento | Requerimento |
| suspensao | Processo administrativo | Portaria PAD |
| aposentadoria | Encerramento por aposentadoria | Portaria RPPS/INSS |
| exoneracao | Saída do cargo | Portaria |
| rescisao | Rescisão contratual (CLT/temp.) | TRCT |

### 6.2 Dados da movimentação
| Campo | Tipo | Obrigatório |
|---|---|---|
| Servidor | FK | ✅ |
| Tipo de movimentação | enum | ✅ |
| Data de início | data | ✅ |
| Data de fim (prevista) | data | — |
| Data de retorno (real) | data | — |
| Portaria / Documento | texto | — |
| Número do documento | texto | — |
| Observações | texto | — |
| Ativo | boolean | ✅ |

---

## 7. Contratos de Terceirizados e Temporários

### 7.1 Dados do contrato
| Campo | Tipo | Obrigatório |
|---|---|---|
| Servidor / Contratado | FK | ✅ |
| Tipo | enum (temporario / terceirizado) | ✅ |
| Empresa (terceirizado) | FK → Fornecedor | — |
| Data de início | data | ✅ |
| Data de fim | data | ✅ |
| Valor mensal | decimal | ✅ |
| Convênio / Dotação | texto | — |
| Passível de renovação | boolean | — |
| Renovado | boolean | — |
| Status | enum | ✅ |

### 7.2 Alertas de contratos
- **30 dias antes do fim:** alerta de vencimento de contrato
- **15 dias antes:** alerta crítico — renovar ou encerrar
- **Contrato vencido:** bloqueia lotação do servidor

---

## 8. Painel RH — KPIs

### 8.1 Indicadores principais
| Indicador | Fórmula | Meta |
|---|---|---|
| Headcount total | Servidores ativos | — |
| Headcount por vínculo | Filtro por tipo | — |
| Taxa de absenteísmo | (Dias ausentes / Dias úteis) × 100 | < 5% |
| Férias vencidas | Count(férias.status = vencida) | 0 |
| Contratos vencendo em 30d | Count(contratos expirando) | 0 |
| % profissionais com cadastro CNES | Atualizado vs. total | 100% |
| Custo de pessoal por fonte | Soma salários por fonte_pagamento | — |
| Lotação por UBS | Headcount por unidade | — |

### 8.2 Alertas do painel RH
```
🔴 Férias vencidas:        X servidor(es) com férias expiradas — risco trabalhista
🟡 Contratos vencendo:     X contrato(s) expirando nos próximos 30 dias
🟠 Afastamentos longos:    X servidor(es) afastados há mais de 30 dias
🔵 Profissionais sem CNES: X profissional(is) não sincronizado(s) com o CNES
```

---

## 9. Endpoints da API

```
# Servidores
GET    /api/rh/servidores                 → listar (filtros: vinculo, unidade, ativo)
POST   /api/rh/servidores                 → criar
GET    /api/rh/servidores/{id}            → detalhar
PUT    /api/rh/servidores/{id}            → atualizar
DELETE /api/rh/servidores/{id}            → soft delete

# Férias
GET    /api/rh/ferias                     → listar (filtros: servidor, ano, status)
POST   /api/rh/ferias                     → programar férias
GET    /api/rh/ferias/vencidas            → férias vencidas (alerta)
PUT    /api/rh/ferias/{id}               → atualizar status

# Escalas
GET    /api/rh/escalas                    → listar (filtros: unidade, data)
POST   /api/rh/escalas                    → criar escala
GET    /api/rh/escalas/hoje               → escala do dia atual

# Movimentações
GET    /api/rh/movimentacoes              → listar
POST   /api/rh/movimentacoes              → registrar movimentação
GET    /api/rh/movimentacoes/ativos       → afastamentos em andamento

# Contratos
GET    /api/rh/contratos                  → listar
POST   /api/rh/contratos                  → criar contrato
GET    /api/rh/contratos/vencendo         → vencendo em 30 dias

# Painel
GET    /api/rh/painel                     → KPIs consolidados
GET    /api/rh/alertas                    → todos os alertas RH
```

---

## 10. Integração com Outros Módulos

| Módulo origem | Dados consumidos | Finalidade |
|---|---|---|
| Cadastros Mestres | Profissionais, Equipes, UBS | Base de dados para servidores |
| FNS / Convênios | Fontes de recurso | Custeio de folha por programa |
| Novo Financiamento APS | Equipes ESF | Calcular custeio por equipe |
| Auditoria | Logs | Rastrear alterações de folha |
| Planejamento (PAS) | Metas de headcount | Comparar real vs. planejado |

---

## 11. Regras de Negócio

- RN-013-01: Servidor desligado (exonerado/rescindido) nunca é excluído — soft delete preserva histórico
- RN-013-02: Férias não podem ser programadas para servidor com afastamento ativo no mesmo período
- RN-013-03: Contrato de terceirizado deve ter empresa fornecedora cadastrada obrigatoriamente
- RN-013-04: Alteração de salário base exige registro de movimentação auditável
- RN-013-05: Plantão de 24h só é válido para cargos com previsão em convenção/estatuto
- RN-013-06: ACS deve ter microárea cadastrada antes de ser vinculado a uma escala
- RN-013-07: Férias vencidas geram alerta no painel de gestão — responsabilidade do gestor
- RN-013-08: Todo afastamento deve ter documento comprobatório (atestado, certidão, portaria)

---

## 12. Critérios de Aceite

- [ ] Cadastro completo de servidor com todos os campos obrigatórios validados
- [ ] Programação de férias com verificação de conflito de datas
- [ ] Alertas de férias vencidas funcionando no painel
- [ ] Alertas de contratos vencendo em 30 dias funcionando
- [ ] Painel RH exibindo headcount, absenteísmo e custo por fonte
- [ ] Movimentações (afastamento, transferência) com log de auditoria
- [ ] Soft delete preservando histórico de servidor desligado
- [ ] API de todos os endpoints testada via Swagger

---

**Documento:** ERSUS-DOC-013
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-012 — Cadastros Mestres
**Próximo:** ERSUS-DOC-014 — Assistência Farmacêutica (Fase 5)
