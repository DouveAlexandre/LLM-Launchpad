export class ChatStore {
    constructor() {
        this.listeners = new Set();
        this.chats = this.loadChats();
        this.savedApiKeys = this.loadSavedApiKeys();
        
        console.log('ChatStore initialized with chats:', this.chats);
        // Se não houver chats, criar um novo e definir como ativo
        if (Object.keys(this.chats).length === 0) {
            console.log('No chats found, creating initial chat');
            const newChatId = this.createChat();
            this.activeChat = newChatId;
        } else {
            // Recuperar o chat ativo do localStorage ou usar o primeiro chat
            this.activeChat = localStorage.getItem('activeChat') || Object.keys(this.chats)[0];
            console.log('Restored active chat:', this.activeChat);
        }
        
        // Notificar os listeners sobre o estado inicial
        this.notifyListeners();
    }

    loadChats() {
        const savedChats = localStorage.getItem('llm_launchpad_chats');
        const chats = savedChats ? JSON.parse(savedChats) : {};
        console.log('Chats loaded:', chats);
        return chats;
    }

    saveChats() {
        console.log('Saving chats:', this.chats);
        localStorage.setItem('llm_launchpad_chats', JSON.stringify(this.chats));
        localStorage.setItem('activeChat', this.activeChat);
        this.notifyListeners();
    }

    createChat(provider = null, apiKey = null, model = null) {
        console.log('Creating new chat with:', { provider, apiKey, model });
        const chatId = 'chat_' + Date.now();
        this.chats[chatId] = {
            id: chatId,
            provider,
            apiKey,
            model,
            messages: [],
            createdAt: new Date().toISOString(),
            title: 'New Chat',
            isLocked: false
        };
        this.activeChat = chatId;
        this.saveChats();
        console.log('New chat created:', chatId);
        return chatId;
    }

    addMessage(chatId, message, isUser = true) {
        if (!this.chats[chatId]) return;
        
        this.chats[chatId].messages.push({
            content: message,
            isUser,
            timestamp: new Date().toISOString()
        });

        // Atualiza o título se for a primeira mensagem do usuário
        if (isUser && this.chats[chatId].messages.length === 1) {
            this.chats[chatId].title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        }

        this.saveChats();
    }

    setActiveChat(chatId) {
        this.activeChat = chatId;
        localStorage.setItem('activeChat', chatId);
        this.notifyListeners();
    }

    deleteChat(chatId) {
        const wasDeleted = !!this.chats[chatId];
        delete this.chats[chatId];
        if (this.activeChat === chatId) {
            this.activeChat = Object.keys(this.chats)[0] || null;
        }
        this.saveChats();
        // Notificar sobre a deleção do chat
        if (wasDeleted) {
            this.notifyListeners('chatDeleted', chatId);
        }
    }

    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add({ update: listener });
        } else {
            this.listeners.add(listener);
        }
        return () => this.listeners.delete(listener);
    }

    notifyListeners(event = 'update', data = null) {
        if (!this.listeners) return;
        this.listeners.forEach(listener => {
            try {
                if (typeof listener === 'function') {
                    listener(this.chats, this.activeChat);
                } else if (event === 'update') {
                    listener.update?.(this.chats, this.activeChat);
                } else if (event === 'chatDeleted' && listener.onChatDeleted) {
                    listener.onChatDeleted(data);
                }
            } catch (error) {
                console.error('Error in listener:', error);
            }
        });
    }

    updateChatConfig(chatId, config) {
        console.log('Updating chat config:', chatId, config); // Debug
        if (this.chats[chatId] && !this.chats[chatId].isLocked) {
            this.chats[chatId] = {
                ...this.chats[chatId],
                ...config
            };
            this.saveChats();
            console.log('Updated chat:', this.chats[chatId]); // Debug
        }
    }

    lockChat(chatId) {
        console.log('Locking chat:', chatId); // Debug
        if (this.chats[chatId]) {
            this.chats[chatId].isLocked = true;
            this.saveChats();
            console.log('Chat locked:', this.chats[chatId]); // Debug
        }
    }

    unlockChat(chatId) {
        console.log('Unlocking chat:', chatId); // Debug
        if (this.chats[chatId]) {
            // Preservar apenas o provider e a API key ao desbloquear
            const previousProvider = this.chats[chatId].provider;
            const previousApiKey = this.chats[chatId].apiKey;
            
            this.chats[chatId].isLocked = false;
            // Limpar outras configurações
            this.chats[chatId].model = null;
            
            this.saveChats();
            console.log('Chat unlocked:', this.chats[chatId]); // Debug
        }
    }

    loadSavedApiKeys() {
        const saved = localStorage.getItem('llm_launchpad_api_keys');
        return saved ? JSON.parse(saved) : {};
    }

    saveSavedApiKeys() {
        localStorage.setItem('llm_launchpad_api_keys', JSON.stringify(this.savedApiKeys));
    }

    saveApiKey(provider, apiKey) {
        this.savedApiKeys[provider] = apiKey;
        this.saveSavedApiKeys();
    }

    getApiKey(provider) {
        return this.savedApiKeys[provider];
    }
} 