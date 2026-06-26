# ERSUS 360 — Gestão Inteligente do SUS
### FMS Apuí / AM — Sistema Completo com Integração FNS

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11+ · FastAPI · SQLAlchemy 2.0 |
| Banco | PostgreSQL 15+ (Supabase ou local) |
| Frontend | React 18 · Vite · TanStack Query |
| IA | Anthropic Claude API |
| Scheduler | APScheduler (sync FNS automático) |
| Autenticação | JWT (python-jose) |

---

## Estrutura do Projeto

```
ersus360/
├── backend/
│   ├── main.py                  # Entry point FastAPI
│   ├── config.py                # Settings (env vars)
│   ├── database.py              # Engine + SessionLocal
│   ├── models/                  # SQLAlchemy ORM
│   │   ├── convenio.py
│   │   ├── repasse.py
│   │   ├── cronograma.py
│   │   ├── indicador.py
│   │   ├── alerta.py
│   │   └── municipio.py
│   ├── schemas/                 # Pydantic v2
│   │   ├── convenio.py
│   │   ├── repasse.py
│   │   ├── fns.py
│   │   └── dashboard.py
│   ├── routers/                 # Endpoints REST
│   │   ├── convenios.py
│   │   ├── repasses.py
│   │   ├── cronogramas.py
│   │   ├── fns.py               # ★ Integração FNS
│   │   ├── indicadores.py
│   │   ├── alertas.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── fns_service.py       # ★ Scraping/API FNS
│   │   ├── alerta_service.py
│   │   └── ia_service.py        # Claude API
│   └── scheduler.py             # Sync automático FNS
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── lib/api.ts           # Axios client
│   │   ├── pages/
│   │   │   ├── PainelGestor.tsx
│   │   │   ├── FnsConvenios.tsx
│   │   │   ├── Indicadores.tsx
│   │   │   └── IAGestora.tsx
│   │   └── components/
│   │       ├── Semaforo.tsx
│   │       ├── RepasesChart.tsx
│   │       └── AlertaCard.tsx
├── .env.example
├── docker-compose.yml
└── requirements.txt
```

---

## Setup Rápido

### 1. Variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Criar tabelas
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(engine)"

# Rodar
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 4. Via Docker (recomendado)

```bash
docker-compose up -d
```

---

## Endpoints principais

### FNS / Integração
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/fns/status` | Status da última sincronização |
| POST | `/api/fns/sync` | Sincroniza uma competência |
| POST | `/api/fns/sync-todos` | Sincroniza todas as competências |
| GET | `/api/fns/historico` | Histórico de syncs |

### Convênios
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/convenios` | Lista convênios |
| POST | `/api/convenios` | Cria convênio |
| PUT | `/api/convenios/{id}` | Atualiza |
| DELETE | `/api/convenios/{id}` | Remove |

### Repasses
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/repasses` | Lista repasses |
| GET | `/api/repasses/mensais` | Agrupado por mês (gráfico) |
| POST | `/api/repasses` | Lança repasse manual |

### Dashboard
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/stats` | KPIs consolidados |
| GET | `/api/alertas` | Alertas ativos |

---

## Sync FNS Automático

O scheduler roda todo dia às **06:00** e sincroniza a competência atual:

```python
# scheduler.py — configurável via .env
SYNC_HORA = "06:00"
SYNC_MUNICIPIO_ID = 1  # FMS Apuí
```

A sincronização consulta `consultafns.saude.gov.br`, extrai repasses novos
e cria alertas automáticos para valores abaixo do esperado.

---

## Módulos implementados — v2 COMPLETO

### Backend (FastAPI) — 100% implementado
- [x] Autenticação JWT (login / me / logout)
- [x] FNS / Convênios (integração web scraping + CRUD completo)
- [x] Repasses (lançamento manual + sync automático às 06:00)
- [x] Módulo 1: Cadastro do Município + Contas Bancárias
- [x] Módulo 2: Receitas FNS (blocos PAB, MAC, Vigilância, APS, etc.)
- [x] Módulo 3: Execução Financeira (Empenho → Liquidação → Pagamento + Restos a Pagar)
- [x] Módulo 4: Obras e SISMOB (cronograma + fotos + dias de atraso)
- [x] Módulo 5-APS: Atenção Primária à Saúde (Previne Brasil / UBS)
- [x] Módulo 5-Farm: Farmácia Municipal (estoque + dispensações + programas)
- [x] Módulo 5-Plan: Planejamento PMS/PAS/RAG/DIGISUS
- [x] Módulo 5-Vig: Vigilância em Saúde (SINAN + PNI + sanitária)
- [x] Módulo 6: Banco de Portarias (busca full-text + upload PDF)
- [x] Módulo 7: Dashboard KPIs consolidados
- [x] Módulo 8: Alertas automáticos (CRUD + resolver/remover)
- [x] Módulo 9: Gestão de Documentos (upload + download + MinIO)
- [x] Módulo 10: Relatórios e Prestação de Contas (PDF/JSON)
- [x] Módulo 11: IA Gestora com contexto real do banco (Claude API)
- [x] Módulo 12: Painel Secretário (indicadores + alertas críticos)
- [x] Módulo 13: Usuários com RBAC (11 perfis de acesso)
- [x] Transporte em Saúde / TFD (frota + pacientes)
- [x] Regulação (SISREG / central de regulação)
- [x] Aplicações Financeiras / Rendimentos bancários
- [x] Indicadores PAS (CRUD + semáforo automático)

### Frontend (React + Vite) — 100% implementado (18 páginas)
- [x] Login (JWT + interceptor automático + logout)
- [x] Painel do Gestor / Dashboard
- [x] FNS / Convênios (sync + gráficos)
- [x] Execução Financeira (saldos + empenhos + restos a pagar)
- [x] Portarias (busca + cadastro + upload PDF)
- [x] Obras (cards de status + semáforo de execução)
- [x] Documentos (upload drag-and-drop + download)
- [x] Alertas (central com auto-refresh 30s)
- [x] Relatórios (financeiro + por bloco + por programa + prestação de contas)
- [x] APS (Previne Brasil + indicadores + produção + UBS)
- [x] Farmácia (estoque + dispensações + programas)
- [x] Planejamento (PAS ações + RAG automático + DIGISUS export)
- [x] Vigilância (SINAN + imunização PNI + sanitária)
- [x] Transporte / TFD (frota + pacientes)
- [x] Regulação (solicitações + taxas + prazos)
- [x] Município (cadastro + contas bancárias)
- [x] Usuários (RBAC visual + criação + desativação)
- [x] IA Gestora (chat + sugestões + histórico)
- [x] Indicadores (semáforo visual)
