import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Stack,
  Tooltip
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { PiPushPinSimpleFill, PiPushPinSimpleSlashFill } from 'react-icons/pi';
import { BsSearch } from 'react-icons/bs';
import DictPassage from './DictPassage';
import { hebrewOrGreek } from './tools';
import { useAppContext } from './AppContext';
import Canon from '../../utils/Canon';
import { WordReference } from '../../utils/Sword';

const DictOpener: React.FC = () => {
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

  function searchWord() {
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
      <InputGroup cursor="pointer" size="xs" width="200px">
        <IconButton
          mr={1}
          isRound={true}
          aria-label="Search database"
          icon={targetWord.fixed ? <PiPushPinSimpleFill /> : <PiPushPinSimpleSlashFill />}
          onClick={() => {
            if (targetWord.lemma) {
              setTargetWord((prev) => ({ ...prev, fixed: !prev.fixed }));
            }
          }}
        />
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
                    return { ...prev, lemma: match[1] + numstr2 };
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
                      return { ...prev, lemma: match[1] + numstr2 };
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
        <Tooltip label="語彙検索">
          <IconButton
            ml={1}
            size="xs"
            isRound={true}
            aria-label="Search database"
            icon={<BsSearch />}
            onClick={searchWord}
          />
        </Tooltip>
      </InputGroup>
    </>
  );
};

const DictView: React.FC = () => {
  const [rawTexts, setRawTexts] = useState<Map<string, string[]>>(new Map());
  const [morphTexts, setMorphTexts] = useState<string[]>([]);
  const { targetWord, swords } = useAppContext();

  useEffect(() => {
    (async () => {
      const morphs = getMorphologies();
      const morphTxts = morphs
        .map((morph) => {
          if (targetWord.morph)
            return Array.from(morph.renderText(targetWord.morph).values()) ?? [];
          else return [];
        })
        .flat()
        .filter((str) => !!str);
      setMorphTexts(morphTxts);
      const texts: Map<string, string[]> = new Map();
      const dicts = getDictionaries();
      dicts.forEach((dict) => {
        if (targetWord.lemma) {
          const txts = dict.renderText(targetWord.lemma);
          if (txts.size > 0) texts.set(dict.modname, Array.from(txts.values()));
        }
      });
      setRawTexts(texts);
    })();
  }, [targetWord, swords]);

  function getMorphologies() {
    return Array.from(swords.values()).filter((sword) => sword.modtype === 'morphology');
  }

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

  return (
    <Box border="1px" borderColor="gray.100">
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
      <Box p={2}>
        <DictOpener />
        <Box fontSize="larger">
          {targetWord.text && (
            <span className={hebrewOrGreek(targetWord.text)}>{targetWord.text}</span>
          )}
        </Box>
        <Flex>
          <Box whiteSpace="pre-line" fontSize="smaller">
            {morphTexts.map((text) => (
              <>
                <Text as="span" color="gray.500" fontSize="smaller">
                  {targetWord.morph}
                </Text>
                &nbsp;
                <DictPassage rawText={text} />
              </>
            ))}
          </Box>
        </Flex>
      </Box>
      <hr />
      <Box p={2}>
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
  );
};

export default DictView;
