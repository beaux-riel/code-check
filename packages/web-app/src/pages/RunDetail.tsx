import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import {
  DownloadIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RunDetail as RunDetailType, Issue, ChartData } from '../types';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const RunDetail: React.FC = () => {
  const { projectId, runId } = useParams<{
    projectId: string;
    runId: string;
  }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { subscribe } = useWebSocket();

  const [runDetail, setRunDetail] = useState<RunDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<{
    progress: number;
    currentFile: string;
    filesProcessed: number;
    totalFiles: number;
    currentIssues: number;
    estimatedTimeRemaining: number;
  } | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchRunDetail = async () => {
      if (!projectId || !runId) return;

      try {
        setLoading(true);
        const data = await apiService.getRun(projectId, runId);
        setRunDetail(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch run details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRunDetail();
  }, [projectId, runId]);

  useEffect(() => {
    const unsubscribeProgress = subscribe('run_progress', (data: any) => {
      if (data.runId === runId) {
        setLiveProgress({
          progress: data.progress || 0,
          currentFile: data.currentFile || '',
          filesProcessed: data.filesProcessed || 0,
          totalFiles: data.totalFiles || 0,
          currentIssues: data.currentIssues || 0,
          estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        });

        // Update run detail with latest metrics
        setRunDetail((prev) =>
          prev
            ? {
                ...prev,
                metrics: {
                  ...prev.metrics,
                  processedFiles:
                    data.filesProcessed || prev.metrics.processedFiles,
                  totalFiles: data.totalFiles || prev.metrics.totalFiles,
                  totalIssues: data.currentIssues || prev.metrics.totalIssues,
                },
              }
            : null
        );
      }
    });

    const unsubscribeIssueFound = subscribe('issue_found', (data: any) => {
      if (data.runId === runId) {
        setRunDetail((prev) =>
          prev
            ? {
                ...prev,
                issues: [...prev.issues, data.issue],
                metrics: {
                  ...prev.metrics,
                  totalIssues: prev.metrics.totalIssues + 1,
                  [data.issue.type === 'error'
                    ? 'errors'
                    : data.issue.type === 'warning'
                      ? 'warnings'
                      : 'info']:
                    prev.metrics[
                      data.issue.type === 'error'
                        ? 'errors'
                        : data.issue.type === 'warning'
                          ? 'warnings'
                          : 'info'
                    ] + 1,
                },
              }
            : null
        );
      }
    });

    const unsubscribeComplete = subscribe('run_completed', (data: any) => {
      if (data.runId === runId) {
        setLiveProgress(null);
        setRunDetail((prev) =>
          prev ? { ...prev, status: 'completed', endTime: data.endTime } : null
        );
      }
    });

    const unsubscribeFailed = subscribe('run_failed', (data: any) => {
      if (data.runId === runId) {
        setLiveProgress(null);
        setRunDetail((prev) =>
          prev ? { ...prev, status: 'failed', endTime: data.endTime } : null
        );
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeIssueFound();
      unsubscribeComplete();
      unsubscribeFailed();
    };
  }, [subscribe, runId]);

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!projectId || !runId) return;

    try {
      const blob = await apiService.exportRunResults(projectId, runId, format);
      await apiService.downloadFile(blob, `run-${runId}.${format}`);
      toast({
        title: 'Export Successful',
        description: `Run results exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export run results',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getIssueTypeData = (): ChartData[] => {
    if (!runDetail) return [];
    const { metrics } = runDetail;
    return [
      { name: 'Errors', value: metrics.errors, color: '#FF8042' },
      { name: 'Warnings', value: metrics.warnings, color: '#FFBB28' },
      { name: 'Info', value: metrics.info, color: '#00C49F' },
    ];
  };

  const getIssuesByCategoryData = (): ChartData[] => {
    if (!runDetail) return [];
    const categoryCount: Record<string, number> = {};
    runDetail.issues.forEach((issue) => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getScoreData = () => {
    if (!runDetail) return [];
    const { metrics } = runDetail;
    return [
      { name: 'Code Quality', score: metrics.codeQualityScore },
      { name: 'Performance', score: metrics.performanceScore },
      { name: 'Security', score: metrics.securityScore },
    ];
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
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
        {error}
      </Alert>
    );
  }

  if (!runDetail) return null;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumb
        spacing="8px"
        separator={<ChevronRightIcon color="gray.500" />}
        mb={4}
      >
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/')}>
            Projects
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate(`/projects/${projectId}`)}>
            {runDetail.projectName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Run Details</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Run Details</Heading>
          <HStack>
            <Text color="gray.600">Run ID: {runDetail.id}</Text>
            <Badge colorScheme={getStatusColor(runDetail.status)}>
              {runDetail.status}
            </Badge>
          </HStack>
        </VStack>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            leftIcon={<DownloadIcon />}
          >
            Export
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>
              Export as PDF
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Live Progress Indicator */}
      {liveProgress && runDetail.status === 'running' && (
        <Card mb={6} bg={cardBg} borderColor="blue.200" borderWidth="2px">
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <Spinner size="sm" color="blue.500" />
                <Heading size="md" color="blue.600">
                  Live Progress
                </Heading>
                <Badge colorScheme="blue">Running</Badge>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                ETA:{' '}
                {liveProgress.estimatedTimeRemaining > 0
                  ? formatDuration(liveProgress.estimatedTimeRemaining * 1000)
                  : 'Calculating...'}
              </Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Overall Progress
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {Math.round(liveProgress.progress)}%
                  </Text>
                </HStack>
                <Progress
                  value={liveProgress.progress}
                  colorScheme="blue"
                  size="lg"
                  hasStripe
                  isAnimated
                />
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Files Processed
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {liveProgress.filesProcessed} / {liveProgress.totalFiles}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Issues Found
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="orange.500">
                    {liveProgress.currentIssues}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Current File
                  </Text>
                  <Text fontSize="sm" color="gray.600" isTruncated maxW="200px">
                    {liveProgress.currentFile || 'Initializing...'}
                  </Text>
                </VStack>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Metrics Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total Issues</StatLabel>
              <StatNumber>{runDetail.metrics.totalIssues}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {runDetail.metrics.errors} errors
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Files Processed</StatLabel>
              <StatNumber>{runDetail.metrics.processedFiles}</StatNumber>
              <StatHelpText>
                of {runDetail.metrics.totalFiles} total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Code Quality</StatLabel>
              <StatNumber>{runDetail.metrics.codeQualityScore}%</StatNumber>
              <Progress
                value={runDetail.metrics.codeQualityScore}
                colorScheme={
                  runDetail.metrics.codeQualityScore > 80
                    ? 'green'
                    : runDetail.metrics.codeQualityScore > 60
                      ? 'yellow'
                      : 'red'
                }
                size="sm"
                mt={2}
              />
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Duration</StatLabel>
              <StatNumber>
                {runDetail.duration
                  ? formatDuration(runDetail.duration)
                  : 'Running...'}
              </StatNumber>
              <StatHelpText>
                Started {new Date(runDetail.startTime).toLocaleTimeString()}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Issues by Type</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getIssueTypeData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {getIssueTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Issues by Category</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getIssuesByCategoryData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Score Overview */}
      <Card bg={cardBg} mb={6}>
        <CardHeader>
          <Heading size="md">Quality Scores</Heading>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getScoreData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="score" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Detailed Results */}
      <Card bg={cardBg}>
        <CardHeader>
          <Heading size="md">Detailed Results</Heading>
        </CardHeader>
        <CardBody>
          <Tabs>
            <TabList>
              <Tab>Issues ({runDetail.issues.length})</Tab>
              <Tab>Logs ({runDetail.logs.length})</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Severity</Th>
                        <Th>Type</Th>
                        <Th>Message</Th>
                        <Th>File</Th>
                        <Th>Line</Th>
                        <Th>Rule</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {runDetail.issues.map((issue) => (
                        <Tr key={issue.id}>
                          <Td>
                            <Badge
                              colorScheme={getSeverityColor(issue.severity)}
                            >
                              {issue.severity}
                            </Badge>
                          </Td>
                          <Td>{issue.type}</Td>
                          <Td>{issue.message}</Td>
                          <Td>{issue.file}</Td>
                          <Td>{issue.line}</Td>
                          <Td>{issue.rule}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel px={0}>
                <VStack align="stretch" spacing={2}>
                  {runDetail.logs.map((log) => (
                    <HStack
                      key={log.id}
                      p={3}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="md"
                    >
                      <Badge
                        colorScheme={
                          log.level === 'error'
                            ? 'red'
                            : log.level === 'warn'
                              ? 'orange'
                              : 'blue'
                        }
                      >
                        {log.level}
                      </Badge>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                      <Text flex={1}>{log.message}</Text>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  );
};

export default RunDetail;
