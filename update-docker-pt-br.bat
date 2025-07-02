@echo off
echo 🇧🇷 Agent Zero - Atualizando Docker com Traduções PT-BR
echo ========================================================

set IMAGE_NAME=agent-zero-pt-br
set CONTAINER_NAME=agent-zero-translated
set TAG=latest
set BRANCH=%1
if "%BRANCH%"=="" set BRANCH=main

echo 📋 Configurações:
echo    - Imagem: %IMAGE_NAME%:%TAG%
echo    - Container: %CONTAINER_NAME%
echo    - Branch: %BRANCH%
echo.

echo 🔍 Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado. Instale o Docker primeiro.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose não encontrado. Instale o Docker Compose primeiro.
    pause
    exit /b 1
)

echo ✅ Docker está funcionando

echo 📂 Navegando para diretório docker/run...
cd /d "%~dp0docker\run"

echo 🛑 Parando containers existentes...
docker-compose down 2>nul

echo 🗑️ Removendo imagem antiga...
docker rmi %IMAGE_NAME%:%TAG% 2>nul

echo 🔨 Construindo nova imagem com traduções...
for /f "tokens=1-3 delims=/: " %%a in ('date /t') do set CACHE_DATE=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set CACHE_TIME=%%a:%%b
set CACHE_DATETIME=%CACHE_DATE%:%CACHE_TIME%

docker build -t %IMAGE_NAME%:%TAG% --build-arg BRANCH=%BRANCH% --build-arg CACHE_DATE="%CACHE_DATETIME%" .
if errorlevel 1 (
    echo ❌ Falha ao construir a imagem
    pause
    exit /b 1
)

echo ✅ Imagem construída com sucesso!

echo 📝 Criando docker-compose.yml personalizado...
(
echo version: '3.8'
echo services:
echo   agent-zero:
echo     container_name: %CONTAINER_NAME%
echo     image: %IMAGE_NAME%:%TAG%
echo     volumes:
echo       - ./agent-zero:/a0
echo     ports:
echo       - "50080:80"
echo     environment:
echo       - LANG=pt_BR.UTF-8
echo       - LC_ALL=pt_BR.UTF-8
echo     restart: unless-stopped
) > docker-compose-translated.yml

echo 🚀 Iniciando container traduzido...
docker-compose -f docker-compose-translated.yml up -d
if errorlevel 1 (
    echo ❌ Falha ao iniciar container
    pause
    exit /b 1
)

echo ✅ Container iniciado com sucesso!

echo ⏳ Aguardando inicialização...
timeout /t 10 /nobreak >nul

echo 🔍 Verificando status do container...
docker ps | findstr %CONTAINER_NAME% >nul
if errorlevel 1 (
    echo ❌ Container não está executando. Verificando logs...
    docker-compose -f docker-compose-translated.yml logs
    pause
    exit /b 1
)

echo.
echo 🎉 Sucesso! Agent Zero com tradução PT-BR está funcionando!
echo.
echo 📱 Acesse: http://localhost:50080
echo 📋 Container: %CONTAINER_NAME%
echo 🐳 Imagem: %IMAGE_NAME%:%TAG%
echo.
echo 📊 Para ver os logs:
echo    docker-compose -f docker-compose-translated.yml logs -f
echo.
echo 🛑 Para parar:
echo    docker-compose -f docker-compose-translated.yml down
echo.
pause
