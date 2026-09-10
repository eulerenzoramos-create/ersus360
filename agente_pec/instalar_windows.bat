@echo off
chcp 65001 >nul
echo ============================================================
echo   ERSUS360 — Instalação do Agente PEC  (Windows)
echo ============================================================
echo.

REM ── Verificar Python ──────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python não encontrado.
    echo Baixe em: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM ── Instalar dependências ─────────────────────────────────────
echo [1/4] Instalando dependências Python...
pip install psycopg2-binary requests --quiet
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependências.
    pause
    exit /b 1
)
echo      OK

REM ── Criar arquivo .env se não existir ────────────────────────
if not exist "%~dp0.env" (
    echo [2/4] Criando arquivo .env...
    copy "%~dp0.env.exemplo" "%~dp0.env" >nul
    echo      ATENÇÃO: Edite o arquivo .env com suas credenciais!
    echo      Abra: %~dp0.env
) else (
    echo [2/4] Arquivo .env já existe — mantido.
)

REM ── Testar conexão ────────────────────────────────────────────
echo [3/4] Testando cálculo (sem envio ao Railway)...
python "%~dp0agente_pec.py" --apenas-calcular
if errorlevel 1 (
    echo.
    echo ATENÇÃO: O cálculo falhou. Verifique as credenciais no .env
    echo Dica: edite %~dp0.env e defina PEC_DB_PASS corretamente.
    pause
    exit /b 1
)

REM ── Criar tarefa agendada (Agendador de Tarefas Windows) ──────
echo [4/4] Criando tarefa agendada (toda meia-noite)...
set TAREFA=ERSUS360_AgentePEC
set SCRIPT="%~dp0agente_pec.py"

schtasks /query /tn "%TAREFA%" >nul 2>&1
if not errorlevel 1 (
    schtasks /delete /tn "%TAREFA%" /f >nul
)

schtasks /create ^
  /tn "%TAREFA%" ^
  /tr "python %SCRIPT%" ^
  /sc DAILY ^
  /st 00:00 ^
  /ru SYSTEM ^
  /f >nul

if errorlevel 1 (
    echo AVISO: Não foi possível criar tarefa agendada.
    echo Execute manualmente como Administrador.
) else (
    echo      Tarefa criada: %TAREFA%  (executa diariamente às 00:00)
)

echo.
echo ============================================================
echo   Instalação concluída!
echo.
echo   Para executar manualmente:
echo     python "%~dp0agente_pec.py"
echo.
echo   Para executar sem enviar ao Railway:
echo     python "%~dp0agente_pec.py" --apenas-calcular
echo.
echo   Log de execução:
echo     %~dp0agente_pec.log
echo ============================================================
pause
