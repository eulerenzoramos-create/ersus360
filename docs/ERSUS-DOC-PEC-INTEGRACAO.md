# DOC-PEC-INTEGRACAO — Integração PEC e-SUS APS (Mapa de Visitas Domiciliares ACS)

Complementa [DOC-012](ERSUS-DOC-012-Cadastros-Mestres.md) (Cadastros Mestres),
[DOC-015](ERSUS-DOC-015-Atencao-Primaria.md) (APS), [DOC-024](ERSUS-DOC-024-App-Mobile-ACS.md)
(App Mobile ACS) e [DOC-026](ERSUS-DOC-026-Compliance-SUS.md) (LGPD). Este documento é o
diagnóstico técnico e o plano de homologação da Fase 1 — Fundação de Dados + Configuração.

## 1. Objetivo

Vincular o ERSUS 360 ao PEC e-SUS APS como camada complementar de monitoramento
operacional, mapa territorial e gestão de visitas domiciliares dos ACS — sem nunca
substituir o PEC como fonte oficial de cadastro, sem escrever diretamente no banco do
PEC, e sem inventar endpoints. Produção oficial trafega exclusivamente pelo padrão
LEDI APS / API oficial do PEC (Nota Técnica nº 32/2026 — MS), quando disponível e
configurada.

## 2. Estado no início desta fase (diagnóstico)

- **Nenhuma instalação real do PEC estava conectada.** `ESUS_URL` apontava para uma URL
  nunca validada; o próprio `frontend/src/pages/GapAnalysisAPS.tsx` já documentava o
  eSUS PEC como `"não_iniciado"`.
- **Dois clientes e-SUS PEC divergentes e não integrados** já existiam no projeto:
  `backend/services/esus_pec.py` (OAuth2/REST) e `backend/services/esus_service.py`
  (GraphQL) — nenhum validado contra uma instalação real. Ambos permanecem intocados
  nesta fase; a nova camada (`backend/services/pec/`) não os substitui ainda.
- **Nenhum modelo de banco de dados existia** para ACS, cidadão, domicílio, microárea,
  visita, equipe ou profissional — tudo era lista Python em memória dentro dos routers
  (`acs.py`, `cadastros.py`, `scnes_conformidade.py`). Essa era a lacuna arquitetural
  mais crítica e o foco desta fase.
- **`DOC-008` afirma "e-SUS PEC — ✅ Produção"**, o que é impreciso — nenhuma chamada
  real jamais teve sucesso confirmado; recomenda-se corrigir esse status em uma
  próxima revisão do DOC-008.

## 3. O que foi implementado nesta fase

| Item | Arquivo |
|---|---|
| Variáveis de ambiente PEC/LEDI/MIVDT | `backend/config.py`, `.env.example` |
| Cache local de cadastros oficiais (Equipe, Profissional, Microárea, Domicílio, Cidadão) | `backend/models/pec_cadastro.py` |
| Visita domiciliar operacional + fila de transmissão LEDI | `backend/models/visita_domiciliar.py` |
| Pseudonimização de CNS/CPF (hash + máscara, nunca texto puro) | `backend/services/pec/pseudonimizacao.py` |
| Teste de conexão real (nunca fabrica sucesso) | `backend/services/pec/connection.py` |
| Sincronização de cadastros (upsert sem duplicidade por `pec_reference_id`) | `backend/services/pec/cadastros.py` |
| Consulta de visitas processadas pelo PEC | `backend/services/pec/visitas.py` |
| Construção do payload MIVDT | `backend/services/pec/mivdt.py` |
| Envelope LEDI + transmissão + status de processamento | `backend/services/pec/transmissao.py` |
| Auditoria (reaproveita `AuditLog` existente) | `backend/services/pec/auditoria.py` |
| Testes automatizados (14 casos, todos verdes) | `backend/tests/` |

Nenhum router novo foi criado e nenhum endpoint existente foi alterado nesta fase —
o sistema em produção continua funcionando exatamente como antes.

### Variáveis de ambiente

```
PEC_BASE_URL=              # ex.: https://esus.apui.am.gov.br
PEC_API_URL=                # endpoint da API LEDI, se distinto do base_url
PEC_CLIENT_ID=
PEC_CLIENT_SECRET=
PEC_CERTIFICATE_PATH=       # se a instalação exigir mTLS
PEC_CERTIFICATE_PASSWORD=
PEC_ESTABLISHMENT_CNES=     # CNES do estabelecimento vinculado
PEC_REQUEST_TIMEOUT=30
PEC_ENVIRONMENT=homologacao # homologacao | producao
LEDI_VERSION=                # versão do LEDI validada com o administrador do PEC
MIVDT_VERSION=                # versão do MIVDT validada com o administrador do PEC
ESUS_INTEGRATION_ENABLED=false
```

Enquanto `ESUS_INTEGRATION_ENABLED=false` (padrão), **nenhum serviço em
`backend/services/pec/` faz qualquer chamada de rede** — todos retornam um estado
explícito de "não configurado", nunca um sucesso ou dado simulado disfarçado de real.

## 4. O que falta para ativar a integração real

1. Confirmar com o administrador do PEC de Apuí/AM: versão instalada, se é ≥ 5.3.19
   (mínimo citado na Nota Técnica nº 32/2026), se expõe HTTPS publicamente ou apenas
   via VPN local (o Gap Analysis existente indica VPN local — isso pode inviabilizar
   acesso direto do Railway e exigir um gateway/túnel).
2. Obter credenciais reais (`PEC_CLIENT_ID`/`PEC_CLIENT_SECRET`) geradas pelo
   administrador do PEC.
3. Obter a documentação técnica oficial da API LEDI desta instalação — os caminhos de
   endpoint usados em `connection.py`/`transmissao.py` (`/oauth/token`,
   `/ledi/visita-domiciliar`, `/ledi/status/{protocolo}`) são placeholders plausíveis,
   **não confirmados**, e devem ser corrigidos contra a documentação real antes de
   qualquer teste em homologação.
4. Validar a estrutura de campos do MIVDT vigente contra o Manual oficial do MS — o
   `MivdtVisitaPayload` em `services/pec/mivdt.py` foi montado a partir dos campos
   citados no diagnóstico, não da especificação oficial (não disponível neste projeto).
5. Implementar de fato `fetch_from_pec()` nos 5 serviços de cadastro e no
   `PecVisitService` — hoje eles levantam `NotImplementedError` propositalmente,
   porque não há como validar o formato de resposta sem acesso à instalação real.
6. Testar em `PEC_ENVIRONMENT=homologacao` antes de qualquer uso em produção.

## 5. Achados fora do escopo desta fase (pendentes, não corrigidos aqui)

- `backend/routers/rnds_gateway.py::POST /testar-conexao` retorna
  `"Conexão RNDS estabelecida com sucesso (mTLS OK)"` **sem fazer nenhuma chamada de
  rede** — um sucesso fabricado, exatamente o padrão que `PecConnectionService`
  (item 3 desta fase) foi desenhado para nunca reproduzir. Recomenda-se corrigir em
  uma tarefa separada.
- `backend/routers/cadastros.py:243` referencia `settings.MUNICIPIO_IBGE`, que não
  existe em `config.py` (`FNS_MUNICIPIO_IBGE` é o nome real) — bug latente que lançaria
  `AttributeError` em runtime.

## 6. Próximas fases sugeridas (não implementadas ainda)

- Tela administrativa "Configurações → Integrações → PEC e-SUS APS" consumindo
  `PecConnectionService` e os demais serviços em modo homologação.
- Endpoints REST (`/api/integracao-pec/...`) expondo os serviços desta camada aos
  routers existentes, sem duplicar `acs.py`.
- Página "ACS → Mapa de Visitas Domiciliares" com a legenda de status pedida.
- App móvel/PWA do ACS (hoje só planejado em DOC-024, sem endpoints `/api/mobile/*`).
