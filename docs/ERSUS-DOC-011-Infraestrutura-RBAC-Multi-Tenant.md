# ERSUS-DOC-011 — Infraestrutura: RBAC, Multi-Tenant e Auditoria
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir e implementar a infraestrutura de segurança e escalabilidade do ERSUS 360: controle de acesso baseado em papéis (RBAC), arquitetura multi-tenant para múltiplos municípios, auditoria completa de operações e perfis de usuário por função na secretaria de saúde.

---

## 2. Visão Geral

```
┌──────────────────────────────────────────────────────────────┐
│                    ERSUS 360 — FASE 2                        │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ MUNICIP. │   │ MUNICIP. │   │ MUNICIP. │   │ MUNICIP. │  │
│  │  Apuí/AM │   │  Lábrea  │   │  Boca   │   │  Novo    │  │
│  │ (piloto) │   │          │   │  do Acre │   │  Airão   │  │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘  │
│       └──────────────┴──────────────┴───────────────┘        │
│                              │                               │
│                   ┌──────────▼──────────┐                    │
│                   │    ERSUS 360 API     │                    │
│                   │  (multi-tenant por  │                    │
│                   │   municipio_id)     │                    │
│                   └──────────┬──────────┘                    │
│                              │                               │
│            ┌─────────────────┼─────────────────┐            │
│            │                 │                 │            │
│      ┌─────▼──────┐   ┌──────▼─────┐   ┌──────▼──────┐     │
│      │    RBAC    │   │  AUDITORIA  │   │   TENANTS   │     │
│      │  (papéis)  │   │   (logs)   │   │  (municípios)│     │
│      └────────────┘   └────────────┘   └─────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Multi-Tenant

### 3.1 Estratégia adotada: Shared Schema
Todos os municípios compartilham as mesmas tabelas. Cada registro tem `municipio_id` obrigatório. Nenhum município acessa dados de outro.

```
Tabela: usuarios
┌────┬──────────────────┬──────────────┬────────┐
│ id │ municipio_id     │ nome         │ papel  │
├────┼──────────────────┼──────────────┼────────┤
│  1 │ 1300144 (Apuí)  │ Euler Ramos  │ admin  │
│  2 │ 1300144 (Apuí)  │ Ana Souza    │ gestor │
│  3 │ 1302405 (Lábrea)│ João Silva   │ gestor │
└────┴──────────────────┴──────────────┴────────┘
```

### 3.2 Modelo de dados — Tenant (Município)
```python
# backend/models/tenant.py
class Municipio(Base):
    __tablename__ = "municipios"
    id           = Column(Integer, primary_key=True)
    ibge         = Column(String(7), unique=True, index=True)  # "1300144"
    nome         = Column(String, nullable=False)
    uf           = Column(String(2), nullable=False)
    plano        = Column(String, default="bronze")  # bronze/prata/ouro/diamante
    ativo        = Column(Boolean, default=True)
    trial_ate    = Column(DateTime, nullable=True)
    criado_em    = Column(DateTime, default=datetime.utcnow)
```

### 3.3 Isolamento de dados — middleware obrigatório
```python
# Toda query DEVE filtrar por municipio_id do usuário logado
# Nunca confiar em parâmetro da URL para definir o tenant

async def get_municipio_atual(usuario = Depends(get_current_user)):
    return usuario.municipio_id  # sempre do token JWT, nunca da URL
```

---

## 4. RBAC — Controle de Acesso Baseado em Papéis

### 4.1 Papéis do sistema

| Papel | Código | Descrição | Quem é |
|---|---|---|---|
| Super Admin | `superadmin` | Acesso total a todos os municípios | Fundador ERSUS |
| Administrador | `admin` | Acesso total ao município | TI da secretaria |
| Gestor | `gestor` | Acesso a todos os módulos, sem config | Secretário de saúde |
| Coordenador | `coordenador` | APS, Previne, Busca Ativa, ACS | Coordenador de APS |
| Financeiro | `financeiro` | FNS, Convênios, Execução Financeira | Diretor financeiro |
| ACS | `acs` | Apenas módulo ACS (suas microáreas) | Agente Comunitário |
| Visualizador | `visualizador` | Somente leitura, sem exportação | Auditores externos |

### 4.2 Matriz de permissões por módulo

| Módulo | superadmin | admin | gestor | coordenador | financeiro | acs | visualizador |
|---|---|---|---|---|---|---|---|
| Home/Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Previne Brasil | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Painel de Gestão | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Busca Ativa | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| ACS | ✅ | ✅ | ✅ | ✅ | ❌ | ✅* | ✅ |
| FNS / Convênios | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Saúde Brasil 360 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| POEPS | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Inconsistências | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| IA Gestora | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Config. do sistema | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão de usuários | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Logs de auditoria | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*ACS visualiza apenas sua própria microárea

### 4.3 Modelo de dados — Usuário com RBAC
```python
# backend/models/usuario.py
class Usuario(Base):
    __tablename__ = "usuarios"
    id             = Column(Integer, primary_key=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False)
    nome           = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True)
    senha_hash     = Column(String, nullable=False)
    papel          = Column(String, nullable=False)   # gestor, coordenador, etc.
    ativo          = Column(Boolean, default=True)
    ultimo_acesso  = Column(DateTime, nullable=True)
    criado_em      = Column(DateTime, default=datetime.utcnow)
    microarea_id   = Column(Integer, nullable=True)  # apenas para ACS
```

### 4.4 Implementação do RBAC no FastAPI
```python
# backend/auth.py

PERMISSOES = {
    "previne_brasil": ["superadmin", "admin", "gestor", "coordenador", "visualizador"],
    "fns":            ["superadmin", "admin", "gestor", "financeiro", "visualizador"],
    "acs":            ["superadmin", "admin", "gestor", "coordenador", "acs", "visualizador"],
    "configuracoes":  ["superadmin", "admin"],
}

def requer_papel(*papeis: str):
    def verificar(usuario = Depends(get_current_user)):
        if usuario.papel not in papeis:
            raise HTTPException(403, "Acesso negado para seu perfil")
        return usuario
    return verificar

# Uso nos routers:
@router.get("/api/fns/repasses")
async def listar_repasses(
    usuario = Depends(requer_papel("superadmin", "admin", "gestor", "financeiro"))
):
    ...
```

---

## 5. Auditoria Completa

### 5.1 O que auditar
Toda operação que altera dados ou acessa informação sensível deve gerar um registro de auditoria.

| Evento | Nível | Exemplos |
|---|---|---|
| Login / Logout | INFO | Acesso ao sistema |
| Visualização de dados | INFO | Abertura de módulo financeiro |
| Criação de registro | AUDIT | Novo convênio, novo usuário |
| Alteração de registro | AUDIT | Edição de meta, atualização de usuário |
| Exclusão de registro | CRITICAL | Soft delete de qualquer entidade |
| Falha de autenticação | WARN | Senha errada, token inválido |
| Acesso negado | WARN | Papel sem permissão tentou acessar módulo |
| Exportação de dados | AUDIT | Download de relatório XLS/PDF |
| Sincronização SUS | INFO | Integração com e-SUS, FNS, CNES |

### 5.2 Modelo de dados — Log de Auditoria
```python
# backend/models/auditoria.py
class LogAuditoria(Base):
    __tablename__ = "log_auditoria"
    id             = Column(Integer, primary_key=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"))
    usuario_id     = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario_nome   = Column(String)      # desnormalizado para histórico
    ip_address     = Column(String)
    acao           = Column(String)      # "login", "visualizar", "criar", "editar", "excluir"
    modulo         = Column(String)      # "fns", "previne", "usuarios"
    recurso_id     = Column(String, nullable=True)  # ID do registro afetado
    descricao      = Column(Text)        # texto livre, sem dados sensíveis
    nivel          = Column(String)      # INFO, AUDIT, WARN, CRITICAL
    criado_em      = Column(DateTime, default=datetime.utcnow, index=True)
```

### 5.3 Middleware de auditoria
```python
# backend/auditoria.py

async def registrar(
    db, municipio_id: int, usuario_id: int, usuario_nome: str,
    ip: str, acao: str, modulo: str, descricao: str,
    nivel: str = "AUDIT", recurso_id: str = None
):
    log = LogAuditoria(
        municipio_id=municipio_id,
        usuario_id=usuario_id,
        usuario_nome=usuario_nome,
        ip_address=ip,
        acao=acao,
        modulo=modulo,
        recurso_id=recurso_id,
        descricao=descricao,
        nivel=nivel,
    )
    db.add(log)
    await db.commit()
```

### 5.4 Endpoints de auditoria
```
GET /api/auditoria/logs          → listar logs (admin+)
GET /api/auditoria/logs/{id}     → detalhe de um log
GET /api/auditoria/usuarios/{id} → histórico de um usuário
GET /api/auditoria/exportar      → exportar logs em CSV
```

---

## 6. Gestão de Usuários

### 6.1 Endpoints
```
GET    /api/usuarios              → listar usuários do município
POST   /api/usuarios              → criar usuário
GET    /api/usuarios/{id}         → detalhar usuário
PUT    /api/usuarios/{id}         → atualizar usuário
DELETE /api/usuarios/{id}         → desativar usuário (soft delete)
POST   /api/usuarios/{id}/resetar-senha → enviar nova senha por e-mail
```

### 6.2 Criação de usuário — fluxo
```
Admin → POST /api/usuarios (nome, email, papel)
      → Backend gera senha temporária aleatória
      → Envia e-mail com senha temporária
      → Usuário faz login e é obrigado a trocar a senha
      → Log de auditoria: "Usuário criado por {admin}"
```

### 6.3 Senha temporária — política
- Gerada automaticamente: 12 caracteres aleatórios
- Válida por 48 horas
- Obriga troca no primeiro login
- Nunca enviada em texto claro via API (apenas por e-mail)

---

## 7. Configurações do Sistema

### 7.1 Módulo de Configurações (apenas admin+)

| Configuração | Tipo | Padrão |
|---|---|---|
| Nome da secretaria | texto | Secretaria Municipal de Saúde |
| Município IBGE | string | 1300144 |
| Logo da secretaria | imagem | Logo padrão ERSUS |
| E-mail de alertas | email | — |
| Fuso horário | string | America/Manaus |
| Idioma | string | pt-BR |
| Sessão JWT expira em | horas | 8 |
| Notificações ativas | boolean | true |

### 7.2 Endpoint
```
GET  /api/configuracoes     → ler configurações do município
PUT  /api/configuracoes     → salvar configurações (admin+)
```

---

## 8. Frontend — Telas da Fase 2

### 8.1 Tela de Gestão de Usuários
```
┌─────────────────────────────────────────────────────┐
│ Gestão de Usuários          [+ Novo Usuário]        │
├─────────────────────────────────────────────────────┤
│ [Buscar por nome ou e-mail...]    [Filtrar: Papel ▼]│
├──────┬──────────────────┬──────────────┬────────────┤
│ Nome │ E-mail           │ Papel        │ Status     │
├──────┼──────────────────┼──────────────┼────────────┤
│ Euler│ euler@...        │ Admin        │ ✅ Ativo   │
│ Ana  │ ana@...          │ Coordenadora │ ✅ Ativo   │
│ João │ joao@...         │ Financeiro   │ ⏸ Inativo │
├──────┴──────────────────┴──────────────┴────────────┤
│ Mostrando 3 de 3 usuários                           │
└─────────────────────────────────────────────────────┘
```

### 8.2 Tela de Logs de Auditoria
```
┌─────────────────────────────────────────────────────┐
│ Auditoria do Sistema        [Exportar CSV]          │
├─────────────────────────────────────────────────────┤
│ [Data início] [Data fim] [Usuário ▼] [Módulo ▼]    │
├──────┬─────────────┬──────────┬───────┬─────────────┤
│ Data │ Usuário     │ Ação     │ Módulo│ Descrição   │
├──────┼─────────────┼──────────┼───────┼─────────────┤
│10:42 │ Euler Ramos │ login    │ auth  │ Login ...   │
│10:45 │ Euler Ramos │visualizar│ fns   │ Acessou ... │
│11:02 │ Ana Souza   │ criar    │ prev. │ Meta ...    │
└──────┴─────────────┴──────────┴───────┴─────────────┘
```

---

## 9. Segurança Adicional — Fase 2

### 9.1 Rate limiting
```python
# Proteção contra brute force no login
# máximo 5 tentativas por IP em 5 minutos

from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/api/auth/login")
@limiter.limit("5/5minutes")
async def login(request: Request, ...):
    ...
```

### 9.2 Bloqueio de conta
- Após 10 tentativas de login falhas: conta bloqueada por 30 minutos
- Log de auditoria nível CRITICAL gerado
- E-mail de alerta enviado ao admin do município

### 9.3 Token de refresh
```
access_token:  válido por 8 horas (uso nas APIs)
refresh_token: válido por 7 dias (renovação silenciosa)
```

---

## 10. Regras de Negócio

- RN-011-01: Todo usuário pertence a exatamente um município — sem acesso cross-tenant exceto superadmin
- RN-011-02: A exclusão de usuário é sempre soft delete — nunca DELETE físico do banco
- RN-011-03: Logs de auditoria nunca são excluídos — somente arquivados após 5 anos
- RN-011-04: Senhas são armazenadas apenas como hash bcrypt — nunca em texto claro
- RN-011-05: O papel `superadmin` só pode ser atribuído via banco de dados diretamente — nunca via API
- RN-011-06: Toda tentativa de acesso a módulo não autorizado gera log nível WARN
- RN-011-07: Município em trial expirado tem acesso somente leitura por 7 dias antes do bloqueio total
- RN-011-08: Exportação de dados só está disponível para papéis gestor, admin e superadmin

---

## 11. Critérios de Aceite

- [ ] Multi-tenant validado: usuário de Apuí/AM não consegue ver dados de outro município
- [ ] RBAC validado: cada papel testado com acesso negado nos módulos corretos
- [ ] Log de auditoria gerado para: login, criação, edição, exclusão e exportação
- [ ] Tela de gestão de usuários funcional (criar, editar, desativar)
- [ ] Tela de logs de auditoria com filtros e exportação CSV
- [ ] Rate limiting no endpoint de login testado
- [ ] Senhas temporárias enviadas por e-mail no cadastro de novo usuário
- [ ] Configurações do município salvas e carregadas corretamente

---

**Documento:** ERSUS-DOC-011
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-010 — Guia do Desenvolvedor
**Próximo:** ERSUS-DOC-012 — Cadastros Mestres (Fase 3)
