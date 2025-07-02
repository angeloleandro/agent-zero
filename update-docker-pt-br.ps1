# Agent Zero - Script de Atualização Docker com Traduções PT-BR (PowerShell)
# Este script automatiza o processo de build e deploy da versão traduzida

param(
    [string]$Branch = "main"
)

# Configurar tratamento de erro
$ErrorActionPreference = "Stop"

Write-Host "🇧🇷 Agent Zero - Atualizando Docker com Traduções PT-BR" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# Definir variáveis
$ImageName = "agent-zero-pt-br"
$ContainerName = "agent-zero-translated"
$Tag = "latest"

Write-Host "📋 Configurações:" -ForegroundColor Cyan
Write-Host "   - Imagem: $ImageName`:$Tag" -ForegroundColor White
Write-Host "   - Container: $ContainerName" -ForegroundColor White
Write-Host "   - Branch: $Branch" -ForegroundColor White
Write-Host ""

# Verificar se Docker está funcionando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✅ Docker está funcionando" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker ou Docker Compose não encontrado. Instale primeiro." -ForegroundColor Red
    exit 1
}

# Navegar para o diretório docker/run
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerPath = Join-Path $ScriptPath "docker\run"
Set-Location $DockerPath

Write-Host "📂 Navegando para: $(Get-Location)" -ForegroundColor Cyan

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
try {
    docker-compose down 2>$null
}
catch {
    # Ignorar erro se não houver containers
}

# Remover imagem antiga se existir
Write-Host "🗑️  Removendo imagem antiga..." -ForegroundColor Yellow
try {
    docker rmi "$ImageName`:$Tag" 2>$null
}
catch {
    # Ignorar erro se a imagem não existir
}

# Construir nova imagem
Write-Host "🔨 Construindo nova imagem com traduções..." -ForegroundColor Yellow
$CacheDate = Get-Date -Format "yyyy-MM-dd:HH:mm:ss"

try {
    docker build -t "$ImageName`:$Tag" --build-arg BRANCH=$Branch --build-arg CACHE_DATE=$CacheDate .
    Write-Host "✅ Imagem construída com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Falha ao construir a imagem" -ForegroundColor Red
    exit 1
}

# Criar docker-compose.yml personalizado
Write-Host "📝 Criando docker-compose.yml personalizado..." -ForegroundColor Yellow
$DockerComposeContent = @"
version: '3.8'
services:
  agent-zero:
    container_name: $ContainerName
    image: $ImageName`:$Tag
    volumes:
      - ./agent-zero:/a0
    ports:
      - "50080:80"
    environment:
      - LANG=pt_BR.UTF-8
      - LC_ALL=pt_BR.UTF-8
    restart: unless-stopped
"@

$DockerComposeContent | Out-File -FilePath "docker-compose-translated.yml" -Encoding UTF8

# Iniciar o container
Write-Host "🚀 Iniciando container traduzido..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose-translated.yml up -d
    Write-Host "✅ Container iniciado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Falha ao iniciar container" -ForegroundColor Red
    exit 1
}

# Aguardar um pouco para o container inicializar
Write-Host "⏳ Aguardando inicialização..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar se está funcionando
Write-Host "🔍 Verificando status do container..." -ForegroundColor Yellow
$ContainerStatus = docker ps --filter "name=$ContainerName" --format "table {{.Names}}"

if ($ContainerStatus -match $ContainerName) {
    Write-Host "✅ Container está executando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Sucesso! Agent Zero com tradução PT-BR está funcionando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Acesse: http://localhost:50080" -ForegroundColor Cyan
    Write-Host "📋 Container: $ContainerName" -ForegroundColor White
    Write-Host "🐳 Imagem: $ImageName`:$Tag" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Para ver os logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose-translated.yml logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Para parar:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose-translated.yml down" -ForegroundColor White
}
else {
    Write-Host "❌ Container não está executando. Verificando logs..." -ForegroundColor Red
    docker-compose -f docker-compose-translated.yml logs
    exit 1
}
