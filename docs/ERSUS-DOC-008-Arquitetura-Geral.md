# ERSUS-DOC-008 — Arquitetura Geral
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Documentar a arquitetura técnica completa do ERSUS 360, definindo componentes, tecnologias, padrões de comunicação, segurança, escalabilidade e infraestrutura.

---

## 2. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERSUS 360                                │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │   FRONTEND   │    │   BACKEND    │    │  INTEGRAÇÕES SUS │  │
│   │  React/Vite  │◄──►│   FastAPI    │◄──►│ e-SUS/FNS/CNES   │  │
│   │  TypeScript  │    │   Python     │    │ SINAN/SISAB      │  │
│   │   Vercel     │    │   Railway    │    │ TransfereGov     │  │
│   └──────────────┘    └──────────────┘    └──────────────────┘  │
│          │                   │                                  │
│          │            ┌──────────────┐                          │
│          │            │   DATABASE   │                          │
│          │            │  PostgreSQL  │                          │
│          │            │  + SQLite    │                          │
│          │            └──────────────┘                          │
│          │                   │                                  │
│          └─────────┬─────────┘                                  │
│                    │                                            │
│             ┌──────────────┐                                    │
│             │  IA GESTORA  │                                    │
│             │ Claude (API) │                                    │
│             │  Anthropic   │                                    │
│             └──────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológica

### 3.1 Frontend
| Componente | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework | React | 18.x | Ecossistema maduro, componentes reutilizáveis |
| Build tool | Vite | 5.x | Build rápido, HMR eficiente |
| Linguagem | TypeScript | 5.x | Tipagem estática, menos bugs em produção |
| Roteamento | React Router | 6.x | SPA com rotas declarativas |
| Estado/Cache | TanStack Query | 5.x | Cache de API, sincronização de estado |
| Ícones | Lucide React | Latest | Biblioteca leve e consistente |
| Estilização | CSS-in-JS inline | — | Sem dependência de CSS framework |
| Deploy | Vercel | — | CDN global, deploy automático via GitHub |

### 3.2 Backend
| Componente | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework | FastAPI | 0.110+ | Alta performance, tipagem nativa, docs automáticos |
| Linguagem | Python | 3.11+ | Ecossistema rico para dados e IA |
| ORM | SQLAlchemy | 2.x | Async, multi-banco, migrations |
| Migrations | Alembic | Latest | Controle de versão do schema |
| Autenticação | JWT (python-jose) | Latest | Stateless, escalável |
| HTTP Client | httpx | Latest | Async, para integrações externas |
| Validação | Pydantic | 2.x | Tipagem de dados, serialização |
| Deploy | Railway | — | PaaS simples, deploy via GitHub |

### 3.3 Banco de Dados
| Ambiente | Banco | Justificativa |
|---|---|---|
| Produção (Railway) | SQLite + aiosqlite | Simples, sem dependência externa |
| Produção futura | PostgreSQL | Escalabilidade, JSON nativo, full-text search |
| Cache | Redis (Fase 2+) | Sessions, rate limiting, cache de API |

### 3.4 Infraestrutura
| Serviço | Provedor | Uso |
|---|---|---|
| Frontend hosting | Vercel | CDN global, deploy automático |
| Backend hosting | Railway | Containers gerenciados |
| CI/CD | GitHub Actions | Testes automáticos + deploy |
| Repositório | GitHub | Versionamento e colaboração |
| Monitoramento | Railway Metrics | CPU, memória, uptime |
| Logs | Railway Logs | Logs centralizados |
| DNS / SSL | Vercel + Railway | HTTPS automático |

### 3.5 Integrações Externas
| Sistema | Tipo | Autenticação | Status |
|---|---|---|---|
| e-SUS PEC (Apuí/AM) | REST API | JWT (usuario/senha) | ✅ Produção |
| FNS API (apifns.saude.gov.br) | REST API | CPF/senha | ✅ Produção |
| CNES / DATASUS | REST API pública | Sem auth | ✅ Produção |
| Anthropic Claude | REST API | API Key | ✅ Produção |
| SUS 360° (MS) | iframe | Sem auth | ✅ Produção |
| SINAN | REST API | A definir | 🔜 Fase 7 |
| SI-PNI | REST API | A definir | 🔜 Fase 7 |
| TransfereGov | REST API | Gov.br | 🔜 Fase 9 |
| SISMOB | REST API | A definir | 🔜 Fase 10 |

---

## 4. Arquitetura do Backend

### 4.1 Estrutura de diretórios
```
ersus360/backend/
├── main.py              # FastAPI app, routers, middleware
├── config.py            # Configurações e variáveis de ambiente
├── database.py          # Conexão, sessões, init_db
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── usuario.py
│   ├── municipio.py
│   ├── indicador.py
│   ├── convenio.py
│   └── ...
├── routers/             # Endpoints FastAPI
│   ├── auth.py          # /api/auth/login, /me
│   ├── fns.py           # /api/fns/*
│   ├── aps.py           # /api/aps/*
│   ├── integracao.py    # /api/integracao/* (CNES, e-SUS, FNS API)
│   └── ...
├── services/            # Lógica de negócio e integrações
│   ├── cnes_service.py
│   ├── fns_api_service.py
│   ├── esus_service.py
│   └── ...
└── requirements.txt
```

### 4.2 Fluxo de autenticação
```
Cliente → POST /api/auth/login (usuario+senha)
       → Backend valida credenciais
       → Retorna JWT (access_token, 8h)
       → Cliente armazena token no localStorage
       → Todas as requisições: Header Authorization: Bearer <token>
       → Backend valida JWT em cada request (middleware)
```

### 4.3 Padrão de endpoints REST
```
GET    /api/{recurso}          → listar
GET    /api/{recurso}/{id}     → detalhar
POST   /api/{recurso}          → criar
PUT    /api/{recurso}/{id}     → atualizar completo
PATCH  /api/{recurso}/{id}     → atualizar parcial
DELETE /api/{recurso}/{id}     → excluir (soft delete)
```

### 4.4 Padrão de resposta
```json
{
  "data": { ... },         // dados do recurso
  "meta": {                // metadados opcionais
    "total": 100,
    "pagina": 1,
    "por_pagina": 20
  },
  "errors": []             // erros de validação
}
```

---

## 5. Arquitetura do Frontend

### 5.1 Estrutura de diretórios
```
ersus360/frontend/src/
├── App.tsx              # Roteamento, Layout, Sidebar
├── main.tsx             # Entry point
├── pages/               # Páginas por módulo
│   ├── Login.tsx
│   ├── PainelGestor.tsx
│   ├── PrevineBrasil.tsx
│   ├── Sus360.tsx
│   └── ...
├── lib/
│   └── api.ts           # Funções de acesso à API
├── components/          # Componentes reutilizáveis (Fase 2+)
└── types/               # Tipos TypeScript compartilhados
```

### 5.2 Fluxo de dados
```
Componente → useQuery(queryFn) → lib/api.ts → fetch(API_URL)
           → Cache TanStack Query (30s staleTime)
           → Renderização reativa
```

### 5.3 Variáveis de ambiente (Frontend)
```
VITE_API_URL=https://ersus360-production.up.railway.app
```

---

## 6. Segurança

### 6.1 Autenticação e autorização
| Mecanismo | Implementação |
|---|---|
| Autenticação | JWT HS256, expira em 8h |
| Autorização | RBAC (Role-Based Access Control) — Fase 2 |
| Senhas | bcrypt (hash+salt), nunca em texto claro |
| Credenciais externas | Variáveis de ambiente Railway, nunca no código |
| HTTPS | Obrigatório em produção (Vercel + Railway) |
| CORS | Whitelist de origens configurada |

### 6.2 LGPD — Lei Geral de Proteção de Dados
| Requisito | Implementação |
|---|---|
| Dados sensíveis de saúde | Criptografia em repouso (Fase 2) |
| Auditoria de acesso | Log de todas as operações (Fase 2) |
| Direito ao esquecimento | Soft delete + anonimização (Fase 2) |
| Consentimento | Termos de uso aceitos no login |
| DPO | Definir responsável (Fase 1 — Governança) |

### 6.3 Variáveis de ambiente (produção Railway)
```
DATABASE_URL         → String de conexão banco
SECRET_KEY           → Chave JWT (mínimo 32 chars)
CORS_ORIGINS         → Lista de origens permitidas
FNS_API_CPF          → CPF do gestor FNS (sem pontos)
FNS_API_SENHA        → Senha FNS
ESUS_USUARIO         → Login e-SUS PEC
ESUS_SENHA           → Senha e-SUS PEC
ANTHROPIC_API_KEY    → Chave da API Claude
```

---

## 7. Escalabilidade

### 7.1 Estratégia atual (MVP)
- 1 instância Railway (1 vCPU, 512MB RAM)
- SQLite para simplicidade
- Sem cache Redis
- Adequado para: 1–10 municípios simultâneos

### 7.2 Estratégia Fase 2 (100 municípios)
- Railway com auto-scaling
- Migração para PostgreSQL
- Redis para cache de sessões
- Multi-tenant por schema do banco

### 7.3 Estratégia Fase 3 (1.000+ municípios)
- Kubernetes (EKS/GKE) ou Railway Teams
- PostgreSQL com read replicas
- CDN para assets estáticos
- Filas assíncronas (Celery + Redis) para jobs pesados
- Microserviços por domínio (FNS, APS, Farmácia)

### 7.4 Multi-tenancy
```
Modelo atual:    Single tenant (Apuí/AM)
Modelo Fase 2:   Shared schema (municipio_id em cada tabela)
Modelo Fase 3:   Schema por tenant (PostgreSQL schemas)
```

---

## 8. CI/CD — Integração e Deploy Contínuo

```
Desenvolvedor → git push → GitHub
                              │
                    ┌─────────┴──────────┐
                    │                    │
              GitHub Actions         GitHub Actions
              (testes backend)      (testes frontend)
                    │                    │
              Railway Deploy        Vercel Deploy
              (automático)         (automático)
                    │                    │
              Produção Backend      Produção Frontend
```

### 8.1 Ambientes
| Ambiente | Branch | URL |
|---|---|---|
| Produção | main | ersus360.vercel.app / railway.app |
| Staging (futuro) | staging | ersus360-staging.vercel.app |
| Dev local | feature/* | localhost:5173 / localhost:8000 |

---

## 9. Monitoramento e Observabilidade

| Métrica | Ferramenta | Alerta |
|---|---|---|
| Uptime | Railway Metrics | < 99,5% |
| Tempo de resposta API | Railway Logs | > 2s |
| Erros 5xx | Railway Logs | > 1% das requests |
| CPU/Memória | Railway Metrics | > 80% |
| Erros de integração | Logs de serviço | Qualquer falha |

---

## 10. Decisões Arquiteturais (ADRs)

| # | Decisão | Razão | Consequência |
|---|---|---|---|
| ADR-001 | FastAPI > Django | Performance async, tipagem Pydantic | Menos batteries-included |
| ADR-002 | SQLite > PostgreSQL (MVP) | Simplicidade Railway, sem config extra | Migração futura necessária |
| ADR-003 | React > Next.js | SPA pura, sem SSR necessário | Sem SEO (não é problema para sistema privado) |
| ADR-004 | JWT stateless | Escalabilidade horizontal | Revogação manual de tokens |
| ADR-005 | Railway > AWS | Simplicidade, custo zero inicial, deploy GitHub | Menos controle de infra |
| ADR-006 | Monorepo | Frontend + backend no mesmo repositório | Deploy conjunto, gestão simples |

---

## 11. Regras de Negócio

- RN-008-01: Nenhuma credencial pode ser commitada no repositório — apenas variáveis de ambiente
- RN-008-02: Toda API externa deve ter fallback gracioso (dados de referência)
- RN-008-03: O token JWT deve expirar em no máximo 8 horas
- RN-008-04: Toda alteração de dado sensível deve gerar log de auditoria
- RN-008-05: O backend deve retornar erro 401 para tokens inválidos/expirados
- RN-008-06: Migrações de banco nunca fazem DROP sem aprovação explícita

---

## 12. Critérios de Aceite

- [ ] Diagrama de arquitetura revisado pelo time técnico
- [ ] Stack tecnológica aprovada e documentada
- [ ] Variáveis de ambiente produção auditadas
- [ ] Plano de migração SQLite → PostgreSQL documentado
- [ ] ADRs revisados e aceitos pelo fundador
- [ ] Estratégia de escalabilidade aprovada

---

**Documento:** ERSUS-DOC-008
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-007 — Roadmap do Produto
**Próximo:** ERSUS-DOC-009 — Framework ERSUS
