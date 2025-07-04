import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OpenAIProvider,
  AnthropicProvider,
  CustomURLProvider,
} from '../IAIProvider.js';
import { AIProviderFactory, AIProviderType } from '../AIProviderFactory.js';
import { AIProviderConfig } from '../AIProviderConfig.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env = {};
  });

  describe('OpenAIProvider', () => {
    it('should initialize with default values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = new OpenAIProvider();
      expect(provider.validateApiKey()).toBe(true);
    });

    it('should throw error when API key is missing', () => {
      expect(() => new OpenAIProvider()).toThrow(
        'OPENAI_API_KEY environment variable is required'
      );
    });

    it('should validate temperature range', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = new OpenAIProvider();

      expect(() => provider.setTemperature(-1)).toThrow(
        'Temperature must be between 0 and 2'
      );
      expect(() => provider.setTemperature(3)).toThrow(
        'Temperature must be between 0 and 2'
      );
      expect(() => provider.setTemperature(1.5)).not.toThrow();
    });

    it('should make successful API request', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = new OpenAIProvider();

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.sendRequest('Test prompt');
      expect(result).toBe('Test response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });
  });

  describe('AnthropicProvider', () => {
    it('should initialize with default values', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = new AnthropicProvider();
      expect(provider.validateApiKey()).toBe(true);
    });

    it('should validate temperature range for Anthropic', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = new AnthropicProvider();

      expect(() => provider.setTemperature(-1)).toThrow(
        'Temperature must be between 0 and 1'
      );
      expect(() => provider.setTemperature(2)).toThrow(
        'Temperature must be between 0 and 1'
      );
      expect(() => provider.setTemperature(0.7)).not.toThrow();
    });

    it('should make successful API request', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = new AnthropicProvider();

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ text: 'Anthropic response' }],
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.sendRequest('Test prompt');
      expect(result).toBe('Anthropic response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
          }),
        })
      );
    });
  });

  describe('CustomURLProvider', () => {
    it('should initialize with custom endpoint', () => {
      const provider = new CustomURLProvider('https://api.example.com/v1/chat');
      expect(provider.validateApiKey()).toBe(true); // Custom URL doesn't require API key
    });

    it('should make successful API request to custom endpoint', async () => {
      const provider = new CustomURLProvider(
        'https://api.example.com/v1/chat',
        {
          apiKey: 'custom-key',
        }
      );

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Custom response' } }],
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.sendRequest('Test prompt');
      expect(result).toBe('Custom response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer custom-key',
          }),
        })
      );
    });
  });

  describe('AIProviderFactory', () => {
    it('should create OpenAI provider', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = AIProviderFactory.createProvider({
        type: AIProviderType.OPENAI,
        model: 'gpt-4',
        temperature: 0.8,
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create Anthropic provider', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = AIProviderFactory.createProvider({
        type: AIProviderType.ANTHROPIC,
        model: 'claude-3-opus-20240229',
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create Custom URL provider', () => {
      const provider = AIProviderFactory.createProvider({
        type: AIProviderType.CUSTOM_URL,
        endpoint: 'https://api.example.com/v1/chat',
      });

      expect(provider).toBeInstanceOf(CustomURLProvider);
    });

    it('should throw error for custom URL without endpoint', () => {
      expect(() =>
        AIProviderFactory.createProvider({
          type: AIProviderType.CUSTOM_URL,
        })
      ).toThrow('Custom URL provider requires an endpoint');
    });

    it('should create provider from environment', () => {
      process.env.AI_PROVIDER_TYPE = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';

      const provider = AIProviderFactory.createFromEnvironment();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should validate environment for different providers', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(AIProviderFactory.validateEnvironment(AIProviderType.OPENAI)).toBe(
        true
      );
      expect(
        AIProviderFactory.validateEnvironment(AIProviderType.ANTHROPIC)
      ).toBe(false);
    });
  });

  describe('AIProviderConfig', () => {
    beforeEach(() => {
      // Reset the singleton instance for each test
      (AIProviderConfig as any).instance = undefined;
    });

    it('should load configuration from environment', () => {
      process.env.AI_PROVIDER_TYPE = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_TEMPERATURE = '0.8';

      const config = AIProviderConfig.getInstance();
      expect(config.getProviderType()).toBe(AIProviderType.OPENAI);
      expect(config.getApiKey(AIProviderType.OPENAI)).toBe('test-key');
      expect(config.getModel(AIProviderType.OPENAI)).toBe('gpt-4');
      expect(config.getTemperature(AIProviderType.OPENAI)).toBe(0.8);
    });

    it('should validate provider configuration', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_TEMPERATURE = '0.5';

      const config = AIProviderConfig.getInstance();
      const validation = config.validateProvider(AIProviderType.OPENAI);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      // Ensure no API key is set for this test
      delete process.env.OPENAI_API_KEY;

      const config = AIProviderConfig.getInstance();
      const validation = config.validateProvider(AIProviderType.OPENAI);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'OPENAI_API_KEY environment variable is required'
      );
    });

    it('should provide comprehensive configuration overview', () => {
      process.env.AI_PROVIDER_TYPE = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.AI_MODEL = 'gpt-4';

      const config = AIProviderConfig.getInstance();
      const allConfig = config.getAllConfig();

      expect(allConfig.providerType).toBe(AIProviderType.OPENAI);
      expect(allConfig.providers.openai.hasApiKey).toBe(true);
      expect(allConfig.providers.openai.model).toBe('gpt-4');
    });
  });
});
