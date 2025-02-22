import { useState, useEffect, useContext, useRef } from 'react';
import {
  Box,
  Flex,
  IconButton,
  InputGroup,
  InputRightAddon,
  Menu,
  MenuButton,
  Select,
  Stack,
  Tabs,
  TabList,
  Tab
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { GiHamburgerMenu } from 'react-icons/gi';
import BibleOpener from './BibleOpener';
import AppContext, { SEARCH_ITEM_SIZE } from './AppContext';
import canon_jp from '../../utils/canons/locale/ja.json';
import './assets/passage.css';
import SearchBar from './SearchBar';
import { WordReference } from 'src/utils/Sword';

function AppBar(): JSX.Element {
  const [searchOptions, setSearchOptions] = useState<{ label: string; value: string }[][]>([]);
  const [enableSearch, setEnableSearch] = useState(false);

  const { searchResults, setSearchResults, workSpaceTab, setWorkSpaceTab } = useContext(AppContext);
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const options: { label: string; value: string }[][] = [];
    searchResults.map((search) => {
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
  }, [searchResults]);

  // useEffect(() => {
  //   const options = Array.from(searchResults.entries()).map(([book, modCounts]) => {
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setEnableSearch(true);
      if (inputRef.current) inputRef.current.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEnableSearch(false);
    }
  };

  function bookPositions(wordRefs: Map<string, WordReference>, book: string) {
    const chapterRefs: Map<number, number[]> = new Map();
    wordRefs.forEach((wordRef) => {
      Object.entries(wordRef[book] ?? []).forEach(([chap, verseCounts]) => {
        const chapter = Number(chap);
        const v1 = chapterRefs.get(chapter) ?? [];
        const v2 = Object.keys(verseCounts).map((v) => Number(v));
        const verses = Array.from(new Set([...v1, ...v2])).sort();
        chapterRefs.set(chapter, verses);
      });
    });
    return chapterRefs;
  }

  function bookPositionPageSize(
    wordRefs: Map<string, WordReference>,
    book: string,
    pageSize: number
  ) {
    const vv = Array.from(bookPositions(wordRefs, book).values());
    return Math.ceil(vv.reduce((accum, vs) => vs.length + accum, 0) / pageSize);
  }

  const seqs = Array.from({ length: searchResults.length }, (_, i) => i + 1);

  return (
    <Flex justifyContent="space-between" px={2}>
      <Flex p={2}>
        {workSpaceTab === 0 && <BibleOpener />}
        {workSpaceTab !== 0 && (
          <Box width="280px">
            {searchOptions.map((opts, i) => {
              const searchResult = searchResults[i];
              const maxPage = bookPositionPageSize(
                searchResult.wordRefs,
                searchResult.selectedBook,
                SEARCH_ITEM_SIZE
              );
              return (
                i + 1 === workSpaceTab && (
                  <Flex>
                    <Box
                      width="60px"
                      fontSize="sm"
                      textAlign="right"
                      px={2}
                      py={1}
                    >{`${searchResult.selectedIndex + 1} / ${maxPage}`}</Box>
                    <InputGroup cursor="pointer" size="sm" width="200px">
                      <Select
                        key={i}
                        size="sm"
                        value={searchResult.selectedBook}
                        onChange={(e) => {
                          setSearchResults((prev) => {
                            const results = [...prev];
                            results[i].selectedBook = e.target.value;
                            results[i].selectedIndex = 0;
                            return results;
                          });
                        }}
                      >
                        {opts.map((option) => (
                          <option value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                      <Stack direction="column" spacing="0" justifyContent="center">
                        <InputRightAddon
                          height="50%"
                          onClick={() => {
                            const searchResult = searchResults[i];
                            const maxPage = bookPositionPageSize(
                              searchResult.wordRefs,
                              searchResult.selectedBook,
                              SEARCH_ITEM_SIZE
                            );
                            setSearchResults((prev) => {
                              const results = [...prev];
                              if (results[i].selectedIndex + 1 < maxPage)
                                results[i].selectedIndex += 1;
                              return results;
                            });
                          }}
                        >
                          <ChevronUpIcon />
                        </InputRightAddon>
                        <InputRightAddon
                          height="50%"
                          onClick={() => {
                            setSearchResults((prev) => {
                              const results = [...prev];
                              if (results[i].selectedIndex > 0) results[i].selectedIndex -= 1;
                              return results;
                            });
                          }}
                        >
                          <ChevronDownIcon />
                        </InputRightAddon>
                      </Stack>
                    </InputGroup>
                  </Flex>
                )
              );
            })}
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
      <Flex>
        {enableSearch && <SearchBar ref={inputRef} onClose={() => setEnableSearch(false)} />}
        <Menu>
          <MenuButton
            isRound
            my={2}
            ml="auto"
            as={IconButton}
            size="sm"
            icon={<GiHamburgerMenu />}
            onClick={() => {}}
          />
        </Menu>
      </Flex>
    </Flex>
  );
}

export default AppBar;
