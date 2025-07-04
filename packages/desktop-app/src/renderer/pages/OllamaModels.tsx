import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Badge,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
  Select,
  FormControl,
  FormLabel,
  Divider,
} from '@chakra-ui/react';
import {
  AddIcon,
  DeleteIcon,
  SearchIcon,
  DownloadIcon,
} from '@chakra-ui/icons';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

const OllamaModels: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    getOllamaStatus,
    listOllamaModels,
    installOllamaModel,
    removeOllamaModel,
  } = useElectronAPI();

  const [ollamaStatus, setOllamaStatus] = useState({
    running: false,
    models: [],
  });
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null);

  // Popular models for quick installation
  const popularModels = [
    { name: 'llama2', description: "Meta's Llama 2 model", size: '~3.8GB' },
    {
      name: 'codellama',
      description: 'Code Llama for programming tasks',
      size: '~3.8GB',
    },
    { name: 'mistral', description: 'Mistral 7B model', size: '~4.1GB' },
    {
      name: 'neural-chat',
      description: "Intel's neural chat model",
      size: '~4.1GB',
    },
    {
      name: 'starling-lm',
      description: 'Starling language model',
      size: '~4.1GB',
    },
    {
      name: 'llama2:13b',
      description: 'Llama 2 13B parameter model',
      size: '~7.4GB',
    },
    {
      name: 'llama2:70b',
      description: 'Llama 2 70B parameter model',
      size: '~39GB',
    },
  ];

  useEffect(() => {
    loadModels();
    checkOllamaStatus();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadModels();
      checkOllamaStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const status = await getOllamaStatus();
      setOllamaStatus(status);
    } catch (error) {
      console.error('Error checking Ollama status:', error);
    }
  };

  const loadModels = async () => {
    try {
      const modelList = await listOllamaModels();
      setModels(modelList);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleInstallModel = async (modelName: string) => {
    setIsInstalling(true);

    try {
      const success = await installOllamaModel(modelName);

      if (success) {
        toast({
          title: 'Model installed',
          description: `Successfully installed ${modelName}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        await loadModels();
      } else {
        toast({
          title: 'Installation failed',
          description: `Failed to install ${modelName}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during installation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsInstalling(false);
      setNewModelName('');
      onClose();
    }
  };

  const handleRemoveModel = async (modelName: string) => {
    try {
      const success = await removeOllamaModel(modelName);

      if (success) {
        toast({
          title: 'Model removed',
          description: `Successfully removed ${modelName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadModels();
      } else {
        toast({
          title: 'Removal failed',
          description: `Failed to remove ${modelName}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during removal',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (sizeString: string) => {
    // Convert size string to a more readable format
    return sizeString;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box p={6} maxWidth="1200px" margin="0 auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Ollama Models
          </Heading>
          <Text color="gray.600">Manage local AI models for offline usage</Text>
        </Box>

        {/* Ollama Status */}
        <Card>
          <CardBody>
            <HStack justify="space-between">
              <HStack spacing={4}>
                <Text fontWeight="medium">Ollama Status:</Text>
                <Badge colorScheme={ollamaStatus.running ? 'green' : 'red'}>
                  {ollamaStatus.running ? 'Running' : 'Stopped'}
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  {models.length} models installed
                </Text>
              </HStack>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={onOpen}
                isDisabled={!ollamaStatus.running}
              >
                Install Model
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {!ollamaStatus.running && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Ollama Not Running</AlertTitle>
              <AlertDescription>
                Ollama service is not running. Please ensure Ollama is installed
                and running to manage models.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Search */}
        <InputGroup>
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <InputRightElement>
            <SearchIcon color="gray.300" />
          </InputRightElement>
        </InputGroup>

        {/* Installed Models */}
        <Card>
          <CardHeader>
            <Heading size="md">Installed Models</Heading>
          </CardHeader>
          <CardBody>
            {filteredModels.length > 0 ? (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Model Name</Th>
                      <Th>Size</Th>
                      <Th>Modified</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredModels.map((model) => (
                      <Tr key={model.name}>
                        <Td fontFamily="mono">{model.name}</Td>
                        <Td>{formatFileSize(model.size)}</Td>
                        <Td>{formatDate(model.modified)}</Td>
                        <Td>
                          <Tooltip label="Remove model">
                            <IconButton
                              aria-label="Remove model"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleRemoveModel(model.name)}
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  {searchTerm
                    ? 'No models found matching your search.'
                    : 'No models installed yet.'}
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Install Model Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Install Ollama Model</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Model Name</FormLabel>
                  <Input
                    placeholder="e.g., llama2, codellama, mistral"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    isDisabled={isInstalling}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Enter the name of the model you want to install
                  </Text>
                </FormControl>

                <Divider />

                <Box>
                  <Text fontWeight="medium" mb={3}>
                    Popular Models
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {popularModels.map((model) => (
                      <Card key={model.name} variant="outline" size="sm">
                        <CardBody py={3}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">{model.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {model.description}
                              </Text>
                              <Badge size="sm">{model.size}</Badge>
                            </VStack>
                            <Button
                              size="sm"
                              leftIcon={<DownloadIcon />}
                              onClick={() => setNewModelName(model.name)}
                              isDisabled={isInstalling}
                            >
                              Select
                            </Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>

                {isInstalling && (
                  <Box>
                    <Text mb={2}>Installing model...</Text>
                    <Progress isIndeterminate colorScheme="blue" />
                  </Box>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={onClose}
                isDisabled={isInstalling}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => handleInstallModel(newModelName)}
                isDisabled={!newModelName.trim() || isInstalling}
                isLoading={isInstalling}
                loadingText="Installing..."
              >
                Install Model
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default OllamaModels;
