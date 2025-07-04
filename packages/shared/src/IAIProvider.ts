export interface IAIProvider {
  sendRequest(prompt: string): Promise<string>;
  setModel(model: string): void;
  setTemperature(temperature: number): void;
  validateApiKey(): boolean;
}

export interface AIProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export class OpenAIProvider implements IAIProvider {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;

  constructor(config: AIProviderOptions = {}) {
    this.apiKey = this.loadApiKey('OPENAI_API_KEY');
    this.model = config.model || 'gpt-3.5-turbo';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
  }

  private loadApiKey(envVar: string): string {
    const apiKey = process.env[envVar];
    if (!apiKey) {
      throw new Error(`${envVar} environment variable is required`);
    }
    return apiKey;
  }

  validateApiKey(): boolean {
    return !!(this.apiKey && this.apiKey.length > 0);
  }

  setModel(model: string): void {
    this.model = model;
  }

  setTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.temperature = temperature;
  }

  async sendRequest(prompt: string): Promise<string> {
    if (!this.validateApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from OpenAI';
    } catch (error) {
      throw new Error(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export class AnthropicProvider implements IAIProvider {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;

  constructor(config: AIProviderOptions = {}) {
    this.apiKey = this.loadApiKey('ANTHROPIC_API_KEY');
    this.model = config.model || 'claude-3-haiku-20240307';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
  }

  private loadApiKey(envVar: string): string {
    const apiKey = process.env[envVar];
    if (!apiKey) {
      throw new Error(`${envVar} environment variable is required`);
    }
    return apiKey;
  }

  validateApiKey(): boolean {
    return !!(this.apiKey && this.apiKey.length > 0);
  }

  setModel(model: string): void {
    this.model = model;
  }

  setTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }
    this.temperature = temperature;
  }

  async sendRequest(prompt: string): Promise<string> {
    if (!this.validateApiKey()) {
      throw new Error('Invalid or missing Anthropic API key');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `Anthropic API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.content[0]?.text || 'No response from Anthropic';
    } catch (error) {
      throw new Error(
        `Anthropic request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export class CustomURLProvider implements IAIProvider {
  private endpoint: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(
    endpoint: string,
    config: AIProviderOptions & {
      apiKey?: string;
      headers?: Record<string, string>;
    } = {}
  ) {
    this.endpoint = endpoint;
    this.model = config.model || 'default-model';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.apiKey = config.apiKey || process.env.CUSTOM_AI_API_KEY;
    this.headers = config.headers || { 'Content-Type': 'application/json' };
  }

  validateApiKey(): boolean {
    // For custom URLs, API key might be optional
    return true;
  }

  setModel(model: string): void {
    this.model = model;
  }

  setTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.temperature = temperature;
  }

  async sendRequest(prompt: string): Promise<string> {
    const headers = { ...this.headers };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `Custom URL API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // Try to extract response from common response formats
      return (
        data.choices?.[0]?.message?.content ||
        data.content?.[0]?.text ||
        data.response ||
        data.text ||
        'No response from custom endpoint'
      );
    } catch (error) {
      throw new Error(
        `Custom URL request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
