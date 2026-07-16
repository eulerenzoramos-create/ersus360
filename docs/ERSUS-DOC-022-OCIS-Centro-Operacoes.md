# ERSUS-DOC-022 — OCIS: Centro de Operações em Saúde
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o OCIS (Operações Centrais Integradas em Saúde) do ERSUS 360 — o centro de comando da secretaria municipal, com monitoramento em tempo real, gestão de regulação, TFD (Tratamento Fora do Domicílio), urgência/emergência e central de alertas.

---

## 2. Componentes do OCIS

```
┌─────────────────────────────────────────────────────────────┐
│                    OCIS — ERSUS 360                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  REGULAÇÃO   │  │    TFD       │  │  URG/EMERGÊNCIA  │  │
│  │  SISREG      │  │ Transporte   │  │  APH · SAMU      │  │
│  │  Agendamento │  │ Aéreo/Terr.  │  │  Leitos          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  CENTRAL DE  │  │  MAPA DE     │  │  COMUNICAÇÃO     │  │
│  │  ALERTAS     │  │  SAÚDE       │  │  CMS · GAP       │  │
│  │  Tempo Real  │  │  Georreferenc│  │  Alertas SMS     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Regulação — SISREG

### 3.1 Funcionalidades
- Fila de espera por especialidade
- Agendamento de consultas especializadas
- Integração com SISREG Nacional
- Tempo médio de espera por procedimento
- Painel de produtividade dos reguladores

### 3.2 Indicadores de regulação
| Indicador | Meta |
|---|---|
| Tempo médio espera consulta especializada | < 30 dias |
| Taxa de absenteísmo em consultas | < 15% |
| % solicitações reguladas em 24h | > 80% |
| Fila ativa de espera | Monitoramento |

---

## 4. TFD — Tratamento Fora do Domicílio

### 4.1 Tipos de TFD
- **Terrestre:** veículo municipal para Humaitá, Manaus
- **Aéreo:** avião/helicóptero para casos graves
- **Aquaviário:** barco para comunidades ribeirinhas

### 4.2 Dados do TFD
| Campo | Tipo | Obrigatório |
|---|---|---|
| Paciente (CNS) | texto | ✅ |
| Diagnóstico (CID) | texto | ✅ |
| Especialidade destino | texto | ✅ |
| Hospital destino | texto | ✅ |
| Cidade destino | texto | ✅ |
| Tipo de transporte | enum | ✅ |
| Data da viagem | date | ✅ |
| Acompanhante | texto | — |
| Recurso utilizado | texto | ✅ |
| Retorno previsto | date | — |
| Custo estimado | decimal | — |
| Status | enum | ✅ |

### 4.3 Indicadores TFD
| Indicador | Objetivo |
|---|---|
| TFD por especialidade | Mapear demanda |
| Custo médio por TFD | Controle financeiro |
| Tempo entre solicitação e viagem | Agilidade |
| Destinos mais frequentes | Otimização de rotas |

---

## 5. Central de Alertas em Tempo Real

### 5.1 Tipos de alerta
| Categoria | Exemplos |
|---|---|
| Epidemiológico | Surto dengue, IPA acima do limiar |
| Financeiro | Convênio vencendo, meta de execução baixa |
| Clínico | Meta Novo Financiamento APS em risco |
| Operacional | Servidor afastado, médico ausente |
| Infraestrutura | Equipamento sem manutenção, obra paralisada |
| Administrativo | Férias vencidas, contrato expirando |

### 5.2 Canais de notificação
- Dashboard OCIS (tempo real)
- E-mail para gestores
- WhatsApp (via API — Fase 15)
- SMS (via API — Fase 15)

---

## 6. Mapa de Saúde

### 6.1 Camadas do mapa
- Localização de todas as UBS e unidades de saúde
- Microáreas dos ACS (polígonos)
- Casos de agravos (pontos georeferenciados)
- Domicílios com famílias sem ACS
- Cobertura da ESF por área

---

## 7. Endpoints da API

```
GET /api/ocis/central-alertas         → todos os alertas ativos
GET /api/ocis/regulacao/fila-espera   → fila por especialidade
GET /api/ocis/tfd                     → solicitações TFD
GET /api/ocis/tfd/dashboard           → KPIs TFD
GET /api/ocis/mapa/unidades           → coordenadas das UBS
GET /api/ocis/mapa/casos/{agravo}     → casos georeferenciados
GET /api/ocis/dashboard               → painel OCIS consolidado
```

---

## 8. Regras de Negócio

- RN-022-01: Alerta crítico no OCIS deve ser resolvido em até 24h
- RN-022-02: TFD aéreo exige autorização do secretário de saúde
- RN-022-03: Fila de regulação não pode ultrapassar 90 dias sem intervenção
- RN-022-04: OCIS é exclusivo do plano Diamante
- RN-022-05: Todos os alertas resolvidos devem ter justificativa registrada

---

## 9. Critérios de Aceite

- [ ] Central de alertas consolidando todos os módulos
- [ ] TFD com registro completo de solicitações
- [ ] Painel OCIS responsivo para uso em tablet
- [ ] Regulação com fila de espera por especialidade
- [ ] Mapa de saúde com unidades georeferenciadas

---

**Documento:** ERSUS-DOC-022
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-021 — Business Intelligence
**Próximo:** ERSUS-DOC-023 — IA Gestora Avançada
