import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Box, Flex } from '@chakra-ui/react';
import { AppContextProvider } from './AppContext';
import AppBar from './AppBar';
import './assets/passage.css';
import ViewLayout from './ViewLayout';

function App(): JSX.Element {
  return (
    <React.StrictMode>
      <AppContextProvider>
        <ChakraProvider>
          <Flex direction="column" width="100vw" height="100vh">
            <AppBar />
            <Box flex="1" overflow="hidden">
              <ViewLayout />
            </Box>
          </Flex>
        </ChakraProvider>
      </AppContextProvider>
    </React.StrictMode>
  );
}

export default App;
