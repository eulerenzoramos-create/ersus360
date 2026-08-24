@echo off
:: ERSUS360 Sync Agent — Configurador para Windows
:: Executar como Administrador no servidor do PEC

echo ================================================
echo  ERSUS360 Sync Agent — Instalacao
echo  Apui/AM - IBGE 1300144
echo ================================================
echo.

:: Verifica Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado.
    echo Baixe em: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python encontrado.

:: Instala dependencias
echo.
echo Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

:: Solicita configuracoes
echo.
echo ================================================
echo  CONFIGURACAO DO BANCO DO PEC
echo ================================================
set /p PEC_DB_HOST=Host do PostgreSQL do PEC [localhost]:
if "%PEC_DB_HOST%"=="" set PEC_DB_HOST=localhost

set /p PEC_DB_PORT=Porta do PostgreSQL [5432]:
if "%PEC_DB_PORT%"=="" set PEC_DB_PORT=5432

set /p PEC_DB_NAME=Nome do banco [esus]:
if "%PEC_DB_NAME%"=="" set PEC_DB_NAME=esus

set /p PEC_DB_USER=Usuario PostgreSQL [esus]:
if "%PEC_DB_USER%"=="" set PEC_DB_USER=esus

set /p PEC_DB_PASS=Senha PostgreSQL:

echo.
echo ================================================
echo  CHAVE ERSUS360
echo  (copiar do painel ERSUS360 > Configuracoes > Sync)
echo ================================================
set /p ERSUS_SYNC_KEY=Chave de sincronizacao ERSUS360:

:: Cria arquivo .env
echo PEC_DB_HOST=%PEC_DB_HOST%> .env
echo PEC_DB_PORT=%PEC_DB_PORT%>> .env
echo PEC_DB_NAME=%PEC_DB_NAME%>> .env
echo PEC_DB_USER=%PEC_DB_USER%>> .env
echo PEC_DB_PASS=%PEC_DB_PASS%>> .env
echo ERSUS_SYNC_KEY=%ERSUS_SYNC_KEY%>> .env

echo.
echo [OK] Configuracao salva em .env
echo.
echo ================================================
echo  CRIANDO TAREFA AGENDADA (a cada 4 horas)
echo ================================================
set SCRIPT_DIR=%~dp0
schtasks /create /tn "ERSUS360_PEC_Sync" /tr "python \"%SCRIPT_DIR%pec_sync.py\"" /sc hourly /mo 4 /ru SYSTEM /f
if errorlevel 1 (
    echo [AVISO] Nao foi possivel criar tarefa agendada automaticamente.
    echo Execute manualmente: python pec_sync.py
) else (
    echo [OK] Tarefa agendada criada: executa a cada 4 horas.
)

echo.
echo ================================================
echo  TESTANDO CONEXAO AGORA...
echo ================================================
python pec_sync.py
echo.
echo Instalacao concluida!
pause
