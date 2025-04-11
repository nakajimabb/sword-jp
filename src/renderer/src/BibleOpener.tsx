import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  GridItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Input,
  InputLeftAddon,
  InputGroup,
  Flex,
  IconButton,
  InputRightAddon,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Tooltip
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import { GiOpenBook } from 'react-icons/gi';
import Sword from '../../utils/Sword';
import Canon from '../../utils/Canon';
import canon_jp from '../../utils/canons/locale/ja.json';
import AppContext from './AppContext';

type Props = {
  mode: 'prev' | 'next';
  maxList?: number;
  delay?: number;
};

const HistoryButton: React.FC<Props> = ({ mode, maxList = 10, delay = 300 }) => {
  const [clicking, setClicking] = useState(false);
  const { setOsisRef, targetHistory, changeTargetHistory } = useContext(AppContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDisabled =
    (mode === 'prev' && targetHistory.index <= 0) ||
    (mode === 'next' && targetHistory.index >= targetHistory.osisRefs.length - 1);

  function slicedHistory() {
    const index = targetHistory.index;
    const rindex = targetHistory.osisRefs.length - index;
    return mode === 'prev'
      ? [...targetHistory.osisRefs].reverse().slice(rindex, rindex + maxList)
      : targetHistory.osisRefs.slice(index + 1, index + maxList + 1);
  }

  return (
    <Menu isOpen={isOpen} onClose={onClose}>
      <Tooltip isDisabled={isDisabled} label={mode === 'prev' ? '戻る' : '進む'}>
        <MenuButton
          as={IconButton}
          icon={mode === 'prev' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          isRound
          size="sm"
          fontSize="20px"
          isDisabled={isDisabled}
          onMouseDown={() => {
            setClicking(true);
            setTimeout(() => onOpen(), delay);
          }}
          onMouseUp={() => setClicking(false)}
          onClick={() => {
            if (mode === 'prev') {
              if (targetHistory.index > 0) {
                const index = targetHistory.index - 1;
                const osisRef = targetHistory.osisRefs[index];
                setOsisRef(osisRef);
                changeTargetHistory({ ...targetHistory, index });
              }
            } else {
              if (targetHistory.index < targetHistory.osisRefs.length - 1) {
                const index = targetHistory.index + 1;
                const osisRef = targetHistory.osisRefs[index];
                setOsisRef(osisRef);
                changeTargetHistory({ ...targetHistory, index });
              }
            }
          }}
        />
      </Tooltip>
      <MenuList hidden={!clicking} fontSize="sm" minWidth="100px">
        {slicedHistory().map((osisRef, i) => (
          <MenuItem
            key={i}
            onClick={() => {
              setOsisRef(osisRef);
              const history = {
                ...targetHistory,
                index: mode === 'prev' ? targetHistory.index - i - 1 : targetHistory.index + i + 1
              };
              changeTargetHistory(history);
            }}
          >
            {osisRef}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const BibleOpener: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [book, setBook] = useState('Gen');
  const [chapter, setChapter] = useState(1);

  const { osisRef, setOsisRef, targetHistory, changeTargetHistory } = useContext(AppContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const canon = Canon.canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

  useEffect(() => {
    const { book, chapter } = Sword.parseOsisRef(osisRef, 'nrsv');
    setBook(book);
    setChapter(chapter);
  }, []);

  const maxChapter =
    (canon.ot && canon.ot[book]?.maxChapter) ?? (canon.nt && canon.nt[book]?.maxChapter) ?? 1;

  return (
    <>
      <Flex gap={2} width="280px">
        <HistoryButton mode="prev" />
        <HistoryButton mode="next" />
        <InputGroup cursor="pointer" size="sm" width="200px">
          <InputLeftAddon onClick={onOpen}>
            <GiOpenBook size={20} color="#888" />
          </InputLeftAddon>
          <Input value={osisRef} onChange={(e) => setOsisRef(e.target.value)} />
          <Stack direction="column" spacing="0" justifyContent="center">
            <Tooltip label="次の章">
              <InputRightAddon
                height="50%"
                onClick={() => {
                  const match = osisRef.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const num = Number(match[2]);
                    const ref = match[1] + String(num + 1);
                    setOsisRef(ref);
                    const history = { ...targetHistory };
                    history.osisRefs[history.index] = ref;
                    changeTargetHistory(history);
                  }
                }}
              >
                <ChevronUpIcon />
              </InputRightAddon>
            </Tooltip>
            <Tooltip label="前の章">
              <InputRightAddon
                height="50%"
                onClick={() => {
                  const match = osisRef.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const num = Number(match[2]);
                    if (num > 1) {
                      const ref = match[1] + String(num - 1);
                      setOsisRef(ref);
                      const history = { ...targetHistory };
                      history.osisRefs[history.index] = ref;
                      changeTargetHistory(history);
                    }
                  }
                }}
              >
                <ChevronDownIcon />
              </InputRightAddon>
            </Tooltip>
          </Stack>
        </InputGroup>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton size="sm" />
          <ModalBody>
            <Tabs index={tabIndex} size="sm">
              <TabList>
                <Tab onClick={() => setTabIndex(0)}>聖書</Tab>
                <Tab onClick={() => setTabIndex(1)}>章</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Grid
                    templateColumns="repeat(6, 1fr)"
                    gap={0.5}
                    bg="gray.400"
                    border="1px"
                    borderColor="gray.400"
                  >
                    {canon.ot &&
                      Object.keys(canon.ot).map((abbrev, i) => (
                        <GridItem
                          key={i}
                          w="100%"
                          h="10"
                          bg={book === abbrev ? 'blue.200' : 'blue.100'}
                          textAlign="center"
                          fontSize="sm"
                          cursor="pointer"
                          _hover={{ bg: 'blue.50', color: 'gray.400' }}
                          onClick={() => {
                            setBook(abbrev);
                            setTabIndex(1);
                          }}
                        >
                          <div>{canonjp[abbrev]?.abbrev}</div>
                          <small>{abbrev}</small>
                        </GridItem>
                      ))}
                    {canon.nt &&
                      Object.keys(canon.nt).map((abbrev, i) => (
                        <GridItem
                          key={i}
                          w="100%"
                          h="10"
                          bg={book === abbrev ? 'green.200' : 'green.100'}
                          textAlign="center"
                          fontSize="sm"
                          cursor="pointer"
                          _hover={{ bg: 'green.50', color: 'gray.400' }}
                          onClick={() => {
                            setBook(abbrev);
                            setTabIndex(1);
                          }}
                        >
                          <div>{canonjp[abbrev]?.abbrev}</div>
                          <small>{abbrev}</small>
                        </GridItem>
                      ))}
                  </Grid>
                </TabPanel>
                <TabPanel>
                  <Grid templateColumns="repeat(10, 1fr)" gap={0}>
                    {Array.from({ length: maxChapter }, (_, i) => i + 1).map((number, i) => {
                      return (
                        <GridItem
                          key={i}
                          w="100%"
                          h="8"
                          bg={chapter === number ? 'yellow.300' : 'yellow.100'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="sm"
                          cursor="pointer"
                          border="1px"
                          borderColor="gray.400"
                          _hover={{ bg: 'yellow.100', color: 'gray.400' }}
                          onClick={() => {
                            setChapter(number);
                            const ref = `${book}.${number}`;
                            setOsisRef(ref);
                            const osisRefs = targetHistory.osisRefs.slice(
                              0,
                              targetHistory.index + 1
                            );
                            osisRefs.push(ref);
                            const index = osisRefs.length - 1;
                            changeTargetHistory({ osisRefs, index });
                            onClose();
                          }}
                        >
                          {number}
                        </GridItem>
                      );
                    })}
                  </Grid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BibleOpener;
