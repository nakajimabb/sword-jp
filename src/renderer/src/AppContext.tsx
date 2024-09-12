import React, { useState, useEffect, useContext, createContext } from 'react';
import Sword, { WordReference } from '../../utils/Sword';

export const SEARCH_ITEM_SIZE = 20;

export type Layout = {
  viewType: 'bible' | 'dictionary';
  modname: string;
  textSize: number; // text size percentage
  doubled: boolean;
  minimized: boolean;
  disabled: boolean;
};

export type TargetWord = {
  lemma?: string;
  morph?: string;
  text?: string;
  fixed?: boolean;
};

export type ContextType = {
  swords: Map<string, Sword>;
  layouts: Layout[][]; // jagged Array
  osisRef: string;
  setOsisRef: React.Dispatch<React.SetStateAction<string>>;
  targetWord: TargetWord;
  setTargetWord: React.Dispatch<React.SetStateAction<TargetWord>>;
  dictionaries: Sword[];
  searchResults: {
    searchKey: string;
    selectedBook: string;
    selectedIndex: number;
    wordRefs: Map<string, WordReference>;
  }[];
  setSearchResults: React.Dispatch<
    React.SetStateAction<
      {
        searchKey: string;
        selectedBook: string;
        selectedIndex: number;
        wordRefs: Map<string, WordReference>;
      }[]
    >
  >;
  workSpaceTab: number;
  setWorkSpaceTab: React.Dispatch<React.SetStateAction<number>>;
  targetHistory: { osisRefs: string[]; index: number };
  setTargetHistory: React.Dispatch<React.SetStateAction<{ osisRefs: string[]; index: number }>>;
  saveSetting: () => void;
};

type Settings = {
  layouts?: Layout[][];
  targetHistory?: { osisRefs: string[]; index: number };
};

const AppContext = createContext({
  swords: new Map(),
  layouts: [],
  osisRef: '',
  setOsisRef: (_: string) => {},
  targetWord: {},
  setTargetWord: (_: TargetWord) => {},
  dictionaries: [],
  searchResults: [],
  setSearchResults: (
    _: {
      searchKey: string;
      selectedBook: string;
      selectedIndex: number;
      wordRefs: Map<string, WordReference>;
    }[]
  ) => {},
  workSpaceTab: 0,
  setWorkSpaceTab: (_: number) => {},
  targetHistory: { osisRefs: [], index: -1 },
  setTargetHistory: (_: { osisRefs: string[]; index: number }) => {},
  saveSetting: () => {}
} as ContextType);

const LayoutIndexes: number[][][] = [
  [[]], // 0
  [[0]], // 1
  [[0], [1]], // 2
  [[0, 1], [2]], // 3
  [
    [0, 1],
    [2, 3]
  ], // 4
  [[0, 1], [2, 3], [4]], // 5
  [
    [0, 1],
    [2, 3],
    [4, 5]
  ], // 6
  [
    [0, 1, 2],
    [3, 4],
    [5, 6]
  ], // 7
  [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7]
  ], // 8
  [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8]
  ] // 9
];

type Props = {
  children?: React.ReactNode;
};

export const AppContextProvider: React.FC<Props> = ({ children }) => {
  const [swords, setSwords] = useState<Map<string, Sword>>(new Map());
  const [layouts, setLayouts] = useState<Layout[][]>([]);
  const [osisRef, setOsisRef] = useState('Gen.1');
  const [targetWord, setTargetWord] = useState<TargetWord>({});
  const [dictionaries, setDictionaries] = useState<Sword[]>([]);
  const [searchResults, setSearchResults] = useState<
    {
      searchKey: string;
      selectedBook: string;
      selectedIndex: number;
      wordRefs: Map<string, WordReference>; // modname: WordReference
    }[]
  >([]);
  const [workSpaceTab, setWorkSpaceTab] = useState<number>(0);
  const [targetHistory, setTargetHistory] = useState<{ osisRefs: string[]; index: number }>({
    osisRefs: ['Gen.1'],
    index: 0
  });

  useEffect(() => {
    // メインプロセスからのメッセージを受け取る
    window.electron.ipcRenderer.on(
      'load-app',
      (_, { modules, settings }: { modules: Sword[]; settings: Settings }) => {
        // load modules
        const swds: Map<string, Sword> = new Map();
        modules.forEach((m) =>
          swds.set(
            m.modname,
            new Sword(m.modname, m.modtype, m.confs, m.binary, m.indexes, m.references)
          )
        );
        setSwords(swds);
        const swdarr = Array.from(swds.values());
        const dicts = swdarr.filter((sword) => sword.modtype === 'dictionary');
        if (dicts.length > 0) setDictionaries(dicts);
        // load settings
        if (settings.layouts) {
          setLayouts(settings.layouts);
        } else {
          const bibleNames = swdarr
            .filter((sword) => sword.modtype === 'bible')
            .map((sword) => sword.modname);
          console.log({
            swdarr,
            bibleNames,
            dicts,
            lay: makeLayouts(bibleNames, dicts.length > 0)
          });
          setLayouts(makeLayouts(bibleNames, dicts.length > 0));
        }
        if (settings.targetHistory) {
          setTargetHistory(settings.targetHistory);
          const osisRefs = settings.targetHistory.osisRefs;
          const index = settings.targetHistory.index;
          if (index >= 0 && index < osisRefs.length) {
            setOsisRef(osisRefs[index]);
          }
        }
      }
    );
    // メインプロセスに準備完了のシグナルを送信
    window.electron.ipcRenderer.send('renderer-ready');
    return () => {
      window.electron.ipcRenderer.removeAllListeners('load-app');
    };
  }, []);

  useEffect(() => {
    // メインプロセスから読込済モジュール情報を受け取る
    window.electron.ipcRenderer.on('load-sword-module', (_, sword: Sword) => {
      const clone = new Sword(
        sword.modname,
        sword.modtype,
        sword.confs,
        sword.binary,
        sword.indexes,
        sword.references
      );
      setSwords((prev) => {
        const swds: Map<string, Sword> = new Map(prev);
        swds.set(clone.modname, clone);
        return swds;
      });
      if (clone.modtype === 'bible') {
        setLayouts((prev) => {
          const lays = prev.flat();
          const bibleNames = lays
            .filter((lay) => lay.viewType === 'bible')
            .map((lay) => lay.modname);
          bibleNames.push(clone.modname);
          const enableDict = lays.some((lay) => lay.viewType === 'dictionary');
          return makeLayouts(bibleNames, enableDict);
        });
      } else if (clone.modtype === 'dictionary') {
        setDictionaries((prev) => prev.concat(clone));
      }
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners('load-sword-module');
    };
  }, []);

  function slicedHistory() {
    const MaxHistory = 10;
    if (targetHistory.index > 0) {
      if (targetHistory.index > MaxHistory) {
        return {
          osisRefs: targetHistory.osisRefs.slice(
            targetHistory.index - MaxHistory,
            targetHistory.index + MaxHistory
          ),
          index: MaxHistory
        };
      } else {
        return {
          ...targetHistory,
          osisRefs: targetHistory.osisRefs.slice(0, targetHistory.index + MaxHistory)
        };
      }
    } else {
      return targetHistory;
    }
  }

  function saveSetting() {
    window.electron.ipcRenderer.send('save-setting', { layouts, targetHistory: slicedHistory() });
  }

  function makeLayouts(bibleNames: string[], enableDict: boolean) {
    const layoutArr: Layout[] = bibleNames.map((modname) => ({
      viewType: 'bible',
      modname,
      textSize: 100,
      doubled: false,
      minimized: false,
      disabled: false
    }));
    if (enableDict) {
      layoutArr.push({
        viewType: 'dictionary',
        modname: '',
        textSize: 100,
        doubled: false,
        minimized: false,
        disabled: false
      });
    }
    const indexes: number[][] = LayoutIndexes[layoutArr.length];
    const newLayouts: Layout[][] = [];
    indexes.forEach((idxes) => {
      const arr: Layout[] = [];
      idxes.forEach((i) => arr.push(layoutArr[i]));
      newLayouts.push(arr);
    });
    return newLayouts;
  }

  return (
    <AppContext.Provider
      value={{
        swords,
        layouts,
        osisRef,
        setOsisRef,
        targetWord,
        setTargetWord,
        dictionaries,
        searchResults,
        setSearchResults,
        workSpaceTab,
        setWorkSpaceTab,
        targetHistory,
        setTargetHistory,
        saveSetting
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
