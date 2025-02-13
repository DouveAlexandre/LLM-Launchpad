export const CONFIG = {
    PROVIDERS: {
        OPENAI: {
            name: 'OpenAI',
            models: ['gpt-3.5-turbo', 'gpt-4'],
            baseUrl: 'https://api.openai.com/v1',
            apiFormat: 'openai',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            })
        },
        DEEPSEEK: {
            name: 'Deepseek',
            models: ['deepseek-chat', 'deepseek-reasoner'],
            baseUrl: 'https://api.deepseek.com',
            apiFormat: 'openai',
            defaultModel: 'deepseek-chat',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }),
            extraParams: {
                temperature: 1.0,
                stream: false
            }
        },
        OPENROUTER: {
            name: 'OpenRouter',
            models: ['openai/gpt-3.5-turbo', 'anthropic/claude-2', 'google/gemini-pro', 'liquid/lfm-7b'],
            baseUrl: 'https://openrouter.ai/api/v1',
            apiFormat: 'openai',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'Content-Type': 'application/json'
            })
        },
        ALIBABACLOUD: {
            name: 'Alibaba Cloud',
            models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
            apiFormat: 'openai',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            })
        },
        ANTHROPIC: {
            name: 'Anthropic',
            models: ['claude-2', 'claude-instant-1'],
            baseUrl: 'https://api.anthropic.com/v1',
            apiFormat: 'anthropic',
            headers: (apiKey) => ({
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            })
        },
        GEMINI: {
            name: 'Google Gemini',
            models: ['gemini-pro'],
            baseUrl: 'https://generativelanguage.googleapis.com',
            apiFormat: 'gemini',
            requiresLibrary: true
        }
    }
}; 