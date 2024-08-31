import React, { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { PiPushPinSimpleFill, PiPushPinSimpleSlashFill } from 'react-icons/pi';
import DictPassage from './DictPassage';
import { hebrewOrGreek } from './tools';
import { useAppContext } from './AppContext';

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

  return (
    <Box border="1px" borderColor="gray.100" bg="gray.100">
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
      <Box px={2}>
        <Flex>
          <Box fontSize="larger">
            {targetWord.text && (
              <>
                <span className={hebrewOrGreek(targetWord.text)}>{targetWord.text}</span>
              </>
            )}
          </Box>
          &emsp;
          <Box fontSize="sm" pt={2}>
            {targetWord.lemma}
          </Box>
          &emsp;
          <Box ml="auto" pt={2}>
            {targetWord.fixed ? <PiPushPinSimpleFill /> : <PiPushPinSimpleSlashFill />}
          </Box>
        </Flex>
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
              <Box>{modname}</Box>
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
