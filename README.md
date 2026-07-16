# ERSUS 360 — Gestão Inteligente do SUS

Plataforma SaaS de gestão municipal de saúde pública para municípios brasileiros.  
Piloto: **Apuí/AM** · IBGE 1300144

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + SQLAlchemy async + SQLite/aiosqlite |
| Frontend | React 18 + Vite + TypeScript + TanStack Query |
| Autenticação | JWT (8h) + RBAC (7 papéis) |
| Deploy Backend | Railway (auto-deploy via git push) |
| Deploy Frontend | Vercel (auto-deploy via git push) |
| IA Gestora | Anthropic Claude (API) |

---

## URLs

| Ambiente | URL |
|---|---|
| Frontend (Vercel) | https://ersus360.vercel.app |
| API (Railway) | https://ersus360-production.up.railway.app |
| Docs API (Swagger) | https://ersus360-production.up.railway.app/docs |

---

## Módulos implementados

### APS e Vigilância
- Painel Novo Financiamento APS — 7 indicadores com metas (Portaria 3.493/2024)
- Atenção Primária — produção ESF, busca ativa, ACS
- Vigilância em Saúde — SINAN, vacinação, epidemiologia
- Saúde Brasil 360 — painéis SISAB

### Financeiro e Planejamento
- FNS/Convênios — repasses, cronograma, portarias
- Execução por bloco (PAB, MAC, VS, AFB, GES)
- Emendas parlamentares
- Planejamento — PMS, PAS, RDQA, metas pactuadas

### Gestão Operacional
- Assistência Farmacêutica — estoque 3 níveis, dispensação
- Obras e Infraestrutura — SISMOB, curva S
- Patrimônio e Frota — tombamento, manutenção, abastecimento
- Recursos Humanos — servidores, férias, movimentações, contratos

### Inteligência e Comando
- Business Intelligence — Score ERSUS 360 (0–100), painéis analíticos
- OCIS — alertas em tempo real, regulação SISREG, TFD
- IA Gestora — Claude API com contexto municipal
- Auditoria — log de todas as operações

### Administração
- RBAC + Multi-tenant (`municipio_id` em todas as tabelas)
- Cadastros Mestres — profissionais, UBS, equipes, ACS, medicamentos
- Gestão de Usuários

### Portais
- Portal do Cidadão — dados LAI, ouvidoria com protocolo
- Marketplace — integrações de parceiros certificados
- Academia ERSUS — trilhas de capacitação, certificados

---

## Desenvolvimento local

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # editar VITE_API_URL
npm run dev
```

### Variáveis de ambiente (Railway)
```
DATABASE_URL=sqlite+aiosqlite:///./ersus360.db
SECRET_KEY=<gerar com openssl rand -hex 32>
MUNICIPIO_NOME=Apuí
MUNICIPIO_UF=AM
MUNICIPIO_IBGE=1300144
ANTHROPIC_API_KEY=<chave Anthropic>
FNS_API_CPF=<cpf gestor FNS>
FNS_API_SENHA=<senha FNS>
ESUS_USUARIO=<usuario e-SUS>
ESUS_SENHA=<senha e-SUS>
```

---

## Deploy

```bash
git push origin main
# Railway e Vercel fazem auto-deploy automaticamente
```

---

## Documentação técnica

Ver pasta `docs/` — 27 documentos cobrindo as 20 fases do roadmap:

| Docs | Conteúdo |
|---|---|
| DOC-001 a 007 | Visão, produto, dados, LGPD, usuários, módulos, SLA |
| DOC-008 a 010 | Arquitetura, framework ERSUS, guia do desenvolvedor |
| DOC-011 a 013 | RBAC/multi-tenant, cadastros mestres, recursos humanos |
| DOC-014 a 020 | Farmácia, APS, vigilância, planejamento, financeiro, obras, patrimônio |
| DOC-021 a 024 | BI, OCIS, IA gestora, app mobile ACS |
| DOC-025 a 027 | Portais, compliance SUS/LGPD/LAI, marketplace e academia |

---

## Segurança

- JWT stateless, 8h expiry
- RBAC: superadmin / admin / gestor / coordenador / financeiro / acs / visualizador
- Multi-tenant: `municipio_id` em todas as tabelas
- Soft delete — auditoria preservada indefinidamente
- LGPD: dados de saúde só acessíveis por papéis autorizados
- Credenciais apenas em variáveis de ambiente Railway

---

**ERSUS Tecnologia em Saúde Pública** · v1.0.0 · Julho/2026
