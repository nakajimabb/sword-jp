import { useState, useEffect, useContext } from 'react';
import { Box, Flex, IconButton, Select, Tabs, TabList, Tab } from '@chakra-ui/react';
import { CiSettings } from 'react-icons/ci';
import BibleOpener from './BibleOpener';
import AppContext from './AppContext';
import canon_jp from '../../utils/canons/locale/ja.json';
import './assets/passage.css';

function AppBar(): JSX.Element {
  const [searchOptions, setSearchOptions] = useState<{ label: string; value: string }[]>([]);
  const { searchResult, workSpaceTab, setWorkSpaceTab } = useContext(AppContext);
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

  useEffect(() => {
    const options = Array.from(searchResult.entries()).map(([book, modCounts]) => {
      const strs = Object.entries(modCounts).reduce(
        (accum, [modname, count]) => accum.concat(`${modname}x${count}`),
        [String(canonjp[book]?.abbrev)]
      );
      return { label: strs.join(' '), value: book };
    });
    setSearchOptions(options);
  }, [workSpaceTab]);

  return (
    <Flex px={2}>
      <Flex justifyContent="space-between" p={2}>
        {workSpaceTab === 0 && <BibleOpener />}
        {workSpaceTab === 1 && (
          <Box width="280px">
            <Select size="sm" pl="50px">
              {searchOptions.map((option) => (
                <option value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Box>
        )}
        <Tabs
          index={workSpaceTab}
          size="small"
          variant="soft-rounded"
          colorScheme="gray"
          py={0.5}
          px={4}
        >
          <TabList>
            <Tab px={2} py={1} fontSize="small" onClick={() => setWorkSpaceTab(0)}>
              本文
            </Tab>
            <Tab px={2} py={1} fontSize="small" onClick={() => setWorkSpaceTab(1)}>
              検索1
            </Tab>
          </TabList>
        </Tabs>
      </Flex>
      <IconButton
        ml="auto"
        size="sm"
        isRound={true}
        variant="solid"
        aria-label="Setting"
        fontSize="20px"
        icon={<CiSettings />}
      />
    </Flex>
  );
}

export default AppBar;
