import React, { useContext } from 'react';

import { Box, Flex } from '@chakra-ui/react';
import AppContext from './AppContext';
import SwordView from './SwordView';
import DictView from './DictView';
import { ViewOptions } from './Passage';

type Prop = {
  hidden?: boolean;
  osisRef: string | string[];
  viewOptions: ViewOptions;
};

const ViewLayout: React.FC<Prop> = ({ osisRef, viewOptions, hidden = false }) => {
  const { swords, viewLayouts } = useContext(AppContext);

  return (
    <Flex h="100%" gap={1} hidden={hidden}>
      {viewLayouts.map((rowLayouts, i) => {
        return (
          <Box key={i} minWidth={0} flexGrow={1} flexBasis={0}>
            <Flex direction="column" h="100%">
              {rowLayouts.map((layout, j) => {
                if (layout.viewType === 'bible') {
                  const sword = swords.get(layout.modname);
                  return (
                    <SwordView
                      key={j}
                      sword={sword}
                      col={i}
                      row={j}
                      osisRef={osisRef}
                      viewOptions={viewOptions}
                    />
                  );
                } else if (layout.viewType === 'dictionary') {
                  return <DictView key={j} />;
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
