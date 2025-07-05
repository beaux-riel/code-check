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
  });

  const [isLoading, setIsLoading] = useState(false);

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

  const handleReset = () => {
    setSettings({
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30,
      theme: 'system',
      maxConcurrentAudits: 3,
      apiTimeout: 30,
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
