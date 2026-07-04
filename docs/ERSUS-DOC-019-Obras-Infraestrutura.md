# ERSUS-DOC-019 — Obras e Infraestrutura
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o módulo de Obras e Infraestrutura do ERSUS 360, cobrindo acompanhamento de obras de saúde, integração SISMOB/AMED, cronogramas físico-financeiros, medições, PAC Saúde e manutenção predial das unidades de saúde de Apuí/AM.

---

## 2. Tipos de Obra

| Tipo | Descrição | Programa típico |
|---|---|---|
| Construção nova | Implantação de UBS, CAPS, UPA | PAC Saúde, emenda |
| Reforma | Ampliação ou recuperação | Requalifica UBS, emenda |
| Aquisição de equipamento | Equipamentos médicos e hospitalares | REMEQ, emenda |
| Manutenção | Reparos correntes | Recurso próprio |
| Infraestrutura | Rede elétrica, hidráulica | PAC Saúde |

---

## 3. Dados da Obra

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome da obra | texto | ✅ |
| Tipo | enum | ✅ |
| Unidade de saúde beneficiada | FK | ✅ |
| Programa/Instrumento | texto | ✅ |
| Número convênio/SICONV | texto | — |
| Número SISMOB | texto | — |
| Concedente | texto | ✅ |
| Valor total contratado | decimal | ✅ |
| Contrapartida municipal | decimal | — |
| Empresa executora | texto | ✅ |
| CNPJ empresa | string | ✅ |
| Engenheiro responsável | texto | — |
| Data de início (contrato) | data | ✅ |
| Data de fim prevista | data | ✅ |
| Data de conclusão real | data | — |
| % físico atual | decimal | ✅ |
| % financeiro atual | decimal | ✅ |
| Status | enum | ✅ |

---

## 4. Status da Obra

```
licitando      → processo licitatório em andamento
contratada     → contrato assinado, aguardando início
em_execucao    → obra em andamento
paralisada     → suspensa por motivo técnico/financeiro
concluida      → obra entregue e aceita
cancelada      → obra cancelada (recurso devolvido)
```

---

## 5. Cronograma Físico-Financeiro

### 5.1 Estrutura
- Planilha mensal com % físico previsto e realizado
- Curva S (acúmulo previsto vs. realizado)
- Alertas de desvio > 10% entre previsto e executado

### 5.2 Medições
| Campo | Tipo |
|---|---|
| Número da medição | inteiro |
| Data da medição | data |
| % físico medido | decimal |
| Valor medido | decimal |
| Valor acumulado | decimal |
| Aprovado pelo fiscal | boolean |
| Data de pagamento | data |

---

## 6. Integração SISMOB

### 6.1 Dados disponíveis via SISMOB
- Empreendimentos cadastrados por município
- Situação física e financeira
- Documentos (projeto, ART, alvará)
- Cronograma previsto vs. realizado
- Relatórios de vistoria

### 6.2 Campos sincronizados
```
numero_sismob, nome_empreendimento, situacao,
perc_fisico, perc_financeiro, valor_global,
data_inicio_prevista, data_fim_prevista
```

---

## 7. Obras em Apuí/AM — Referência

| Obra | Programa | Valor | Status | % Físico |
|---|---|---|---|---|
| Reforma UBS Central | Requalifica UBS | R$ 280.000 | Em execução | 68% |
| Ampliação Farmácia Central | Emenda federal | R$ 150.000 | Contratada | 0% |
| Aquisição equipamentos UBS | REMEQ | R$ 95.000 | Concluída | 100% |
| UBS Zona Rural — Reforma | PAC Saúde | R$ 320.000 | Em execução | 42% |

---

## 8. Endpoints da API

```
GET  /api/obras                    → ✅ listar obras
GET  /api/obras/{id}               → ✅ detalhar obra
GET  /api/obras/{id}/medicoes      → medições da obra
GET  /api/obras/{id}/cronograma    → cronograma físico-financeiro
GET  /api/obras/dashboard          → KPIs de obras
GET  /api/obras/alertas            → obras com desvio ou paralisadas
POST /api/obras/{id}/medicao       → registrar nova medição
```

---

## 9. Regras de Negócio

- RN-019-01: Obra com % físico > % financeiro por 2 medições consecutivas gera alerta
- RN-019-02: Obra paralisada há mais de 60 dias gera notificação ao gestor
- RN-019-03: Medição só é paga após aprovação do fiscal de obras
- RN-019-04: Aditivo de prazo ou valor exige nova planilha orçamentária
- RN-019-05: Obra concluída deve ter Termo de Recebimento Definitivo registrado

---

## 10. Critérios de Aceite

- [ ] Listagem de obras com status visual (semáforo)
- [ ] Cronograma físico-financeiro com curva S
- [ ] Alertas de paralisação e desvio de cronograma
- [ ] Registro de medições com aprovação do fiscal
- [ ] Dashboard com total investido, em andamento, concluído

---

**Documento:** ERSUS-DOC-019
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-018 — Financeiro e FNS
**Próximo:** ERSUS-DOC-020 — Patrimônio e Frota
