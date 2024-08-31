import React, { useState, useEffect, useContext } from 'react';

import {
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
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
  TabPanel
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

const BibleOpener: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [book, setBook] = useState('Gen');
  const [chapter, setChapter] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { osisRef, setOsisRef } = useContext(AppContext);
  const canon = Canon.canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

  useEffect(() => {
    const { book, chapter } = Sword.parseOsisRef(osisRef, 'nrsv');
    setBook(book);
    setChapter(chapter);
  }, []);

  const maxChapter =
    (canon.ot && canon.ot[book].maxChapter) ?? (canon.nt && canon.nt[book].maxChapter) ?? 1;

  return (
    <>
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
          <InputLeftAddon onClick={onOpen}>
            <GiOpenBook size={20} color="#888" />
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
                      Object.keys(canon.ot).map((abbrev) => (
                        <GridItem
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
                      Object.keys(canon.nt).map((abbrev) => (
                        <GridItem
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
                    {Array.from({ length: maxChapter }, (_, i) => i + 1).map((number) => {
                      return (
                        <GridItem
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
                            setOsisRef(`${book}.${number}`);
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
