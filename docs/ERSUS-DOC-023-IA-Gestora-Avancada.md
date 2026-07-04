# ERSUS-DOC-023 — IA Gestora Avançada
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir a IA Gestora Avançada do ERSUS 360 — assistente inteligente baseado na API Claude (Anthropic) com contexto completo do município, capaz de analisar indicadores, prever riscos, sugerir ações, redigir documentos e responder perguntas técnicas sobre gestão em saúde pública.

---

## 2. Capacidades da IA Gestora

### 2.1 Análise e interpretação
- Analisar todos os indicadores do município em linguagem natural
- Identificar correlações entre indicadores (ex: baixo pré-natal → alta mortalidade infantil)
- Comparar desempenho atual com histórico e com municípios similares
- Interpretar dados epidemiológicos e sugerir investigações

### 2.2 Geração de documentos
- Redigir RDQA completo a partir dos dados do sistema
- Gerar relatório mensal de gestão automaticamente
- Elaborar justificativas para metas não atingidas
- Criar ofícios e comunicados técnicos

### 2.3 Predição e alertas inteligentes
- Prever risco de não cumprimento de metas Previne Brasil
- Calcular probabilidade de surto epidemiológico (série temporal)
- Prever insuficiência de estoque de medicamentos
- Alertar sobre contratos e convênios em situação de risco

### 2.4 Assistente conversacional
- Responder perguntas sobre gestão em saúde pública
- Explicar normas e portarias do Ministério da Saúde
- Orientar processos administrativos (SIOPS, SICONV, RDQA)
- Auxiliar na resolução de inconsistências no e-SUS

---

## 3. Contexto injetado na IA por sessão

```python
CONTEXTO_MUNICIPIO = """
Município: {nome} ({uf}) — IBGE {ibge}
Plano ERSUS: {plano}
Gestão atual: {secretario}

SITUAÇÃO ATUAL:
- ESF: {num_equipes} equipes ({num_acs} ACS)
- Famílias cadastradas: {num_familias}
- Previne Brasil (média): {previne_media}%
- Execução PAB: {execucao_pab}%
- Alertas críticos: {num_alertas}
- Score ERSUS 360: {score}/100
"""
```

---

## 4. Limites por plano

| Recurso | Bronze | Prata | Ouro | Diamante |
|---|---|---|---|---|
| Consultas/mês | 20 | 100 | Ilimitado | Ilimitado |
| Contexto do município | Básico | Completo | Completo | Personalizado |
| Geração de RDQA | ❌ | ✅ | ✅ | ✅ |
| Predições avançadas | ❌ | ❌ | ✅ | ✅ |
| Fine-tuning municipal | ❌ | ❌ | ❌ | ✅ |
| IA no OCIS | ❌ | ❌ | ❌ | ✅ |

---

## 5. Integração Anthropic Claude

### 5.1 Modelo utilizado
```
claude-sonnet-5  → padrão (velocidade + qualidade)
claude-opus-4-8  → documentos longos e análises complexas
claude-haiku-4-5 → respostas rápidas, baixo custo
```

### 5.2 Parâmetros da API
```python
SISTEMA_PROMPT = """
Você é a IA Gestora do ERSUS 360, assistente especializado em
gestão municipal de saúde pública no Brasil. Você conhece:
- O SUS, suas normas, portarias e financiamento
- Os sistemas SISAB, e-SUS, SINAN, CNES, FNS, SIOPS
- O Previne Brasil e seus 7 indicadores
- As especificidades do município de {municipio}

Responda em português, de forma clara e objetiva.
Cite sempre a base normativa quando relevante.
Quando não souber algo, diga claramente.
"""
```

---

## 6. Endpoints da API

```
POST /api/ia/chat                     → ✅ implementado
POST /api/ia/analise-indicadores      → análise automática dos KPIs
POST /api/ia/gerar-rdqa               → gerar texto do RDQA
POST /api/ia/gerar-relatorio-mensal   → relatório automático
GET  /api/ia/historico                → histórico de conversas
POST /api/ia/predicao/{modulo}        → predição para módulo específico
```

---

## 7. Regras de Negócio

- RN-023-01: A IA nunca responde com dados de outro município
- RN-023-02: Documentos gerados pela IA devem ser revisados pelo gestor antes de envio oficial
- RN-023-03: Histórico de conversas é preservado por 90 dias
- RN-023-04: Consultas excedidas no plano Bronze exibem aviso e oferecem upgrade
- RN-023-05: ANTHROPIC_API_KEY é variável de ambiente Railway — nunca no código

---

## 8. Critérios de Aceite

- [ ] Chat com IA respondendo perguntas sobre o município
- [ ] Análise automática de indicadores gerada com 1 clique
- [ ] RDQA rascunho gerado pela IA com dados do período
- [ ] Contador de consultas funcionando por plano
- [ ] Histórico de conversas persistido por sessão

---

**Documento:** ERSUS-DOC-023
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-022 — OCIS
**Próximo:** ERSUS-DOC-024 — App Mobile ACS
