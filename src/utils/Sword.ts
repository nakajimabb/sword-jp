import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import { getRawEntry as zTextRawEntry } from './zText';
import { getRawEntry as rawComRawEntry } from './rawCom';
import Canon from './Canon';

export type ModType = 'bible' | 'dictionary' | 'morphology';
export type BookU8Arr = Partial<Record<'nt' | 'ot' | 'dict', Uint8Array>>;

export interface BookPos {
  book: string;
  chapter: number;
  verse: number;
  osisRef: string;
}

export interface ChapterIndex {
  start: number;
  length: number;
  offset: number;
  verses: { offset: number; length: number }[];
}

export interface DictIndex {
  start: number;
  length: number;
  osisRef: string;
}

export interface IndexesType {
  ot?: { [book: string]: ChapterIndex[] };
  nt?: { [book: string]: ChapterIndex[] };
  dict_ot?: { [key: string]: DictIndex };
  dict_nt?: { [key: string]: DictIndex };
  dict?: { [key: string]: DictIndex };
}

export function decodeTextFromUint8Array(u8arr: Uint8Array, encoding = 'CP1252') {
  return iconv.decode(Buffer.from(u8arr), encoding);
}

class Sword {
  modname: string;
  modtype: ModType;
  confs: { [key: string]: string | string[] };
  binary: BookU8Arr;
  indexes: IndexesType;
  references?: {
    [lemma: string]: { [book: string]: { [chapter: number]: { [verse: number]: number } } };
  };

  constructor(
    modname: string,
    modtype: ModType,
    confs: { [key: string]: string | string[] },
    binary: BookU8Arr,
    indexes: IndexesType,
    references?: {
      [lemma: string]: { [book: string]: { [chapter: number]: { [verse: number]: number } } };
    }
  ) {
    this.modname = modname;
    this.modtype = modtype;
    this.confs = confs;
    this.binary = binary;
    this.indexes = indexes;
    this.references = references;
  }

  async loadReference(path: string) {
    const buffer = fs.readFileSync(path);
    const zip = await JSZip.loadAsync(buffer);
    for (const name in zip.files) {
      const m = name.match(/^(\w+).json$/);
      if (m) {
        const json = await zip.files[name].async('text');
        this.references = JSON.parse(json);
      }
    }
  }

  static supported(moddrv: string) {
    return ['zText', 'zCom', 'RawCom'].includes(moddrv);
  }

  renderText(osisRef: string) {
    if (this.confs && this.indexes) {
      if (this.modtype === 'bible') {
        const vers = String(this.confs.Versification ?? 'kjv').toLowerCase();
        const { book, chapter, verses } = Sword.parseOsisRef(osisRef, vers);
        return this.renderBibleText(book, chapter, verses);
      } else {
        return this.renderDictText(osisRef);
      }
    }
    throw Error(`invalid data`);
  }

  renderDictText(osisRef: string) {
    const rawTexts: Map<string, string> = new Map();
    if (this.binary.dict && this.indexes.dict) {
      const indexes = this.indexes.dict;
      if (indexes && osisRef in indexes) {
        const encoding = String(this.confs.Encoding) ?? 'CP1252';
        const index = indexes[osisRef];
        const data = this.binary.dict.slice(index.start, index.start + index.length);
        const rawText = decodeTextFromUint8Array(data, encoding);
        rawTexts.set(osisRef, rawText);
      }
    }
    return rawTexts;
  }

  renderBibleText(book: string, chapter: number, verses: number[]) {
    const moddrv = this.confs.ModDrv as string;
    const encoding = (this.confs.Encoding ?? 'CP1252') as string;
    const indexes = this.indexes;
    const binary = this.binary;
    if (Sword.supported(moddrv) && encoding && binary && indexes) {
      if (moddrv === 'zText' || moddrv === 'zCom') {
        let bookIndexes: ChapterIndex[] = [];
        let u8arr: Uint8Array | undefined = undefined;
        if (indexes.nt && book in indexes.nt) {
          bookIndexes = indexes.nt[book];
          u8arr = binary.nt;
        } else if (indexes.ot && book in indexes.ot) {
          bookIndexes = indexes.ot[book];
          u8arr = binary.ot;
        }
        if (bookIndexes.length > 0 && u8arr) {
          return zTextRawEntry(u8arr, bookIndexes, book, chapter, verses, encoding);
        } else {
          throw Error(`not found indexes ${moddrv} ${book} ${chapter}`);
        }
      } else if (moddrv === 'RawCom') {
        const dictIndexes: DictIndex[] = [];
        let u8arr: Uint8Array | undefined = undefined;
        verses.forEach((verse) => {
          const osisRef = `${book}.${chapter}:${verse}`;
          if (indexes.dict_ot && osisRef in indexes.dict_ot) {
            dictIndexes.push(indexes.dict_ot[osisRef]);
            u8arr = binary.ot;
          } else if (indexes.dict_nt && osisRef in indexes.dict_nt) {
            dictIndexes.push(indexes.dict_nt[osisRef]);
            u8arr = binary.nt;
          }
        });

        if (dictIndexes.length > 0 && u8arr) {
          return rawComRawEntry(u8arr, dictIndexes, encoding);
        } else {
          throw Error(`not found indexes ${moddrv} ${book} ${chapter}`);
        }
      } else {
        throw Error(`not supported moddrv ${moddrv}`);
      }
    }
    throw Error(`not supported data ${moddrv} ${encoding}`);
  }

  private static parseConf(str: string) {
    const confs: { [key: string]: string | string[] } = {};
    let modname: string | undefined;
    const lines = str.split(/[\r\n]+/g);
    for (const line of lines) {
      // ignore comment or empty line
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }
      const matches = line.trim().match(/^\[(.*?)\]$/);
      if (matches) {
        modname = matches[1];
      } else {
        const [key, value] = line.trim().split('=');
        if (key && value !== undefined) {
          if (key.trim() in confs) {
            const prev = confs[key.trim()];
            if (Array.isArray(prev)) {
              confs[key.trim()] = prev.concat(value);
            } else {
              confs[key.trim()] = [prev, value];
            }
          } else {
            confs[key.trim()] = value.trim();
          }
        }
      }
    }
    return { modname, confs };
  }

  public static parseOsisRef(osisRef: string, vers: string) {
    const m = osisRef.match(/^(\w+)\.(\d+)(:([\d-,]+))*$/);
    if (m) {
      const book = m[1];
      const chapter = Number(m[2]);
      const verse = m[4];
      const bookInfo = Canon.bookInfo(vers, book);
      if (bookInfo) {
        if (verse) {
          const verses = Sword.parseVerse(verse);
          return { book, chapter, verses };
        } else {
          if (chapter < bookInfo.maxVerses.length) {
            const verseMax = bookInfo.maxVerses[chapter - 1];
            const verses = [...Array(verseMax)].map((_, i) => i + 1);
            return { book, chapter, verses };
          }
        }
      }
    }
    throw Error(`cannot parse osisRef ${osisRef}`);
  }

  private static parseVerse(str: string) {
    const strs = str.split(',');
    const verses: number[] = [];
    strs.forEach((s) => {
      const strs2 = s.split('-').filter((s2) => s2);
      if (strs2.length === 1) {
        verses.push(Number(strs2[0]));
      } else {
        const v1 = Number(strs2[0]);
        const v2 = Number(strs2[1]);
        for (let i = v1; i <= v2; ++i) {
          verses.push(i);
        }
      }
    });
    return verses;
  }

  public static async createBibleIndexes(
    u8arrIndexes: { [key: string]: Uint8Array },
    moddrv: string,
    vers: string
  ): Promise<IndexesType> {
    let bookPosOT: { start: number; length: number }[] | null = null;
    let bookPosNT: { start: number; length: number }[] | null = null;
    let rawPosNT: { [key: string]: ChapterIndex[] } = {};
    let rawPosOT: { [key: string]: ChapterIndex[] } = {};
    let rawPosDictNT: { [key: string]: DictIndex } = {};
    let rawPosDictOT: { [key: string]: DictIndex } = {};

    if (moddrv === 'zText' || moddrv === 'zCom') {
      if (u8arrIndexes.ot_zs || u8arrIndexes.ot_zv) {
        bookPosOT = Sword.getBookPositions(u8arrIndexes.ot_zs);
        rawPosOT = Sword.getChapterVersePositions(u8arrIndexes.ot_zv, bookPosOT, 'ot', vers);
      }
      if (u8arrIndexes.nt_zs || u8arrIndexes.nt_zv) {
        bookPosNT = Sword.getBookPositions(u8arrIndexes.nt_zs);
        rawPosNT = Sword.getChapterVersePositions(u8arrIndexes.nt_zv, bookPosNT, 'nt', vers);
      }
    } else if (moddrv === 'RawCom') {
      if (u8arrIndexes.ot_vss) {
        rawPosDictOT = Sword.getDictPositions(u8arrIndexes.ot_vss, 'ot', vers);
      }
      if (u8arrIndexes.nt_vss) {
        rawPosDictNT = Sword.getDictPositions(u8arrIndexes.nt_vss, 'nt', vers);
      }
    }
    return {
      ot: rawPosOT,
      nt: rawPosNT,
      dict_ot: rawPosDictOT,
      dict_nt: rawPosDictNT
    };
  }

  public static createDictIndexes(
    indexes: Uint8Array,
    u8arr: Uint8Array,
    encoding: string
  ): IndexesType {
    const view = new DataView(indexes.buffer, indexes.byteOffset, indexes.byteLength);
    const dictIndexes: { [key: string]: DictIndex } = {};
    for (let offset = 0; offset + 8 < indexes.length; offset += 8) {
      const start = view.getUint32(offset, true);
      const length = view.getUint32(offset + 4, true);
      if (start + length < u8arr.length) {
        const data = u8arr.slice(start, start + length);
        const rawText = decodeTextFromUint8Array(data, encoding);
        const m = rawText.match(/^(.+)(\r\n|\r|\n)/);
        if (m) {
          const osisRef = m[1];
          const len = m[1].length + m[2].length;
          dictIndexes[osisRef] = { start: start + len, length: length - len, osisRef };
        }
      }
    }
    return { dict: dictIndexes };
  }

  private static getChapterVersePositions(
    u8arr: Uint8Array,
    bookPositions: { start: number; length: number }[],
    otnt: 'ot' | 'nt',
    vers: string
  ) {
    let start = 40; // skip 40 byte
    const bookInfos = Canon.bookInfos(vers, otnt);
    const view = new DataView(u8arr.buffer, u8arr.byteOffset, u8arr.byteLength);

    let chapterStartPos = 0,
      lastNonZeroStartPos = 0,
      length = 0,
      chapterLength = 0,
      bookStartPos = 0,
      booknum = 0,
      startPos = 0,
      foundEmptyChapter = 0;
    const chapterIndexes: { [key: string]: ChapterIndex[] } = {};
    Object.entries(bookInfos).forEach(([book, bookInfo]) => {
      chapterIndexes[book] = [];
      foundEmptyChapter = 0;
      for (let chapter = 0; chapter < bookInfo.maxChapter; chapter++) {
        chapterStartPos = 0;
        lastNonZeroStartPos = 0;
        length = 0;
        const verseMax = bookInfo.maxVerses[chapter];
        if (verseMax <= 0) continue;

        let chapterIndex: ChapterIndex = {
          start: 0,
          length: 0,
          offset: 0,
          verses: []
        };
        for (let verse = 0; verse < verseMax; verse++) {
          booknum = view.getUint16(start, true);
          start += 4; // ignore 2byte?
          startPos = view.getUint32(start, true);
          start += 4;
          if (startPos !== 0) lastNonZeroStartPos = startPos;
          length = view.getUint16(start, true);
          start += 2;
          if (verse === 0) {
            chapterStartPos = startPos;
            bookStartPos = 0;
            if (booknum < bookPositions.length) {
              bookStartPos = bookPositions[booknum].start;
            }
            chapterIndex.offset = chapterStartPos;
            chapterIndex.start = bookStartPos;
          }
          if (booknum === 0 && startPos === 0 && length === 0) {
            chapterIndex.verses.push({ offset: 0, length: 0 });
          } else {
            chapterIndex.verses.push({
              offset: startPos - chapterStartPos,
              length: length
            });
          }
        } //end verse
        if (chapterIndex.verses.length > 0) {
          chapterLength = lastNonZeroStartPos - chapterStartPos + length;
          chapterIndex.length = chapterLength;
          chapterIndexes[book].push(chapterIndex);
          if (isNaN(chapterLength) || chapterLength === 0) {
            foundEmptyChapter++;
          }
        }
        start += 10;
      } //end chapters
      if (foundEmptyChapter === bookInfo.maxChapter) {
        delete chapterIndexes[book];
      }
      start += 10;
    }); //end books
    return chapterIndexes;
  }

  private static getDictPositions(u8arr: Uint8Array, otnt: 'ot' | 'nt', vers: string) {
    let start = 12; // skip 12 byte
    const view = new DataView(u8arr.buffer, u8arr.byteOffset, u8arr.byteLength);

    const bookInfos = Canon.bookInfos(vers, otnt);
    const dictIndexes: { [key: string]: DictIndex } = {};
    Object.entries(bookInfos).forEach(([book, bookInfo]) => {
      start += 6;
      for (let chapter = 0; chapter < bookInfo.maxChapter; chapter++) {
        const verseMax = bookInfo.maxVerses[chapter];
        start += 6;
        for (let verse = 0; verse < verseMax && start + 6 < u8arr.length; verse++) {
          const startPos = view.getUint32(start, true);
          start += 4;
          const length = view.getUint16(start, true);
          start += 2;
          if (length > 0) {
            const osisRef = `${book}.${chapter + 1}:${verse + 1}`;
            dictIndexes[osisRef] = { start: startPos, length: length, osisRef };
          }
        }
      }
    });
    return dictIndexes;
  }

  private static getBookPositions(u8arr: Uint8Array): { start: number; length: number }[] {
    const view = new DataView(u8arr.buffer, u8arr.byteOffset, u8arr.byteLength);
    const bookPositions: { start: number; length: number }[] = [];
    for (let offset = 0; offset < u8arr.byteLength; offset += 12) {
      const start = view.getInt32(offset, true); // little endian
      const length = view.getInt32(offset + 4, true);
      // skip 4byte
      bookPositions.push({ start, length });
    }
    return bookPositions;
  }

  public static async loadFile(path: string, modtype: ModType) {
    const buffer = fs.readFileSync(path);
    const zip = await JSZip.loadAsync(buffer);
    const confName = Object.keys(zip.files).find((name) => name.search(/.conf/) !== -1);
    if (!confName) throw Error('conf file not found.');

    const confBuf = await zip.files[confName].async('text');
    const { modname, confs } = Sword.parseConf(confBuf);
    if (!modname) throw Error('modname not found in conf file');

    const u8arrBooks: BookU8Arr = {};
    const u8arrIndexes: Partial<
      Record<'nt_zs' | 'nt_zv' | 'nt_vss' | 'ot_zs' | 'ot_zv' | 'ot_vss' | 'dict', Uint8Array>
    > = {};

    for (const name in zip.files) {
      if (name.search('.conf') === -1) {
        const u8arr = await zip.files[name].async('uint8array');
        if (confs.ModDrv === 'zText' || confs.ModDrv === 'zCom') {
          if (name.search(/nt.[bc]zs/) !== -1) {
            u8arrIndexes.nt_zs = u8arr; // nt book position
          } else if (name.search(/nt.[bc]zv/) !== -1) {
            u8arrIndexes.nt_zv = u8arr;
          } else if (name.search(/ot.[bc]zs/) !== -1) {
            u8arrIndexes.ot_zs = u8arr; // ot book position
          } else if (name.search(/ot.[bc]zv/) !== -1) {
            u8arrIndexes.ot_zv = u8arr;
          } else {
            const m = name.match(/(nt|ot).\w+$/);
            if (m && m[1]) {
              u8arrBooks[m[1]] = u8arr; //
            }
          }
        } else if (confs.ModDrv === 'RawCom') {
          if (name.search(/nt.vss/) !== -1) {
            u8arrIndexes.nt_vss = u8arr;
          } else if (name.search(/ot.vss/) !== -1) {
            u8arrIndexes.ot_vss = u8arr;
          } else {
            const m = name.match(/(nt|ot)$/);
            if (m && m[1]) {
              u8arrBooks[m[1]] = u8arr; //
            }
          }
        } else {
          if (name.search(/.idx/) !== -1) {
            u8arrIndexes.dict = u8arr;
          } else if (name.search(/.dat/) !== -1) {
            u8arrBooks.dict = u8arr;
          }
        }
      }
    }
    const moddrv = confs.ModDrv as string;
    const vers = String(confs.Versification ?? 'kjv').toLowerCase();
    if (modtype === 'bible') {
      const indexes = await Sword.createBibleIndexes(u8arrIndexes, moddrv, vers);
      return new Sword(modname, modtype, confs, u8arrBooks, indexes);
    } else if (u8arrIndexes.dict && u8arrBooks.dict) {
      const encoding = (confs.Encoding ?? 'UTF-8') as string;
      const indexes = Sword.createDictIndexes(u8arrIndexes.dict, u8arrBooks.dict, encoding);
      return new Sword(modname, modtype, confs, u8arrBooks, indexes);
    }
    throw Error('fail to load sword module');
  }
}

export default Sword;
