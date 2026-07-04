# ERSUS-DOC-027 — Marketplace e Academia ERSUS
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o Marketplace ERSUS (integração de fornecedores e soluções parceiras) e a Academia ERSUS (plataforma de capacitação em gestão de saúde pública), completando as 20 fases do roadmap ERSUS 360.

---

## 2. Marketplace ERSUS

### 2.1 Propósito
Ecossistema de integrações e extensões para o ERSUS 360 — fornecedores de tecnologia em saúde, consultores de gestão e desenvolvedores parceiros podem publicar integrações e soluções complementares ao sistema base.

### 2.2 Categorias do Marketplace
| Categoria | Exemplos |
|---|---|
| Integrações de sistema | Conector HL7/FHIR, integração ProntuárioSUS |
| Telemed | Plataformas de teleconsulta certificadas |
| Laudos e diagnóstico | Telediagnóstico, ECG remoto, raio-X digital |
| Farmácia | Dispensação automatizada, controle de psicotrópicos |
| RH e Folha | Integração com sistema de RH da prefeitura |
| BI avançado | Dashboards verticais, modelos preditivos |
| Consultoria | Consultores certificados ERSUS |

### 2.3 Modelo de parceria
| Tipo | Descrição | Receita ERSUS |
|---|---|---|
| Integração gratuita | Parceiro básico, listagem no marketplace | 0% |
| Integração paga | Parceiro cobra por uso da integração | 15% de comissão |
| Consultoria listada | Consultor certificado indicado pelo ERSUS | 10% de comissão |
| White-label | Parceiro usa ERSUS com marca própria | Licença mensal |

### 2.4 Processo de certificação de parceiro
1. Cadastro no portal do desenvolvedor
2. Documentação da integração via API
3. Revisão técnica ERSUS (segurança + LGPD)
4. Homologação em ambiente de teste
5. Publicação no Marketplace
6. Monitoramento contínuo (SLA + reclamações)

### 2.5 API Pública ERSUS (Developer Portal)
```
Autenticação: OAuth 2.0 com client_id + client_secret
Rate limit: 1.000 req/hora (parceiro básico), ilimitado (enterprise)
Endpoints públicos:
  GET /api/v1/municipio/{ibge}/indicadores  → indicadores públicos
  GET /api/v1/municipio/{ibge}/unidades     → unidades de saúde
  POST /api/v1/webhook/register             → registrar webhook
  GET /api/v1/schema                        → documentação OpenAPI
```

---

## 3. Academia ERSUS

### 3.1 Propósito
Plataforma de capacitação em gestão municipal de saúde — cursos online, trilhas de aprendizado e certificações para gestores, coordenadores, financeiros e equipes da atenção básica.

### 3.2 Público-alvo
| Perfil | Foco |
|---|---|
| Secretário(a) de Saúde | Gestão estratégica, indicadores, planejamento |
| Coordenador APS | Previne Brasil, produção ESF, e-SUS |
| Financeiro | FNS, SIOPS, RREO, execução orçamentária |
| ACS | Visita domiciliar, SISAB, ficha E |
| TI da prefeitura | Instalação, configuração, Railway/Vercel |

### 3.3 Trilhas de aprendizado

**Trilha 1 — Gestão em Saúde para Iniciantes**
- Módulo 1: Como funciona o SUS no município
- Módulo 2: Financiamento (PAB, blocos, convênios)
- Módulo 3: Previne Brasil — os 7 indicadores
- Módulo 4: RDQA — o que é e como preencher
- Duração: 8h | Certificado: Sim

**Trilha 2 — Atenção Primária na Prática**
- Módulo 1: e-SUS PEC básico
- Módulo 2: Ficha de cadastro e visita domiciliar
- Módulo 3: Busca Ativa — gestantes e vacinas
- Módulo 4: SISAB — produção e inconsistências
- Duração: 12h | Certificado: Sim

**Trilha 3 — Financeiro Municipal de Saúde**
- Módulo 1: Blocos de financiamento FNS
- Módulo 2: SIOPS — preenchimento prático
- Módulo 3: Prestação de contas de convênios
- Módulo 4: Mínimo constitucional (15%)
- Duração: 10h | Certificado: Sim

**Trilha 4 — Gestor ERSUS 360 Avançado**
- Módulo 1: Configuração completa do sistema
- Módulo 2: Score ERSUS 360 — como melhorar
- Módulo 3: BI e análise de dados
- Módulo 4: LGPD na saúde municipal
- Duração: 16h | Certificado: Sim

### 3.4 Formatos de conteúdo
- Videoaulas (máx. 15 min cada)
- Material em PDF para impressão
- Quizzes de fixação
- Simulados práticos no ERSUS 360
- Fórum de dúvidas com tutores

### 3.5 Certificações ERSUS
| Certificado | Requisito |
|---|---|
| Gestor Iniciante | Trilha 1 + quiz aprovação 70% |
| APS Certificado | Trilha 2 + trilha 1 |
| Financeiro Certificado | Trilha 3 |
| Especialista ERSUS 360 | Todas as 4 trilhas + avaliação prática |

### 3.6 Integração com o sistema
- Notificação no ERSUS 360 quando curso lançado
- Badge de certificação no perfil do usuário
- Relatório de capacitação por município
- Acesso à Academia vinculado ao plano ERSUS

### 3.7 Disponibilidade por plano
| Recurso | Bronze | Prata | Ouro | Diamante |
|---|---|---|---|---|
| Trilha básica (Trilha 1) | ✅ | ✅ | ✅ | ✅ |
| Todas as trilhas | ❌ | ✅ | ✅ | ✅ |
| Certificados | ❌ | ✅ | ✅ | ✅ |
| Simulados práticos | ❌ | ❌ | ✅ | ✅ |
| Tutoria individualizada | ❌ | ❌ | ❌ | ✅ |
| Treinamento in loco | ❌ | ❌ | ❌ | Sob demanda |

---

## 4. Endpoints da API

```
# Marketplace
GET  /api/marketplace/parceiros          → lista de integrações
GET  /api/marketplace/parceiros/{id}     → detalhe do parceiro
POST /api/marketplace/solicitar          → solicitar integração

# Academia
GET  /api/academia/trilhas               → trilhas disponíveis
GET  /api/academia/trilhas/{id}/modulos  → módulos da trilha
POST /api/academia/matricula             → matricular em trilha
GET  /api/academia/progresso/{usuario}   → progresso do usuário
GET  /api/academia/certificados/{usuario} → certificados obtidos
```

---

## 5. Regras de Negócio

- RN-027-01: Parceiro deve ter CNPJ brasileiro e assinar termo de conformidade LGPD
- RN-027-02: Integração no Marketplace deve passar por homologação técnica antes de publicar
- RN-027-03: Certificado ERSUS tem validade de 2 anos — revalidação por atualização de conteúdo
- RN-027-04: Academia inclui acesso para até 5 usuários por município no plano Prata
- RN-027-05: Conteúdo da Academia é atualizado a cada portaria relevante do MS
- RN-027-06: Tutoria individualizada (Diamante) tem SLA de resposta de 24h úteis

---

## 6. Critérios de Aceite

- [ ] Página do Marketplace listando integrações disponíveis por categoria
- [ ] Formulário de cadastro de parceiro funcionando
- [ ] Academia com trilhas e módulos acessíveis no plano correspondente
- [ ] Progresso do usuário salvo e visualizável
- [ ] Certificado gerado em PDF ao completar trilha
- [ ] Badge de certificação visível no perfil do usuário no ERSUS 360

---

## 7. Roadmap Completo — Visão Consolidada

Com este documento, as 20 fases do ERSUS 360 estão documentadas:

| Fase | Módulo | Doc | Status |
|---|---|---|---|
| 1 | Governança e Fundação | DOC-001 a 010 | ✅ Produção |
| 2 | RBAC + Cadastros | DOC-011, 012 | ✅ Produção |
| 3 | Recursos Humanos | DOC-013 | ✅ Produção |
| 4 | Auditoria | DOC-011 (RBAC) | ✅ Produção |
| 5 | Assistência Farmacêutica | DOC-014 | ✅ Documentado |
| 6 | Atenção Primária | DOC-015 | ✅ Documentado |
| 7 | Vigilância em Saúde | DOC-016 | ✅ Documentado |
| 8 | Planejamento | DOC-017 | ✅ Documentado |
| 9 | Financeiro/FNS | DOC-018 | ✅ Documentado |
| 10 | Obras e Infraestrutura | DOC-019 | ✅ Documentado |
| 11 | Patrimônio e Frota | DOC-020 | ✅ Documentado |
| 12 | Business Intelligence | DOC-021 | ✅ Documentado |
| 13 | OCIS | DOC-022 | ✅ Documentado |
| 14 | IA Gestora | DOC-023 | ✅ Documentado |
| 15 | App Mobile ACS | DOC-024 | ✅ Documentado |
| 16 | Regulação/TFD | DOC-022 (OCIS) | ✅ Documentado |
| 17 | Portal do Gestor | DOC-025 | ✅ Documentado |
| 18 | Portal do Cidadão | DOC-025 | ✅ Documentado |
| 19 | Compliance SUS | DOC-026 | ✅ Documentado |
| 20 | Marketplace + Academia | DOC-027 | ✅ Documentado |

---

**Documento:** ERSUS-DOC-027
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-026 — Compliance SUS
**Status:** ROADMAP COMPLETO — 27 documentos escritos
