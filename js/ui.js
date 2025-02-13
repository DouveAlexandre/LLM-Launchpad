import { CONFIG } from './config.js';

export class UI {
    constructor(store) {
        this.store = store;
        this.elements = {
            providerSelect: document.getElementById('provider-select'),
            apiKeyInput: document.getElementById('api-key'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            chatMessages: document.getElementById('chat-messages'),
            tabsContainer: document.getElementById('tabs-container'),
            newChatBtn: document.getElementById('new-chat-btn'),
            chatsContainer: document.getElementById('chats-container'),
            lockButton: document.getElementById('lock-button'),
            settingsModal: document.getElementById('settings-modal'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings')
        };

        this.setupEventListeners();
        this.setupSettingsModal();
        
        // Registrar listener para atualizações do store
        this.store.subscribe((chats, activeChat) => {
            console.log('UI received store update:', { 
                chatsCount: Object.keys(chats).length, 
                activeChat 
            });
            this.render();
        });

        // Renderização inicial
        this.render();

        this.isProcessing = false;
    }

    setupEventListeners() {
        // Monitora mudanças nos campos de configuração
        const configFields = [
            this.elements.providerSelect,
            this.elements.apiKeyInput,
            document.getElementById('model-select')
        ];

        configFields.forEach(field => {
            field?.addEventListener('change', () => this.updateCurrentChatConfig());
        });

        // Adiciona listener para o API Key que monitora o evento 'input'
        this.elements.apiKeyInput?.addEventListener('input', () => this.updateCurrentChatConfig());

        // Adiciona listener para o botão de lock
        this.elements.lockButton?.addEventListener('click', () => {
            console.log('Lock button clicked'); // Debug
            const activeChat = this.store.chats[this.store.activeChat];
            if (!activeChat) {
                console.log('No active chat'); // Debug
                return;
            }

            if (!activeChat.isLocked) {
                // Verificar e salvar configurações
                const config = {
                    provider: this.elements.providerSelect.value,
                    apiKey: this.elements.apiKeyInput.value,
                    model: document.getElementById('model-select')?.value
                };

                console.log('Config to save:', config); // Debug

                if (!config.provider || !config.model || !config.apiKey) {
                    alert('Please fill in all settings before locking the chat.');
                    return;
                }

                // Atualizar configurações antes de travar
                this.store.updateChatConfig(this.store.activeChat, config);
                this.store.lockChat(this.store.activeChat);
                console.log('Chat locked:', this.store.chats[this.store.activeChat]); // Debug
            } else {
                this.store.unlockChat(this.store.activeChat);
                console.log('Chat unlocked:', this.store.chats[this.store.activeChat]); // Debug
            }

            this.updateControlsState();
            this.updateSendButton();
        });

        // Adicionar listener para mudança de provider
        this.elements.providerSelect?.addEventListener('change', (e) => {
            // Limpar API key quando trocar de provider
            this.elements.apiKeyInput.value = '';
            
            // Atualizar lista de modelos
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="">Select a model</option>';
                
                const provider = CONFIG.PROVIDERS[e.target.value.toUpperCase()];
                if (provider && provider.models) {
                    provider.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                }
            }
        });
    }

    setupSettingsModal() {
        // Abrir configurações
        this.elements.settingsBtn?.addEventListener('click', () => this.openSettings());
        
        // Fechar configurações
        this.elements.closeSettingsBtn?.addEventListener('click', () => this.closeSettings());
        
        // Fechar ao clicar fora do modal
        this.elements.settingsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });
    }

    async openSettings() {
        this.elements.settingsModal?.classList.remove('hidden');
        
        // Resetar campos do formulário
        const activeChat = this.store.chats[this.store.activeChat];
        
        // Limpar todos os campos primeiro
        this.elements.providerSelect.value = '';
        this.elements.apiKeyInput.value = '';
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="">Select a model</option>';
        }
        
        // Atualizar campos baseado no chat atual
        if (activeChat) {
            if (activeChat.provider) {
                // Primeiro, definir o provider
                this.elements.providerSelect.value = activeChat.provider;
                
                // Depois, preencher a lista de modelos
                const provider = CONFIG.PROVIDERS[activeChat.provider.toUpperCase()];
                if (provider && provider.models) {
                    provider.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect?.appendChild(option);
                    });
                }
                
                // Agora que a lista de modelos está preenchida, podemos selecionar o modelo atual
                if (activeChat.model && modelSelect) {
                    console.log('Selecting model:', activeChat.model);
                    setTimeout(() => {
                        modelSelect.value = activeChat.model;
                    }, 0);
                }
                
                // Manter a API key apenas se for do mesmo provider
                if (activeChat.apiKey) {
                    this.elements.apiKeyInput.value = activeChat.apiKey;
                }
            }
        }

        // Animar entrada
        requestAnimationFrame(() => {
            this.elements.settingsModal?.querySelector('div')?.classList.add('scale-100', 'opacity-100');
            this.elements.settingsModal?.querySelector('div')?.classList.remove('scale-95', 'opacity-0');
        });
    }

    showApiKeyConfirmDialog(provider) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center';
            dialog.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Existing API Key
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        There is a saved API key for ${provider}. Do you want to use it?
                    </p>
                    <div class="flex justify-end space-x-4">
                        <button class="cancel-btn px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 
                                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            No, use another
                        </button>
                        <button class="confirm-btn px-4 py-2 rounded-lg bg-primary-light dark:bg-primary-dark 
                                     text-white hover:opacity-90 transition-opacity">
                            Yes, use existing
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.confirm-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });

            dialog.querySelector('.cancel-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
        });
    }

    closeSettings() {
        const modalContent = this.elements.settingsModal?.querySelector('div');
        // Animar saída
        modalContent?.classList.remove('scale-100', 'opacity-100');
        modalContent?.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            this.elements.settingsModal?.classList.add('hidden');
        }, 200);
    }

    checkAndShowSettings() {
        const activeChat = this.store.chats[this.store.activeChat];
        if (activeChat && !activeChat.isLocked && (!activeChat.provider || !activeChat.apiKey || !activeChat.model)) {
            this.openSettings();
        }
    }

    updateCurrentChatConfig() {
        const activeChat = this.store.chats[this.store.activeChat];
        if (!activeChat || activeChat.isLocked) return;

        const config = {
            provider: this.elements.providerSelect.value,
            apiKey: this.elements.apiKeyInput.value,
            model: document.getElementById('model-select')?.value
        };

        this.store.updateChatConfig(this.store.activeChat, config);
        this.updateControlsState();
        this.updateSendButton();
    }

    createTabElement(chat) {
        const tab = document.createElement('div');
        tab.className = `flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer 
                        ${chat.id === this.store.activeChat ? 
                        'bg-primary-light dark:bg-primary-dark text-white' : 
                        'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                        hover:opacity-90 transition-all`;
        
        tab.innerHTML = `
            <span class="truncate max-w-[150px]">${chat.title}</span>
            <button class="close-tab ml-2 opacity-60 hover:opacity-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;

        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.close-tab')) {
                this.store.setActiveChat(chat.id);
            }
        });

        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.store.deleteChat(chat.id);
        });

        return tab;
    }

    renderTabs() {
        if (!this.elements.tabsContainer) return;
        
        console.log('Rendering tabs...');
        this.elements.tabsContainer.innerHTML = '';
        
        const chats = Object.values(this.store.chats);
        if (chats.length === 0) {
            console.log('No chats to display');
            return;
        }

        chats.forEach(chat => {
            this.elements.tabsContainer.appendChild(this.createTabElement(chat));
        });
    }

    renderMessages(chatId) {
        const chat = this.store.chats[chatId];
        if (!chat) return;

        this.elements.chatMessages.innerHTML = '';
        
        if (chat.messages.length === 0) {
            const welcomeMessage = this.createWelcomeMessage();
            this.elements.chatMessages.appendChild(welcomeMessage);
        } else {
            chat.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `p-3 rounded-lg mb-2 ${
                    msg.isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                } ${msg.isUser ? 'max-w-[80%]' : 'message-ai'}`;
                
                if (!msg.isUser && msg.content) {
                    messageDiv.className += ' markdown-body';
                    messageDiv.innerHTML = marked.parse(msg.content, {
                        breaks: true,
                        gfm: true,
                        headerIds: false,
                        mangle: false
                    });
                } else {
                    messageDiv.textContent = msg.content || 'Error: Empty message';
                }
                this.elements.chatMessages.appendChild(messageDiv);
            });
        }
        
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    createWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'flex items-center space-x-3 mb-6';
        welcomeDiv.innerHTML = `
            <div class="w-10 h-10 bg-gradient-to-r from-primary-light to-violet-500 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm max-w-[80%]">
                <p class="text-gray-700 dark:text-gray-300">
                    Hello! I'm your AI assistant. Select a provider and enter your API key to start our conversation.
                </p>
            </div>
        `;
        return welcomeDiv;
    }

    render() {
        console.log('Rendering UI...');
        try {
            this.renderTabs();
            if (this.store.activeChat) {
                this.renderMessages(this.store.activeChat);
                this.updateControlsState();
                this.updateSendButton();
                // Verificar se precisa mostrar configurações
                this.checkAndShowSettings();
            } else {
                console.log('No active chat to render');
            }
        } catch (error) {
            console.error('Error rendering UI:', error);
        }
    }

    initializeProviderSelect(providers) {
        this.elements.providerSelect.innerHTML = '<option value="">Selecione um provedor</option>';
        
        Object.entries(providers).forEach(([key, provider]) => {
            const option = document.createElement('option');
            option.value = key.toLowerCase();
            option.textContent = provider.name;
            this.elements.providerSelect.appendChild(option);
        });
    }

    addMessage(message, isUser = true) {
        if (!message) {
            console.error('Attempt to add an empty message');
            message = 'Error: Empty message';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `p-3 rounded-lg mb-2 ${
            isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
        } ${isUser ? 'max-w-[80%]' : 'message-ai'} message-new`;
        
        if (message === 'Generating response...') {
            messageDiv.className += ' message-loading';
            messageDiv.textContent = message;
        } else if (!isUser && message) {
            messageDiv.className += ' markdown-body';
            messageDiv.innerHTML = marked.parse(message, {
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
        } else {
            messageDiv.textContent = message || 'Error: Empty message';
        }
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageDiv;
    }

    clearInput() {
        this.elements.messageInput.value = '';
    }

    updateControlsState() {
        const activeChat = this.store.chats[this.store.activeChat];
        if (!activeChat) return;

        const isLocked = activeChat.isLocked;
        console.log('Updating controls state, isLocked:', isLocked); // Debug

        // Atualizar estado dos controles
        const controls = [
            this.elements.providerSelect,
            this.elements.apiKeyInput,
            document.getElementById('model-select')
        ];

        controls.forEach(control => {
            if (control) {
                control.disabled = isLocked;
                // Se estiver travado, mostrar os valores salvos
                if (isLocked) {
                    // Garantir que o modelo seja selecionado após a lista estar preenchida
                    if (control.id === 'model-select') {
                        setTimeout(() => {
                            control.value = activeChat.model;
                        }, 0);
                    } else if (control.id === 'provider-select') {
                        control.value = activeChat.provider;
                    } else if (control.id === 'api-key') {
                        control.value = activeChat.apiKey;
                    }
                }
            }
        });

        // Atualizar aparência do botão de lock
        if (this.elements.lockButton) {
            const lockStatus = this.elements.lockButton.querySelector('.lock-status');
            if (lockStatus) {
                lockStatus.textContent = isLocked ? 'Locked' : 'Unlocked';
            }

            this.elements.lockButton.className = `p-2 rounded-lg transition-colors flex items-center space-x-2 
                ${isLocked ? 'locked' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`;
        }
    }

    updateInputState(isProcessing = false) {
        const messageInput = this.elements.messageInput;
        if (messageInput) {
            messageInput.disabled = isProcessing;
            messageInput.placeholder = isProcessing ? 
                'Waiting for response...' : 
                'Type your message...';
            
            // Adicionar classes visuais
            if (isProcessing) {
                messageInput.classList.add('bg-gray-50', 'dark:bg-gray-800/50', 'cursor-not-allowed');
            } else {
                messageInput.classList.remove('bg-gray-50', 'dark:bg-gray-800/50', 'cursor-not-allowed');
            }
        }
    }

    updateSendButton(isProcessing = false) {
        const activeChat = this.store.chats[this.store.activeChat];
        const sendButton = this.elements.sendButton;
        
        const isConfigValid = activeChat && 
            activeChat.isLocked && 
            activeChat.provider && 
            activeChat.apiKey && 
            activeChat.model;

        // Desabilitar durante processamento ou configuração inválida
        const shouldDisable = isProcessing || !isConfigValid;
        
        if (shouldDisable) {
            sendButton.disabled = true;
            sendButton.classList.add('button-disabled');
            
            // Atualizar texto do botão durante processamento
            const buttonText = sendButton.querySelector('span');
            if (buttonText) {
                buttonText.textContent = isProcessing ? 'Processing...' : 'Send';
            }
        } else {
            sendButton.disabled = false;
            sendButton.classList.remove('button-disabled');
            const buttonText = sendButton.querySelector('span');
            if (buttonText) {
                buttonText.textContent = 'Send';
            }
        }

        // Atualizar estado do input
        this.updateInputState(isProcessing);
    }
} 