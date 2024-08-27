import {
  Button,
  Input,
  InputLeftAddon,
  InputGroup,
  Flex,
  IconButton,
  InputRightAddon,
  Stack
} from '@chakra-ui/react';
import './assets/passage.css';
import { FaBook } from 'react-icons/fa';
import { CiSettings } from 'react-icons/ci';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import { useAppContext } from './AppContext';

function App(): JSX.Element {
  const { osisRef, setOsisRef } = useAppContext();

  return (
    <Flex justifyContent="space-between" p={2}>
      <Flex gap={2}>
        <IconButton
          size="sm"
          isRound={true}
          variant="solid"
          aria-label="Prev"
          fontSize="20px"
          icon={<ChevronLeftIcon />}
        />
        <IconButton
          size="sm"
          isRound={true}
          variant="solid"
          aria-label="Next"
          fontSize="20px"
          icon={<ChevronRightIcon />}
        />
        <InputGroup cursor="pointer" size="sm" width="200px">
          <InputLeftAddon>
            <FaBook />
          </InputLeftAddon>
          <Input type="tel" value={osisRef} onChange={(e) => setOsisRef(e.target.value)} />
          <Stack direction="column" spacing="0" justifyContent="center">
            <InputRightAddon
              height="50%"
              onClick={() => {
                setOsisRef((prev) => {
                  const match = prev.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const num = Number(match[2]);
                    return match[1] + String(num + 1);
                  }
                  return prev;
                });
              }}
            >
              <ChevronUpIcon />
            </InputRightAddon>
            <InputRightAddon
              height="50%"
              onClick={() => {
                setOsisRef((prev) => {
                  const match = prev.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const num = Number(match[2]);
                    return num > 1 ? match[1] + String(num - 1) : prev;
                  }
                  return prev;
                });
              }}
            >
              <ChevronDownIcon />
            </InputRightAddon>
          </Stack>
        </InputGroup>
      </Flex>
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
