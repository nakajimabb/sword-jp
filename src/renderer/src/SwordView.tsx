import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sword from '../../utils/Sword';
import Passage from './Passage';

type Props = {
  sword: Sword;
  osisRef: string;
};

const SwordView: React.FC<Props> = ({ sword, osisRef }) => {
  const [rawTexts, setRawTexts] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const texts = sword.renderText(osisRef);
      setRawTexts(texts);
    })();
  }, [sword, osisRef]);

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
        {sword.modname}
      </Box>
      <Box px={2} pt={1} pb={3} className={String(sword.confs.Lang ?? '')}>
        {Array.from(rawTexts.entries()).map(([osisRef, rawText], key) => (
          <Passage key={key} osisRef={osisRef} rawText={rawText} showPosition="verse" />
        ))}
      </Box>
    </Box>
  );
};

export default SwordView;
