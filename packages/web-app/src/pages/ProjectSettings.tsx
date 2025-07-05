import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Divider,
  useColorModeValue,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckIcon, ArrowBackIcon, AttachmentIcon } from '@chakra-ui/icons';
import { apiService } from '../services/api';
import { Project } from '../types';

interface ProjectSettingsForm {
  name: string;
  description: string;
  language: string;
  path: string;
  // Analysis settings
  includedFiles: string[];
  excludedFiles: string[];
  maxFileSize: number;
  timeout: number;
  concurrency: number;
  enableParallelExecution: boolean;
  // Rule settings
  enabledRulesets: string[];
  customRules: any;
}

const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProjectSettingsForm>({
    name: '',
    description: '',
    language: 'typescript',
    path: '',
    includedFiles: [],
    excludedFiles: ['node_modules', 'dist', 'build', '.git'],
    maxFileSize: 1048576, // 1MB
    timeout: 30000, // 30 seconds
    concurrency: 4,
    enableParallelExecution: true,
    enabledRulesets: ['security', 'performance', 'quality'],
    customRules: {},
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const projectData = await apiService.getProject(projectId);
      setProject(projectData);

      // Initialize settings form with project data
      setSettings((prev) => ({
        ...prev,
        name: projectData.name,
        description: projectData.description,
        language: projectData.language,
        path: projectData.path || '',
        // Other settings would come from project.settings if stored
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch project data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!projectId || !project) return;

    try {
      setSaving(true);

      // Update basic project info
      const updatedProject = await apiService.updateProject(projectId, {
        name: settings.name,
        description: settings.description,
        language: settings.language,
        path: settings.path,
        // Store additional settings in a settings field if the backend supports it
      });

      setProject(updatedProject);

      toast({
        title: 'Settings Saved',
        description: 'Project settings have been updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save project settings',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (project) {
      setSettings((prev) => ({
        ...prev,
        name: project.name,
        description: project.description,
        language: project.language,
        path: project.path || '',
      }));

      toast({
        title: 'Settings Reset',
        description: 'Settings have been reset to their saved values',
        status: 'info',
        duration: 3000,
      });
    }
  };

  const handleArrayInputChange = (
    value: string,
    field: 'includedFiles' | 'excludedFiles'
  ) => {
    const array = value.split('\n').filter((line) => line.trim() !== '');
    setSettings((prev) => ({
      ...prev,
      [field]: array,
    }));
  };

  const handleFolderSelect = () => {
    // Note: Due to browser security restrictions, we can't get the full absolute path
    // Only the folder name is available through the webkitRelativePath API
    const input = document.createElement('input');
    input.type = 'file';
    // @ts-ignore - webkitdirectory is a non-standard attribute
    input.webkitdirectory = true;
    // @ts-ignore - directory is a non-standard attribute
    input.directory = true;
    input.multiple = true;

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        // Extract the directory name from the first file
        const firstFile = files[0];
        // @ts-ignore - webkitRelativePath is a non-standard property
        const relativePath = firstFile.webkitRelativePath || firstFile.name;

        // Get the root folder name from the relative path
        const folderName = relativePath.split('/')[0];

        // Note to user: This is just the folder name, not the full path
        // For security reasons, browsers don't expose the full file system path
        setSettings((prev) => ({
          ...prev,
          path: folderName,
        }));

        toast({
          title: 'Folder Selected',
          description: `Selected folder: ${folderName}. Note: For security reasons, only the folder name is available, not the full path.`,
          status: 'info',
          duration: 5000,
        });
      }
    };

    input.click();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box flex="1">
          <Text fontWeight="bold">Error loading project settings</Text>
          <Text>{error}</Text>
        </Box>
        <Button
          colorScheme="red"
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
        >
          Back to Projects
        </Button>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <Text>Project not found</Text>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumb mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">
            Projects
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to={`/projects/${project.id}`}>
            {project.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Settings</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Project Settings</Heading>
          <Text color="gray.600">
            Configure analysis settings and project properties
          </Text>
        </VStack>
        <HStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            Back to Project
          </Button>
        </HStack>
      </HStack>

      {/* Settings Tabs */}
      <Tabs>
        <TabList>
          <Tab>General</Tab>
          <Tab>Analysis</Tab>
          <Tab>Rules</Tab>
          <Tab>Advanced</Tab>
        </TabList>

        <TabPanels>
          {/* General Settings */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">General Settings</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Project Name</FormLabel>
                    <Input
                      value={settings.name}
                      onChange={(e) =>
                        setSettings({ ...settings, name: e.target.value })
                      }
                      placeholder="Enter project name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={settings.description}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter project description"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Primary Language</FormLabel>
                    <Select
                      value={settings.language}
                      onChange={(e) =>
                        setSettings({ ...settings, language: e.target.value })
                      }
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="csharp">C#</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="cpp">C++</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Project Path</FormLabel>
                    <InputGroup>
                      <Input
                        value={settings.path}
                        onChange={(e) =>
                          setSettings({ ...settings, path: e.target.value })
                        }
                        placeholder="Enter project file path or select a folder"
                        pr="4.5rem"
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={handleFolderSelect}
                          leftIcon={<AttachmentIcon />}
                        >
                          Browse
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Enter the full path to analyze, or click Browse to select
                      a folder name. Note: Browser security limits folder
                      selection to name only.
                    </Text>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Analysis Settings */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">File Selection</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Included File Patterns</FormLabel>
                      <Textarea
                        value={settings.includedFiles.join('\n')}
                        onChange={(e) =>
                          handleArrayInputChange(
                            e.target.value,
                            'includedFiles'
                          )
                        }
                        placeholder="*.ts&#10;*.js&#10;src/**/*.tsx"
                        rows={4}
                      />
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        One pattern per line. Leave empty to include all files.
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Excluded File Patterns</FormLabel>
                      <Textarea
                        value={settings.excludedFiles.join('\n')}
                        onChange={(e) =>
                          handleArrayInputChange(
                            e.target.value,
                            'excludedFiles'
                          )
                        }
                        placeholder="node_modules&#10;dist&#10;*.test.js"
                        rows={4}
                      />
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        One pattern per line. These files will be skipped during
                        analysis.
                      </Text>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Performance Settings</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Maximum File Size (bytes)</FormLabel>
                      <NumberInput
                        value={settings.maxFileSize}
                        onChange={(value) =>
                          setSettings({
                            ...settings,
                            maxFileSize: parseInt(value) || 1048576,
                          })
                        }
                        min={1024}
                        max={10485760}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Files larger than this will be skipped (1MB = 1,048,576
                        bytes)
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Analysis Timeout (milliseconds)</FormLabel>
                      <NumberInput
                        value={settings.timeout}
                        onChange={(value) =>
                          setSettings({
                            ...settings,
                            timeout: parseInt(value) || 30000,
                          })
                        }
                        min={5000}
                        max={300000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Maximum time to wait for analysis completion
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Concurrency Level</FormLabel>
                      <NumberInput
                        value={settings.concurrency}
                        onChange={(value) =>
                          setSettings({
                            ...settings,
                            concurrency: parseInt(value) || 4,
                          })
                        }
                        min={1}
                        max={16}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Number of files to analyze simultaneously
                      </Text>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="parallel-execution" mb="0">
                        Enable Parallel Execution
                      </FormLabel>
                      <Switch
                        id="parallel-execution"
                        isChecked={settings.enableParallelExecution}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            enableParallelExecution: e.target.checked,
                          })
                        }
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Rules Settings */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Rule Configuration</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Configure which rule sets to apply during analysis. For
                    detailed rule configuration, visit the main Rules page.
                  </Text>

                  <FormControl>
                    <FormLabel>Enabled Rule Sets</FormLabel>
                    <VStack align="start" spacing={2}>
                      {[
                        {
                          id: 'security',
                          name: 'Security Rules',
                          description: 'Detect security vulnerabilities',
                        },
                        {
                          id: 'performance',
                          name: 'Performance Rules',
                          description: 'Identify performance issues',
                        },
                        {
                          id: 'quality',
                          name: 'Code Quality Rules',
                          description: 'Check code quality and maintainability',
                        },
                        {
                          id: 'design-patterns',
                          name: 'Design Patterns',
                          description: 'Validate design pattern usage',
                        },
                      ].map((ruleset) => (
                        <FormControl
                          key={ruleset.id}
                          display="flex"
                          alignItems="start"
                        >
                          <VStack align="start" spacing={0} flex={1}>
                            <HStack>
                              <Switch
                                isChecked={settings.enabledRulesets.includes(
                                  ruleset.id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSettings({
                                      ...settings,
                                      enabledRulesets: [
                                        ...settings.enabledRulesets,
                                        ruleset.id,
                                      ],
                                    });
                                  } else {
                                    setSettings({
                                      ...settings,
                                      enabledRulesets:
                                        settings.enabledRulesets.filter(
                                          (id) => id !== ruleset.id
                                        ),
                                    });
                                  }
                                }}
                              />
                              <FormLabel mb="0" fontWeight="medium">
                                {ruleset.name}
                              </FormLabel>
                            </HStack>
                            <Text fontSize="sm" color="gray.500" ml={10}>
                              {ruleset.description}
                            </Text>
                          </VStack>
                        </FormControl>
                      ))}
                    </VStack>
                  </FormControl>

                  <Divider />

                  <HStack>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/rules')}
                    >
                      Configure Individual Rules
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Advanced Settings */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Advanced Configuration</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Advanced settings for experienced users. Modify these
                    settings carefully.
                  </Text>

                  <Alert status="info">
                    <AlertIcon />
                    Advanced settings are coming in a future update. For now,
                    you can configure basic project settings in the General tab.
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Action Buttons */}
      <Card mt={6} bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <HStack justify="flex-end" spacing={4}>
            <Button variant="outline" onClick={handleResetSettings}>
              Reset Changes
            </Button>
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="blue"
              onClick={handleSaveSettings}
              isLoading={saving}
              loadingText="Saving..."
            >
              Save Settings
            </Button>
          </HStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ProjectSettings;
