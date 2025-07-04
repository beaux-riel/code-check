import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Divider,
  HStack,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useElectronAPI } from '../hooks/useElectronAPI';

const Settings: React.FC = () => {
  const toast = useToast();
  const {
    getAppVersion,
    getPlatform,
    getStoreValue,
    setStoreValue,
    getBackendStatus,
    getOllamaStatus,
  } = useElectronAPI();

  const [appVersion, setAppVersion] = useState('');
  const [platform, setPlatform] = useState('');
  const [backendStatus, setBackendStatus] = useState({
    running: false,
    port: null,
  });
  const [ollamaStatus, setOllamaStatus] = useState({
    running: false,
    models: [],
  });

  // Settings state
  const [settings, setSettings] = useState({
    autoStart: false,
    minimizeToTray: false,
    checkUpdatesAutomatically: true,
    logLevel: 'info',
    maxLogFiles: 10,
    customBackendUrl: '',
    enableNotifications: true,
    theme: 'system',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const version = await getAppVersion();
        const platformInfo = await getPlatform();
        const backend = await getBackendStatus();
        const ollama = await getOllamaStatus();

        setAppVersion(version);
        setPlatform(platformInfo);
        setBackendStatus(backend);
        setOllamaStatus(ollama);

        // Load saved settings
        const savedSettings = await getStoreValue('settings');
        if (savedSettings) {
          setSettings({ ...settings, ...savedSettings });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await setStoreValue('settings', newSettings);
      toast({
        title: 'Settings saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetSettings = async () => {
    try {
      await setStoreValue('settings', {});
      setSettings({
        autoStart: false,
        minimizeToTray: false,
        checkUpdatesAutomatically: true,
        logLevel: 'info',
        maxLogFiles: 10,
        customBackendUrl: '',
        enableNotifications: true,
        theme: 'system',
      });

      toast({
        title: 'Settings reset',
        description: 'All settings have been reset to default values',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error resetting settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} maxWidth="800px" margin="0 auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Settings
          </Heading>
          <Text color="gray.600">Configure CodeCheck Desktop application</Text>
        </Box>

        {/* System Information */}
        <Card>
          <CardHeader>
            <Heading size="md">System Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">App Version:</Text>
                <Badge colorScheme="blue">{appVersion}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">Platform:</Text>
                <Badge>{platform}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">Backend Status:</Text>
                <Badge colorScheme={backendStatus.running ? 'green' : 'red'}>
                  {backendStatus.running
                    ? `Running on port ${backendStatus.port}`
                    : 'Stopped'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">Ollama Status:</Text>
                <Badge colorScheme={ollamaStatus.running ? 'green' : 'red'}>
                  {ollamaStatus.running
                    ? `Running (${ollamaStatus.models.length} models)`
                    : 'Stopped'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Application Settings</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-start" mb="0">
                  Auto-start on system boot
                </FormLabel>
                <Switch
                  id="auto-start"
                  isChecked={settings.autoStart}
                  onChange={(e) =>
                    handleSettingChange('autoStart', e.target.checked)
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="minimize-tray" mb="0">
                  Minimize to system tray
                </FormLabel>
                <Switch
                  id="minimize-tray"
                  isChecked={settings.minimizeToTray}
                  onChange={(e) =>
                    handleSettingChange('minimizeToTray', e.target.checked)
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-update" mb="0">
                  Check for updates automatically
                </FormLabel>
                <Switch
                  id="auto-update"
                  isChecked={settings.checkUpdatesAutomatically}
                  onChange={(e) =>
                    handleSettingChange(
                      'checkUpdatesAutomatically',
                      e.target.checked
                    )
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="notifications" mb="0">
                  Enable notifications
                </FormLabel>
                <Switch
                  id="notifications"
                  isChecked={settings.enableNotifications}
                  onChange={(e) =>
                    handleSettingChange('enableNotifications', e.target.checked)
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Theme</FormLabel>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Advanced Settings</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Log Level</FormLabel>
                <Select
                  value={settings.logLevel}
                  onChange={(e) =>
                    handleSettingChange('logLevel', e.target.value)
                  }
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Maximum Log Files</FormLabel>
                <Input
                  type="number"
                  value={settings.maxLogFiles}
                  onChange={(e) =>
                    handleSettingChange('maxLogFiles', parseInt(e.target.value))
                  }
                  min={1}
                  max={100}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Custom Backend URL (optional)</FormLabel>
                <Input
                  placeholder="http://localhost:3001"
                  value={settings.customBackendUrl}
                  onChange={(e) =>
                    handleSettingChange('customBackendUrl', e.target.value)
                  }
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Leave empty to use the embedded backend server
                </Text>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Actions</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Reset Settings</AlertTitle>
                  <AlertDescription>
                    This will reset all settings to their default values. This
                    action cannot be undone.
                  </AlertDescription>
                </Box>
              </Alert>

              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleResetSettings}
                alignSelf="flex-start"
              >
                Reset to Defaults
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Settings;
