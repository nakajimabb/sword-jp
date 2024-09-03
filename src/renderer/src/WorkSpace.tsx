import React, { useContext } from 'react';
import { Box } from '@chakra-ui/react';
import ViewLayout from './ViewLayout';
import AppContext from './AppContext';

const WorkSpace: React.FC = () => {
  const { workSpaceTab } = useContext(AppContext);

  return (
    <Box flex="1" overflow="hidden">
      <ViewLayout hidden={workSpaceTab !== 0} />
      <Box hidden={workSpaceTab !== 1}>Search View</Box>
    </Box>
  );
};

export default WorkSpace;
