// Tunnel settings for the Settings modal
document.addEventListener('alpine:init', () => {
    Alpine.data('tunnelSettings', () => ({
        isLoading: false,
        tunnelLink: '',
        linkGenerated: false,
        loadingText: '',

        init() {
            this.checkTunnelStatus();
        },

        async checkTunnelStatus() {
            try {
                const response = await fetchApi('/tunnel_proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'get' }),
                });
                
                const data = await response.json();
                
                if (data.success && data.tunnel_url) {
                    // Update the stored URL if it's different from what we have
                    if (this.tunnelLink !== data.tunnel_url) {
                        this.tunnelLink = data.tunnel_url;
                        localStorage.setItem('agent_zero_tunnel_url', data.tunnel_url);
                    }
                    this.linkGenerated = true;
                } else {
                    // Check if we have a stored tunnel URL
                    const storedTunnelUrl = localStorage.getItem('agent_zero_tunnel_url');
                    
                    if (storedTunnelUrl) {
                        // Use the stored URL but verify it's still valid
                        const verifyResponse = await fetchApi('/tunnel_proxy', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ action: 'verify', url: storedTunnelUrl }),
                        });
                        
                        const verifyData = await verifyResponse.json();
                        
                        if (verifyData.success && verifyData.is_valid) {
                            this.tunnelLink = storedTunnelUrl;
                            this.linkGenerated = true;
                        } else {
                            // Clear stale URL
                            localStorage.removeItem('agent_zero_tunnel_url');
                            this.tunnelLink = '';
                            this.linkGenerated = false;
                        }
                    } else {
                        // No stored URL, show the generate button
                        this.tunnelLink = '';
                        this.linkGenerated = false;
                    }
                }
            } catch (error) {
                console.error('Error checking tunnel status:', error);
                this.tunnelLink = '';
                this.linkGenerated = false;
            }
        },

        async refreshLink() {
            // Call generate but with a confirmation first
            if (confirm("Tem certeza de que deseja gerar uma nova URL de túnel? A URL antiga deixará de funcionar.")) {
                this.isLoading = true;
                this.loadingText = 'Atualizando túnel...';
                
                // Change refresh button appearance
                const refreshButton = document.querySelector('.refresh-link-button');
                const originalContent = refreshButton.innerHTML;
                refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
                refreshButton.disabled = true;
                refreshButton.classList.add('refreshing');
                
                try {
                    // First stop any existing tunnel
                    const stopResponse = await fetchApi('/tunnel_proxy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'stop' }),
                    });
                    
                    // Check if stopping was successful
                    const stopData = await stopResponse.json();
                    if (!stopData.success) {
                        console.warn("Aviso: Não foi possível parar o túnel existente corretamente");
                        // Continue anyway since we want to create a new one
                    }
                    
                    // Then generate a new one
                    await this.generateLink();
                } catch (error) {
                    console.error("Erro ao atualizar o túnel:", error);
                    window.toast("Erro ao atualizar o túnel", "error", 3000);
                    this.isLoading = false;
                    this.loadingText = '';
                } finally {
                    // Reset refresh button
                    refreshButton.innerHTML = originalContent;
                    refreshButton.disabled = false;
                    refreshButton.classList.remove('refreshing');
                }
            }
        },

        async generateLink() {
            // First check if authentication is enabled
            try {
                const authCheckResponse = await fetchApi('/settings_get');
                const authData = await authCheckResponse.json();
                
                // Find the auth_login and auth_password in the settings
                let hasAuth = false;
                
                if (authData && authData.settings && authData.settings.sections) {
                    for (const section of authData.settings.sections) {
                        if (section.fields) {
                            const authLoginField = section.fields.find(field => field.id === 'auth_login');
                            const authPasswordField = section.fields.find(field => field.id === 'auth_password');
                            
                            if (authLoginField && authPasswordField && 
                                authLoginField.value && authPasswordField.value) {
                                hasAuth = true;
                                break;
                            }
                        }
                    }
                }
                
                // If no authentication is set, warn the user
                if (!hasAuth) {
                    const proceed = confirm(
                        "AVISO: Nenhuma autenticação está configurada para sua instância do Agent Zero.\n\n" +
                        "Criar um túnel público sem autenticação significa que qualquer pessoa com a URL " +
                        "poderá acessar sua instância do Agent Zero.\n\n" +
                        "Recomenda-se configurar autenticação em Configurações > Autenticação " +
                        "antes de criar um túnel público.\n\n" +
                        "Deseja continuar mesmo assim?"
                    );
                    
                    if (!proceed) {
                        return; // User cancelled
                    }
                }
            } catch (error) {
                console.error("Error checking authentication status:", error);
                // Continue anyway if we can't check auth status
            }
            
            this.isLoading = true;
            this.loadingText = 'Criando túnel...';

            // Get provider from the parent settings modal scope
            const modalEl = document.getElementById('settingsModal');
            const modalAD = Alpine.$data(modalEl);
            const provider = modalAD.provider || 'serveo'; // Default to serveo if not set
            
            // Change create button appearance
            const createButton = document.querySelector('.tunnel-actions .btn-ok');
            if (createButton) {
                createButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
                createButton.disabled = true;
                createButton.classList.add('creating');
            }
            
            try {
                // Call the backend API to create a tunnel
                const response = await fetchApi('/tunnel_proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        action: 'create',
                        provider: provider
                        // port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80)
                    }),
                });
                
                const data = await response.json();
                
                if (data.success && data.tunnel_url) {
                    // Store the tunnel URL in localStorage for persistence
                    localStorage.setItem('agent_zero_tunnel_url', data.tunnel_url);
                    
                    this.tunnelLink = data.tunnel_url;
                    this.linkGenerated = true;
                    
                    // Show success message to confirm creation
                    window.toast("Túnel criado com sucesso", "success", 3000);
                } else {
                    // The tunnel might still be starting up, check again after a delay
                    this.loadingText = 'A criação do túnel está levando mais tempo que o esperado...';
                    
                    // Wait for 5 seconds and check if the tunnel is running
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Check if tunnel is running now
                    try {
                        const statusResponse = await fetchApi('/tunnel_proxy', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ action: 'get' }),
                        });
                        
                        const statusData = await statusResponse.json();
                        
                        if (statusData.success && statusData.tunnel_url) {
                            // Tunnel is now running, we can update the UI
                            localStorage.setItem('agent_zero_tunnel_url', statusData.tunnel_url);
                            this.tunnelLink = statusData.tunnel_url;
                            this.linkGenerated = true;
                            window.toast("Túnel criado com sucesso", "success", 3000);
                            return;
                        }
                    } catch (statusError) {
                        console.error("Error checking tunnel status:", statusError);
                    }
                    
                    // If we get here, the tunnel really failed to start
                    const errorMessage = data.message || "Falha ao criar o túnel. Por favor, tente novamente.";
                    window.toast(errorMessage, "error", 5000);
                    console.error("Falha na criação do túnel:", data);
                }
            } catch (error) {
                window.toast("Erro ao criar túnel", "error", 5000);
                console.error("Erro ao criar túnel:", error);
            } finally {
                this.isLoading = false;
                this.loadingText = '';
                
                // Reset create button if it's still in the DOM
                const createButton = document.querySelector('.tunnel-actions .btn-ok');
                if (createButton) {
                    createButton.innerHTML = '<i class="fas fa-play-circle"></i> Criar Túnel';
                    createButton.disabled = false;
                    createButton.classList.remove('creating');
                }
            }
        },

        async stopTunnel() {
            if (confirm("Tem certeza de que deseja parar o túnel? A URL deixará de estar acessível.")) {
                this.isLoading = true;
                this.loadingText = 'Parando túnel...';
                
                
                try {
                    // Call the backend to stop the tunnel
                    const response = await fetchApi('/tunnel_proxy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'stop' }),
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Clear the stored URL
                        localStorage.removeItem('agent_zero_tunnel_url');
                        
                        // Update UI state
                        this.tunnelLink = '';
                        this.linkGenerated = false;
                        
                        window.toast("Túnel parado com sucesso", "success", 3000);
                    } else {
                        window.toast("Falha ao parar túnel", "error", 3000);
                        
                        // Reset stop button
                        stopButton.innerHTML = originalStopContent;
                        stopButton.disabled = false;
                        stopButton.classList.remove('stopping');
                    }
                } catch (error) {
                    window.toast("Erro ao parar túnel", "error", 3000);
                    console.error("Erro ao parar túnel:", error);
                    
                    // Reset stop button
                    stopButton.innerHTML = originalStopContent;
                    stopButton.disabled = false;
                    stopButton.classList.remove('stopping');
                } finally {
                    this.isLoading = false;
                    this.loadingText = '';
                }
            }
        },

        copyToClipboard() {
            if (!this.tunnelLink) return;
            
            const copyButton = document.querySelector('.copy-link-button');
            const originalContent = copyButton.innerHTML;
            
            navigator.clipboard.writeText(this.tunnelLink)
                .then(() => {
                    // Update button to show success state
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    copyButton.classList.add('copy-success');
                    
                    // Show toast notification
                    window.toast("URL do túnel copiada para a área de transferência!", "success", 3000);
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        copyButton.innerHTML = originalContent;
                        copyButton.classList.remove('copy-success');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy URL: ', err);
                    window.toast("Falha ao copiar a URL do túnel", "error", 3000);
                    copyButton.innerHTML = '<i class="fas fa-times"></i> Falhou';
                    copyButton.classList.add('copy-error');
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        copyButton.innerHTML = originalContent;
                        copyButton.classList.remove('copy-error');
                    }, 2000);
                });
        }
    }));
});