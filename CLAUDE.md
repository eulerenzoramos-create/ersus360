# ERSUS 360 — CLAUDE.md
Guia de contexto para o assistente Claude Code.

## O que é este projeto
ERSUS 360 é uma plataforma SaaS de gestão municipal de saúde pública para municípios brasileiros do SUS. Piloto: **Apuí/AM** (IBGE 1300144, ~25.000 hab, Amazonas).

Stack: FastAPI (backend Railway) + React/Vite/TypeScript (frontend Vercel).

## URLs de produção
- **Frontend:** https://ersus360.vercel.app
- **Backend API:** https://ersus360-production.up.railway.app
- **API Docs:** https://ersus360-production.up.railway.app/docs
- **GitHub:** eulerenzoramos-create/ersus360

## Usuários de teste
| Usuário | Senha | Papel |
|---|---|---|
| gestor | ersus2026 | gestor |
| admin | admin2026 | admin |

## Credenciais sensíveis
NUNCA no código — apenas como variáveis de ambiente no Railway:
- `FNS_API_CPF`, `FNS_API_SENHA` — acesso ao FNS/SIOPS
- `ESUS_USUARIO`, `ESUS_SENHA` — acesso ao e-SUS PEC
- `ANTHROPIC_API_KEY` — IA Gestora (Claude)

## Estrutura de diretórios
```
ersus360/
├── backend/
│   ├── main.py          ← registra todos os routers
│   ├── config.py        ← pydantic-settings (lê env vars)
│   ├── database.py      ← SQLAlchemy async + SQLite/aiosqlite
│   ├── models/          ← SQLAlchemy ORM models
│   ├── routers/         ← um arquivo por módulo
│   └── scheduler.py     ← APScheduler jobs
├── frontend/
│   ├── src/
│   │   ├── App.tsx      ← BrowserRouter + sidebar + todas as rotas
│   │   └── pages/       ← uma página por módulo
│   └── vite.config.ts
└── docs/                ← DOC-001 a DOC-027 (roadmap completo)
```

## Routers backend registrados (main.py)
| Arquivo | Prefix |
|---|---|
| auth.py | /api/auth |
| municipio.py | /api/municipio |
| fns.py | /api/fns |
| convenios.py | /api/convenios |
| repasses.py | /api/repasses |
| execucao.py | /api/execucao |
| portarias.py | /api/portarias |
| obras.py | /api/obras |
| usuarios.py | /api/usuarios |
| documentos.py | /api/documentos |
| relatorios.py | /api/relatorios |
| aps.py | /api/aps |
| farmacia.py | /api/farmacia |
| planejamento.py | /api/planejamento |
| ia.py | /api/ia |
| outros.py | /api/cronogramas, /api/indicadores, /api/alertas, /api/dashboard |
| modulos.py | /api/vigilancia, /api/transporte, /api/regulacao |
| emendas.py | /api/emendas |
| integracao.py | /api/integracao |
| auditoria.py | /api/auditoria |
| cadastros.py | /api/cadastros |
| rh.py | /api/rh |
| bi.py | /api/bi |
| ocis.py | /api/ocis |
| patrimonio.py | /api/patrimonio |
| portais.py | /api/portal, /api/publico |

## Páginas frontend (src/pages/)
`PainelGestor`, `Indicadores`, `Modulos`, `FnsConvenios`, `IAGestora`,
`Portarias`, `Obras`, `Execucao`, `Documentos`, `Alertas`, `Relatorios`,
`APS`, `Farmacia`, `Planejamento`, `Vigilancia`, `Municipio`, `Usuarios`,
`Login`, `Transporte`, `Regulacao`, `Emendas`, `PrevineBrasil`, `Sus360`,
`Auditoria`, `CadastrosMestres`, `RH`, `BI`, `OCIS`, `Patrimonio`,
`PortalCidadao`, `Marketplace`

## Padrão de dados (referência)
Todos os routers retornam `"fonte": "referencia"` quando os dados são simulados (Apuí/AM real-world values). As integrações reais (e-SUS, FNS, CNES) são chamadas quando as env vars estão disponíveis.

## Autenticação
JWT — 8h expiry. Header: `Authorization: Bearer <token>`. Dependency: `get_current_user` em `routers/auth.py`.

## Deploy
- **push para main** → Railway (backend) e Vercel (frontend) fazem auto-deploy
- Railway: variáveis em `Settings > Variables`
- Vercel: `VITE_API_URL=https://ersus360-production.up.railway.app`

## Como adicionar um novo módulo
1. Criar `backend/routers/novo_modulo.py` com `router = APIRouter(prefix="/api/novo")`
2. Importar e registrar em `backend/main.py`
3. Criar `frontend/src/pages/NovoModulo.tsx`
4. Adicionar import + `<Route>` + entrada na sidebar em `frontend/src/App.tsx`
5. Commitar e fazer push

## Segurança (não negociável)
- Nunca colocar CPF, senha ou API key no código
- Soft delete em todas as entidades críticas (auditoria)
- RBAC: `requer_papel(["admin","gestor"])` como dependency FastAPI
- LGPD: dados de pacientes só para papéis autorizados

## Documentação (docs/)
DOC-001 a DOC-027 — ver índice em `docs/README.md` (se existir) ou listar com `ls docs/`.
