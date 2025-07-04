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
  Switch,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { SearchIcon, SettingsIcon, InfoIcon } from '@chakra-ui/icons';
import { Rule, RuleCategory } from '../types';
import { apiService } from '../services/api';

const RulesConfig: React.FC = () => {
  const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [ruleConfig, setRuleConfig] = useState<Record<string, any>>({});

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRules();
      setRuleCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = async (rule: Rule) => {
    try {
      const updatedRule = await apiService.updateRule(rule.id, {
        enabled: !rule.enabled,
      });

      setRuleCategories((prev) =>
        prev.map((category) => ({
          ...category,
          rules: category.rules.map((r) =>
            r.id === rule.id ? updatedRule : r
          ),
        }))
      );

      toast({
        title: 'Rule Updated',
        description: `${rule.name} has been ${updatedRule.enabled ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rule',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleConfigureRule = (rule: Rule) => {
    setSelectedRule(rule);
    setRuleConfig(rule.configuration || {});
    onOpen();
  };

  const handleSaveConfiguration = async () => {
    if (!selectedRule) return;

    try {
      const updatedRule = await apiService.updateRule(selectedRule.id, {
        configuration: ruleConfig,
      });

      setRuleCategories((prev) =>
        prev.map((category) => ({
          ...category,
          rules: category.rules.map((r) =>
            r.id === selectedRule.id ? updatedRule : r
          ),
        }))
      );

      toast({
        title: 'Configuration Saved',
        description: `Configuration for ${selectedRule.name} has been updated`,
        status: 'success',
        duration: 3000,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        status: 'error',
        duration: 3000,
      });
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

  const filteredCategories = ruleCategories
    .map((category) => ({
      ...category,
      rules: category.rules.filter((rule) => {
        const matchesSearch =
          rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === 'all' || category.id === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    }))
    .filter((category) => category.rules.length > 0);

  const allCategories = ruleCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  const getEnabledCount = (rules: Rule[]) =>
    rules.filter((r) => r.enabled).length;

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

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Rules Configuration</Heading>
          <Text color="gray.600">
            Configure code analysis rules and their settings
          </Text>
        </VStack>
        <Button onClick={fetchRules} size="sm">
          Refresh
        </Button>
      </HStack>

      {/* Filters */}
      <Card bg={cardBg} mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <Box flex={1}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Box>
            <Box>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                w="200px"
              >
                <option value="all">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Statistics */}
      <Grid
        templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
        gap={4}
        mb={6}
      >
        {ruleCategories.map((category) => (
          <Card key={category.id} bg={cardBg}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="bold">
                  {category.name}
                </Text>
                <HStack>
                  <Text fontSize="2xl" fontWeight="bold">
                    {getEnabledCount(category.rules)}
                  </Text>
                  <Text color="gray.500">/ {category.rules.length}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  enabled rules
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Rules List */}
      <Accordion allowMultiple>
        {filteredCategories.map((category) => (
          <AccordionItem key={category.id}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{category.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {category.description}
                    </Text>
                  </VStack>
                  <Badge colorScheme="blue">
                    {getEnabledCount(category.rules)} / {category.rules.length}{' '}
                    enabled
                  </Badge>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                {category.rules.map((rule) => (
                  <Card
                    key={rule.id}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <CardBody>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack>
                            <Text fontWeight="semibold">{rule.name}</Text>
                            <Badge
                              colorScheme={getSeverityColor(rule.severity)}
                            >
                              {rule.severity}
                            </Badge>
                            {rule.fixable && (
                              <Badge colorScheme="green" variant="outline">
                                Auto-fixable
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {rule.description}
                          </Text>
                        </VStack>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<SettingsIcon />}
                            variant="ghost"
                            onClick={() => handleConfigureRule(rule)}
                            isDisabled={!rule.enabled}
                          >
                            Configure
                          </Button>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel
                              htmlFor={`rule-${rule.id}`}
                              mb="0"
                              fontSize="sm"
                            >
                              Enabled
                            </FormLabel>
                            <Switch
                              id={`rule-${rule.id}`}
                              isChecked={rule.enabled}
                              onChange={() => handleRuleToggle(rule)}
                            />
                          </FormControl>
                        </HStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Configuration Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <SettingsIcon />
              <Text>Configure Rule: {selectedRule?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRule && (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <InfoIcon />
                  <Text ml={2} fontSize="sm">
                    {selectedRule.description}
                  </Text>
                </Alert>

                {Object.keys(selectedRule.configuration || {}).length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={8}>
                    This rule has no configurable options.
                  </Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {Object.entries(selectedRule.configuration || {}).map(
                      ([key, value]) => (
                        <FormControl key={key}>
                          <FormLabel>{key}</FormLabel>
                          {typeof value === 'boolean' ? (
                            <Switch
                              isChecked={ruleConfig[key] ?? value}
                              onChange={(e) =>
                                setRuleConfig({
                                  ...ruleConfig,
                                  [key]: e.target.checked,
                                })
                              }
                            />
                          ) : typeof value === 'number' ? (
                            <Input
                              type="number"
                              value={ruleConfig[key] ?? value}
                              onChange={(e) =>
                                setRuleConfig({
                                  ...ruleConfig,
                                  [key]: parseInt(e.target.value),
                                })
                              }
                            />
                          ) : Array.isArray(value) ? (
                            <Textarea
                              value={JSON.stringify(
                                ruleConfig[key] ?? value,
                                null,
                                2
                              )}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  setRuleConfig({
                                    ...ruleConfig,
                                    [key]: parsed,
                                  });
                                } catch (error) {
                                  // Invalid JSON, keep the string value for now
                                }
                              }}
                              rows={4}
                            />
                          ) : (
                            <Input
                              value={ruleConfig[key] ?? value}
                              onChange={(e) =>
                                setRuleConfig({
                                  ...ruleConfig,
                                  [key]: e.target.value,
                                })
                              }
                            />
                          )}
                        </FormControl>
                      )
                    )}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveConfiguration}
              isDisabled={
                !selectedRule ||
                Object.keys(selectedRule.configuration || {}).length === 0
              }
            >
              Save Configuration
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RulesConfig;
