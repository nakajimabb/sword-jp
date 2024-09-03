import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Flex } from '@chakra-ui/react';
import { AppContextProvider } from './AppContext';
import AppBar from './AppBar';
import WorkSpace from './WorkSpace';
import './assets/passage.css';

function App(): JSX.Element {
  return (
    <React.StrictMode>
      <AppContextProvider>
        <ChakraProvider>
          <Flex direction="column" width="100vw" height="100vh">
            <AppBar />
            <WorkSpace />
          </Flex>
        </ChakraProvider>
      </AppContextProvider>
    </React.StrictMode>
  );
}

export default App;
