import {
  IAIProvider,
  OpenAIProvider,
  AnthropicProvider,
  CustomURLProvider,
  AIProviderOptions,
} from './IAIProvider.js';

export enum AIProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM_URL = 'custom-url',
}

export interface AIProviderFactoryConfig extends AIProviderOptions {
  type: AIProviderType;
  endpoint?: string; // Required for custom URL
  apiKey?: string; // Optional override for environment variable
  headers?: Record<string, string>; // Custom headers for custom URL
}

export class AIProviderFactory {
  /**
   * Creates an AI provider based on the specified configuration
   */
  static createProvider(config: AIProviderFactoryConfig): IAIProvider {
    switch (config.type) {
      case AIProviderType.OPENAI:
        return new OpenAIProvider({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          timeout: config.timeout,
        });

      case AIProviderType.ANTHROPIC:
        return new AnthropicProvider({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          timeout: config.timeout,
        });

      case AIProviderType.CUSTOM_URL:
        if (!config.endpoint) {
          throw new Error('Custom URL provider requires an endpoint');
        }
        return new CustomURLProvider(config.endpoint, {
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          timeout: config.timeout,
          apiKey: config.apiKey,
          headers: config.headers,
        });

      default:
        throw new Error(`Unsupported AI provider type: ${config.type}`);
    }
  }

  /**
   * Creates a provider from environment variables
   * Looks for AI_PROVIDER_TYPE environment variable to determine which provider to use
   */
  static createFromEnvironment(): IAIProvider {
    const providerType = process.env.AI_PROVIDER_TYPE as AIProviderType;

    if (!providerType) {
      throw new Error('AI_PROVIDER_TYPE environment variable is required');
    }

    const config: AIProviderFactoryConfig = {
      type: providerType,
      model: process.env.AI_MODEL,
      temperature: process.env.AI_TEMPERATURE
        ? parseFloat(process.env.AI_TEMPERATURE)
        : undefined,
      maxTokens: process.env.AI_MAX_TOKENS
        ? parseInt(process.env.AI_MAX_TOKENS)
        : undefined,
      timeout: process.env.AI_TIMEOUT
        ? parseInt(process.env.AI_TIMEOUT)
        : undefined,
      endpoint: process.env.AI_CUSTOM_ENDPOINT,
      apiKey: process.env.AI_API_KEY,
    };

    return this.createProvider(config);
  }

  /**
   * Creates multiple providers for testing or fallback scenarios
   */
  static createMultipleProviders(
    configs: AIProviderFactoryConfig[]
  ): IAIProvider[] {
    return configs.map((config) => this.createProvider(config));
  }

  /**
   * Validates that all required environment variables are present for a given provider type
   */
  static validateEnvironment(providerType: AIProviderType): boolean {
    switch (providerType) {
      case AIProviderType.OPENAI:
        return !!process.env.OPENAI_API_KEY;

      case AIProviderType.ANTHROPIC:
        return !!process.env.ANTHROPIC_API_KEY;

      case AIProviderType.CUSTOM_URL:
        return !!process.env.AI_CUSTOM_ENDPOINT;

      default:
        return false;
    }
  }
}
