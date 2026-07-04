# ERSUS-DOC-010 — Guia do Desenvolvedor
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Guiar qualquer desenvolvedor — novo ou experiente — a configurar o ambiente local, entender a estrutura do projeto, contribuir com código e fazer deploy no ERSUS 360.

---

## 2. Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Python | 3.11+ | python.org |
| Node.js | 18+ | nodejs.org |
| Git | 2.40+ | git-scm.com |
| VS Code | Qualquer | code.visualstudio.com |

---

## 3. Configuração do Ambiente Local

### 3.1 Clonar o repositório
```bash
git clone https://github.com/eulerenzoramos-create/ersus360.git
cd ersus360
```

### 3.2 Backend — FastAPI
```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 3.3 Variáveis de ambiente (backend local)
Criar arquivo `backend/.env` (nunca commitar este arquivo):
```env
DATABASE_URL=sqlite+aiosqlite:///./ersus360.db
SECRET_KEY=chave-local-desenvolvimento-nao-usar-em-producao
CORS_ORIGINS=http://localhost:5173
FNS_API_BASE=https://apifns.saude.gov.br
FNS_API_CPF=
FNS_API_SENHA=
ESUS_URL=https://esus.apui.am.gov.br
ESUS_USUARIO=
ESUS_SENHA=
CNES_API=https://cnes.datasus.gov.br/services
FNS_MUNICIPIO_IBGE=1300144
ANTHROPIC_API_KEY=
```

> **Nota:** As credenciais FNS e e-SUS são necessárias apenas para desenvolver os módulos de integração. O sistema funciona com fallback sem elas.

### 3.4 Rodar o backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Acesse:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3.5 Frontend — React/Vite
```bash
cd frontend

# Instalar dependências
npm install
```

### 3.6 Variáveis de ambiente (frontend local)
Criar arquivo `frontend/.env.local` (nunca commitar):
```env
VITE_API_URL=http://localhost:8000
```

### 3.7 Rodar o frontend
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

### 3.8 Login local
```
Usuário: gestor
Senha:   ersus2026

Usuário: admin
Senha:   admin2026
```

---

## 4. Estrutura do Repositório

```
ersus360/
├── backend/
│   ├── main.py              # App FastAPI, registro de routers
│   ├── config.py            # Configurações (pydantic-settings)
│   ├── database.py          # Conexão banco, init_db
│   ├── auth.py              # JWT, get_current_user
│   ├── models/              # SQLAlchemy models (tabelas)
│   ├── routers/             # Endpoints por módulo
│   │   ├── auth.py
│   │   ├── fns.py
│   │   ├── aps.py
│   │   └── integracao.py
│   ├── services/            # Lógica de integração externa
│   ├── requirements.txt
│   └── Procfile             # Comando de start para Railway
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Layout, Sidebar, Rotas
│   │   ├── main.tsx         # Entry point
│   │   └── pages/           # Uma página por módulo
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                    # Documentos do Roadmap (DOC-001 a DOC-0XX)
│
└── README.md
```

---

## 5. Criando um Novo Módulo

### 5.1 Passo a passo completo

**Passo 1 — Documento**
Criar `docs/ERSUS-DOC-XXX-Nome-do-Modulo.md` seguindo o padrão DOC-009.

**Passo 2 — Model (backend)**
```python
# backend/models/meu_modulo.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class MeuModelo(Base):
    __tablename__ = "meu_modulo"
    id = Column(Integer, primary_key=True)
    municipio_ibge = Column(String, index=True)
    valor = Column(Float)
    criado_em = Column(DateTime)
```

**Passo 3 — Router (backend)**
```python
# backend/routers/meu_modulo.py
from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter(prefix="/api/meu-modulo", tags=["Meu Módulo"])

@router.get("/")
async def listar(usuario = Depends(get_current_user)):
    return {"data": []}
```

**Passo 4 — Registrar router em main.py**
```python
# backend/main.py
from routers.meu_modulo import router as meu_modulo_router
app.include_router(meu_modulo_router)
```

**Passo 5 — Página (frontend)**
```typescript
// frontend/src/pages/MeuModulo.tsx
export default function MeuModulo() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Meu Módulo</h1>
    </div>
  );
}
```

**Passo 6 — Rota e item no Sidebar (App.tsx)**
```typescript
// Adicionar import
import MeuModulo from './pages/MeuModulo';

// Adicionar rota
<Route path="/meu-modulo" element={<MeuModulo />} />

// Adicionar item no sidebar (seção correta)
{ label: 'Meu Módulo', path: '/meu-modulo', icon: <IconeApropriado size={16} /> }
```

---

## 6. Fluxo de Deploy

### 6.1 Deploy automático (padrão)
```bash
# Qualquer push para main aciona deploy automático
git add .
git commit -m "feat: descrição do que foi feito"
git push origin main

# Backend → Railway detecta push → rebuild → deploy (~2 min)
# Frontend → Vercel detecta push → rebuild → deploy (~1 min)
```

### 6.2 Verificar deploy
- Backend: https://ersus360-production.up.railway.app/docs
- Frontend: https://ersus360.vercel.app
- Logs Railway: railway.app → projeto → Deployments → View Logs

### 6.3 Deploy manual (Railway)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy manual
railway up
```

---

## 7. Variáveis de Ambiente em Produção (Railway)

| Variável | Onde configurar | Quem tem acesso |
|---|---|---|
| SECRET_KEY | Railway → Variables | Apenas fundador |
| FNS_API_CPF | Railway → Variables | Apenas fundador |
| FNS_API_SENHA | Railway → Variables | Apenas fundador |
| ESUS_USUARIO | Railway → Variables | Apenas fundador |
| ESUS_SENHA | Railway → Variables | Apenas fundador |
| ANTHROPIC_API_KEY | Railway → Variables | Apenas fundador |
| CORS_ORIGINS | Railway → Variables | Dev sênior+ |
| DATABASE_URL | Railway → Variables | Railway automático |

> **Regra:** nunca solicitar credenciais de produção por e-mail, WhatsApp ou chat. Sempre via Railway dashboard com acesso restrito.

---

## 8. Comandos Úteis

### 8.1 Backend
```bash
# Rodar testes
pytest

# Rodar testes com cobertura
pytest --cov=. --cov-report=html

# Verificar tipos
mypy .

# Formatar código
black .

# Verificar dependências vulneráveis
pip-audit
```

### 8.2 Frontend
```bash
# Build de produção
npm run build

# Preview do build
npm run preview

# Verificar tipos TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Verificar dependências vulneráveis
npm audit
```

### 8.3 Git — convenção de commits
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
refactor: refatoração sem mudança de comportamento
test: adição ou correção de testes
chore: tarefas de manutenção (deps, configs)

Exemplos:
  feat: add módulo Previne Brasil com 7 indicadores
  fix: corrigir fallback quando FNS API offline
  docs: add DOC-010 Guia do Desenvolvedor
  refactor: extrair service layer para integrações
```

---

## 9. Debugging Comum

### 9.1 Backend não sobe localmente
```bash
# Verificar se porta 8000 está ocupada
netstat -an | grep 8000

# Verificar se venv está ativado
which python  # deve apontar para venv/

# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

### 9.2 Frontend não conecta ao backend
```bash
# Verificar VITE_API_URL no .env.local
cat frontend/.env.local

# Verificar se backend está rodando
curl http://localhost:8000/docs

# Verificar CORS no backend
# config.py → CORS_ORIGINS deve incluir http://localhost:5173
```

### 9.3 Erro 401 (token inválido)
```bash
# Token expirou (8h) — fazer login novamente
# No frontend: localStorage.clear() e recarregar a página
```

### 9.4 Railway mostra erro no deploy
```bash
# Ver logs completos no Railway dashboard
# Erros comuns:
#   - requirements.txt desatualizado → pip freeze > requirements.txt
#   - Variável de ambiente faltando → adicionar no Railway Variables
#   - Porta errada → Procfile deve usar $PORT
```

### 9.5 Procfile correto para Railway
```
# backend/Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 10. Extensões VS Code Recomendadas

| Extensão | ID | Uso |
|---|---|---|
| Python | ms-python.python | Syntax, debugging Python |
| Pylance | ms-python.vscode-pylance | Type checking Python |
| ESLint | dbaeumer.vscode-eslint | Lint TypeScript |
| Prettier | esbenp.prettier-vscode | Formatação |
| REST Client | humao.rest-client | Testar APIs .http |
| Thunder Client | rangav.vscode-thunder-client | Testar APIs (GUI) |
| GitLens | eamodio.gitlens | Git avançado |
| Error Lens | usernamehw.errorlens | Erros inline |

---

## 11. Ambientes e URLs

| Ambiente | Frontend | Backend | Branch |
|---|---|---|---|
| Produção | https://ersus360.vercel.app | https://ersus360-production.up.railway.app | main |
| Local dev | http://localhost:5173 | http://localhost:8000 | feature/* |
| Swagger local | — | http://localhost:8000/docs | — |
| Swagger prod | — | https://ersus360-production.up.railway.app/docs | — |

---

## 12. Regras de Negócio

- RN-010-01: Nenhum desenvolvedor recebe credenciais de produção diretamente — acesso via Railway dashboard com MFA
- RN-010-02: O arquivo `.env` local nunca é commitado (garantido pelo `.gitignore`)
- RN-010-03: Todo PR deve passar pelos checks automatizados antes do merge
- RN-010-04: Em caso de incidente em produção, acionar o fundador em até 15 minutos
- RN-010-05: Qualquer mudança no banco de dados deve ter migration Alembic antes de ir para produção
- RN-010-06: O Swagger (/docs) deve estar sempre atualizado — é a documentação oficial da API

---

## 13. Critérios de Aceite

- [ ] Novo desenvolvedor consegue subir ambiente local em menos de 30 minutos seguindo este guia
- [ ] Todos os comandos testados em Windows e Linux
- [ ] `.gitignore` inclui `.env`, `venv/`, `node_modules/`, `*.db`
- [ ] README.md do repositório referencia este documento
- [ ] Extensões VS Code configuradas no `.vscode/extensions.json`

---

**Documento:** ERSUS-DOC-010
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-009 — Framework ERSUS
**Próximo:** ERSUS-DOC-011 — Infraestrutura (Fase 2 — RBAC e Multi-tenant)
