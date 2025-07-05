import React, { useState, useEffect } from 'react';
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
  Badge,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TriangleUpIcon,
  SettingsIcon,
  DeleteIcon,
  EditIcon,
} from '@chakra-ui/icons';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Project, RunDetail } from '../types';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { subscribe, unsubscribe } = useWebSocket();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<RunDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    path: '',
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    const unsubscribeRunUpdate = subscribe('run_started', (data: any) => {
      if (data.projectId === projectId) {
        toast({
          title: 'Run Started',
          description: 'Analysis has started for this project',
          status: 'info',
          duration: 3000,
        });
        fetchProjectData();
      }
    });

    const unsubscribeRunComplete = subscribe('run_completed', (data: any) => {
      if (data.projectId === projectId) {
        toast({
          title: 'Run Completed',
          description: 'Analysis has completed successfully',
          status: 'success',
          duration: 3000,
        });
        fetchProjectData();
      }
    });

    return () => {
      unsubscribeRunUpdate();
      unsubscribeRunComplete();
    };
  }, [projectId, subscribe, toast]);

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const [projectData, runsData] = await Promise.all([
        apiService.getProject(projectId),
        apiService.getRuns(projectId),
      ]);

      setProject(projectData);
      setRuns(runsData);
      setEditData({
        name: projectData.name,
        description: projectData.description,
        path: '', // Path will be handled separately
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch project data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartRun = async () => {
    if (!projectId) return;

    try {
      setIsStartingRun(true);
      const newRun = await apiService.startRun(projectId);
      toast({
        title: 'Run Started',
        description: `Analysis started with ID: ${newRun.id}`,
        status: 'success',
        duration: 3000,
      });

      // Refresh data
      fetchProjectData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start run',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsStartingRun(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectId || !project) return;

    try {
      const updatedProject = await apiService.updateProject(projectId, {
        name: editData.name,
        description: editData.description,
      });

      setProject(updatedProject);
      onClose();

      toast({
        title: 'Project Updated',
        description: 'Project details have been updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    if (
      window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      try {
        await apiService.deleteProject(projectId);
        toast({
          title: 'Project Deleted',
          description: 'Project has been deleted successfully',
          status: 'success',
          duration: 3000,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete project',
          status: 'error',
          duration: 3000,
        });
      }
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

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
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
          <Text fontWeight="bold">Error loading project</Text>
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
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{project.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Project Header */}
      <Card mb={6} bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={2}>
              <HStack>
                <Heading size="lg">{project.name}</Heading>
                <Badge colorScheme={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </HStack>
              <Text color="gray.600">{project.description}</Text>
              <HStack spacing={4}>
                <Text fontSize="sm">
                  <strong>Language:</strong> {project.language}
                </Text>
                <Text fontSize="sm">
                  <strong>Total Runs:</strong> {project.runsCount}
                </Text>
                <Text fontSize="sm">
                  <strong>Issues:</strong> {project.issuesCount}
                </Text>
              </HStack>
            </VStack>
            <VStack spacing={2}>
              <Button
                leftIcon={<TriangleUpIcon />}
                colorScheme="green"
                onClick={handleStartRun}
                isLoading={isStartingRun}
                loadingText="Starting..."
              >
                Start New Run
              </Button>
              <HStack>
                <Button
                  size="sm"
                  leftIcon={<EditIcon />}
                  onClick={onOpen}
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  leftIcon={<SettingsIcon />}
                  onClick={() => navigate(`/projects/${project.id}/settings`)}
                  variant="outline"
                >
                  Settings
                </Button>
                <Button
                  size="sm"
                  leftIcon={<DeleteIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDeleteProject}
                >
                  Delete
                </Button>
              </HStack>
            </VStack>
          </HStack>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs>
        <TabList>
          <Tab>Recent Runs</Tab>
          <Tab>Overview</Tab>
        </TabList>

        <TabPanels>
          {/* Recent Runs Tab */}
          <TabPanel>
            {runs.length === 0 ? (
              <Card>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Text fontSize="lg" color="gray.500">
                      No runs found
                    </Text>
                    <Text color="gray.400">
                      Start your first analysis run to see results here
                    </Text>
                    <Button
                      leftIcon={<TriangleUpIcon />}
                      colorScheme="green"
                      onClick={handleStartRun}
                      isLoading={isStartingRun}
                    >
                      Start Analysis
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Run ID</Th>
                    <Th>Status</Th>
                    <Th>Started</Th>
                    <Th>Duration</Th>
                    <Th>Issues</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {runs.map((run) => (
                    <Tr key={run.id}>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {run.id.substring(0, 8)}...
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </Td>
                      <Td>{formatDate(run.startTime)}</Td>
                      <Td>{formatDuration(run.duration)}</Td>
                      <Td>{run.issues?.length || 0}</Td>
                      <Td>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/projects/${project.id}/runs/${run.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          {/* Overview Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Statistics</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <Text>Total Runs</Text>
                      <Text fontWeight="bold">{project.runsCount}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text>Total Issues</Text>
                      <Text fontWeight="bold">{project.issuesCount}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text>Last Run</Text>
                      <Text fontWeight="bold">
                        {formatDate(project.lastRun)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text>Status</Text>
                      <Badge colorScheme={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="md">Project Info</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <Text>Language</Text>
                      <Text fontWeight="bold">{project.language}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text>Created</Text>
                      <Text fontWeight="bold">
                        {formatDate(project.createdAt)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text>Updated</Text>
                      <Text fontWeight="bold">
                        {formatDate(project.updatedAt)}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Project Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Project Name</FormLabel>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  placeholder="Enter project description"
                />
              </FormControl>
              <FormControl>
                <FormLabel>File Path</FormLabel>
                <Input
                  value={editData.path}
                  onChange={(e) =>
                    setEditData({ ...editData, path: e.target.value })
                  }
                  placeholder="Enter project file path"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateProject}
              disabled={!editData.name.trim()}
            >
              Update Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectDetail;
