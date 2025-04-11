import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Stack,
  Text,
  Tooltip
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { PiPushPinSimpleFill, PiPushPinSimpleSlashFill } from 'react-icons/pi';
import { BsSearch } from 'react-icons/bs';
import { AiOutlineFileSearch } from 'react-icons/ai';
import DictPassage from './DictPassage';
import { TargetWord, useAppContext } from './AppContext';
import Canon from '../../utils/Canon';
import { hebrewOrGreek } from './tools';
import { WordReference } from '../../utils/Sword';
import WordSearch from './WordSearch';

const DictOpener: React.FC = () => {
  const [openWordSearch, setOpenWordSearch] = useState(false);
  const { swords, targetWord, setTargetWord, searchResults, setSearchResults, setWorkSpaceTab } =
    useAppContext();
  const canon = Canon.canons.nrsv;

  function booksToIndexObject(): { [key: string]: number } {
    const books = Object.keys(canon.ot ?? {}).concat(Object.keys(canon.nt ?? {}));
    return books.reduce((obj, book, index) => {
      obj[book] = index;
      return obj;
    }, {});
  }

  function searchWord(targetWord: TargetWord) {
    const maxSearch = 3;
    if (targetWord.lemma && targetWord.lemma.trim()) {
      const bookIndexes = booksToIndexObject();
      const lemma = targetWord.lemma.trim();
      const wordRefs: Map<string, WordReference> = new Map();
      bibles().forEach((bible) => {
        const references = bible.references;
        if (references && references[lemma]) {
          // wordRefs.set(bible.modname, references[lemma]);
          const books = Object.keys(references[lemma]).sort(
            (book1, book2) => bookIndexes[book1] - bookIndexes[book2]
          ); // sorted bible book key
          const sortedWordRefs: WordReference = books.reduce((accum, book) => {
            accum[book] = references[lemma][book];
            return accum;
          }, {});
          wordRefs.set(bible.modname, sortedWordRefs);
        }
      });
      const wordRef = Array.from(wordRefs.values())[0];
      const selectedBook = Object.keys(wordRef)[0];
      setSearchResults((prev) =>
        prev
          .concat({ searchKey: lemma, wordRefs, selectedBook, selectedIndex: 0 })
          .slice(prev.length >= maxSearch ? prev.length + 1 - maxSearch : 0)
      );
      setWorkSpaceTab(searchResults.length + 1 >= maxSearch ? maxSearch : searchResults.length + 1);
    }
  }

  function bibles() {
    return Array.from(swords.values()).filter((sword) => sword.modtype === 'bible');
  }

  return (
    <>
      <WordSearch
        isOpen={openWordSearch}
        searchWord={searchWord}
        onClose={() => setOpenWordSearch(false)}
      />
      <InputGroup cursor="pointer" size="xs" width="200px">
        <Tooltip label="ピン留め">
          <IconButton
            mr={1}
            size="xs"
            isRound={true}
            aria-label="Search database"
            icon={targetWord.fixed ? <PiPushPinSimpleFill /> : <PiPushPinSimpleSlashFill />}
            onClick={() => {
              if (targetWord.lemma) {
                setTargetWord((prev) => ({ ...prev, fixed: !prev.fixed }));
              }
            }}
          />
        </Tooltip>
        <Input
          value={targetWord.lemma}
          onChange={(e) => setTargetWord((prev) => ({ ...prev, lemma: e.target.value }))}
        />
        <Stack h="24px" direction="column" spacing="0" justifyContent="center">
          <InputRightAddon
            height="50%"
            onClick={() => {
              setTargetWord((prev) => {
                if (prev.lemma) {
                  const match = prev.lemma.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const numstr = match[2];
                    const num = Number(numstr);
                    const numstr2 = String(num + 1).padStart(numstr.length, '0');
                    return { ...prev, lemma: match[1] + numstr2, morph: undefined };
                  }
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
              setTargetWord((prev) => {
                if (prev.lemma) {
                  const match = prev.lemma.match(/^(.*?)(\d+)$/);
                  if (match) {
                    const numstr = match[2];
                    const num = Number(numstr);
                    if (num > 1) {
                      const numstr2 = String(num - 1).padStart(numstr.length, '0');
                      return { ...prev, lemma: match[1] + numstr2, morph: undefined };
                    }
                  }
                }
                return prev;
              });
            }}
          >
            <ChevronDownIcon />
          </InputRightAddon>
        </Stack>
        <Tooltip label="語彙参照">
          <IconButton
            ml={1}
            size="xs"
            isRound={true}
            aria-label="Search database"
            icon={<BsSearch />}
            onClick={() => searchWord(targetWord)}
          />
        </Tooltip>
        <Tooltip label="辞書検索">
          <IconButton
            ml={1}
            size="xs"
            isRound={true}
            aria-label="Search database"
            icon={<AiOutlineFileSearch />}
            onClick={() => setOpenWordSearch(true)}
          />
        </Tooltip>
      </InputGroup>
    </>
  );
};

const DictView: React.FC = () => {
  const [rawTexts, setRawTexts] = useState<Map<string, string[]>>(new Map());
  const { targetWord, swords } = useAppContext();

  useEffect(() => {
    (async () => {
      try {
        const texts: Map<string, string[]> = new Map();
        const dicts = getDictionaries();
        dicts.forEach((dict) => {
          if (targetWord.lemma) {
            const txts = dict.renderText(targetWord.lemma);
            if (txts.size > 0) texts.set(dict.modname, Array.from(txts.values()));
          }
        });
        setRawTexts(texts);
      } catch (e) {
        setRawTexts(new Map());
      }
    })();
  }, [targetWord, swords]);

  function getDictionaries() {
    return Array.from(swords.values()).filter((sword) => sword.modtype === 'dictionary');
  }

  function getSword(modname: string) {
    return Array.from(swords.values()).find((sword) => sword.modname === modname);
  }

  function swordDesc(modname: string) {
    const sword = getSword(modname);
    return String(sword?.confs?.title ?? sword?.confs?.Description ?? modname);
  }

  function getMorphologies() {
    return Array.from(swords.values()).filter((sword) => sword.modtype === 'morphology');
  }

  function morphNode(morph: string) {
    const morphMods = getMorphologies();
    const morphTxts = morphMods
      .map((morphMod) => {
        if (morph) return Array.from(morphMod.renderDictText(morph).values()) ?? [];
        else return [];
      })
      .flat()
      .filter((str) => !!str);

    return morphTxts.length > 0 ? (
      <Box fontSize="xs">
        <DictPassage rawText={morphTxts.join('')} />
      </Box>
    ) : undefined;
  }

  function wordInfo(lemma: string, word?: string, morph?: string) {
    if (lemma) {
      return getDictionaries()
        .map((dict) => {
          const wordMap = dict.dict;
          if (wordMap) {
            const item = wordMap.get(lemma);
            if (item) {
              return (
                <>
                  <Flex>
                    <Box
                      fontSize="large"
                      fontWeight="semibold"
                      className={hebrewOrGreek(item.spell)}
                    >
                      {item.spell}
                    </Box>
                    &emsp;
                    <Box fontSize="small" pt={1}>
                      {item.pronunciation}
                    </Box>
                  </Flex>
                  {morph && (
                    <>
                      <Badge fontSize="x-small" variant="outline" colorScheme="gray">
                        Morphology
                      </Badge>
                      <Stack>
                        <Flex gap={2}>
                          {word && <Text className={hebrewOrGreek(word)}>{word}</Text>}
                          {morphNode(morph)}
                        </Flex>
                      </Stack>
                    </>
                  )}
                </>
              );
            }
          }
          return undefined;
        })
        .filter((text) => !!text)[0];
    }
    return undefined;
  }

  return (
    <>
      <Box
        px="0.5rem"
        fontSize="sm"
        letterSpacing="wide"
        boxShadow="lg"
        color="gray.600"
        bg="yellow.200"
        h="1.25rem"
      >
        Dictionary
      </Box>
      <Box overflowY="auto">
        <Box p={2}>
          <DictOpener />
        </Box>
        <Box px={2} py={0}>
          {targetWord.lemma && wordInfo(targetWord.lemma, targetWord.text, targetWord.morph)}
        </Box>
        <Box px={2} py={1}>
          {Array.from(rawTexts.entries()).map(([modname, texts]) => {
            return (
              <>
                <Badge variant="outline" colorScheme="green">
                  {swordDesc(modname)}
                </Badge>
                <Box fontSize="small" whiteSpace="pre-line">
                  {texts.map((rawText) => (
                    <DictPassage rawText={rawText} />
                  ))}
                </Box>
              </>
            );
          })}
        </Box>
      </Box>
    </>
  );
};

export default DictView;
