# 🇧🇷 Agent Zero PT-BR - Comandos Rápidos Docker

## 🚀 Executar Atualização Completa

### Windows:
```batch
# Opção 1: Script Batch
update-docker-pt-br.bat

# Opção 2: PowerShell
PowerShell -ExecutionPolicy Bypass -File update-docker-pt-br.ps1
```

### Linux/Mac:
```bash
./update-docker-pt-br.sh
```

## 📋 Comandos Manuais

### 1. Build da Imagem
```bash
cd docker/run
docker build -t agent-zero-pt-br:latest --build-arg BRANCH=main --no-cache .
```

### 2. Iniciar Container
```bash
docker-compose -f docker-compose-translated.yml up -d
```

### 3. Parar Container
```bash
docker-compose -f docker-compose-translated.yml down
```

### 4. Ver Logs
```bash
docker-compose -f docker-compose-translated.yml logs -f
```

### 5. Reiniciar
```bash
docker-compose -f docker-compose-translated.yml restart
```

### 6. Status
```bash
docker ps
docker-compose -f docker-compose-translated.yml ps
```

## 🛠️ Comandos de Manutenção

### Limpar tudo:
```bash
docker-compose -f docker-compose-translated.yml down --volumes --remove-orphans
docker rmi agent-zero-pt-br:latest
docker system prune -a
```

### Debug no container:
```bash
docker exec -it agent-zero-translated bash
```

### Verificar arquivos traduzidos:
```bash
docker exec -it agent-zero-translated ls -la /a0/webui/
docker exec -it agent-zero-translated cat /a0/webui/index.html | grep -i "português\|mensagem\|configurações"
```

## 🌐 URLs de Acesso

- **Interface Principal:** http://localhost:50080
- **API Health Check:** http://localhost:50080/health
- **Arquivos Estáticos:** http://localhost:50080/public/

## 🔧 Personalização Rápida

### Alterar porta para 8080:
```bash
sed -i 's/50080:80/8080:80/g' docker-compose-translated.yml
```

### Adicionar variável de ambiente:
```yaml
environment:
  - LANG=pt_BR.UTF-8
  - LC_ALL=pt_BR.UTF-8
  - TZ=America/Sao_Paulo
  - DEBUG=true
```

## 📊 Monitoramento

### Verificar uso de recursos:
```bash
docker stats agent-zero-translated
```

### Verificar logs de erro:
```bash
docker-compose -f docker-compose-translated.yml logs | grep -i error
```

### Backup do volume:
```bash
docker run --rm -v agent-zero_data:/data -v $(pwd):/backup alpine tar czf /backup/agent-zero-backup.tar.gz /data
```
