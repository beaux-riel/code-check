import React from 'react';
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
} from '@chakra-ui/react';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useWebSocket();

  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const menuItems = [
    { label: 'Projects', path: '/', icon: '📁' },
    { label: 'Rules', path: '/rules', icon: '⚙️' },
    { label: 'Settings', path: '/settings', icon: '🔧' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

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
            Code Check Dashboard
          </Text>
        </HStack>

        <HStack spacing={4}>
          <Badge
            colorScheme={isConnected ? 'green' : 'red'}
            variant="subtle"
            fontSize="xs"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
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
