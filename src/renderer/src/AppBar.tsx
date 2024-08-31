import { Flex, IconButton } from '@chakra-ui/react';
import { CiSettings } from 'react-icons/ci';
import BibleOpener from './BibleOpener';
import './assets/passage.css';

function App(): JSX.Element {
  return (
    <Flex justifyContent="space-between" p={2}>
      <BibleOpener />
      <IconButton
        size="sm"
        isRound={true}
        variant="solid"
        aria-label="Setting"
        fontSize="20px"
        icon={<CiSettings />}
      />
    </Flex>
  );
}

export default App;
