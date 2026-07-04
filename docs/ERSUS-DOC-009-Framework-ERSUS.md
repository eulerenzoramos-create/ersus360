# ERSUS-DOC-009 — Framework ERSUS
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o Framework ERSUS — o conjunto de princípios, padrões, convenções e metodologias que governam o desenvolvimento, a qualidade e a evolução do ERSUS 360. Este documento é o guia de referência para todo desenvolvedor, designer e gestor de produto que trabalha no projeto.

---

## 2. Princípios Fundamentais

### 2.1 Os 5 Princípios ERSUS

| # | Princípio | Descrição |
|---|---|---|
| P1 | **Saúde Primeiro** | Toda decisão técnica deve considerar o impacto no cuidado ao paciente |
| P2 | **Simplicidade Radical** | O gestor municipal não é tecnólogo — a UX deve ser óbvia |
| P3 | **Dado Real, Nunca Simulado** | Sempre buscar dado real do SUS; fallback somente quando API indisponível |
| P4 | **Um Passo de Cada Vez** | Entregar valor incremental, jamais big-bang |
| P5 | **Segurança sem Negociação** | LGPD, credenciais seguras e auditoria são inegociáveis |

---

## 3. Framework de Desenvolvimento

### 3.1 Ciclo de Vida de uma Funcionalidade

```
IDEIA → DOCUMENTO → IMPLEMENTAÇÃO → TESTE → PILOTO → PRODUÇÃO
  │          │              │           │        │         │
  │       DOC-XXX        Backend +    QA +     Apuí/AM  Deploy
  │      (obrig.)        Frontend   Unitários  validação Railway+
  │                                             gestor   Vercel
  └──────────────────────────────────────────────────────────►
                         (mínimo 1 semana por fase)
```

**Regra de ouro:** nenhuma funcionalidade vai para produção sem documento aprovado.

### 3.2 Estrutura de um Documento ERSUS (padrão SAP/Oracle)
Todo documento do roadmap deve conter:

| Seção | Conteúdo obrigatório |
|---|---|
| 1. Objetivo | O que o documento define e por quê |
| 2. Visão Geral | Diagrama ou tabela resumindo o escopo |
| 3. Detalhamento | Seções específicas do módulo |
| ...N-2. Regras de Negócio | RN-XXX-YY: regras invioláveis |
| ...N-1. Critérios de Aceite | Checklist de aprovação |
| N. Rodapé | Versão, data, anterior, próximo |

### 3.3 Nomenclatura de documentos
```
ERSUS-DOC-{NNN}-{Titulo-Kebab-Case}.md

Exemplos:
  ERSUS-DOC-001-Visao-Estrategica.md
  ERSUS-DOC-008-Arquitetura-Geral.md
  ERSUS-DOC-015-Modulo-Farmacia.md
```

### 3.4 Nomenclatura de regras de negócio
```
RN-{DOC}-{SEQ}: {Descrição imperativa}

Exemplos:
  RN-009-01: Toda funcionalidade deve ter documento antes da implementação
  RN-009-02: Credenciais jamais são commitadas no repositório
```

---

## 4. Framework de Backend (FastAPI)

### 4.1 Convenções de código Python

```python
# Nomenclatura
snake_case           → variáveis, funções, módulos
PascalCase           → classes (models, schemas)
UPPER_SNAKE_CASE     → constantes

# Estrutura de um router
from fastapi import APIRouter, Depends
from ..auth import get_current_user

router = APIRouter(prefix="/api/{modulo}", tags=["{Modulo}"])

@router.get("/")
async def listar(usuario = Depends(get_current_user)):
    """Docstring apenas se a lógica não for óbvia."""
    ...
```

### 4.2 Padrão de service layer
```python
# Toda integração externa vai em services/
# services/{sistema}_service.py

async def buscar_indicadores_previne(municipio_ibge: str) -> dict:
    try:
        # Tenta API real
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{FNS_API}/previne/{municipio_ibge}")
            return resp.json()
    except Exception:
        # Fallback gracioso — nunca retorna erro 500 para o frontend
        return DADOS_REFERENCIA_PREVINE
```

### 4.3 Padrão de resposta de erro
```python
# Nunca expor stack trace para o cliente
# Sempre retornar mensagem amigável

from fastapi import HTTPException

raise HTTPException(
    status_code=404,
    detail="Município não encontrado"
)
```

### 4.4 Variáveis de ambiente — regra absoluta
```
✅ settings.FNS_API_CPF          → lê de variável de ambiente Railway
❌ cpf = "34130047272"           → PROIBIDO — credencial no código
❌ # TODO: mudar a senha         → PROIBIDO — indica credencial hardcoded
```

---

## 5. Framework de Frontend (React/TypeScript)

### 5.1 Convenções de código TypeScript

```typescript
// Nomenclatura
camelCase        → variáveis, funções, hooks
PascalCase       → componentes, tipos, interfaces
UPPER_SNAKE_CASE → constantes globais
kebab-case       → nomes de arquivos de componentes

// Tipos sempre explícitos em props
interface Props {
  municipioId: string;
  onAtualizar: () => void;
}
```

### 5.2 Padrão de página
```typescript
// Toda página segue este padrão:
export default function NomeDaPagina() {
  // 1. Hooks de estado
  const [filtro, setFiltro] = useState('todos');

  // 2. Busca de dados (TanStack Query)
  const { data, isLoading, error } = useQuery({
    queryKey: ['modulo', filtro],
    queryFn: () => fetchDados(filtro),
    staleTime: 30_000,  // 30s de cache
  });

  // 3. Loading state
  if (isLoading) return <div style={CARD}>Carregando...</div>;

  // 4. Error state (nunca omitir)
  if (error) return <div style={CARD}>Erro ao carregar dados.</div>;

  // 5. Render
  return (
    <div style={{ padding: 24 }}>
      ...
    </div>
  );
}
```

### 5.3 Estilo inline — convenções
```typescript
// Constantes de estilo reutilizáveis na mesma página
const CARD = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

// Cores semânticas ERSUS
const CORES = {
  primaria:   '#1565C0',  // Azul ERSUS
  sucesso:    '#2E7D32',  // Verde meta atingida
  alerta:     '#F57F17',  // Amarelo atenção
  perigo:     '#C62828',  // Vermelho meta não atingida
  neutro:     '#455A64',  // Cinza texto
  fundo:      '#F5F7FA',  // Cinza fundo
};
```

### 5.4 Nomenclatura de rotas
```
/                        → Home (PainelGestor)
/previne-brasil          → Previne Brasil
/previne-brasil/ind-1    → Indicador específico
/painel-gestao           → Painel de Gestão
/fns/convenios           → FNS Convênios
/sb360/vinculos          → Saúde Brasil 360 — Vínculos
```

---

## 6. Framework de Integrações SUS

### 6.1 Hierarquia de fonte de dados
```
1. API real (e-SUS / FNS / CNES)   → sempre preferida
2. Cache local (banco de dados)    → usado se API offline há < 24h
3. Dados de referência ERSUS       → fallback de último recurso
4. Mensagem de indisponibilidade   → apenas se não houver fallback
```

### 6.2 Contratos de integração

| Sistema | Endpoint padrão | Autenticação | Timeout | Retry |
|---|---|---|---|---|
| e-SUS PEC | `{ESUS_URL}/api/` | JWT (login prévio) | 10s | 2x |
| FNS API | `apifns.saude.gov.br/api/` | CPF+senha (login prévio) | 15s | 2x |
| CNES | `cnes.datasus.gov.br/services/` | Sem auth | 8s | 3x |
| Anthropic | `api.anthropic.com/v1/` | API Key header | 30s | 1x |

### 6.3 Padrão de sincronização
```python
# POST /api/integracao/sincronizar
# Atualiza todos os sistemas e salva no banco local
# Executar: manualmente pelo gestor ou via cron diário às 6h

async def sincronizar_tudo(municipio_ibge: str):
    resultados = {}
    for sistema in [cnes_service, fns_service, esus_service]:
        try:
            resultados[sistema.nome] = await sistema.sincronizar(municipio_ibge)
        except Exception as e:
            resultados[sistema.nome] = {"erro": str(e), "status": "falhou"}
    return resultados
```

---

## 7. Framework de Qualidade

### 7.1 Pirâmide de testes ERSUS

```
        /\
       /  \        E2E (poucos, fluxos críticos)
      /────\
     /      \      Integração (APIs e banco)
    /────────\
   /          \    Unitários (services e utils)
  /────────────\
```

### 7.2 Critérios de qualidade por camada

| Tipo | Cobertura mínima | Ferramentas | Quando rodar |
|---|---|---|---|
| Unitários | 80% das functions | pytest (backend) | A cada commit |
| Integração | Todos os endpoints | pytest + httpx | A cada PR |
| E2E | Fluxos de login, dashboard, previne | Playwright (futuro) | Antes de release |

### 7.3 Checklist de PR (Pull Request)
Antes de abrir um PR, verificar:
- [ ] Testes passando localmente
- [ ] Sem credencial no código (git grep "senha\|password\|cpf")
- [ ] Endpoints novos documentados no Swagger (/docs)
- [ ] Frontend testado no Chrome e Firefox
- [ ] Sem `console.log` esquecido
- [ ] Tipos TypeScript sem `any` sem justificativa
- [ ] Fallback implementado para APIs externas

---

## 8. Framework de UX/UI ERSUS

### 8.1 Hierarquia visual das páginas
```
┌──────────────────────────────────────────────────────┐
│ TÍTULO DA PÁGINA          [Filtros]    [Ações]        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]                 │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  CONTEÚDO PRINCIPAL (tabela, gráfico, cards)         │
│                                                       │
├──────────────────────────────────────────────────────┤
│ Fonte: sistema  |  Atualizado: data  |  [Exportar]   │
└──────────────────────────────────────────────────────┘
```

### 8.2 Semáforo ERSUS — padrão de cores para metas
| Cor | Hex | Significado | Condição |
|---|---|---|---|
| Verde | #2E7D32 | Meta atingida | ≥ 90% |
| Amarelo | #F57F17 | Em andamento | 60–89% |
| Vermelho | #C62828 | Não atingida | < 60% |
| Cinza | #455A64 | Sem dado | null |

### 8.3 Componentes padronizados
| Componente | Uso | Cor |
|---|---|---|
| Badge "Atingido" | Meta ≥ 90% | Verde fundo claro |
| Badge "Andamento" | Meta 60–89% | Amarelo fundo claro |
| Badge "Crítico" | Meta < 60% | Vermelho fundo claro |
| BarraProgresso | Indicadores | Cor pelo semáforo |
| CardKPI | Dashboard | Azul ERSUS borda |
| CardAlerta | Notificações | Vermelho borda esquerda |

---

## 9. Framework de Segurança

### 9.1 Checklist de segurança por sprint
- [ ] Nenhuma credencial no código (automatizado: git-secrets)
- [ ] Dependências atualizadas (pip audit + npm audit)
- [ ] Tokens JWT com expiração correta (8h)
- [ ] CORS restrito a origens conhecidas
- [ ] SQL: apenas ORM SQLAlchemy, nunca SQL string concatenado
- [ ] Inputs do usuário sanitizados antes de persistir
- [ ] Logs sem dados pessoais (CPF, nome de paciente)

### 9.2 Política de senhas internas
| Credencial | Política |
|---|---|
| Senha gestor (JWT) | Mínimo 12 chars, 1 maiúscula, 1 número |
| SECRET_KEY | 64 chars aleatórios (openssl rand -hex 32) |
| Credenciais APIs | Armazenadas APENAS em Railway env vars |
| Senha banco | Gerada automaticamente pelo Railway |

### 9.3 Dados proibidos em logs
```python
CAMPOS_SENSIVEIS = [
    'cpf', 'cnpj', 'senha', 'password', 'token',
    'nome_paciente', 'prontuario', 'diagnostico'
]

# Mascarar antes de logar
def sanitizar_log(dados: dict) -> dict:
    return {k: '***' if k in CAMPOS_SENSIVEIS else v
            for k, v in dados.items()}
```

---

## 10. Framework de Dados de Referência

### 10.1 Dados de referência ERSUS (IBGE 1300144 — Apuí/AM)
Quando uma API real não está disponível, o sistema usa dados validados do município piloto:

| Módulo | Fonte | Atualização |
|---|---|---|
| Previne Brasil | Relatório quadrimestral Apuí/AM | Trimestral |
| Repasses FNS | Portal FNS público | Mensal |
| Equipes CNES | DATASUS público | Mensal |
| Produção APS | e-SUS PEC Apuí/AM | Diária (quando online) |

### 10.2 Política de fallback
```
API disponível:    retornar dado real + timestamp da busca
API indisponível:  retornar dado do banco (se < 24h)
Banco desatualizado: retornar DADOS_REFERENCIA + aviso "dado de referência"
```

---

## 11. Regras de Negócio

- RN-009-01: Toda funcionalidade deve ter documento aprovado antes da implementação
- RN-009-02: Credenciais jamais são commitadas — somente variáveis de ambiente
- RN-009-03: Todo fallback de API deve exibir aviso visual para o usuário
- RN-009-04: O semáforo de cores deve ser consistente em todos os módulos
- RN-009-05: Nenhuma página pode ficar em branco — sempre há loading, error ou empty state
- RN-009-06: Todos os endpoints da API devem estar documentados no Swagger (/docs)
- RN-009-07: Dados pessoais de pacientes nunca aparecem em logs ou respostas de API sem necessidade funcional explícita

---

## 12. Critérios de Aceite

- [ ] Framework revisado e aprovado pelo fundador
- [ ] Checklist de PR adicionado ao repositório GitHub (.github/pull_request_template.md)
- [ ] Convenções de nomenclatura documentadas no README
- [ ] Paleta de cores ERSUS extraída para constante compartilhada no frontend
- [ ] Política de segurança comunicada para todo o time técnico
- [ ] Dados de referência Apuí/AM validados com o gestor municipal

---

**Documento:** ERSUS-DOC-009
**Versão:** 1.0
**Data:** Julho/2026
**Anterior:** ERSUS-DOC-008 — Arquitetura Geral
**Próximo:** ERSUS-DOC-010 — Guia do Desenvolvedor
