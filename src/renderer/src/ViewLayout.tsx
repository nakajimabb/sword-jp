import React, { useContext } from 'react';

import { Box, Flex } from '@chakra-ui/react';
import AppContext from './AppContext';
import SwordView from './SwordView';
import DictView from './DictView';

type Prop = {
  hidden?: boolean;
};

const ViewLayout: React.FC<Prop> = ({ hidden = false }) => {
  const { swords, layouts, osisRef } = useContext(AppContext);

  return (
    <Flex h="100%" gap={1} hidden={hidden}>
      {layouts.map((rowLayouts, i) => {
        return (
          <Box key={i} minWidth={0} flexGrow={1} flexBasis={0}>
            <Flex direction="column" h="100%" gap={1}>
              {rowLayouts.map((layout, j) => {
                if (layout.viewType === 'bible') {
                  const sword = swords.get(layout.modname);
                  if (!sword) return null;
                  return (
                    <Box key={j} flex="1" overflowY="auto">
                      <SwordView sword={sword} osisRef={osisRef} />
                    </Box>
                  );
                } else if (layout.viewType === 'dictionary') {
                  return (
                    <Box key={j} flex="1" overflowY="auto">
                      <DictView />
                    </Box>
                  );
                } else {
                  return null;
                }
              })}
            </Flex>
          </Box>
        );
      })}
    </Flex>
  );
};

export default ViewLayout;
