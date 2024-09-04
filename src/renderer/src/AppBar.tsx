import { useState, useEffect, useContext } from 'react';
import { Box, Flex, IconButton, Select, Tabs, TabList, Tab } from '@chakra-ui/react';
import { CiSettings } from 'react-icons/ci';
import BibleOpener from './BibleOpener';
import AppContext from './AppContext';
import Canon from '../../utils/Canon';
import canon_jp from '../../utils/canons/locale/ja.json';
import './assets/passage.css';

function AppBar(): JSX.Element {
  const [searchOptions, setSearchOptions] = useState<{ label: string; value: string }[][]>([]);
  const { searchResult, workSpaceTab, setWorkSpaceTab } = useContext(AppContext);
  const canon = Canon.canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

  useEffect(() => {
    const options: { label: string; value: string }[][] = [];
    searchResult.map((search) => {
      const bookCounts: Map<string, { [modname: string]: number }> = new Map(); // book: {modname: count}
      const wordRefs = search.wordRefs;
      const modnames = Array.from(wordRefs.keys());
      const books = Array.from(wordRefs.values()).reduce(
        (accum, wordref) => new Set([...accum, ...Object.keys(wordref)]),
        new Set<string>()
      );
      // => should sort
      books.forEach((book) => {
        const counts = {};
        modnames.forEach((modname) => {
          const wordRef = wordRefs.get(modname);
          if (wordRef && book in wordRef) {
            counts[modname] = Object.values(wordRef[book]).reduce(
              (accum, verseCount) =>
                Object.values(verseCount).reduce((accum2, vnum) => accum2 + vnum, accum),
              0
            );
          }
        });
        bookCounts.set(book, counts);
      });
      const opts = Array.from(bookCounts.entries()).map(([book, modCounts]) => {
        const strs = Object.entries(modCounts).reduce(
          (accum, [modname, count]) => accum.concat(`${modname}x${count}`),
          [String(canonjp[book]?.abbrev)]
        );
        return { label: strs.join(' '), value: book };
      });
      options.push(opts);
    });
    setSearchOptions(options);
  }, [searchResult]);

  // useEffect(() => {
  //   const options = Array.from(searchResult.entries()).map(([book, modCounts]) => {
  //     const strs = Object.entries(modCounts).reduce(
  //       (accum, [modname, count]) => accum.concat(`${modname}x${count}`),
  //       [String(canonjp[book]?.abbrev)]
  //     );
  //     return { label: strs.join(' '), value: book };
  //   });
  //   setSearchOptions(options);
  // }, [workSpaceTab]);

  // function booksToIndexObject(): { [key: string]: number } {
  //   const books = Object.keys(canon.ot ?? {}).concat(Object.keys(canon.nt ?? {}));
  //   return books.reduce((obj, book, index) => {
  //     obj[book] = index;
  //     return obj;
  //   }, {});
  // }

  const seqs = Array.from({ length: searchResult.length }, (_, i) => i + 1);

  return (
    <Flex px={2}>
      <Flex justifyContent="space-between" p={2}>
        {workSpaceTab === 0 && <BibleOpener />}
        {workSpaceTab !== 0 && (
          <Box width="280px">
            {searchOptions.map(
              (opts, i) =>
                i + 1 === workSpaceTab && (
                  <Select key={i} size="sm" pl="50px">
                    {opts.map((option) => (
                      <option value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                )
            )}
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
          {seqs.length > 0 && (
            <TabList>
              <Tab px={2} py={1} fontSize="small" onClick={() => setWorkSpaceTab(0)}>
                本文
              </Tab>
              {seqs.length > 0 &&
                seqs.map((num) => (
                  <Tab px={2} py={1} fontSize="small" onClick={() => setWorkSpaceTab(num)}>
                    {`検索${num}`}
                  </Tab>
                ))}
            </TabList>
          )}
        </Tabs>
      </Flex>
      <IconButton
        my={2}
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
