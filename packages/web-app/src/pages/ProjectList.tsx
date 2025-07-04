import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  IconButton,
  useColorModeValue,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, SettingsIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useWebSocket } from '../hooks/useWebSocket';
import { Project } from '../types';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, loading, error, createProject, deleteProject } =
    useProjects();
  const { subscribe, unsubscribe } = useWebSocket();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    language: 'javascript',
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  React.useEffect(() => {
    const unsubscribeRunUpdate = subscribe('run_started', (data: any) => {
      toast({
        title: 'Run Started',
        description: `Analysis started for project ${data.projectName}`,
        status: 'info',
        duration: 3000,
      });
    });

    const unsubscribeRunComplete = subscribe('run_completed', (data: any) => {
      toast({
        title: 'Run Completed',
        description: `Analysis completed for project ${data.projectName}`,
        status: 'success',
        duration: 3000,
      });
    });

    return () => {
      unsubscribeRunUpdate();
      unsubscribeRunComplete();
    };
  }, [subscribe, toast]);

  const handleCreateProject = async () => {
    try {
      await createProject({
        ...newProject,
        lastRun: new Date().toISOString(),
        status: 'pending',
        runsCount: 0,
        issuesCount: 0,
      });
      setNewProject({ name: '', description: '', language: 'javascript' });
      onClose();
      toast({
        title: 'Project Created',
        description: 'New project has been created successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Projects</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
          New Project
        </Button>
      </HStack>

      {projects.length === 0 ? (
        <Card>
          <CardBody>
            <VStack spacing={4} py={8}>
              <Text fontSize="lg" color="gray.500">
                No projects found
              </Text>
              <Text color="gray.400">
                Create your first project to get started with code analysis
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Create Project
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {projects.map((project) => (
            <Card
              key={project.id}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              _hover={{ shadow: 'md' }}
              transition="all 0.2s"
            >
              <CardHeader>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Heading size="md">{project.name}</Heading>
                    <Badge colorScheme={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </VStack>
                  <HStack>
                    <IconButton
                      size="sm"
                      icon={<ViewIcon />}
                      aria-label="View project"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                    <IconButton
                      size="sm"
                      icon={<SettingsIcon />}
                      aria-label="Project settings"
                      onClick={() =>
                        navigate(`/projects/${project.id}/settings`)
                      }
                    />
                    <IconButton
                      size="sm"
                      icon={<DeleteIcon />}
                      aria-label="Delete project"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteProject(project.id)}
                    />
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={3}>
                  <Text fontSize="sm" color="gray.600">
                    {project.description}
                  </Text>
                  <HStack spacing={4}>
                    <Text fontSize="sm">
                      <strong>Language:</strong> {project.language}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Runs:</strong> {project.runsCount}
                    </Text>
                  </HStack>
                  <HStack spacing={4}>
                    <Text fontSize="sm">
                      <strong>Issues:</strong> {project.issuesCount}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Last Run:</strong> {formatDate(project.lastRun)}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Project Name</FormLabel>
                <Input
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select
                  value={newProject.language}
                  onChange={(e) =>
                    setNewProject({ ...newProject, language: e.target.value })
                  }
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateProject}
              disabled={!newProject.name.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectList;
