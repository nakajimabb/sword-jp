import React, { useContext } from 'react';
import { Box } from '@chakra-ui/react';
import ViewLayout from './ViewLayout';
import AppContext, { SEARCH_ITEM_SIZE } from './AppContext';
import { WordReference } from 'src/utils/Sword';

const WorkSpace: React.FC = () => {
  const { workSpaceTab, searchResults, osisRef } = useContext(AppContext);

  function bookPositions(wordRefs: Map<string, WordReference>, book: string) {
    const chapterRefs: Map<number, number[]> = new Map();
    wordRefs.forEach((wordRef) => {
      Object.entries(wordRef[book]).forEach(([chap, verseCounts]) => {
        const chapter = Number(chap);
        const v1 = chapterRefs.get(chapter) ?? [];
        const v2 = Object.keys(verseCounts).map((v) => Number(v));
        const verses = Array.from(new Set([...v1, ...v2])).sort();
        chapterRefs.set(chapter, verses);
      });
    });
    return chapterRefs;
  }

  function osisRefsFromWordRefs(wordRefs: Map<string, WordReference>, book: string) {
    const chapterRefs = bookPositions(wordRefs, book);
    return Array.from(chapterRefs.entries())
      .map(([chapter, verses]) => verses.map((verse) => `${book}.${chapter}:${verse}`))
      .flat();
  }

  return (
    <Box flex="1" overflow="hidden">
      <ViewLayout
        hidden={workSpaceTab !== 0}
        osisRef={osisRef}
        viewOptions={{ viewChapter: false, viewVerse: true, lineBreak: false }}
      />
      {searchResults.map((searchResult, i) => {
        const wordRefs = searchResult.wordRefs;
        const osisRefs = osisRefsFromWordRefs(wordRefs, searchResult.selectedBook);
        const start = searchResult.selectedIndex * SEARCH_ITEM_SIZE;
        return (
          <ViewLayout
            hidden={workSpaceTab !== i + 1}
            osisRef={osisRefs.slice(start, start + SEARCH_ITEM_SIZE)}
            viewOptions={{ viewChapter: true, viewVerse: true, lineBreak: true }}
          />
        );
      })}
    </Box>
  );
};

export default WorkSpace;
