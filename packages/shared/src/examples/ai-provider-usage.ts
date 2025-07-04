/**
 * Example usage of the AI Provider abstraction layer
 *
 * This file demonstrates how to use the provider-agnostic interface
 * for OpenAI, Anthropic, and custom URL endpoints.
 */

import { IAIProvider } from '../IAIProvider.js';
import { AIProviderFactory, AIProviderType } from '../AIProviderFactory.js';
import { AIProviderConfig } from '../AIProviderConfig.js';

// Example 1: Basic usage with factory pattern
export async function basicUsageExample() {
  // Create an OpenAI provider
  const openaiProvider = AIProviderFactory.createProvider({
    type: AIProviderType.OPENAI,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Create an Anthropic provider
  const anthropicProvider = AIProviderFactory.createProvider({
    type: AIProviderType.ANTHROPIC,
    model: 'claude-3-haiku-20240307',
    temperature: 0.5,
    maxTokens: 800,
  });

  // Create a custom URL provider
  const customProvider = AIProviderFactory.createProvider({
    type: AIProviderType.CUSTOM_URL,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'llama-2-7b',
    temperature: 0.8,
    apiKey: 'your-custom-api-key',
  });

  // Use any provider with the same interface
  const providers: IAIProvider[] = [
    openaiProvider,
    anthropicProvider,
    customProvider,
  ];

  for (const provider of providers) {
    try {
      const response = await provider.sendRequest(
        'Explain the concept of recursion in programming.'
      );
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Example 2: Environment-based configuration
export async function environmentConfigExample() {
  try {
    // This will read AI_PROVIDER_TYPE from environment and create appropriate provider
    const provider = AIProviderFactory.createFromEnvironment();

    // Optionally configure the provider after creation
    provider.setModel('gpt-4');
    provider.setTemperature(0.9);

    const response = await provider.sendRequest(
      'What are the benefits of TypeScript?'
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Failed to create provider from environment:', error);
  }
}

// Example 3: Configuration validation
export function configurationValidationExample() {
  const config = AIProviderConfig.getInstance();

  // Check if OpenAI is properly configured
  const openaiValidation = config.validateProvider(AIProviderType.OPENAI);
  if (!openaiValidation.isValid) {
    console.error('OpenAI configuration errors:', openaiValidation.errors);
  }

  // Check if Anthropic is properly configured
  const anthropicValidation = config.validateProvider(AIProviderType.ANTHROPIC);
  if (!anthropicValidation.isValid) {
    console.error(
      'Anthropic configuration errors:',
      anthropicValidation.errors
    );
  }

  // Get comprehensive configuration overview
  const allConfig = config.getAllConfig();
  console.log('Current configuration:', JSON.stringify(allConfig, null, 2));
}

// Example 4: Dynamic provider switching
export async function dynamicProviderSwitchingExample() {
  const config = AIProviderConfig.getInstance();
  const providers: IAIProvider[] = [];

  // Try to create providers for all available configurations
  if (AIProviderFactory.validateEnvironment(AIProviderType.OPENAI)) {
    providers.push(
      AIProviderFactory.createProvider({
        type: AIProviderType.OPENAI,
        model: config.getModel(AIProviderType.OPENAI),
        temperature: config.getTemperature(AIProviderType.OPENAI),
      })
    );
  }

  if (AIProviderFactory.validateEnvironment(AIProviderType.ANTHROPIC)) {
    providers.push(
      AIProviderFactory.createProvider({
        type: AIProviderType.ANTHROPIC,
        model: config.getModel(AIProviderType.ANTHROPIC),
        temperature: config.getTemperature(AIProviderType.ANTHROPIC),
      })
    );
  }

  if (AIProviderFactory.validateEnvironment(AIProviderType.CUSTOM_URL)) {
    providers.push(
      AIProviderFactory.createProvider({
        type: AIProviderType.CUSTOM_URL,
        endpoint: config.getCustomEndpoint()!,
        model: config.getModel(AIProviderType.CUSTOM_URL),
        temperature: config.getTemperature(AIProviderType.CUSTOM_URL),
      })
    );
  }

  if (providers.length === 0) {
    throw new Error('No AI providers are properly configured');
  }

  // Use the first available provider as primary, others as fallbacks
  const prompt = 'Write a short poem about programming';

  for (let i = 0; i < providers.length; i++) {
    try {
      console.log(`Trying provider ${i + 1}...`);
      const response = await providers[i].sendRequest(prompt);
      console.log('Success! Response:', response);
      return response;
    } catch (error) {
      console.error(`Provider ${i + 1} failed:`, error);
      if (i === providers.length - 1) {
        throw new Error('All providers failed');
      }
    }
  }
}

// Example 5: Custom provider implementation
export class LoggingProviderWrapper implements IAIProvider {
  constructor(private wrappedProvider: IAIProvider) {}

  validateApiKey(): boolean {
    return this.wrappedProvider.validateApiKey();
  }

  setModel(model: string): void {
    console.log(`Setting model to: ${model}`);
    this.wrappedProvider.setModel(model);
  }

  setTemperature(temperature: number): void {
    console.log(`Setting temperature to: ${temperature}`);
    this.wrappedProvider.setTemperature(temperature);
  }

  async sendRequest(prompt: string): Promise<string> {
    console.log(`Sending request: ${prompt.substring(0, 50)}...`);
    const startTime = Date.now();

    try {
      const response = await this.wrappedProvider.sendRequest(prompt);
      const duration = Date.now() - startTime;
      console.log(`Request completed in ${duration}ms`);
      console.log(`Response: ${response.substring(0, 100)}...`);
      return response;
    } catch (error) {
      console.error(`Request failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }
}

// Example usage of wrapper
export async function wrappedProviderExample() {
  const baseProvider = AIProviderFactory.createProvider({
    type: AIProviderType.OPENAI,
    model: 'gpt-3.5-turbo',
  });

  const loggingProvider = new LoggingProviderWrapper(baseProvider);

  await loggingProvider.sendRequest('Explain the decorator pattern');
}

// Environment variables setup guide
export const environmentVariablesGuide = `
To use the AI Provider abstraction layer, set up these environment variables:

Required for all providers:
- AI_PROVIDER_TYPE: 'openai' | 'anthropic' | 'custom-url'

For OpenAI:
- OPENAI_API_KEY: Your OpenAI API key
- OPENAI_MODEL: (optional) Model to use (default: gpt-3.5-turbo)
- OPENAI_TEMPERATURE: (optional) Temperature setting (default: 0.7)
- OPENAI_MAX_TOKENS: (optional) Max tokens (default: 1000)

For Anthropic:
- ANTHROPIC_API_KEY: Your Anthropic API key
- ANTHROPIC_MODEL: (optional) Model to use (default: claude-3-haiku-20240307)
- ANTHROPIC_TEMPERATURE: (optional) Temperature setting (default: 0.7)
- ANTHROPIC_MAX_TOKENS: (optional) Max tokens (default: 1000)

For Custom URL:
- AI_CUSTOM_ENDPOINT: The custom API endpoint URL
- CUSTOM_AI_API_KEY: (optional) API key for custom endpoint
- CUSTOM_AI_MODEL: (optional) Model name
- CUSTOM_AI_TEMPERATURE: (optional) Temperature setting
- CUSTOM_AI_MAX_TOKENS: (optional) Max tokens

Global fallback settings:
- AI_MODEL: Fallback model for any provider
- AI_TEMPERATURE: Fallback temperature for any provider
- AI_MAX_TOKENS: Fallback max tokens for any provider
- AI_TIMEOUT: Request timeout in milliseconds
- AI_API_KEY: Fallback API key (mainly for custom URLs)

Example .env file:
AI_PROVIDER_TYPE=openai
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.8
AI_MAX_TOKENS=1500
AI_TIMEOUT=30000
`;
