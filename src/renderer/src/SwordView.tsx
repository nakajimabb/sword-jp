import React, { useEffect, useState } from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import Sword from '../../utils/Sword';
import Passage from './Passage';
import { truncate } from './tools';
import { ViewOptions } from './Passage';

type Props = {
  sword: Sword;
  osisRef: string | string[];
  viewOptions: ViewOptions;
};

const SwordView: React.FC<Props> = ({ sword, osisRef, viewOptions }) => {
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
        <Tooltip
          hasArrow
          fontSize="small"
          bg="gray.300"
          color="black"
          label={String(sword?.confs?.Description ?? sword.modname)}
        >
          {truncate(String(sword?.confs?.Description ?? sword.modname), 24)}
        </Tooltip>
      </Box>
      <Box px={2} pt={1} pb={3} className={String(sword.confs.Lang ?? '')}>
        {Array.from(rawTexts.entries()).map(([ref, rawText], key) => (
          <>
            <Passage key={key} osisRef={ref} rawText={rawText} viewOptions={viewOptions} />
            {viewOptions.lineBreak && <br />}
          </>
        ))}
      </Box>
    </Box>
  );
};

export default SwordView;
