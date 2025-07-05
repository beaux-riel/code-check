import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  Input,
  Text,
  Divider,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';

interface SettingsState {
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'system';
  maxConcurrentAudits: number;
  apiTimeout: number;
  // AI Configuration
  aiEnabled: boolean;
  aiProvider: 'openai' | 'anthropic' | 'local';
  aiApiKey: string;
  aiModel: string;
  aiMaxTokens: number;
  aiTemperature: number;
  aiAnalysisEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  aiAutoFixEnabled: boolean;
}

const Settings: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    theme: 'system',
    maxConcurrentAudits: 3,
    apiTimeout: 30,
    // AI Configuration defaults
    aiEnabled: false,
    aiProvider: 'openai',
    aiApiKey: '',
    aiModel: 'gpt-4',
    aiMaxTokens: 2048,
    aiTemperature: 0.3,
    aiAnalysisEnabled: true,
    aiSuggestionsEnabled: true,
    aiAutoFixEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    connected: boolean;
    model: string;
    lastChecked: string;
    error?: string;
  }>({
    connected: false,
    model: '',
    lastChecked: '',
  });
  const [isTestingAi, setIsTestingAi] = useState(false);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would save to the API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    try {
      // Simulate AI connection test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful connection
      setAiStatus({
        connected: true,
        model: settings.aiModel,
        lastChecked: new Date().toLocaleString(),
      });

      toast({
        title: 'AI Connection Successful',
        description: `Successfully connected to ${settings.aiProvider} with model ${settings.aiModel}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setAiStatus({
        connected: false,
        model: '',
        lastChecked: new Date().toLocaleString(),
        error: 'Failed to connect to AI service',
      });

      toast({
        title: 'AI Connection Failed',
        description: 'Please check your API key and settings.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleReset = () => {
    setSettings({
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30,
      theme: 'system',
      maxConcurrentAudits: 3,
      apiTimeout: 30,
      aiEnabled: false,
      aiProvider: 'openai',
      aiApiKey: '',
      aiModel: 'gpt-4',
      aiMaxTokens: 2048,
      aiTemperature: 0.3,
      aiAnalysisEnabled: true,
      aiSuggestionsEnabled: true,
      aiAutoFixEnabled: false,
    });

    setAiStatus({
      connected: false,
      model: '',
      lastChecked: '',
    });

    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to defaults.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Settings</Heading>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">General</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="notifications" mb="0">
                  Enable notifications
                </FormLabel>
                <Switch
                  id="notifications"
                  isChecked={settings.notifications}
                  onChange={(e) =>
                    handleSettingChange('notifications', e.target.checked)
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="autoRefresh" mb="0">
                  Auto-refresh data
                </FormLabel>
                <Switch
                  id="autoRefresh"
                  isChecked={settings.autoRefresh}
                  onChange={(e) =>
                    handleSettingChange('autoRefresh', e.target.checked)
                  }
                />
              </FormControl>

              {settings.autoRefresh && (
                <FormControl>
                  <FormLabel>Refresh interval (seconds)</FormLabel>
                  <NumberInput
                    value={settings.refreshInterval}
                    min={5}
                    max={300}
                    onChange={(value) =>
                      handleSettingChange(
                        'refreshInterval',
                        parseInt(value) || 30
                      )
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Theme preference</FormLabel>
                <Select
                  value={settings.theme}
                  onChange={(e) =>
                    handleSettingChange(
                      'theme',
                      e.target.value as 'light' | 'dark' | 'system'
                    )
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Performance</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Maximum concurrent audits</FormLabel>
                <NumberInput
                  value={settings.maxConcurrentAudits}
                  min={1}
                  max={10}
                  onChange={(value) =>
                    handleSettingChange(
                      'maxConcurrentAudits',
                      parseInt(value) || 3
                    )
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500">
                  Controls how many audits can run simultaneously
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>API timeout (seconds)</FormLabel>
                <NumberInput
                  value={settings.apiTimeout}
                  min={10}
                  max={120}
                  onChange={(value) =>
                    handleSettingChange('apiTimeout', parseInt(value) || 30)
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500">
                  Maximum time to wait for API responses
                </Text>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">AI Configuration</Heading>
              <HStack>
                <Text
                  fontSize="sm"
                  color={aiStatus.connected ? 'green.500' : 'red.500'}
                >
                  {aiStatus.connected ? 'Connected' : 'Disconnected'}
                </Text>
                <Button
                  size="sm"
                  onClick={handleTestAiConnection}
                  isLoading={isTestingAi}
                  loadingText="Testing..."
                  isDisabled={!settings.aiEnabled || !settings.aiApiKey}
                >
                  Test Connection
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="ai-enabled" mb="0">
                  Enable AI Features
                </FormLabel>
                <Switch
                  id="ai-enabled"
                  isChecked={settings.aiEnabled}
                  onChange={(e) =>
                    handleSettingChange('aiEnabled', e.target.checked)
                  }
                />
              </FormControl>

              {settings.aiEnabled && (
                <>
                  <FormControl>
                    <FormLabel>AI Provider</FormLabel>
                    <Select
                      value={settings.aiProvider}
                      onChange={(e) =>
                        handleSettingChange('aiProvider', e.target.value)
                      }
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="local">Local Model</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>API Key</FormLabel>
                    <Input
                      type="password"
                      value={settings.aiApiKey}
                      onChange={(e) =>
                        handleSettingChange('aiApiKey', e.target.value)
                      }
                      placeholder="Enter your API key"
                    />
                    <Text fontSize="sm" color="gray.500">
                      Your API key is stored securely and never shared
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Model</FormLabel>
                    <Select
                      value={settings.aiModel}
                      onChange={(e) =>
                        handleSettingChange('aiModel', e.target.value)
                      }
                    >
                      {settings.aiProvider === 'openai' && (
                        <>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </>
                      )}
                      {settings.aiProvider === 'anthropic' && (
                        <>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">
                            Claude 3 Sonnet
                          </option>
                          <option value="claude-3-haiku">Claude 3 Haiku</option>
                        </>
                      )}
                      {settings.aiProvider === 'local' && (
                        <>
                          <option value="llama-2">Llama 2</option>
                          <option value="codellama">Code Llama</option>
                          <option value="custom">Custom Model</option>
                        </>
                      )}
                    </Select>
                  </FormControl>

                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Max Tokens</FormLabel>
                      <NumberInput
                        value={settings.aiMaxTokens}
                        min={256}
                        max={8192}
                        onChange={(value) =>
                          handleSettingChange(
                            'aiMaxTokens',
                            parseInt(value) || 2048
                          )
                        }
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Temperature</FormLabel>
                      <NumberInput
                        value={settings.aiTemperature}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(value) =>
                          handleSettingChange(
                            'aiTemperature',
                            parseFloat(value) || 0.3
                          )
                        }
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </HStack>

                  <Divider />

                  <Text fontWeight="medium">AI Features</Text>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="ai-analysis" mb="0">
                      AI-powered code analysis
                    </FormLabel>
                    <Switch
                      id="ai-analysis"
                      isChecked={settings.aiAnalysisEnabled}
                      onChange={(e) =>
                        handleSettingChange(
                          'aiAnalysisEnabled',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="ai-suggestions" mb="0">
                      AI improvement suggestions
                    </FormLabel>
                    <Switch
                      id="ai-suggestions"
                      isChecked={settings.aiSuggestionsEnabled}
                      onChange={(e) =>
                        handleSettingChange(
                          'aiSuggestionsEnabled',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="ai-autofix" mb="0">
                      AI automatic code fixes
                    </FormLabel>
                    <Switch
                      id="ai-autofix"
                      isChecked={settings.aiAutoFixEnabled}
                      onChange={(e) =>
                        handleSettingChange(
                          'aiAutoFixEnabled',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  {aiStatus.lastChecked && (
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm" color="gray.600">
                        <strong>Last Connection Test:</strong>{' '}
                        {aiStatus.lastChecked}
                      </Text>
                      {aiStatus.connected && (
                        <Text fontSize="sm" color="green.600">
                          <strong>Active Model:</strong> {aiStatus.model}
                        </Text>
                      )}
                      {aiStatus.error && (
                        <Text fontSize="sm" color="red.600">
                          <strong>Error:</strong> {aiStatus.error}
                        </Text>
                      )}
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <Heading size="md">About</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Version:</Text>
                <Text>1.0.0</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">Build:</Text>
                <Text>2025.01.05</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">API Status:</Text>
                <Text color="green.500">Connected</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">AI Status:</Text>
                <Text
                  color={
                    settings.aiEnabled
                      ? aiStatus.connected
                        ? 'green.500'
                        : 'orange.500'
                      : 'gray.500'
                  }
                >
                  {settings.aiEnabled
                    ? aiStatus.connected
                      ? 'Active'
                      : 'Configured'
                    : 'Disabled'}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Action Buttons */}
        <HStack justify="flex-end" spacing={4}>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save Settings
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Settings;
