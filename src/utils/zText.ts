import * as pako from 'pako';
import * as iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import { ChapterIndex } from './Sword';

function decodeTextFromUint8Array(u8arr: Uint8Array, encoding = 'CP1252') {
  return iconv.decode(Buffer.from(u8arr), encoding);
}

export function getRawEntry(
  uint8Array: Uint8Array,
  bookIndexes: ChapterIndex[],
  book: string,
  chapter: number,
  verses: number[],
  encoding: string
) {
  const bookIndex = bookIndexes[chapter - 1];
  if (!bookIndex) {
    console.log({
      bookIndexes,
      book,
      chapter,
      verses
    });
    throw Error(`wrong chapter ${book}.${chapter}`);
  }
  const chapterStartPos = bookIndex.start + bookIndex.offset;
  const chapterEndPos = chapterStartPos + bookIndex.length;
  const view = uint8Array.slice(bookIndex.start, chapterEndPos);
  const inflator = new pako.Inflate();
  inflator.push(view, true);
  if (inflator.err) {
    throw Error(`pako error occur ${inflator.err}`);
  }
  const infU8arr = inflator.result as Uint8Array;

  let verseStart = 0,
    verseEnd = 0;
  const rawTexts: Map<string, string> = new Map();
  verses.forEach((verse) => {
    const pos = bookIndexes[chapter - 1].verses[verse - 1];
    verseStart = bookIndex.offset + (pos?.offset || 0);
    verseEnd = verseStart + (pos?.length || 0);

    const u8arr = infU8arr.slice(verseStart, verseEnd);
    const rawText = decodeTextFromUint8Array(u8arr, encoding);
    const osisRef = `${book}.${chapter}:${verse}`;
    rawTexts.set(osisRef, rawText);
  });
  return rawTexts;
}
