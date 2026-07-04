# ERSUS-DOC-012 — Cadastros Mestres
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir os cadastros mestres do ERSUS 360 — as entidades fundamentais que sustentam todos os módulos operacionais: profissionais, pacientes, unidades de saúde (UBS), equipes, ACS, medicamentos, fornecedores e contas bancárias. Estes cadastros são a espinha dorsal do sistema.

---

## 2. Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CADASTROS MESTRES                            │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ PROFISSIONAIS│   │    UBS /     │   │     EQUIPES      │    │
│  │  CRM · CBO  │   │ UNIDADES DE  │   │  ESF · eSB       │    │
│  │  CRN · COREN│   │    SAÚDE     │   │  eMulti · eSFR   │    │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘    │
│         │                 │                    │               │
│         └─────────────────┼────────────────────┘               │
│                           │                                    │
│  ┌──────────────┐   ┌──────▼───────┐   ┌──────────────────┐    │
│  │  PACIENTES   │   │     ACS      │   │  MEDICAMENTOS    │    │
│  │  CNS · CPF  │◄──►│  Microáreas  │   │  DCB · RENAME   │    │
│  │  Família    │   │  Famílias    │   │  Controlados     │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ FORNECEDORES │   │   CONTAS     │   │  FONTES DE       │    │
│  │  CNPJ · MEI │   │  BANCÁRIAS   │   │   RECURSOS       │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Fonte primária:** CNES/DATASUS (sincronização automática)
**Complemento:** cadastro manual pela secretaria

---

## 3. Cadastro de Profissionais

### 3.1 Dados do profissional
| Campo | Tipo | Obrigatório | Fonte |
|---|---|---|---|
| Nome completo | texto | ✅ | Manual / CNES |
| CPF | string(11) | ✅ | Manual |
| CNS (Cartão Nacional de Saúde) | string(15) | ✅ | Manual / CNES |
| CBO (Classificação Brasileira de Ocupações) | string(6) | ✅ | CNES |
| Conselho profissional (CRM/CRN/CRO/COREN) | texto | — | Manual |
| Número do conselho | texto | — | Manual |
| UF do conselho | string(2) | — | Manual |
| Vínculo | enum | ✅ | Manual |
| Carga horária semanal | inteiro | ✅ | Manual |
| UBS de lotação | FK | ✅ | Manual |
| Equipe de saúde | FK | — | Manual |
| Data de admissão | data | ✅ | Manual |
| Fonte de pagamento | enum | ✅ | Manual |
| Ativo | boolean | ✅ | Manual |

### 3.2 Tipos de vínculo
```
estatutario     → servidor público efetivo
clt             → celetista direto
temporario      → contrato temporário (lei municipal)
terceirizado    → via empresa terceira
residente       → médico residente
estagiario      → estudante em estágio
voluntario      → sem remuneração
```

### 3.3 Fontes de pagamento
```
recurso_proprio         → Tesouro Municipal
pab_fixo                → Piso da Atenção Básica
esf                     → Equipes de Saúde da Família
saude_bucal             → Programa Saúde Bucal
agentes_comunitarios    → ACS/ACE
emenda_parlamentar      → Emenda federal/estadual
```

### 3.4 Integração CNES
```
GET /api/integracao/cnes/profissionais?ibge=1300144
→ Retorna lista de profissionais cadastrados no CNES
→ Sincronizar mensalmente ou sob demanda
→ Campos CNES: CNS, CBO, nome, vínculo, carga horária
```

---

## 4. Cadastro de Unidades de Saúde (UBS)

### 4.1 Dados da unidade
| Campo | Tipo | Obrigatório | Fonte |
|---|---|---|---|
| CNES (código 7 dígitos) | string(7) | ✅ | CNES |
| Nome da unidade | texto | ✅ | CNES |
| Tipo | enum | ✅ | CNES |
| Endereço completo | texto | ✅ | CNES |
| Bairro / Localidade | texto | ✅ | CNES |
| Telefone | string(20) | — | Manual |
| E-mail | email | — | Manual |
| Responsável técnico | FK → Profissional | — | Manual |
| Horário de funcionamento | texto | — | Manual |
| Latitude / Longitude | float | — | Manual |
| Ativa | boolean | ✅ | Manual |

### 4.2 Tipos de unidade (CNES)
```
01 → Posto de Saúde
02 → Centro de Saúde / UBS
04 → Policlínica
05 → Hospital Geral
22 → Consultório Isolado
36 → Clínica / Centro de Especialidade
71 → Centro de Atenção Psicossocial (CAPS)
72 → UPA / Unidade de Pronto Atendimento
```

---

## 5. Cadastro de Equipes de Saúde

### 5.1 Tipos de equipe (conforme CNES)
| Tipo | Sigla | Composição mínima |
|---|---|---|
| Equipe de Saúde da Família | ESF | 1 médico + 1 enfermeiro + 1 técnico enfermagem + 4–12 ACS |
| Equipe de Saúde Bucal | eSB | 1 cirurgião dentista + 1 TSB ou ASB |
| Equipe Multiprofissional | eMulti | Fisio + Farmacêutico + Psicólogo + Nutricionista |
| Equipe de Saúde da Família Ribeirinha | eSFR | Composição ESF + logística fluvial |
| Equipe de Consultório na Rua | eCR | Médico + Enfermeiro + Técnico enfermagem |

### 5.2 Dados da equipe
| Campo | Tipo | Obrigatório |
|---|---|---|
| INE (Identificador Nacional de Equipes) | string(10) | ✅ |
| Nome da equipe | texto | ✅ |
| Tipo | enum | ✅ |
| UBS vinculada | FK | ✅ |
| Área de abrangência | texto | — |
| Número de microáreas | inteiro | — |
| Número de famílias cadastradas | inteiro | — |
| Data de implantação | data | — |
| Ativa | boolean | ✅ |

---

## 6. Cadastro de ACS (Agentes Comunitários de Saúde)

### 6.1 Dados do ACS
| Campo | Tipo | Obrigatório |
|---|---|---|
| Profissional (FK) | FK → Profissional | ✅ |
| Equipe (FK) | FK → Equipe | ✅ |
| Número da microárea | string | ✅ |
| Descrição da microárea | texto | — |
| Número de famílias | inteiro | — |
| Número de pessoas | inteiro | — |
| Meta de visitas/mês | inteiro | — |

---

## 7. Cadastro de Pacientes

### 7.1 Dados básicos
| Campo | Tipo | Obrigatório | LGPD |
|---|---|---|---|
| CNS | string(15) | ✅ | Dado sensível |
| Nome completo | texto | ✅ | Dado pessoal |
| Nome da mãe | texto | — | Dado pessoal |
| Data de nascimento | data | ✅ | Dado pessoal |
| Sexo biológico | enum | ✅ | — |
| Raça/Cor | enum | — | Dado sensível |
| CPF | string(11) | — | Dado sensível |
| Endereço | texto | — | Dado pessoal |
| Microárea | FK | — | — |
| ACS responsável | FK | — | — |
| Equipe de saúde | FK | — | — |
| Ativo no cadastro | boolean | ✅ | — |

> **LGPD:** dados de pacientes são classificados como dados sensíveis de saúde. Acesso restrito a papéis com necessidade funcional comprovada. Logs de acesso obrigatórios.

### 7.2 Integração e-SUS APS
```
A base de pacientes primária é o e-SUS PEC do município.
O ERSUS 360 consome via API para listas de busca ativa —
nunca duplica cadastros para evitar inconsistência.
```

---

## 8. Cadastro de Medicamentos

### 8.1 Dados do medicamento
| Campo | Tipo | Obrigatório | Fonte |
|---|---|---|---|
| DCB (Denominação Comum Brasileira) | texto | ✅ | RENAME |
| Nome comercial | texto | — | Manual |
| Apresentação | texto | ✅ | Manual |
| Concentração | texto | ✅ | Manual |
| Forma farmacêutica | enum | ✅ | Manual |
| Via de administração | enum | ✅ | Manual |
| Classe terapêutica | texto | — | RENAME |
| Componente RENAME | enum | ✅ | RENAME |
| Controlado (portaria) | boolean | ✅ | Manual |
| Portaria de controle | texto | — | Manual |
| Ativo no cadastro | boolean | ✅ | Manual |

### 8.2 Componentes RENAME
```
basico          → Componente Básico da Assistência Farmacêutica
especializado   → Componente Especializado
estrategico     → Medicamentos Estratégicos (tuberculose, DST)
nao_rename      → Fora da Relação Nacional
```

---

## 9. Cadastro de Fornecedores

### 9.1 Dados do fornecedor
| Campo | Tipo | Obrigatório |
|---|---|---|
| CNPJ | string(14) | ✅ |
| Razão social | texto | ✅ |
| Nome fantasia | texto | — |
| Inscrição estadual | texto | — |
| Endereço completo | texto | ✅ |
| Telefone principal | string(20) | ✅ |
| E-mail | email | ✅ |
| Contato responsável | texto | — |
| Segmento (medicamentos, EPI, equipamentos...) | texto | — |
| Ativo | boolean | ✅ |

---

## 10. Endpoints da API

```
# Profissionais
GET    /api/cadastros/profissionais
POST   /api/cadastros/profissionais
GET    /api/cadastros/profissionais/{id}
PUT    /api/cadastros/profissionais/{id}
DELETE /api/cadastros/profissionais/{id}   → soft delete
POST   /api/cadastros/profissionais/sincronizar-cnes

# Unidades de Saúde
GET    /api/cadastros/unidades
POST   /api/cadastros/unidades
GET    /api/cadastros/unidades/{id}
POST   /api/cadastros/unidades/sincronizar-cnes

# Equipes
GET    /api/cadastros/equipes
POST   /api/cadastros/equipes
GET    /api/cadastros/equipes/{id}

# ACS
GET    /api/cadastros/acs
POST   /api/cadastros/acs
GET    /api/cadastros/acs/{id}

# Medicamentos
GET    /api/cadastros/medicamentos
POST   /api/cadastros/medicamentos
GET    /api/cadastros/medicamentos/{id}

# Fornecedores
GET    /api/cadastros/fornecedores
POST   /api/cadastros/fornecedores
GET    /api/cadastros/fornecedores/{id}
```

---

## 11. Modelo de Dados — Diagrama ER Simplificado

```
Municipio (1) ──────────────────── (N) Unidade
                                         │
                     ┌───────────────────┤
                     │                   │
                   (N) Equipe         (N) Profissional
                     │                   │
              ┌──────┤              ┌────┤
              │      │              │    │
            (N) ACS  │            (N)   │
              │      │        CBO/Conselho
              │   (N) Paciente
              │      │
              └──────┘ (ACS atende Paciente)
```

---

## 12. Sincronização com CNES

### 12.1 Dados disponíveis via CNES público (sem autenticação)
- Estabelecimentos de saúde (por IBGE)
- Profissionais vinculados ao estabelecimento
- Equipes (INE, tipo, competência)
- Leitos e equipamentos

### 12.2 Frequência de sincronização
| Dado | Frequência | Método |
|---|---|---|
| Estabelecimentos | Mensal | Job automático 1º dia do mês |
| Equipes | Mensal | Job automático 1º dia do mês |
| Profissionais | Mensal | Job automático |
| Sob demanda | Qualquer momento | Botão "Sincronizar com CNES" |

---

## 13. Regras de Negócio

- RN-012-01: Todo profissional deve ter CNS e CBO antes de ser vinculado a uma equipe
- RN-012-02: Exclusão de profissional é sempre soft delete — preserva histórico de produção
- RN-012-03: Dados de pacientes são dados sensíveis — acesso restrito e sempre auditado
- RN-012-04: A base primária de pacientes é o e-SUS PEC — o ERSUS 360 consome, não duplica
- RN-012-05: Medicamentos controlados devem informar a portaria de controle
- RN-012-06: Sincronização com CNES não sobrescreve campos editados manualmente — usa merge
- RN-012-07: Equipe sem ACS cadastrado gera alerta automático no painel de inconsistências
- RN-012-08: Profissional sem UBS de lotação não pode ser vinculado a equipe

---

## 14. Critérios de Aceite

- [ ] Cadastro completo de profissionais com todos os campos obrigatórios
- [ ] Sincronização com CNES retornando equipes e estabelecimentos de Apuí/AM
- [ ] Cadastro de UBS com dados do CNES importados automaticamente
- [ ] Cadastro de equipes ESF/eSB vinculadas às UBS
- [ ] Cadastro de ACS por microárea com número de famílias
- [ ] Cadastro de medicamentos com componente RENAME
- [ ] API de todos os endpoints testada via Swagger
- [ ] Soft delete funcionando — registro inativo mas preservado

---

**Documento:** ERSUS-DOC-012
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-011 — Infraestrutura RBAC Multi-Tenant
**Próximo:** ERSUS-DOC-013 — Recursos Humanos (Fase 4)
