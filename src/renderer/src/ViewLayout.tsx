import React, { useContext } from 'react';

import { Box, Flex } from '@chakra-ui/react';
import AppContext from './AppContext';
import SwordView from './SwordView';

const ViewLayout: React.FC = () => {
  const { swords, layouts, osisRef } = useContext(AppContext);

  return (
    <Flex h="100%" gap={1}>
      {layouts.map((rowLayouts, i) => {
        return (
          <Box key={i} flex="1">
            <Flex direction="column" h="100%" gap={1}>
              {rowLayouts.map((layout, j) => {
                const sword = swords.get(layout.modname);
                if (!sword) return null;
                return (
                  <Box flex="1" overflowY="auto">
                    <SwordView key={j} sword={sword} osisRef={osisRef} />
                  </Box>
                );
              })}
            </Flex>
          </Box>
        );
      })}
    </Flex>
  );
};

export default ViewLayout;
