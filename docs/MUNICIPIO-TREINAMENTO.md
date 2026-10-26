# Município de Treinamento — PEC de treinamento do Ministério → ERSUS360

Objetivo: treinar o uso do ERSUS360 com os dados **fictícios** do e-SUS APS PEC de treinamento
(padrão do Ministério da Saúde, credenciado no DF), sem que nada chegue a Apuí ou a qualquer
município real.

| Item | Valor |
|---|---|
| Nome no ERSUS360 | `MUNICÍPIO TREINAMENTO (PEC MS)` |
| UF | `DF` |
| Código (7 dígitos) | `5399999`: não existe no IBGE (o único município do DF é 5300108) |
| Quem entra | só o administrador-geral, por "Trocar município" |
| Constante no código | `IBGE_TREINAMENTO` em `backend/tenancy/contexto.py` e `frontend/src/lib/municipio.ts` |

Em todas as telas desse município aparece a faixa amarela **"TREINAMENTO — dados fictícios do PEC
de treinamento do Ministério da Saúde (DF)"**.

## O que já funciona

- Município isolado como qualquer outro (multi-município): nada dele aparece em Apuí, e nada
  de Apuí aparece nele.
- O agente local, em modo treinamento, envia o **sinal de vida**, que fica registrado no
  município de treinamento (`/api/pec-agente/situacao`).
- O **Painel ACS** (`/acs/painel`, `/api/acs/*`) é liberado para todos os municípios: cada um vê
  só o próprio lote do agente. No município de treinamento, ele mostra "Conectado" depois do
  primeiro sinal de vida, e números só quando chegar um lote ACS.
- O lote do Painel ACS (`/api/pec-agente/acs`) é aceito para o município de treinamento
  quando o agente passar a extraí-lo. A extração do lote ainda não existe no agente (é a Fase 3
  de `DOC-PEC-ACS-INTEGRACAO.md`), e o PEC de treinamento é o lugar certo para desenvolvê-la.
- A prévia de indicadores (`/api/pec/sync`) continua só para Apuí. No modo treinamento o
  agente **não** a envia.

## Travas de segurança

1. O agente só envia para `5399999` com `PEC_TREINAMENTO=1`, e com `PEC_TREINAMENTO=1` só envia
   para `5399999`. Qualquer outra combinação para o agente antes de conectar.
2. Cada município tem a própria chave (`ERSUS_SYNC_KEY_{código}`): a chave do treinamento não
   vale para Apuí, e a de Apuí não vale para o treinamento.
3. `/api/pec/sync` (prévia de indicadores) recusa qualquer código que não seja Apuí.
4. Testes: `backend/tests/test_municipio_treinamento.py`.

## Passo a passo (ações nas contas são suas)

### 1. Criar o município no ERSUS360
Painel do administrador-geral → Municípios → Novo:
- Nome `MUNICÍPIO TREINAMENTO (PEC MS)`, UF `DF`, código IBGE `5399999`, situação **ativo**.

Não use "Importar IBGE" para isso: esse código não existe no IBGE de propósito.

### 2. Chave do agente no Railway
Gere uma chave longa e aleatória (por exemplo, no PowerShell:
`[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))`) e cadastre no Railway →
ersus360 → Variáveis:
- `ERSUS_SYNC_KEY_5399999` = a chave gerada.

Ela é diferente da chave de Apuí (`ERSUS_SYNC_KEY`). Nunca reutilize.

### 3. Usuário somente leitura no PostgreSQL do PEC de treinamento
O PEC de treinamento deste computador usa o PostgreSQL do e-SUS na porta **5433**. Como
superusuário do banco, rode `pec_sync_agent/criar_usuario_somente_leitura.sql` e defina a
senha do usuário `ersus_sync` direto no `psql` (`\password ersus_sync`). A senha não vai para
arquivo versionado.

### 4. Configurar o agente em modo treinamento
Numa pasta própria para o treinamento (uma cópia de `pec_sync_agent/`, separada da do PEC de
produção), crie o arquivo `.env`:

```
PEC_TREINAMENTO=1
ERSUS_IBGE=5399999
PEC_DB_HOST=localhost
PEC_DB_PORT=5433
PEC_DB_NAME=esus
PEC_DB_USER=ersus_sync
PEC_DB_PASS=<senha do ersus_sync>
ERSUS_SYNC_KEY=<a mesma chave cadastrada em ERSUS_SYNC_KEY_5399999>
```

O `.env` fica só nesse computador e nunca vai para o Git.

### 5. Rodar
```
python pec_sync.py --test
python pec_sync.py --once
```
O log mostra `município=5399999 (TREINAMENTO — dados fictícios)` e "✓ Sinal de vida enviado".
No ERSUS360, entre no município de treinamento (Trocar município): a faixa amarela de
TREINAMENTO aparece em todas as telas, e o Painel ACS mostra o agente "Conectado".
