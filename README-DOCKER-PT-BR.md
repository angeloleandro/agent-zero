# 🇧🇷 Agent Zero - Docker com Tradução PT-BR

Este guia explica como atualizar e executar o Agent Zero com interface totalmente traduzida para português brasileiro usando Docker.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Git (para clonar o repositório)

## 🚀 Início Rápido

### Opção 1: Script Automatizado (Recomendado)

#### Windows (PowerShell):
```powershell
# Execute como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\update-docker-pt-br.ps1
```

#### Linux/Mac (Bash):
```bash
# Dar permissão de execução
chmod +x update-docker-pt-br.sh

# Executar
./update-docker-pt-br.sh
```

### Opção 2: Manual

1. **Parar containers existentes:**
   ```bash
   cd docker/run
   docker-compose down
   ```

2. **Construir imagem com traduções:**
   ```bash
   docker build -t agent-zero-pt-br:latest --build-arg BRANCH=main --no-cache .
   ```

3. **Criar docker-compose personalizado:**
   ```bash
   cp docker-compose.yml docker-compose-translated.yml
   # Edite docker-compose-translated.yml para usar agent-zero-pt-br:latest
   ```

4. **Iniciar o container:**
   ```bash
   docker-compose -f docker-compose-translated.yml up -d
   ```

## 🌐 Acesso

Após a inicialização, acesse:
- **URL:** http://localhost:50080
- **Interface:** Completamente em português brasileiro

## 📁 Estrutura de Arquivos Traduzidos

```
webui/
├── index.html                     ✅ Traduzido
├── js/
│   ├── tunnel.js                 ✅ Traduzido
│   ├── settings.js               ✅ Traduzido
│   ├── messages.js               ✅ Traduzido
│   ├── history.js                ✅ Traduzido
│   ├── file_browser.js           ✅ Traduzido
│   ├── speech.js                 ✅ Traduzido
│   ├── scheduler.js              ✅ Traduzido
│   └── image_modal.js            ✅ Traduzido
└── components/
    └── settings/                 ✅ Totalmente traduzido
```

## 🛠️ Funcionalidades Traduzidas

- ✅ Interface principal do chat
- ✅ Sistema de configurações completo
- ✅ Agendador de tarefas
- ✅ Navegador de arquivos
- ✅ Sistema de backup/restauração
- ✅ Configurações MCP
- ✅ Funcionalidade de túnel
- ✅ Sistema de fala (Speech-to-Text)
- ✅ Upload e gerenciamento de arquivos
- ✅ Mensagens de erro e sucesso
- ✅ Tooltips e ajudas contextuais

## 📊 Comandos Úteis

### Verificar status:
```bash
docker ps
docker-compose -f docker-compose-translated.yml ps
```

### Ver logs:
```bash
docker-compose -f docker-compose-translated.yml logs -f
```

### Reiniciar:
```bash
docker-compose -f docker-compose-translated.yml restart
```

### Parar:
```bash
docker-compose -f docker-compose-translated.yml down
```

### Remover tudo:
```bash
docker-compose -f docker-compose-translated.yml down --volumes --remove-orphans
docker rmi agent-zero-pt-br:latest
```

## 🐛 Solução de Problemas

### Interface não está em português:
1. Verifique se a imagem foi construída corretamente
2. Confirme que os arquivos traduzidos estão na imagem:
   ```bash
   docker exec -it agent-zero-translated ls -la /a0/webui/
   ```

### Container não inicia:
1. Verifique os logs:
   ```bash
   docker-compose -f docker-compose-translated.yml logs
   ```
2. Verifique se a porta 50080 está disponível:
   ```bash
   netstat -an | grep 50080
   ```

### Erro de permissão (Linux):
```bash
sudo chown -R $USER:$USER ./agent-zero
```

## 🔧 Personalização

### Alterar porta:
Edite `docker-compose-translated.yml`:
```yaml
ports:
  - "8080:80"  # Muda para porta 8080
```

### Configurar ambiente:
```yaml
environment:
  - LANG=pt_BR.UTF-8
  - LC_ALL=pt_BR.UTF-8
  - TZ=America/Sao_Paulo
```

## 📚 Documentação Adicional

- [Guia de Instalação Original](../docs/installation.md)
- [Documentação Docker](../docs/cuda_docker_setup.md)
- [Guia de Tradução Completo](DOCKER_UPDATE_GUIDE.md)

## 🤝 Contribuição

Encontrou algum texto que não foi traduzido? Abra uma issue ou envie um pull request!

## 📞 Suporte

Para suporte técnico:
1. Verifique os logs do container
2. Consulte a documentação original
3. Abra uma issue no repositório

---

**Nota:** Esta tradução mantém toda a funcionalidade original do Agent Zero, alterando apenas os textos da interface para português brasileiro.
