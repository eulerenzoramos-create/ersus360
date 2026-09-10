# ERSUS360 — Agente PEC Local

Script que roda **no servidor do e-SUS PEC de Apuí**, calcula todos os indicadores de qualidade APS a partir do banco PostgreSQL local e envia automaticamente para o Railway (ERSUS360 online).

## Indicadores calculados

| Código | Descrição | Equipe |
|--------|-----------|--------|
| C1–C7  | Componente Qualidade eSF/eAP | eSF / eAP |
| B1–B6  | Componente Qualidade eSB | Saúde Bucal |
| M1–M2  | Componente Qualidade eMulti | Multiprofissional |
| R1–R6  | Componente Qualidade eSFR | Ribeirinha |
| CR1–CR4 | Indicadores eCR | Consultório na Rua |
| P1     | Indicador eAPP | Atenção Prisional |
| ACS_visitas / ACS_familias | Visitas domiciliares ACS | eSF/eSFR |

## Pré-requisitos

- Python 3.8+
- Acesso à rede local onde roda o PostgreSQL do e-SUS PEC
- Chave `ERSUS_SYNC_KEY` (copie do Railway → Variables)

## Instalação

### Windows (no servidor do PEC)

1. Copie a pasta `agente_pec/` para o servidor do PEC
2. Edite `.env.exemplo` → salve como `.env` com suas credenciais
3. Execute como Administrador:
   ```
   instalar_windows.bat
   ```

### Linux/Ubuntu

1. Copie a pasta `agente_pec/` para o servidor
2. Edite `.env.exemplo` → salve como `.env`
3. Execute:
   ```bash
   chmod +x instalar_linux.sh
   ./instalar_linux.sh
   ```

## Configuração (.env)

```env
PEC_DB_HOST=localhost        # IP do servidor PostgreSQL do PEC
PEC_DB_PORT=5432
PEC_DB_NAME=esus             # nome do banco (geralmente 'esus')
PEC_DB_USER=esus
PEC_DB_PASS=SENHA_DO_BANCO

RAILWAY_URL=https://ersus360-production.up.railway.app
ERSUS_SYNC_KEY=CHAVE_DO_RAILWAY   # Railway → Variables → ERSUS_SYNC_KEY
```

## Execução manual

```bash
# Calcular e enviar competência atual
python agente_pec.py

# Competência específica
python agente_pec.py --competencia 2026-05

# Só calcular, sem enviar
python agente_pec.py --apenas-calcular

# Usar .env em local diferente
python agente_pec.py --env /etc/ersus360/.env
```

## Funcionamento

```
Banco PEC (local) → agente_pec.py → Railway /api/pec/sync → ERSUS360 online
```

Após o envio bem-sucedido, a aba **Componente Qualidade** do ERSUS360 exibe os dados reais calculados pelo agente, com a fonte indicando **"e-SUS PEC"** em vez de "SIAPS · Ref. municipal".

## Log

O arquivo `agente_pec.log` registra cada execução com timestamps. Em caso de erro de conexão ou cálculo, o log mostra o detalhe da falha.

## Frequência recomendada

- **Diária às 00:00** — configurada automaticamente pelo instalador
- Para dados mais frequentes, altere o crontab/Agendador de Tarefas para a hora desejada
