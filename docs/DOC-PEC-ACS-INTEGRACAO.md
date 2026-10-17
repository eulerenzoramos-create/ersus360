# PEC_SYNC_AGENT — Integração e-SUS APS/PEC → Painel ACS (ERSUS360)

Município piloto: **Apuí/AM** (IBGE 1300144) · PEC instalado: **versão 5.5.28** (rodapé de
https://esus.apui.am.gov.br, verificado em 16/10/2026).

## 1. Diagnóstico (Fase 1 — 16/10/2026)

| Item | Situação encontrada |
|---|---|
| Painel ACS (`/acs/painel`, `frontend/src/pages/ACSPainel.tsx`) | 9 abas: Dashboard, Visitas, Calendário, Cadastros Individuais, Cadastros Domiciliares, Lista de ACS, Microáreas, Tempo Real, Capturar PEC. |
| Origem dos números (`backend/routers/acs.py`) | **Fictícia.** 65 ACS com nomes inventados, famílias, visitas, "60/65", "85,4%", grupos prioritários — tudo fixo no código e exibido como "referência CNES". |
| `services/esus_service.py` / `integracao_pec.py` | Login GraphQL no PEC pelo servidor (ESUS_USUARIO/ESUS_SENHA) **falha** ("Falha ao autenticar"); as consultas usam um esquema GraphQL não documentado. Sem resultado real. |
| Aba "Capturar PEC" (bookmarklet) | Consultas GraphQL não documentadas e CBO errado (515140 é Agente de Combate às Endemias; ACS é **515105**). O recebimento só registrava log. |
| Agente local `pec_sync_agent/` | **Instalado e ativo** no servidor do PEC (último envio em 16/10/2026), usuário PostgreSQL `ersus_sync` somente leitura com permissão por coluna. Hoje calcula só os indicadores de qualidade C1–C7 (prévia). |
| Mecanismos oficiais do PEC 5.5 | **Escrita**: LEDI APS (Thrift/XML) para enviar fichas ao PEC. **Leitura** por terceiros: não há API pública documentada; o caminho seguro é a leitura do banco do próprio município por usuário somente leitura, dentro do servidor (sem expor o banco). |

Conclusão: a integração de leitura deve ser feita pelo **agente local já instalado**, ampliado
para os dados dos ACS. Automação de navegador e login GraphQL pelo servidor não são usados.

## 2. Arquitetura

```
e-SUS PEC (PostgreSQL do servidor municipal)
   │  usuário ersus_sync — SOMENTE LEITURA, permissão por coluna, statement_timeout
   ▼
PEC_SYNC_AGENT (pec_sync_agent/, tarefa agendada no servidor, a cada 4 h)
   │  HTTPS · X-Sync-Key do município · só dados AGREGADOS
   ▼
ERSUS360 /api/pec-agente/{acs,esquema,heartbeat}  (routers/pec_agente.py)
   │  validação do contrato (campos extras recusados) · histórico · idempotência por hash
   ▼
Banco ERSUS360 (pec_acs_lotes / pec_agente_execucoes / pec_esquema_relatorios, por municipio_id)
   ▼
Painel ACS (/api/acs/*, services/pec_acs.py)
```

- O banco do PEC nunca é exposto à internet; o frontend nunca fala com o PEC.
- Nada é gravado no PEC (planejamento de visitas fica no ERSUS360, separado do registrado).
- **Multi-município**: chave `ERSUS_SYNC_KEY_{IBGE7}` (Railway) lida por `tenancy.credenciais`
  (sistema `PEC_AGENTE`); `ERSUS_SYNC_KEY` sem sufixo = Apuí (legado). Chave de um município
  não vale para outro; município precisa estar *ativo* ou *em implantação*.

## 3. Contrato do lote ACS (`POST /api/pec-agente/acs`)

Somente agregados. Nenhum nome/CPF/CNS/endereço/dado clínico de cidadão. Identificador do ACS
= hash hexadecimal (nunca CPF/CNS). Campos fora do contrato são recusados (HTTP 422).

```json
{
  "ibge": "1300144", "competencia": "2026-10", "gerado_em": "2026-10-16T22:00:00Z",
  "agente_versao": "1.3.0", "pec_versao": "5.5.28",
  "periodo": {"inicio": "2026-10-01", "fim": "2026-10-16"},
  "equipes":    [{"ine": "...", "nome": "...", "tipo": "eSF", "cnes": "...", "unidade": "..."}],
  "acs":        [{"chave": "<sha256>", "nome": "...", "cbo": "515105", "ine": "...", "microareas": ["01"], "ativo": true}],
  "microareas": [{"codigo": "01", "ine": "...", "acs_chave": "<sha256>", "domicilios": 0, "familias": 0, "individuos": 0, "familias_visitadas": 0}],
  "visitas":    [{"data": "2026-10-03", "acs_chave": "<sha256>", "ine": "...", "microarea": "01", "total": 0, "realizadas": 0, "recusadas": 0, "ausentes": 0}],
  "grupos":     [{"ine": "...", "microarea": "01", "gestantes": 0, "criancas_menor_2": 0, "hipertensos": 0, "diabeticos": 0, "idosos": 0, "acamados": 0, "domiciliados": 0}],
  "totais":     {"cadastros_individuais": 0, "cadastros_domiciliares": 0, "familias": 0},
  "criterios":  {"visitas": "como o agente contou", "...": "..."}
}
```

Reenvio com o mesmo conteúdo → `sem_alteracao` (idempotente). Um lote por competência.

## 4. Critérios dos indicadores (a validar com a SMS de Apuí)

| Indicador | Critério adotado | Situação |
|---|---|---|
| ACS ativos | profissionais CBO 515105 com lotação ativa em equipe no PEC | depende do diagnóstico de esquema |
| Famílias / domicílios / indivíduos | cadastros domiciliares/individuais ativos por microárea | idem |
| Visitas realizadas | fichas de visita domiciliar com desfecho "visita realizada", pela data do atendimento | idem |
| % famílias visitadas | famílias com ≥ 1 visita realizada no período ÷ famílias cadastradas | só com as duas contagens |
| Cobertura familiar | **não calculada** — exige parâmetro populacional e fórmula validada | `None` até validação |
| Visitas programadas / metas | não existem no PEC; virão do planejamento do ERSUS360 | `None` |
| Grupos prioritários | contagens enviadas pelo agente, critérios em `criterios` | idem |

Regras: cadastro **não** conta como visita; valor ausente na origem = vazio ("—"), nunca zero
inventado; toda tela mostra competência e data de leitura no PEC.

## 5. Estados da integração (abas Tempo Real e Capturar PEC)

`sem_agente` · `conectado` (contato sem lote ACS) · `atualizado` · `desatualizado` (lote > 8 h) ·
`offline` (sem contato > 8 h) · `erro` (agente avisou que não lê o banco do PEC).
Como a origem é consultada periodicamente, a tela diz **"Atualização automática a cada 4 h"** —
nunca "tempo real".

## 6. O que o município precisa disponibilizar

1. **Autorização institucional** da Secretaria Municipal de Saúde (finalidade: gestão dos ACS;
   dados agregados; papéis de controlador/operador; retenção; plano de interrupção).
2. **Acesso ao servidor do PEC** (quem administra o servidor) para:
   a. atualizar a pasta `pec_sync_agent/` com esta versão;
   b. rodar `python diagnostico_acs.py --pec-versao 5.5.28` (só lê o catálogo do banco — nenhuma
      linha de dados — e envia os nomes das tabelas/colunas ao ERSUS360);
   c. depois do diagnóstico, executar os `GRANT SELECT` por coluna que forem indicados para as
      tabelas de cadastro e visita (a lista sai do diagnóstico, não de suposição).
3. **Homologação**: conferir os números do primeiro lote com os relatórios do PEC
   (Relatórios › Produção › Visita domiciliar e territorial; Relatórios › Cadastro) antes de
   divulgar o painel.

## 7. Próximas fases

- Fase 3: com o esquema confirmado, implementar no agente a extração do lote ACS (consultas
  só nas colunas confirmadas) e o `heartbeat`.
- Fase 4: ligar Calendário ao planejamento do ERSUS360 (distinto do registrado no PEC).
- Fase 5–7: monitoramento no painel do administrador-geral, reconciliação com o PEC,
  homologação com a SMS.

## 8. Testes

`backend/tests/test_pec_agente.py` (obrigatórios no CI): contrato recusa dado pessoal e CPF/CNS
como identificador; chave inválida/rejeitada e registrada; chave de um município não vale para
outro; idempotência; estados da integração; painel sem lote não mostra números; lote de um
município não aparece para outro; cadastro não conta como visita.
