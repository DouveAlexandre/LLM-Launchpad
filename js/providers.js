import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { CONFIG } from './config.js';

const API_ENDPOINTS = {
    OPENAI: 'https://api.openai.com/v1',
    ANTHROPIC: 'https://api.anthropic.com/v1',
    TOGETHERAI: 'https://api.together.xyz/v1',
    DEEPSEEK: 'https://api.deepseek.com/v1',
    OPENROUTER: 'https://openrouter.ai/api/v1',
    ALIBABACLOUD: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
};

class APILLMHub {
    constructor(config) {
        this.provider = config.provider;
        this.apiKey = config.apiKey;
        this.model = config.model;
        this.maxTokens = config.maxTokens || 1000;
        this.temperature = config.temperature || 0.7;
        this.conversationHistory = [];
        this.extraParams = config.extraParams || {};
        this.providerConfig = CONFIG.PROVIDERS[this.provider.toUpperCase()];
        this.genAI = null;
        this.modelInstance = null;
        this.baseUrl = this.getBaseUrl();
    }

    async sendOpenAIFormat(message) {
        try {
            // Ajuste especial para Alibaba Cloud
            const headers = this.providerConfig.headers(this.apiKey);
            if (this.provider.toUpperCase() === 'ALIBABACLOUD') {
                headers['X-DashScope-SSE'] = 'disable';
            }

            const response = await fetch(`${this.providerConfig.baseUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: this.providerConfig.defaultModel || this.model,
                    messages: this.conversationHistory.map(msg => ({
                        role: msg.isUser ? "user" : "assistant",
                        content: msg.content
                    })),
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    stream: false,
                    ...this.providerConfig.extraParams,
                    ...this.extraParams
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            this.conversationHistory.push({ role: "assistant", content: assistantMessage });
            return assistantMessage;
        } catch (error) {
            throw new Error(`API request failed for ${this.provider}: ${error.message}`);
        }
    }

    async validateApiKey() {
        const provider = this.provider.toUpperCase();
        try {
            switch (provider) {
                case 'ALIBABACLOUD':
                    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'X-DashScope-SSE': 'disable'
                        },
                        body: JSON.stringify({
                            model: this.model,
                            messages: [{ role: 'user', content: 'test' }],
                            stream: false
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        if (response.status === 401) {
                            throw new Error('Invalid API key for Alibaba Cloud');
                        }
                        throw new Error(error.message || 'Error validating API key');
                    }
                    break;

                default:
                    await this.initializeOpenAIFormat();
            }
            return true;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error(`Failed to connect to the ${this.providerConfig.name} server. Check your connection or the API key.`);
            }
            throw new Error(error.message);
        }
    }

    async initializeOpenAIFormat() {
        try {
            const response = await fetch(`${this.providerConfig.baseUrl}/models`, {
                headers: this.providerConfig.headers(this.apiKey)
            });
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    throw new Error(`Invalid API key for ${this.providerConfig.name}`);
                }
                throw new Error(error.error?.message || `Error connecting to ${this.providerConfig.name}`);
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async initializeGemini() {
        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.modelInstance = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            
            // Teste básico
            const result = await this.modelInstance.generateContent("test");
            if (!result) throw new Error('Invalid API key');
        } catch (error) {
            throw new Error('Failed to initialize Gemini API: ' + error.message);
        }
    }

    async sendGemini(message) {
        try {
            if (!this.modelInstance) {
                await this.initializeGemini();
            }

            const history = this.conversationHistory.map(msg => ({
                role: msg.isUser ? "user" : "model",
                parts: msg.content
            }));

            const chat = this.modelInstance.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: this.temperature,
                }
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            const assistantMessage = response.text();
            
            this.conversationHistory.push({ role: "assistant", content: assistantMessage });
            return assistantMessage;
        } catch (error) {
            throw new Error('Gemini API request failed: ' + error.message);
        }
    }

    getBaseUrl() {
        switch (this.provider) {
            case 'openai': return API_ENDPOINTS.OPENAI;
            case 'anthropic': return API_ENDPOINTS.ANTHROPIC;
            case 'togetherai': return API_ENDPOINTS.TOGETHERAI;
            case 'deepseek': return API_ENDPOINTS.DEEPSEEK;
            case 'openrouter': return API_ENDPOINTS.OPENROUTER;
            case 'alibabacloud': return API_ENDPOINTS.ALIBABACLOUD;
            default: return API_ENDPOINTS.OPENAI;
        }
    }

    async initialize() {
        const format = this.providerConfig.apiFormat;
        
        try {
            // Validar API key primeiro
            await this.validateApiKey();
            
            if (format === 'openai') {
                return this.initializeOpenAIFormat();
            } else if (format === 'gemini') {
                return this.initializeGemini();
            }
            
            throw new Error(`Unsupported API format: ${format}`);
        } catch (error) {
            // Remover prefixos técnicos da mensagem de erro
            const cleanError = error.message
                .replace('Error: ', '')
                .replace('Failed to initialize API: ', '');
            throw new Error(cleanError);
        }
    }

    async sendMessage(message) {
        this.conversationHistory.push({ role: "user", content: message });
        
        const format = this.providerConfig.apiFormat;
        
        if (format === 'openai') {
            return this.sendOpenAIFormat(message);
        } else if (format === 'gemini') {
            return this.sendGemini(message);
        }
        
        throw new Error(`Unsupported API format: ${format}`);
    }
}

if (typeof window !== 'undefined') {
    window.APILLMHub = APILLMHub;
}

export default APILLMHub; 