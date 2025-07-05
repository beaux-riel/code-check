import React from 'react';
import { Box, Heading, Text, VStack, Button, useToast } from '@chakra-ui/react';

const DebugTest: React.FC = () => {
  const toast = useToast();

  const showToast = () => {
    toast({
      title: 'Test Toast',
      description: 'If you can see this, React and Chakra UI are working!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={8}>
      <VStack spacing={6} align="start">
        <Heading size="xl" color="blue.500">
          🧪 Debug Test Page
        </Heading>

        <Text fontSize="lg">
          This is a test page to verify the React app is working correctly.
        </Text>

        <Text>If you can see this content, then:</Text>

        <VStack align="start" spacing={2} pl={4}>
          <Text>✅ React is rendering components</Text>
          <Text>✅ Chakra UI is working</Text>
          <Text>✅ TypeScript compilation is successful</Text>
          <Text>✅ Routing is functional</Text>
        </VStack>

        <Button colorScheme="blue" onClick={showToast}>
          Test Toast Notification
        </Button>

        <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
          <Text fontWeight="bold" mb={2}>
            Current Environment:
          </Text>
          <Text>Development Mode: {import.meta.env.MODE}</Text>
          <Text>Timestamp: {new Date().toLocaleString()}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default DebugTest;
