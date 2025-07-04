import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
  useDisclosure,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Text,
  Badge,
  useColorMode,
  Button,
  Tooltip,
  Circle,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { getBackendStatus, getOllamaStatus } = useElectronAPI();

  const [backendStatus, setBackendStatus] = useState({
    running: false,
    port: null,
  });
  const [ollamaStatus, setOllamaStatus] = useState({
    running: false,
    models: [],
  });

  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const menuItems = [
    { label: 'Projects', path: '/', icon: '📁' },
    { label: 'Rules', path: '/rules', icon: '⚙️' },
    { label: 'Ollama Models', path: '/ollama', icon: '🤖' },
    { label: 'Settings', path: '/settings', icon: '🔧' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  // Check service status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const backend = await getBackendStatus();
        const ollama = await getOllamaStatus();
        setBackendStatus(backend);
        setOllamaStatus(ollama);
      } catch (error) {
        console.error('Error checking service status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [getBackendStatus, getOllamaStatus]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        w="full"
        px={4}
        py={2}
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <HStack spacing={4}>
          <IconButton
            size="md"
            icon={<HamburgerIcon />}
            aria-label="Open menu"
            onClick={onOpen}
          />
          <Text fontSize="xl" fontWeight="bold">
            CodeCheck Desktop
          </Text>
        </HStack>

        <HStack spacing={4}>
          {/* Backend Status */}
          <Tooltip
            label={`Backend Server: ${backendStatus.running ? `Running on port ${backendStatus.port}` : 'Stopped'}`}
          >
            <HStack spacing={2}>
              <Circle
                size="8px"
                bg={backendStatus.running ? 'green.400' : 'red.400'}
              />
              <Badge
                colorScheme={backendStatus.running ? 'green' : 'red'}
                variant="subtle"
                fontSize="xs"
              >
                Backend
              </Badge>
            </HStack>
          </Tooltip>

          {/* Ollama Status */}
          <Tooltip
            label={`Ollama: ${ollamaStatus.running ? `Running (${ollamaStatus.models.length} models)` : 'Stopped'}`}
          >
            <HStack spacing={2}>
              <Circle
                size="8px"
                bg={ollamaStatus.running ? 'green.400' : 'red.400'}
              />
              <Badge
                colorScheme={ollamaStatus.running ? 'green' : 'red'}
                variant="subtle"
                fontSize="xs"
              >
                Ollama
              </Badge>
            </HStack>
          </Tooltip>

          <Button size="sm" onClick={toggleColorMode}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </HStack>
      </Flex>

      {/* Sidebar Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack spacing={2} align="stretch">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? 'solid' : 'ghost'}
                  justifyContent="flex-start"
                  leftIcon={<Text>{item.icon}</Text>}
                  onClick={() => handleNavigate(item.path)}
                  w="full"
                >
                  {item.label}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box as="main" flex={1} p={4}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
