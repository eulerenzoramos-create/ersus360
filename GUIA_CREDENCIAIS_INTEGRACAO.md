# Guia de Configuração — Credenciais de Integração ERSUS 360
## FMS Apuí/AM · IBGE 1300144

> Adicione todas as variáveis no painel Railway:
> **Railway → seu projeto → Variables → New Variable**

---

## 1. Portal da Transparência (FNS — repasses SUS)

**Variável:** `TRANSPARENCIA_API_KEY`

**Como obter:**
1. Acesse https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email
2. Informe seu e-mail e clique em **Cadastrar**
3. Você receberá a chave por e-mail em até 1 dia útil
4. Cole a chave como valor de `TRANSPARENCIA_API_KEY` no Railway

**Custo:** Gratuito · **Prazo:** Imediato a 24h

---

## 2. e-Gestor Atenção Básica (ESF, SCNES, SISAB)

**Variáveis:** `EGESTOR_USUARIO` · `EGESTOR_SENHA` · `EGESTOR_TOKEN`

**Como obter:**
1. Acesse https://egestorab.saude.gov.br
2. Faça login com sua conta **gov.br** (perfil: Gestor Municipal de Saúde)
3. Vá em **Acesso à API → Gerar Token**
4. O token gerado é o valor de `EGESTOR_TOKEN`
5. Configure também `EGESTOR_USUARIO` (seu CPF) e `EGESTOR_SENHA` (senha gov.br)

**Pré-requisito:** Conta gov.br com vínculo ao CNES 2206406 (SMS Apuí)

> **Alternativa mais simples:** Use apenas `EGESTOR_TOKEN` — o sistema já está programado para autenticar só com o token.

---

## 3. RNDS / e-SUS PEC (atendimentos, vacinação, prescrições)

**Variáveis:** `RNDS_CLIENT_ID` · `RNDS_CLIENT_SECRET` · `RNDS_CERT_B64` · `RNDS_CERT_PASSWORD`

**Como obter:**
1. Acesse https://ehr.saude.gov.br
2. Faça login com certificado ICP-Brasil (e-CPF A3 ou e-CNPJ do município)
3. Vá em **Gerenciar Aplicações → Novo Aplicativo**
4. Informe nome "ERSUS360" e URL de callback do Railway
5. Você recebe `client_id` e `client_secret`

**Para o certificado (RNDS_CERT_B64 e RNDS_CERT_PASSWORD):**
```bash
# Converta seu .pfx para base64 (execute no terminal):
base64 -i seu_certificado.pfx | tr -d '\n'
```
Cole o resultado em `RNDS_CERT_B64` e a senha do .pfx em `RNDS_CERT_PASSWORD`

**Pré-requisito:** Certificado ICP-Brasil do município (e-CNPJ da Prefeitura/FMS)

> **Nota:** Esta é a integração mais complexa. Sem o certificado ICP-Brasil, o sistema usa os dados de fallback (dados reais de Apuí/AM) sem interrupção.

---

## 4. SIAPS / HORUS (assistência farmacêutica)

**Variável:** `SIAPS_TOKEN`

**Como obter:**
1. Acesse https://horus.saude.gov.br
2. Faça login com usuário DATASUS (cadastrado pela COSEMS/AM)
3. Vá em **Configurações → Integrações → Gerar Token de API**
4. Cole o token como valor de `SIAPS_TOKEN`

**Pré-requisito:** Usuário HORUS ativo para o município (solicite à COSEMS-AM se não tiver)

---

## Resumo — ordem recomendada de configuração

| Prioridade | Sistema | Variável | Dificuldade |
|---|---|---|---|
| 1º | Portal Transparência | `TRANSPARENCIA_API_KEY` | ⭐ Fácil — só e-mail |
| 2º | e-Gestor AB | `EGESTOR_TOKEN` | ⭐⭐ Médio — gov.br |
| 3º | SIAPS/HORUS | `SIAPS_TOKEN` | ⭐⭐ Médio — DATASUS |
| 4º | RNDS/e-SUS PEC | 4 variáveis | ⭐⭐⭐ Complexo — certificado ICP |

**Enquanto não configuradas:** O sistema opera normalmente com dados estáticos reais de Apuí/AM (fallback).

---

## Como adicionar no Railway

```
1. Acesse: https://railway.app → seu projeto ersus360
2. Clique em: Variables (menu lateral)
3. Para cada variável: New Variable → Nome → Valor → Add
4. Após adicionar todas: Deploy → o backend reinicia automaticamente
```
