import { CONFIG } from './config.js';
import APILLMHub from './providers.js';
import { UI } from './ui.js';
import { ChatStore } from './store.js';

class App {
    constructor() {
        this.store = new ChatStore();
        this.ui = new UI(this.store);
        this.providerManagers = {};  // Um objeto para armazenar os gerenciadores de cada chat
        this.isProcessing = false;
        
        // Registrar listener para deleção de chat
        this.store.subscribe({
            update: (chats, activeChat) => {
                // Handler normal para atualizações
            },
            onChatDeleted: (chatId) => {
                this.handleChatDelete(chatId);
            }
        });
        
        this.initialize();
    }

    initialize() {
        this.initializeProviderSelect();
        this.setupEventListeners();
        this.ui.render();
    }

    initializeProviderSelect() {
        const providerSelect = document.getElementById('provider-select');
        providerSelect.innerHTML = '<option value="">Select a provider</option>';
        
        // Adiciona os provedores do CONFIG
        Object.entries(CONFIG.PROVIDERS).forEach(([key, provider]) => {
            const option = document.createElement('option');
            option.value = key.toLowerCase();
            option.textContent = provider.name;
            providerSelect.appendChild(option);
        });

        // Adiciona evento de mudança para atualizar os modelos disponíveis
        providerSelect.addEventListener('change', (e) => {
            this.updateModelSelect(e.target.value);
        });
    }

    updateModelSelect(providerKey) {
        const modelSelect = document.getElementById('model-select');
        if (!modelSelect) {
            // Se não existe, cria o select de modelos
            this.createModelSelect();
            return this.updateModelSelect(providerKey);
        }

        modelSelect.innerHTML = '<option value="">Select a model</option>';
        
        const provider = CONFIG.PROVIDERS[providerKey.toUpperCase()];
        if (provider && provider.models) {
            provider.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
    }

    createModelSelect() {
        const controlsSection = document.querySelector('.grid');
        const modelSelectDiv = document.createElement('div');
        modelSelectDiv.className = 'relative';
        modelSelectDiv.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
            </label>
            <select id="model-select" 
                    class="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl 
                           shadow-sm focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-transparent
                           dark:text-gray-300 transition-colors">
                <option value="">Select a model</option>
            </select>
        `;
        controlsSection.appendChild(modelSelectDiv);
    }

    setupEventListeners() {
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        const providerSelect = document.getElementById('provider-select');
        const modelSelect = document.getElementById('model-select');
        const newChatBtn = document.getElementById('new-chat-btn');

        // Adicionar listener para o botão de novo chat
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                console.log('Creating new chat from main.js');
                this.store.createChat();
                // Mostrar configurações para o novo chat
                setTimeout(() => this.ui.checkAndShowSettings(), 100);
            });
        }

        sendButton.addEventListener('click', () => this.handleSendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        // Reset providerManager quando mudar o provedor ou modelo
        providerSelect.addEventListener('change', () => {
            if (this.store.activeChat) {
                delete this.providerManagers[this.store.activeChat];
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'model-select') {
                if (this.store.activeChat) {
                    delete this.providerManagers[this.store.activeChat];
                }
            }
        });
    }

    async handleSendMessage() {
        // Evitar envios múltiplos
        if (this.isProcessing) {
            console.log('There is a message being processed');
            return;
        }

        const activeChat = this.store.chats[this.store.activeChat];
        if (!activeChat || !activeChat.isLocked) {
            this.ui.openSettings();
            return;
        }

        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        if (!message) return;

        try {
            this.isProcessing = true;
            this.ui.updateSendButton(true);

            if (!this.providerManagers[this.store.activeChat]) {
                console.log('Creating a new provider manager for chat:', this.store.activeChat);
                console.log('Config:', {
                    provider: activeChat.provider,
                    model: activeChat.model
                });

                const loadingDiv = this.ui.addMessage('Validating settings...', false);

                try {
                    this.providerManagers[this.store.activeChat] = new APILLMHub({
                        provider: activeChat.provider,
                        apiKey: activeChat.apiKey,
                        model: activeChat.model,
                        maxTokens: 1000,
                        temperature: 0.7
                    });
                    await this.providerManagers[this.store.activeChat].initialize();
                    loadingDiv.remove();
                } catch (error) {
                    loadingDiv.remove();
                    this.ui.addMessage(`⚠️ ${error.message}`, false);
                    // Desbloquear chat para permitir edição da configuração
                    this.store.unlockChat(this.store.activeChat);
                    throw error;
                }
            }

            const currentProvider = this.providerManagers[this.store.activeChat];

            // Adicionar mensagem do usuário
            this.store.addMessage(this.store.activeChat, message, true);
            messageInput.value = '';

            // Mostrar indicador de carregamento
            let loadingDiv = null;
            try {
                loadingDiv = this.ui.addMessage('Generating response...', false);
                
                // Obter e adicionar resposta da IA
                const response = await currentProvider.sendMessage(message);
                
                // Verificar se a resposta é válida
                if (!response) {
                    throw new Error('Empty response from provider');
                }
                
                // Remover mensagem de carregamento
                if (loadingDiv && loadingDiv.parentNode) {
                    loadingDiv.remove();
                }
                
                // Adicionar resposta da IA
                this.store.addMessage(this.store.activeChat, response, false);
            } catch (error) {
                if (loadingDiv && loadingDiv.parentNode) {
                    loadingDiv.remove();
                }
                
                // Mostrar mensagem de erro mais amigável
                const errorMessage = error.message || 'Unknown error processing the message';
                this.ui.addMessage(`Error: ${errorMessage}`, false);
                throw error;
            }
        } catch (error) {
            console.error('Error:', error);
            if (!error.message.includes('⚠️')) {
                this.ui.addMessage(`⚠️ Error: ${error.message}. Click the ⚙️ icon to adjust settings.`, false);
            }
        } finally {
            this.isProcessing = false;
            this.ui.updateSendButton(false);
        }
    }

    // Limpar provider quando deletar um chat
    handleChatDelete(chatId) {
        delete this.providerManagers[chatId];
    }
}

// Inicializar a aplicação
new App(); 