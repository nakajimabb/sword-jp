import React, { useState, useContext } from 'react';
import {
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  Table,
  Tbody,
  Tr,
  Td
} from '@chakra-ui/react';
import { hebrewOrGreek } from './tools';
import AppContext, { TargetWord } from './AppContext';

type Props = {
  isOpen?: boolean;
  searchWord: (targetWord: TargetWord) => void;
  onClose: () => void;
};

type ResultType = { dict: string; lemma: string; value: { [key: string]: string } };

const WordSearch: React.FC<Props> = ({ isOpen = true, searchWord, onClose }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ResultType[]>([]);

  const { dictionaries, targetWord, setTargetWord } = useContext(AppContext);

  function selectWord(lemma: string) {
    if (lemma) {
      const tw: TargetWord = { ...targetWord, lemma, fixed: true };
      setTargetWord(tw);
      searchWord(tw);
      onClose();
    }
  }

  function searchDict() {
    const results: ResultType[] = [];
    dictionaries.forEach((dict) => {
      const result = dict.searchDictionary(search.trim());
      result.forEach((value, lemma) => {
        results.push({ dict: dict.modname, lemma, value });
      });
      setSearchResults(results);
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="2xl">
        <ModalBody>
          <Flex gap={2} mb={2}>
            <Input
              size="xs"
              w="200px"
              placeholder="検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchDict();
                }
              }}
            />
            <Button size="xs" onClick={searchDict}>
              検索
            </Button>
          </Flex>
          {searchResults.length > 0 && (
            <Table size="xs">
              <Tbody>
                {searchResults.map((result) => (
                  <Tr
                    _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                    onClick={() => selectWord(result.lemma)}
                  >
                    <Td
                      fontSize="sm"
                      verticalAlign="top"
                      className={hebrewOrGreek(result.value.spell)}
                    >
                      {result.value.spell}
                    </Td>
                    <Td fontSize="xs" verticalAlign="top" px={2}>
                      {result.lemma}
                    </Td>
                    <Td fontSize="xs">{result.value.meaning}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WordSearch;
