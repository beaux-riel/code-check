import { AIProviderType } from './AIProviderFactory.js';

export interface AIProviderEnvironmentConfig {
  // Provider selection
  AI_PROVIDER_TYPE?: string;

  // OpenAI
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_TEMPERATURE?: string;
  OPENAI_MAX_TOKENS?: string;

  // Anthropic
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_TEMPERATURE?: string;
  ANTHROPIC_MAX_TOKENS?: string;

  // Custom URL
  AI_CUSTOM_ENDPOINT?: string;
  CUSTOM_AI_API_KEY?: string;
  CUSTOM_AI_MODEL?: string;
  CUSTOM_AI_TEMPERATURE?: string;
  CUSTOM_AI_MAX_TOKENS?: string;

  // Global settings
  AI_MODEL?: string;
  AI_TEMPERATURE?: string;
  AI_MAX_TOKENS?: string;
  AI_TIMEOUT?: string;
  AI_API_KEY?: string;
}

export class AIProviderConfig {
  private static instance: AIProviderConfig;
  private config: AIProviderEnvironmentConfig;

  private constructor() {
    this.config = this.loadEnvironmentConfig();
  }

  static getInstance(): AIProviderConfig {
    if (!AIProviderConfig.instance) {
      AIProviderConfig.instance = new AIProviderConfig();
    }
    return AIProviderConfig.instance;
  }

  private loadEnvironmentConfig(): AIProviderEnvironmentConfig {
    return {
      AI_PROVIDER_TYPE: process.env.AI_PROVIDER_TYPE,

      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE,
      OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS,

      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
      ANTHROPIC_TEMPERATURE: process.env.ANTHROPIC_TEMPERATURE,
      ANTHROPIC_MAX_TOKENS: process.env.ANTHROPIC_MAX_TOKENS,

      AI_CUSTOM_ENDPOINT: process.env.AI_CUSTOM_ENDPOINT,
      CUSTOM_AI_API_KEY: process.env.CUSTOM_AI_API_KEY,
      CUSTOM_AI_MODEL: process.env.CUSTOM_AI_MODEL,
      CUSTOM_AI_TEMPERATURE: process.env.CUSTOM_AI_TEMPERATURE,
      CUSTOM_AI_MAX_TOKENS: process.env.CUSTOM_AI_MAX_TOKENS,

      AI_MODEL: process.env.AI_MODEL,
      AI_TEMPERATURE: process.env.AI_TEMPERATURE,
      AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
      AI_TIMEOUT: process.env.AI_TIMEOUT,
      AI_API_KEY: process.env.AI_API_KEY,
    };
  }

  /**
   * Get the configured provider type
   */
  getProviderType(): AIProviderType | undefined {
    const type = this.config.AI_PROVIDER_TYPE;
    if (
      type &&
      Object.values(AIProviderType).includes(type as AIProviderType)
    ) {
      return type as AIProviderType;
    }
    return undefined;
  }

  /**
   * Get API key for a specific provider
   */
  getApiKey(providerType: AIProviderType): string | undefined {
    switch (providerType) {
      case AIProviderType.OPENAI:
        return this.config.OPENAI_API_KEY;
      case AIProviderType.ANTHROPIC:
        return this.config.ANTHROPIC_API_KEY;
      case AIProviderType.CUSTOM_URL:
        return this.config.CUSTOM_AI_API_KEY || this.config.AI_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * Get model for a specific provider
   */
  getModel(providerType: AIProviderType): string | undefined {
    switch (providerType) {
      case AIProviderType.OPENAI:
        return this.config.OPENAI_MODEL || this.config.AI_MODEL;
      case AIProviderType.ANTHROPIC:
        return this.config.ANTHROPIC_MODEL || this.config.AI_MODEL;
      case AIProviderType.CUSTOM_URL:
        return this.config.CUSTOM_AI_MODEL || this.config.AI_MODEL;
      default:
        return this.config.AI_MODEL;
    }
  }

  /**
   * Get temperature for a specific provider
   */
  getTemperature(providerType: AIProviderType): number | undefined {
    let tempStr: string | undefined;

    switch (providerType) {
      case AIProviderType.OPENAI:
        tempStr = this.config.OPENAI_TEMPERATURE || this.config.AI_TEMPERATURE;
        break;
      case AIProviderType.ANTHROPIC:
        tempStr =
          this.config.ANTHROPIC_TEMPERATURE || this.config.AI_TEMPERATURE;
        break;
      case AIProviderType.CUSTOM_URL:
        tempStr =
          this.config.CUSTOM_AI_TEMPERATURE || this.config.AI_TEMPERATURE;
        break;
      default:
        tempStr = this.config.AI_TEMPERATURE;
    }

    return tempStr ? parseFloat(tempStr) : undefined;
  }

  /**
   * Get max tokens for a specific provider
   */
  getMaxTokens(providerType: AIProviderType): number | undefined {
    let tokensStr: string | undefined;

    switch (providerType) {
      case AIProviderType.OPENAI:
        tokensStr = this.config.OPENAI_MAX_TOKENS || this.config.AI_MAX_TOKENS;
        break;
      case AIProviderType.ANTHROPIC:
        tokensStr =
          this.config.ANTHROPIC_MAX_TOKENS || this.config.AI_MAX_TOKENS;
        break;
      case AIProviderType.CUSTOM_URL:
        tokensStr =
          this.config.CUSTOM_AI_MAX_TOKENS || this.config.AI_MAX_TOKENS;
        break;
      default:
        tokensStr = this.config.AI_MAX_TOKENS;
    }

    return tokensStr ? parseInt(tokensStr) : undefined;
  }

  /**
   * Get timeout setting
   */
  getTimeout(): number | undefined {
    return this.config.AI_TIMEOUT
      ? parseInt(this.config.AI_TIMEOUT)
      : undefined;
  }

  /**
   * Get custom endpoint URL
   */
  getCustomEndpoint(): string | undefined {
    return this.config.AI_CUSTOM_ENDPOINT;
  }

  /**
   * Validate configuration for a specific provider
   */
  validateProvider(providerType: AIProviderType): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    switch (providerType) {
      case AIProviderType.OPENAI:
        if (!this.config.OPENAI_API_KEY) {
          errors.push('OPENAI_API_KEY environment variable is required');
        }
        break;

      case AIProviderType.ANTHROPIC:
        if (!this.config.ANTHROPIC_API_KEY) {
          errors.push('ANTHROPIC_API_KEY environment variable is required');
        }
        break;

      case AIProviderType.CUSTOM_URL:
        if (!this.config.AI_CUSTOM_ENDPOINT) {
          errors.push('AI_CUSTOM_ENDPOINT environment variable is required');
        }
        break;
    }

    // Validate temperature ranges
    const temperature = this.getTemperature(providerType);
    if (temperature !== undefined) {
      if (
        providerType === AIProviderType.ANTHROPIC &&
        (temperature < 0 || temperature > 1)
      ) {
        errors.push('Temperature for Anthropic must be between 0 and 1');
      } else if (
        providerType !== AIProviderType.ANTHROPIC &&
        (temperature < 0 || temperature > 2)
      ) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    // Validate max tokens
    const maxTokens = this.getMaxTokens(providerType);
    if (maxTokens !== undefined && maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    // Validate timeout
    const timeout = this.getTimeout();
    if (timeout !== undefined && timeout <= 0) {
      errors.push('Timeout must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all configuration as a readable object
   */
  getAllConfig(): Record<string, any> {
    return {
      providerType: this.getProviderType(),
      customEndpoint: this.getCustomEndpoint(),
      timeout: this.getTimeout(),
      providers: {
        openai: {
          hasApiKey: !!this.config.OPENAI_API_KEY,
          model: this.getModel(AIProviderType.OPENAI),
          temperature: this.getTemperature(AIProviderType.OPENAI),
          maxTokens: this.getMaxTokens(AIProviderType.OPENAI),
        },
        anthropic: {
          hasApiKey: !!this.config.ANTHROPIC_API_KEY,
          model: this.getModel(AIProviderType.ANTHROPIC),
          temperature: this.getTemperature(AIProviderType.ANTHROPIC),
          maxTokens: this.getMaxTokens(AIProviderType.ANTHROPIC),
        },
        customUrl: {
          hasApiKey: !!(
            this.config.CUSTOM_AI_API_KEY || this.config.AI_API_KEY
          ),
          model: this.getModel(AIProviderType.CUSTOM_URL),
          temperature: this.getTemperature(AIProviderType.CUSTOM_URL),
          maxTokens: this.getMaxTokens(AIProviderType.CUSTOM_URL),
        },
      },
    };
  }
}
