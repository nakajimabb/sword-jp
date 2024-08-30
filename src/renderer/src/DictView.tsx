import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sword from '../../utils/Sword';
import Passage from './Passage';
import { useAppContext } from './AppContext';

const DictView: React.FC = () => {
  const [rawTexts, setRawTexts] = useState<Map<string, string[]>>(new Map());
  const { targetWord, swords } = useAppContext();

  useEffect(() => {
    (async () => {
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
      <Box px={2} pt={1} pb={3}>
        {Array.from(rawTexts.entries()).map(([modname, rawTexts]) => {
          return (
            <div>
              <div>
                {targetWord.text} {targetWord.lemma} {targetWord.morph}
              </div>
              <hr />
              <div>{modname}</div>
              <div>
                {rawTexts.map((rawText) => (
                  <div>{rawText}</div>
                ))}
              </div>
            </div>
          );
        })}
      </Box>
    </Box>
  );
};

export default DictView;
