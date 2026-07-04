# ERSUS-DOC-026 — Compliance SUS: LGPD, LAI e Auditoria
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir os requisitos de conformidade do ERSUS 360 com a legislação brasileira aplicável à gestão municipal de saúde: LGPD (Lei 13.709/2018), LAI (Lei 12.527/2011), normas do SUS e regulamentos do Ministério da Saúde.

---

## 2. LGPD — Lei Geral de Proteção de Dados

### 2.1 Dados pessoais tratados
| Categoria | Exemplos | Base Legal LGPD |
|---|---|---|
| Identificação | Nome, CPF, CNS, endereço | Execução de política pública (art. 7º, III) |
| Saúde | Diagnóstico, prontuário, vacinas | Tutela da saúde (art. 11, II, f) |
| Profissional | Servidor, registro profissional | Execução de contrato (art. 7º, V) |
| Financeiro | Conta bancária fornecedor | Execução de contrato (art. 7º, V) |

### 2.2 Direitos do titular
- Acesso a dados pessoais (via sistema ou ofício)
- Correção de dados incorretos
- Eliminação de dados desnecessários
- Revogação do consentimento (quando aplicável)
- Portabilidade (formato aberto)

### 2.3 Medidas técnicas implementadas
| Medida | Implementação |
|---|---|
| Criptografia em trânsito | HTTPS/TLS 1.3 obrigatório |
| Criptografia em repouso | SQLite WAL + Railway encrypted volumes |
| Controle de acesso | RBAC com 7 papéis |
| Anonimização | Dados exportados mascarados por padrão |
| Log de acesso | AuditLog em todas as operações sensíveis |
| Retenção de dados | 5 anos após encerramento do vínculo |
| Backup | Diário, retido 90 dias |

### 2.4 DPO — Encarregado de Dados
- O município deve nomear um DPO (Lei exige para entes públicos)
- ERSUS 360 fornece relatórios LGPD ao DPO
- Canal para solicitações de titulares disponível no Portal do Cidadão

---

## 3. LAI — Lei de Acesso à Informação

### 3.1 Informações obrigatórias
Conforme LAI, o município deve publicar proativamente:
- Receitas e despesas em saúde
- Contratos e convênios de saúde
- Licitações realizadas
- Estrutura organizacional da SMS
- Indicadores de saúde consolidados

### 3.2 Como o ERSUS 360 atende
- Portal do Cidadão expõe dados LAI automaticamente
- Execução financeira simplificada em tempo real
- Contratos visíveis (sem valores nominais de servidores)
- Indicadores Previne Brasil publicados quadrimestralmente

### 3.3 Ouvidoria integrada
- Prazo legal: 20 dias úteis (prorrogável mais 10)
- Recurso em 3 instâncias municipais
- Registro de protocolo automático
- Dashboard de prazos para o gestor

---

## 4. Normas SUS e Ministério da Saúde

### 4.1 Sistemas obrigatórios suportados
| Sistema | Periodicidade | Penalidade por atraso |
|---|---|---|
| SIOPS | Quadrimestral (mar/jul/set/jan) | Bloqueio de repasses FNS |
| SISAB/e-SUS | Mensal | Perda de incentivos ESF |
| SINAN | Semanal (agravos) | Irregular no MS |
| RDQA | Quadrimestral | Bloqueio de incentivos |
| RREO | Bimestral | LRF — responsabilidade fiscal |

### 4.2 Alertas automáticos de compliance
| Alerta | Antecedência |
|---|---|
| SIOPS vencendo | 30 dias |
| RDQA vencendo | 15 dias |
| SISAB com inconsistências | Diário |
| RREO vencendo | 10 dias |
| Mínimo constitucional em risco | Tempo real |

---

## 5. Auditoria Interna e Controle

### 5.1 O que é auditado
- Todos os acessos ao sistema (login/logout)
- Criação, alteração e exclusão de registros
- Exportações de dados (quem, quando, quais dados)
- Alterações de senha e perfil de usuário
- Acesso a dados sensíveis (prontuário, financeiro)

### 5.2 Modelo de auditoria
```
AuditLog:
  - id, municipio_id
  - usuario_id, usuario_nome
  - acao: enum (CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, CONFIG)
  - modulo: string
  - registro_id: optional
  - dados_antes: JSON (snapshot pré-alteração)
  - dados_depois: JSON (snapshot pós-alteração)
  - ip_origem: string
  - timestamp: datetime
  - nivel: enum (INFO, AUDIT, WARN, CRITICAL)
```

### 5.3 Retenção de logs
- Logs de operação: 5 anos
- Logs de acesso: 2 anos
- Logs críticos: 10 anos (exclusão/alteração de dados de saúde)

---

## 6. Relatório de Conformidade LGPD

Relatório trimestral gerado automaticamente com:
- Operações de tratamento de dados realizadas
- Acessos a dados sensíveis por usuário
- Tentativas de acesso bloqueadas (bloqueio por RBAC)
- Exportações realizadas e volumes
- Incidentes (se houver) — obrigatório notificar ANPD em 72h

---

## 7. Regras de Negócio

- RN-026-01: LGPD — dados de saúde só podem ser acessados por papéis autorizados (art. 11 LGPD)
- RN-026-02: LAI — dados públicos do Portal do Cidadão não requerem login
- RN-026-03: Auditoria — exclusão de registros nunca é definitiva (soft delete)
- RN-026-04: SIOPS — alerta ativo 30 dias antes do vencimento com contagem regressiva
- RN-026-05: Incidente de segurança — notificação ANPD em 72h é responsabilidade do município; ERSUS 360 gera o template do relatório
- RN-026-06: Backup — restauração testada mensalmente (automático)

---

## 8. Critérios de Aceite

- [ ] AuditLog registrando todas as operações sensíveis
- [ ] Portal do Cidadão com dados LAI obrigatórios
- [ ] Alertas de compliance (SIOPS, RDQA, RREO) funcionando
- [ ] Soft delete implementado em todas as entidades críticas
- [ ] Relatório LGPD trimestral gerado automaticamente
- [ ] Ouvidoria com protocolo e prazos conforme LAI

---

**Documento:** ERSUS-DOC-026
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-025 — Portal do Gestor e Portal do Cidadão
**Próximo:** ERSUS-DOC-027 — Marketplace e Academia ERSUS
