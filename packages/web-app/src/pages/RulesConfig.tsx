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
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [ruleConfig, setRuleConfig] = useState<Record<string, any>>({});
  const [newPatternRule, setNewPatternRule] = useState({
    name: '',
    description: '',
    category: 'design-patterns',
    type: 'pattern' as 'pattern' | 'anti-pattern',
    patterns: [''],
    severity: 'medium' as 'high' | 'medium' | 'low',
  });

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPatternModalOpen,
    onOpen: onPatternModalOpen,
    onClose: onPatternModalClose,
  } = useDisclosure();
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

  const handleCreatePatternRule = async () => {
    try {
      const newRule: Omit<Rule, 'id'> = {
        name: newPatternRule.name,
        description: newPatternRule.description,
        category: newPatternRule.category,
        severity: newPatternRule.severity,
        enabled: true,
        fixable: false,
        type: newPatternRule.type,
        patterns: newPatternRule.patterns.filter((p) => p.trim()),
        configuration: {},
        examples: {
          good: [],
          bad: [],
        },
      };

      // In a real implementation, this would call the API
      // For now, we'll simulate adding it to the local state
      const createdRule = { ...newRule, id: `pattern-${Date.now()}` } as Rule;

      setRuleCategories((prev) => {
        const categoryIndex = prev.findIndex(
          (cat) => cat.id === newPatternRule.category
        );
        if (categoryIndex >= 0) {
          const updatedCategories = [...prev];
          updatedCategories[categoryIndex] = {
            ...updatedCategories[categoryIndex],
            rules: [...updatedCategories[categoryIndex].rules, createdRule],
          };
          return updatedCategories;
        } else {
          // Create new category if it doesn't exist
          return [
            ...prev,
            {
              id: newPatternRule.category,
              name: newPatternRule.category
                .replace('-', ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
              description: `${newPatternRule.type === 'pattern' ? 'Design patterns' : 'Anti-patterns'} rules`,
              rules: [createdRule],
            },
          ];
        }
      });

      setNewPatternRule({
        name: '',
        description: '',
        category: 'design-patterns',
        type: 'pattern',
        patterns: [''],
        severity: 'medium',
      });

      onPatternModalClose();

      toast({
        title: 'Pattern Rule Created',
        description: `${newPatternRule.type === 'pattern' ? 'Pattern' : 'Anti-pattern'} rule "${newPatternRule.name}" has been created`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create pattern rule',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddPattern = () => {
    setNewPatternRule((prev) => ({
      ...prev,
      patterns: [...prev.patterns, ''],
    }));
  };

  const handleRemovePattern = (index: number) => {
    setNewPatternRule((prev) => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index),
    }));
  };

  const handlePatternChange = (index: number, value: string) => {
    setNewPatternRule((prev) => ({
      ...prev,
      patterns: prev.patterns.map((p, i) => (i === index ? value : p)),
    }));
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
        const matchesType =
          selectedRuleType === 'all' ||
          (selectedRuleType === 'standard' &&
            (!rule.type || rule.type === 'standard')) ||
          rule.type === selectedRuleType;
        return matchesSearch && matchesCategory && matchesType;
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
        <HStack spacing={2}>
          <Button
            onClick={onPatternModalOpen}
            colorScheme="blue"
            size="sm"
            leftIcon={<InfoIcon />}
          >
            Create Pattern Rule
          </Button>
          <Button onClick={fetchRules} size="sm" variant="outline">
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Filters */}
      <Card bg={cardBg} mb={6}>
        <CardBody>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
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
              <Box>
                <Select
                  value={selectedRuleType}
                  onChange={(e) => setSelectedRuleType(e.target.value)}
                  w="180px"
                >
                  <option value="all">All Types</option>
                  <option value="standard">Standard Rules</option>
                  <option value="pattern">Design Patterns</option>
                  <option value="anti-pattern">Anti-Patterns</option>
                </Select>
              </Box>
            </HStack>

            <HStack spacing={4} w="full" justify="space-between">
              <HStack spacing={6}>
                <Text fontSize="sm" color="gray.600">
                  <strong>Total Rules:</strong>{' '}
                  {ruleCategories.reduce(
                    (acc, cat) => acc + cat.rules.length,
                    0
                  )}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  <strong>Enabled:</strong>{' '}
                  {ruleCategories.reduce(
                    (acc, cat) =>
                      acc + cat.rules.filter((r) => r.enabled).length,
                    0
                  )}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  <strong>Pattern Rules:</strong>{' '}
                  {ruleCategories.reduce(
                    (acc, cat) =>
                      acc +
                      cat.rules.filter(
                        (r) => r.type === 'pattern' || r.type === 'anti-pattern'
                      ).length,
                    0
                  )}
                </Text>
              </HStack>
            </HStack>
          </VStack>
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
                            {rule.type === 'pattern' && (
                              <Badge colorScheme="blue" variant="outline">
                                Pattern
                              </Badge>
                            )}
                            {rule.type === 'anti-pattern' && (
                              <Badge colorScheme="red" variant="outline">
                                Anti-Pattern
                              </Badge>
                            )}
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

      {/* Create Pattern Rule Modal */}
      <Modal
        isOpen={isPatternModalOpen}
        onClose={onPatternModalClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <InfoIcon />
              <Text>Create Pattern Rule</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Rule Name</FormLabel>
                <Input
                  value={newPatternRule.name}
                  onChange={(e) =>
                    setNewPatternRule({
                      ...newPatternRule,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Singleton Pattern Detection"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newPatternRule.description}
                  onChange={(e) =>
                    setNewPatternRule({
                      ...newPatternRule,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this rule detects..."
                  rows={3}
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Rule Type</FormLabel>
                  <Select
                    value={newPatternRule.type}
                    onChange={(e) =>
                      setNewPatternRule({
                        ...newPatternRule,
                        type: e.target.value as 'pattern' | 'anti-pattern',
                      })
                    }
                  >
                    <option value="pattern">Design Pattern</option>
                    <option value="anti-pattern">Anti-Pattern</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Severity</FormLabel>
                  <Select
                    value={newPatternRule.severity}
                    onChange={(e) =>
                      setNewPatternRule({
                        ...newPatternRule,
                        severity: e.target.value as 'high' | 'medium' | 'low',
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={newPatternRule.category}
                  onChange={(e) =>
                    setNewPatternRule({
                      ...newPatternRule,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="design-patterns">Design Patterns</option>
                  <option value="anti-patterns">Anti-Patterns</option>
                  <option value="architectural-patterns">
                    Architectural Patterns
                  </option>
                  <option value="code-smells">Code Smells</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Code Patterns</FormLabel>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Define regex patterns or code snippets that this rule should
                  detect
                </Text>
                <VStack spacing={2} align="stretch">
                  {newPatternRule.patterns.map((pattern, index) => (
                    <HStack key={index}>
                      <Input
                        value={pattern}
                        onChange={(e) =>
                          handlePatternChange(index, e.target.value)
                        }
                        placeholder="e.g., class.*implements.*Singleton|private static.*instance"
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      {newPatternRule.patterns.length > 1 && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemovePattern(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </HStack>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddPattern}
                    alignSelf="flex-start"
                  >
                    Add Pattern
                  </Button>
                </VStack>
              </FormControl>

              <Alert status="info" borderRadius="md">
                <InfoIcon />
                <Box ml={2}>
                  <Text fontSize="sm">
                    <strong>Pattern Tips:</strong> Use regex patterns to match
                    code structures. For example:{' '}
                    <code>class.*extends.*Component</code> to detect React class
                    components.
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPatternModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreatePatternRule}
              isDisabled={
                !newPatternRule.name.trim() ||
                !newPatternRule.description.trim() ||
                !newPatternRule.patterns.some((p) => p.trim())
              }
            >
              Create Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RulesConfig;
