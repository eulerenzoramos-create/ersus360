# ERSUS-DOC-025 — Portal do Gestor e Portal do Cidadão
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o Portal do Gestor (destinado ao Prefeito e Vereadores) e o Portal do Cidadão (acesso público à transparência em saúde), ambos derivando dados do ERSUS 360 em tempo real — sem acesso à operação interna do sistema.

---

## 2. Portal do Gestor — Painel do Prefeito

### 2.1 Propósito
Painel executivo simplificado para o prefeito acompanhar os principais indicadores de saúde do município sem necessidade de treinamento técnico. Foco em: quanto foi investido, quantas pessoas foram atendidas, quais metas foram atingidas.

### 2.2 Indicadores exibidos
| Indicador | Fonte | Formato |
|---|---|---|
| Score ERSUS 360 | BI | Gauge 0–100 |
| Recursos FNS recebidos no mês | Financeiro | R$ com variação |
| Execução orçamentária | Financeiro | % por bloco |
| Famílias atendidas pela ESF | APS | Número |
| Cobertura vacinal | Vigilância | % |
| Metas Novo Financiamento APS | APS | Semáforo |
| Obras em andamento | Obras | Contador + status |
| Alertas críticos | OCIS | Badge vermelho |

### 2.3 Acesso e segurança
- Login separado com papel `prefeito`
- Apenas leitura — sem operações
- Acessível via tablet ou celular
- Versão simplificada do dashboard

---

## 3. Portal do Cidadão — Transparência em Saúde

### 3.1 Propósito
Página pública (sem login) com dados de saúde do município disponíveis à população, conforme Lei de Acesso à Informação (LAI) e princípios de transparência do SUS.

### 3.2 Dados públicos disponíveis
| Dado | Atualização |
|---|---|
| Unidades de saúde (nome, endereço, horário) | Manual |
| Equipes de saúde (ESF ativas) | Mensal |
| Cobertura da Atenção Básica (%) | Mensal |
| Indicadores Novo Financiamento APS (resultado) | Quadrimestral |
| Coberturas vacinais | Mensal |
| Execução financeira simplificada | Mensal |
| Obras de saúde (status) | Mensal |

### 3.3 Funcionalidades do cidadão
- **"Minha UBS":** o cidadão informa seu endereço e vê qual UBS e equipe é responsável
- **"Postos de vacinação":** onde vacinar por bairro
- **"Ouvidoria":** formulário de reclamações/sugestões (integra com OCIS)
- **"Agendar consulta":** link para o sistema de regulação (quando disponível)

### 3.4 Ouvidoria
| Campo | Tipo |
|---|---|
| Tipo | enum (sugestão, reclamação, denúncia, elogio, solicitação) |
| Assunto | texto |
| Descrição | texto livre |
| Unidade envolvida | seleção opcional |
| Contato (opcional) | e-mail/telefone |
| Protocolo gerado | automático |
| Prazo de resposta | 30 dias úteis (LAI) |

---

## 4. Arquitetura dos portais

```
Portal do Gestor → subdomínio gestor.ersus360.apui.am.gov.br
Portal do Cidadão → transparencia.saude.apui.am.gov.br (ou link na prefeitura)
ERSUS 360 (interno) → ersus360.vercel.app (acesso restrito)
```

---

## 5. Endpoints da API

```
# Portal do Gestor (autenticado — papel prefeito)
GET /api/portal/gestor/resumo        → KPIs executivos
GET /api/portal/gestor/financeiro    → execução simplificada

# Portal do Cidadão (público — sem autenticação)
GET /api/publico/unidades            → unidades de saúde
GET /api/publico/equipes             → equipes ESF
GET /api/publico/indicadores         → indicadores públicos
GET /api/publico/obras               → obras em andamento
POST /api/publico/ouvidoria          → registrar manifestação
GET /api/publico/ouvidoria/{protocolo} → acompanhar manifestação
```

---

## 6. Regras de Negócio

- RN-025-01: Portal do Cidadão não exibe dados nominais de pacientes — apenas agregados
- RN-025-02: Ouvidoria deve ter protocolo gerado automaticamente e respondida em 30 dias
- RN-025-03: Portal do Gestor não tem acesso à operação — apenas leitura de indicadores
- RN-025-04: Dados do Portal do Cidadão devem ser atualizados mensalmente
- RN-025-05: Portal do Cidadão é acessível sem login — dados públicos por LAI

---

## 7. Critérios de Aceite

- [ ] Portal do Gestor com Score ERSUS e indicadores executivos
- [ ] Portal do Cidadão com dados públicos das unidades de saúde
- [ ] Ouvidoria com geração de protocolo e acompanhamento
- [ ] "Minha UBS" funcionando por endereço/CEP
- [ ] API pública sem autenticação para endpoints /api/publico/*

---

**Documento:** ERSUS-DOC-025
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-024 — App Mobile ACS
**Próximo:** ERSUS-DOC-026 — Compliance SUS e Marketplace
