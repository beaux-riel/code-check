# AI Provider Abstraction Layer - Complete Configuration Guide

A provider-agnostic interface for working with AI services including OpenAI, Anthropic, Custom URL endpoints, Ollama, and LM Studio. This abstraction layer provides a unified interface for making AI requests while supporting environment-based configuration and provider-specific optimizations.

## Features

- 🚀 **Provider Agnostic**: Unified interface for multiple AI providers
- 🔧 **Environment Configuration**: Easy setup via environment variables
- 🛡️ **Type Safety**: Full TypeScript support with proper typing
- ⚙️ **Configurable**: Support for model, temperature, and token settings
- 🔄 **Fallback Support**: Easy provider switching and fallback mechanisms
- 🧪 **Testable**: Comprehensive test suite with mocking support
- 📝 **Well Documented**: Extensive documentation and examples
- 🌐 **Local Support**: Ollama and LM Studio integration

## Supported Providers

### OpenAI

- GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, and other chat completion models
- Configurable temperature (0-2), max tokens, and timeouts
- Automatic API key validation
- Full OpenAI API compatibility

### Anthropic

- Claude 3 models (Haiku, Sonnet, Opus)
- Provider-specific temperature validation (0-1 range)
- Anthropic-specific API headers and formatting
- Support for latest Claude models

### Custom URL Endpoints

- Support for any OpenAI-compatible API endpoint
- Flexible response format parsing
- Optional API key authentication
- Custom headers support

### Ollama (Local)

- Local model hosting with Ollama
- Multiple model support (Llama 2, Mistral, CodeLlama, etc.)
- No API key required
- Custom endpoint configuration

### LM Studio (Local)

- Local model hosting with LM Studio
- OpenAI-compatible API
- No API key required
- Custom model loading

## Environment Variables Reference

### Required Variables

| Variable           | Description           | Valid Values                                               | Required |
| ------------------ | --------------------- | ---------------------------------------------------------- | -------- |
| `AI_PROVIDER_TYPE` | Which provider to use | `openai`, `anthropic`, `custom-url`, `ollama`, `lm-studio` | Yes      |

### OpenAI Configuration

| Variable             | Description          | Default         | Required | Notes                        |
| -------------------- | -------------------- | --------------- | -------- | ---------------------------- |
| `OPENAI_API_KEY`     | OpenAI API key       | -               | Yes      | Format: `sk-...`             |
| `OPENAI_MODEL`       | Model to use         | `gpt-3.5-turbo` | No       | `gpt-4`, `gpt-4-turbo`, etc. |
| `OPENAI_TEMPERATURE` | Temperature (0-2)    | `0.7`           | No       | Controls randomness          |
| `OPENAI_MAX_TOKENS`  | Maximum tokens       | `1000`          | No       | Response length limit        |
| `OPENAI_TIMEOUT`     | Request timeout (ms) | `30000`         | No       | Override global timeout      |

### Anthropic Configuration

| Variable                | Description          | Default                   | Required | Notes                                                |
| ----------------------- | -------------------- | ------------------------- | -------- | ---------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | Anthropic API key    | -                         | Yes      | Format: `sk-ant-...`                                 |
| `ANTHROPIC_MODEL`       | Model to use         | `claude-3-haiku-20240307` | No       | `claude-3-sonnet-20240229`, `claude-3-opus-20240229` |
| `ANTHROPIC_TEMPERATURE` | Temperature (0-1)    | `0.7`                     | No       | Anthropic uses 0-1 range                             |
| `ANTHROPIC_MAX_TOKENS`  | Maximum tokens       | `1000`                    | No       | Response length limit                                |
| `ANTHROPIC_TIMEOUT`     | Request timeout (ms) | `30000`                   | No       | Override global timeout                              |

### Custom URL Configuration

| Variable                | Description                 | Default         | Required | Notes                     |
| ----------------------- | --------------------------- | --------------- | -------- | ------------------------- |
| `AI_CUSTOM_ENDPOINT`    | Custom API endpoint         | -               | Yes      | Full URL including path   |
| `CUSTOM_AI_API_KEY`     | API key for custom endpoint | -               | No       | Optional authentication   |
| `CUSTOM_AI_MODEL`       | Model name                  | `default-model` | No       | Provider-specific model   |
| `CUSTOM_AI_TEMPERATURE` | Temperature (0-2)           | `0.7`           | No       | Range depends on provider |
| `CUSTOM_AI_MAX_TOKENS`  | Maximum tokens              | `1000`          | No       | Response length limit     |
| `CUSTOM_AI_TIMEOUT`     | Request timeout (ms)        | `30000`         | No       | Override global timeout   |

### Ollama Configuration

| Variable             | Description          | Default                  | Required | Notes                       |
| -------------------- | -------------------- | ------------------------ | -------- | --------------------------- |
| `OLLAMA_ENDPOINT`    | Ollama API endpoint  | `http://localhost:11434` | No       | Local Ollama instance       |
| `OLLAMA_MODEL`       | Model to use         | `llama2`                 | No       | Must be pulled in Ollama    |
| `OLLAMA_TEMPERATURE` | Temperature (0-2)    | `0.7`                    | No       | Controls randomness         |
| `OLLAMA_MAX_TOKENS`  | Maximum tokens       | `1000`                   | No       | Response length limit       |
| `OLLAMA_TIMEOUT`     | Request timeout (ms) | `60000`                  | No       | Longer for local processing |

### LM Studio Configuration

| Variable                | Description            | Default                 | Required | Notes                       |
| ----------------------- | ---------------------- | ----------------------- | -------- | --------------------------- |
| `LM_STUDIO_ENDPOINT`    | LM Studio API endpoint | `http://localhost:1234` | No       | Local LM Studio instance    |
| `LM_STUDIO_MODEL`       | Model to use           | `local-model`           | No       | Loaded model in LM Studio   |
| `LM_STUDIO_TEMPERATURE` | Temperature (0-2)      | `0.7`                   | No       | Controls randomness         |
| `LM_STUDIO_MAX_TOKENS`  | Maximum tokens         | `1000`                  | No       | Response length limit       |
| `LM_STUDIO_TIMEOUT`     | Request timeout (ms)   | `60000`                 | No       | Longer for local processing |

### Global Fallback Settings

| Variable         | Description          | Usage                                           | Notes                                    |
| ---------------- | -------------------- | ----------------------------------------------- | ---------------------------------------- |
| `AI_MODEL`       | Fallback model       | Used when provider-specific model not set       | Provider-specific models take precedence |
| `AI_TEMPERATURE` | Fallback temperature | Used when provider-specific temperature not set | Must respect provider ranges             |
| `AI_MAX_TOKENS`  | Fallback max tokens  | Used when provider-specific tokens not set      | Applies to all providers                 |
| `AI_TIMEOUT`     | Request timeout (ms) | Global timeout for all requests                 | Default: `30000`                         |
| `AI_API_KEY`     | Fallback API key     | Mainly for custom URLs                          | Less secure than provider-specific keys  |

## Example .env Files

### OpenAI Configuration

```env
# OpenAI Provider Configuration
AI_PROVIDER_TYPE=openai
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1500
OPENAI_TIMEOUT=30000

# Global fallback settings
AI_TIMEOUT=30000
```

### Anthropic Configuration

```env
# Anthropic Provider Configuration
AI_PROVIDER_TYPE=anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_TEMPERATURE=0.5
ANTHROPIC_MAX_TOKENS=2000
ANTHROPIC_TIMEOUT=30000

# Global fallback settings
AI_TIMEOUT=30000
```

### Custom URL Configuration

```env
# Custom URL Provider Configuration
AI_PROVIDER_TYPE=custom-url
AI_CUSTOM_ENDPOINT=https://api.openai.com/v1/chat/completions
CUSTOM_AI_API_KEY=your-custom-api-key-here
CUSTOM_AI_MODEL=gpt-3.5-turbo
CUSTOM_AI_TEMPERATURE=0.8
CUSTOM_AI_MAX_TOKENS=1000
CUSTOM_AI_TIMEOUT=30000

# Global fallback settings
AI_TIMEOUT=30000
```

### Ollama Configuration

```env
# Ollama Provider Configuration
AI_PROVIDER_TYPE=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=1000
OLLAMA_TIMEOUT=60000

# Global fallback settings
AI_TIMEOUT=60000
```

### LM Studio Configuration

```env
# LM Studio Provider Configuration
AI_PROVIDER_TYPE=lm-studio
LM_STUDIO_ENDPOINT=http://localhost:1234
LM_STUDIO_MODEL=local-model
LM_STUDIO_TEMPERATURE=0.7
LM_STUDIO_MAX_TOKENS=1000
LM_STUDIO_TIMEOUT=60000

# Global fallback settings
AI_TIMEOUT=60000
```

## Code Examples

### Basic Usage

```typescript
import { AIProviderFactory, AIProviderType } from '@code-check/shared';

// Create a provider from environment
const provider = AIProviderFactory.createFromEnvironment();

// Send a request
const response = await provider.sendRequest('Explain TypeScript interfaces');
console.log(response);
```

### Factory Creation Examples

```typescript
import { AIProviderFactory, AIProviderType } from '@code-check/shared';

// Create OpenAI provider
const openaiProvider = AIProviderFactory.createProvider({
  type: AIProviderType.OPENAI,
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 1500,
});

// Create Anthropic provider
const anthropicProvider = AIProviderFactory.createProvider({
  type: AIProviderType.ANTHROPIC,
  model: 'claude-3-sonnet-20240229',
  temperature: 0.5,
  maxTokens: 2000,
});

// Create custom URL provider
const customProvider = AIProviderFactory.createProvider({
  type: AIProviderType.CUSTOM_URL,
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  apiKey: 'your-custom-api-key',
});

// Create Ollama provider
const ollamaProvider = AIProviderFactory.createProvider({
  type: AIProviderType.OLLAMA,
  endpoint: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.7,
});

// Create LM Studio provider
const lmStudioProvider = AIProviderFactory.createProvider({
  type: AIProviderType.LM_STUDIO,
  endpoint: 'http://localhost:1234',
  model: 'local-model',
  temperature: 0.7,
});
```

### Fallback Chain Implementation

```typescript
import {
  AIProviderFactory,
  AIProviderType,
  IAIProvider,
} from '@code-check/shared';

async function createProviderWithFallback(): Promise<IAIProvider> {
  const providerConfigs = [
    { type: AIProviderType.OPENAI },
    { type: AIProviderType.ANTHROPIC },
    {
      type: AIProviderType.CUSTOM_URL,
      endpoint: 'https://api.openai.com/v1/chat/completions',
    },
    {
      type: AIProviderType.OLLAMA,
      endpoint: 'http://localhost:11434',
    },
    {
      type: AIProviderType.LM_STUDIO,
      endpoint: 'http://localhost:1234',
    },
  ];

  for (const config of providerConfigs) {
    try {
      if (AIProviderFactory.validateEnvironment(config.type)) {
        return AIProviderFactory.createProvider(config);
      }
    } catch (error) {
      console.warn(`Failed to create ${config.type} provider:`, error);
    }
  }

  throw new Error('No AI providers are properly configured');
}

// Usage with automatic fallback
async function queryWithFallback(prompt: string): Promise<string> {
  const provider = await createProviderWithFallback();
  return provider.sendRequest(prompt);
}
```

### Local Provider Setup

```typescript
import { AIProviderFactory, AIProviderType } from '@code-check/shared';

// Setup Ollama provider
const setupOllama = async () => {
  const provider = AIProviderFactory.createProvider({
    type: AIProviderType.OLLAMA,
    endpoint: 'http://localhost:11434',
    model: 'llama2',
    temperature: 0.7,
    timeout: 60000, // Longer timeout for local processing
  });

  try {
    const response = await provider.sendRequest('Hello, can you help me?');
    console.log('Ollama response:', response);
  } catch (error) {
    console.error('Ollama error:', error);
    // Fallback to cloud provider
  }
};

// Setup LM Studio provider
const setupLMStudio = async () => {
  const provider = AIProviderFactory.createProvider({
    type: AIProviderType.LM_STUDIO,
    endpoint: 'http://localhost:1234',
    model: 'local-model',
    temperature: 0.7,
    timeout: 60000,
  });

  try {
    const response = await provider.sendRequest('What is machine learning?');
    console.log('LM Studio response:', response);
  } catch (error) {
    console.error('LM Studio error:', error);
    // Fallback to cloud provider
  }
};
```

## Advanced Configuration and Error Handling

### Validation and Configuration Debugging

```typescript
import { AIProviderConfig, AIProviderType } from '@code-check/shared';

const config = AIProviderConfig.getInstance();

// Validate all providers
const validateAllProviders = () => {
  const providers = [
    AIProviderType.OPENAI,
    AIProviderType.ANTHROPIC,
    AIProviderType.CUSTOM_URL,
  ];

  providers.forEach((providerType) => {
    const validation = config.validateProvider(providerType);
    if (!validation.isValid) {
      console.error(`${providerType} configuration errors:`, validation.errors);
    } else {
      console.log(`${providerType} is properly configured`);
    }
  });
};

// Get comprehensive configuration overview
const debugConfiguration = () => {
  const allConfig = config.getAllConfig();
  console.log('Current configuration:', JSON.stringify(allConfig, null, 2));

  // Check environment setup for each provider
  Object.values(AIProviderType).forEach((type) => {
    const isValid = AIProviderFactory.validateEnvironment(type);
    console.log(`${type} environment validation:`, isValid);
  });
};
```

### Rate Limiting and Request Management

```typescript
import { IAIProvider } from '@code-check/shared';

class RateLimitedProvider implements IAIProvider {
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequest = 0;
  private minInterval = 1000; // 1 second between requests
  private maxConcurrent = 3;
  private currentRequests = 0;

  constructor(private baseProvider: IAIProvider) {}

  validateApiKey(): boolean {
    return this.baseProvider.validateApiKey();
  }

  setModel(model: string): void {
    this.baseProvider.setModel(model);
  }

  setTemperature(temperature: number): void {
    this.baseProvider.setTemperature(temperature);
  }

  async sendRequest(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeRequest(prompt);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async executeRequest(prompt: string): Promise<string> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
    this.currentRequests++;

    try {
      return await this.baseProvider.sendRequest(prompt);
    } finally {
      this.currentRequests--;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.currentRequests >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.currentRequests < this.maxConcurrent
    ) {
      const request = this.requestQueue.shift();
      if (request) {
        request(); // Execute without await to allow concurrent processing
      }
    }

    this.isProcessing = false;
  }
}
```

### Error Handling and Recovery

```typescript
import { IAIProvider } from '@code-check/shared';

class ResilientProvider implements IAIProvider {
  private maxRetries = 3;
  private retryDelay = 1000;
  private backoffMultiplier = 2;

  constructor(private baseProvider: IAIProvider) {}

  validateApiKey(): boolean {
    return this.baseProvider.validateApiKey();
  }

  setModel(model: string): void {
    this.baseProvider.setModel(model);
  }

  setTemperature(temperature: number): void {
    this.baseProvider.setTemperature(temperature);
  }

  async sendRequest(prompt: string): Promise<string> {
    let lastError: Error;
    let delay = this.retryDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.baseProvider.sendRequest(prompt);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors
        if (this.isAuthError(error)) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        console.warn(
          `Request failed (attempt ${attempt + 1}/${this.maxRetries + 1}):`,
          error
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= this.backoffMultiplier;
      }
    }

    throw new Error(
      `Request failed after ${this.maxRetries + 1} attempts: ${lastError.message}`
    );
  }

  private isAuthError(error: any): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('api key') ||
      message.includes('unauthorized') ||
      message.includes('authentication')
    );
  }
}
```

## Provider-Specific Tips

### OpenAI Best Practices

- **Rate Limits**: OpenAI has tier-based rate limits. Monitor your usage.
- **Model Selection**: Use `gpt-3.5-turbo` for cost-effective solutions, `gpt-4` for complex tasks.
- **Temperature**: Use 0.7-0.9 for creative tasks, 0.1-0.3 for factual responses.
- **Token Management**: Monitor token usage to control costs.

### Anthropic Best Practices

- **Temperature Range**: Anthropic uses 0-1 range (different from OpenAI's 0-2).
- **Model Selection**: `claude-3-haiku-20240307` is fastest, `claude-3-opus-20240229` is most capable.
- **Context Length**: Claude models have large context windows (100k+ tokens).

### Local Provider Best Practices

- **Ollama Setup**: Ensure models are pulled with `ollama pull llama2`.
- **LM Studio Setup**: Load models in LM Studio before use.
- **Timeout Settings**: Use longer timeouts (60s+) for local processing.
- **Resource Management**: Monitor CPU/GPU usage during inference.

## Configuration Helper Functions

For debugging and configuration management, use the [AIProviderConfig](./AIProviderConfig.ts) helper functions:

```typescript
import { AIProviderConfig } from '@code-check/shared';

const config = AIProviderConfig.getInstance();

// Get configuration for specific provider
const openaiConfig = {
  apiKey: config.getApiKey(AIProviderType.OPENAI),
  model: config.getModel(AIProviderType.OPENAI),
  temperature: config.getTemperature(AIProviderType.OPENAI),
  maxTokens: config.getMaxTokens(AIProviderType.OPENAI),
};

// Validate provider configuration
const validation = config.validateProvider(AIProviderType.OPENAI);
if (!validation.isValid) {
  console.error('Configuration issues:', validation.errors);
}

// Get all configuration for debugging
const allConfig = config.getAllConfig();
console.log('Full configuration:', JSON.stringify(allConfig, null, 2));
```

## Testing

The abstraction layer is designed to be easily testable:

```typescript
import { vi } from 'vitest';
import { OpenAIProvider } from '@code-check/shared';

// Mock fetch for testing
global.fetch = vi.fn();

test('should handle API response', async () => {
  process.env.OPENAI_API_KEY = 'test-key';

  const mockResponse = {
    ok: true,
    json: vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Test response' } }],
    }),
  };

  (global.fetch as any).mockResolvedValue(mockResponse);

  const provider = new OpenAIProvider();
  const result = await provider.sendRequest('Test prompt');

  expect(result).toBe('Test response');
});

// Test error handling
test('should handle API errors', async () => {
  process.env.OPENAI_API_KEY = 'test-key';

  const mockResponse = {
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
  };

  (global.fetch as any).mockResolvedValue(mockResponse);

  const provider = new OpenAIProvider();
  await expect(provider.sendRequest('Test prompt')).rejects.toThrow('401');
});
```

## Best Practices

1. **Environment Variables**: Always use environment variables for API keys and sensitive configuration
2. **Error Handling**: Implement proper error handling with fallbacks and retry logic
3. **Validation**: Validate configuration before making requests using `AIProviderConfig.validateProvider()`
4. **Rate Limiting**: Implement rate limiting for production use to avoid API limits
5. **Logging**: Use wrapper patterns for request/response logging and monitoring
6. **Testing**: Mock providers in tests to avoid API costs and ensure reliable tests
7. **Fallback Chains**: Configure multiple providers for resilience
8. **Local Development**: Use Ollama or LM Studio for development to reduce API costs
9. **Security**: Never commit API keys to version control
10. **Monitoring**: Track API usage, costs, and performance metrics

## Contributing

When adding new providers:

1. Implement the `IAIProvider` interface
2. Add appropriate environment variable handling in `AIProviderConfig`
3. Include provider-specific validation logic
4. Add comprehensive tests with mocking
5. Update this documentation
6. Add examples in the examples directory

## TypeScript Support

The abstraction layer is built with TypeScript and provides full type safety:

```typescript
import type { IAIProvider, AIProviderConfig } from '@code-check/shared';

// All interfaces are properly typed
const provider: IAIProvider = AIProviderFactory.createProvider({
  type: AIProviderType.OPENAI, // Enum ensures valid values
  temperature: 0.5, // Type checked to be number
});
```

## Related Files

- [AIProviderConfig.ts](./AIProviderConfig.ts) - Configuration management and validation
- [AIProviderFactory.ts](./AIProviderFactory.ts) - Factory for creating providers
- [IAIProvider.ts](./IAIProvider.ts) - Provider interface and implementations
- [examples/ai-provider-usage.ts](./examples/ai-provider-usage.ts) - Usage examples
