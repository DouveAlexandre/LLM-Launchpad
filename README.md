# LLM Launchpad 🚀

LLM Launchpad is a modern web-based interface for interacting with multiple Large Language Models (LLMs) in a unified platform. It supports various AI providers such as OpenAI, Anthropic, Google Gemini, and others.

![LLM Launchpad Screenshot](https://github.com/douvealexandre/LLM-Launchpad/blob/main/css/screenshot.png?raw=true)

---

## 🌟 Key Features

- **Support for multiple LLM providers:**
  - OpenAI (GPT-3.5, GPT-4)
  - Anthropic (Claude-2, Claude Instant)
  - Google Gemini
  - DeepSeek
  - OpenRouter

---

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/douvealexandre/llm-launchpad.git
cd llm-launchpad
```

2. Start a local server:

```bash
python -m http.server 8000
```

or

```bash
npx serve
```

3. Open in your browser:

```
http://localhost:8000
```

---

## 🔑 API Key Configuration

To use LLM Launchpad, obtain API keys from your desired providers:

- **OpenAI**: [Get API key](https://platform.openai.com/api-keys)
- **Anthropic**: [Get API key](https://console.anthropic.com/)
- **Google AI**: [Get API key](https://makersuite.google.com/app/apikey)
- **DeepSeek**: [Get API key](https://platform.deepseek.com/)
- **OpenRouter**: [Get API key](https://openrouter.ai/)
- **Alibaba Cloud**: [Get API key](https://www.alibabacloud.com/)

---

## 🛠️ Technical Details

### 📁 Project Architecture

```
llm-launchpad/
├── css/
│   └── styles.css  # Styles and animations
├── js/
│   ├── config.js  # Provider configurations
│   ├── main.js  # Application initialization
│   ├── providers.js  # LLM provider integration
│   ├── store.js  # State management
│   └── ui.js  # UI components and rendering
└── index.html  # Main entry point
```

### 🧠 Supported Providers

```javascript
const PROVIDERS = {
  OPENAI: {
    models: ['gpt-3.5-turbo', 'gpt-4']
  },
  GEMINI: {
    models: ['gemini-pro']
  },
  ANTHROPIC: {
    models: ['claude-2', 'claude-instant-1']
  },
  DEEPSEEK: {
    models: ['deepseek-chat', 'deepseek-reasoner']
  }
}
```

### 🔑 API Integration

```javascript
class APILLMHub {
  constructor(config) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }
  // ...
}
```

### 🎨 Styling (TailwindCSS)

```javascript
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#6366f1',
          dark: '#818cf8'
        }
      }
    }
  }
}
```

### ➕ Adding a New Provider

```javascript
PROVIDERS.NEW_PROVIDER = {
  name: 'New Provider',
  models: ['model-1', 'model-2'],
  baseUrl: 'https://api.provider.com/v1',
  apiFormat: 'openai',
  headers: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  })
}
```

---

## 🔒 Security

- API keys are stored locally in the browser.
- No sensitive information is stored on the server.
- Direct communication with LLM providers.
- HTTPS usage is recommended for production.

---

## 🌐 Browser Compatibility

Compatible with major modern browsers:

- Chrome/Edge (latest version)
- Firefox (latest version)
- Safari (latest version)
- Opera (latest version)

---

## 📝 License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a branch for your feature:

```bash
git checkout -b feature/NewFeature
```

3. Make your changes and commit:

```bash
git commit -m 'Add NewFeature'
```

4. Push to the remote branch:

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request.

---

## 📞 Support

If you need help:

1. Check the [Issues](https://github.com/douvealexandre/llm-launchpad/issues) section.
2. Open a new issue if necessary.

---

## 💡 Implementation Details

### 🏗️ Technologies Used

- **Pure JavaScript (ES6+)**
  - No heavy frameworks.
  - Modular architecture with ES6 modules.
  - Use of async/await for API calls.
  - Class-based components.

- **TailwindCSS**
  - Utility-first CSS framework.
  - Light/dark mode support.
  - Responsive design.
  - Custom animations.

- **LocalStorage API**
  - Persistent chat history.
  - Secure API key storage.
  - User preferences management.

- **Marked.js**
  - Markdown parsing and rendering.
  - Code block support.

### 🔍 Application Structure

```javascript
// Main Application (main.js)
class App {
    constructor() {
        this.store = new ChatStore();    // State management
        this.ui = new UI(this.store);    // User interface
        this.providerManagers = {};      // LLM providers
    }
}
```

### 🔑 State Management

```javascript
class ChatStore {
    constructor() {
        this.chats = {};                 // Chat history
        this.listeners = new Set();      // State observers
        this.savedApiKeys = {};          // API keys
    }
}
```

### 🎨 User Interface

```javascript
class UI {
    constructor(store) {
        this.store = store;              // State reference
        this.elements = {};              // DOM elements
        this.setupEventListeners();      // Event handling
    }
}
```

---

💙 Developed by Alexandre Douve and Claude 3.5