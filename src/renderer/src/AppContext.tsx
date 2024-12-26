import React, { useState, useEffect, useContext, createContext } from 'react';
import Sword, { WordReference } from '../../utils/Sword';

export const SEARCH_ITEM_SIZE = 20;

export type Setting = {
  viewLayouts: ViewLayout[][];
  targetHistory: { osisRefs: string[]; index: number };
};

export type ViewLayout = {
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
  viewLayouts: ViewLayout[][]; // jagged Array
  changeViewLayouts: (layouts: ViewLayout[][]) => void;
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
  changeTargetHistory: (history: { osisRefs: string[]; index: number }) => void;
};

const AppContext = createContext({
  swords: new Map(),
  viewLayouts: [],
  changeViewLayouts: () => {},
  osisRef: '',
  setOsisRef: () => {},
  targetWord: {},
  setTargetWord: () => {},
  dictionaries: [],
  searchResults: [],
  setSearchResults: () => {},
  workSpaceTab: 0,
  setWorkSpaceTab: () => {},
  targetHistory: { osisRefs: [], index: -1 },
  changeTargetHistory: () => {}
} as ContextType);

type Settings = {
  viewLayouts?: ViewLayout[][];
  targetHistory?: { osisRefs: string[]; index: number };
};

const ViewLayoutIndexes: number[][][] = [
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
  const [viewLayouts, setViewLayouts] = useState<ViewLayout[][]>([]);
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
            new Sword(
              m.modname,
              m.modtype,
              m.confs,
              m.binary,
              m.indexes,
              m.format,
              m.dict,
              m.references
            )
          )
        );
        setSwords(swds);
        const swdarr = Array.from(swds.values());
        const dicts = swdarr.filter((sword) => sword.modtype === 'dictionary');
        if (dicts.length > 0) setDictionaries(dicts);
        // load settings
        if (settings.viewLayouts) {
          setViewLayouts(settings.viewLayouts);
        } else {
          const bibleNames = swdarr
            .filter((sword) => sword.modtype === 'bible')
            .map((sword) => sword.modname);
          console.log({
            swdarr,
            bibleNames,
            dicts,
            lay: makeViewLayouts(bibleNames, dicts.length > 0)
          });
          setViewLayouts(makeViewLayouts(bibleNames, dicts.length > 0));
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

    function handleAuxClick(event: MouseEvent) {
      // middle click
      if (event.button === 1) {
        window.electron.ipcRenderer.send('inspect-element', {
          x: event.clientX,
          y: event.clientY
        });
      }
    }
    if (isdev()) {
      document.addEventListener('auxclick', handleAuxClick);
    }

    return () => {
      window.electron.ipcRenderer.removeAllListeners('load-app');
      if (isdev()) {
        document.removeEventListener('auxclick', handleAuxClick);
      }
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
        sword.format,
        sword.dict,
        sword.references
      );
      setSwords((prev) => {
        const swds: Map<string, Sword> = new Map(prev);
        swds.set(clone.modname, clone);
        return swds;
      });
      if (clone.modtype === 'bible') {
        setViewLayouts((prev) => {
          const lays = prev.flat();
          const bibleNames = lays
            .filter((lay) => lay.viewType === 'bible')
            .map((lay) => lay.modname);
          bibleNames.push(clone.modname);
          const enableDict = lays.some((lay) => lay.viewType === 'dictionary');
          return makeViewLayouts(bibleNames, enableDict);
        });
      } else if (clone.modtype === 'dictionary') {
        setDictionaries((prev) => prev.concat(clone));
      }
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners('load-sword-module');
    };
  }, []);

  function isdev() {
    return process.env.NODE_ENV === 'development';
  }

  function slicedHistory(history: { osisRefs: string[]; index: number }) {
    const MaxHistory = 10;
    if (history.index > 0) {
      if (history.index > MaxHistory) {
        return {
          osisRefs: history.osisRefs.slice(history.index - MaxHistory, history.index + MaxHistory),
          index: MaxHistory
        };
      } else {
        return {
          ...history,
          osisRefs: history.osisRefs.slice(0, history.index + MaxHistory)
        };
      }
    } else {
      return history;
    }
  }

  function changeViewLayouts(layouts: ViewLayout[][]) {
    setViewLayouts(layouts);
    saveSetting({ viewLayouts: layouts, targetHistory });
  }

  function changeTargetHistory(history: { osisRefs: string[]; index: number }) {
    setTargetHistory(slicedHistory(history));
    saveSetting({ viewLayouts, targetHistory: history });
  }

  function saveSetting(setting: {
    viewLayouts: ViewLayout[][];
    targetHistory: { osisRefs: string[]; index: number };
  }) {
    window.electron.ipcRenderer.send('save-setting', setting);
  }

  function makeViewLayouts(bibleNames: string[], enableDict: boolean) {
    const layoutArr: ViewLayout[] = bibleNames.map((modname) => ({
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
    const indexes: number[][] = ViewLayoutIndexes[layoutArr.length];
    const layouts: ViewLayout[][] = [];
    indexes.forEach((idxes) => {
      const arr: ViewLayout[] = [];
      idxes.forEach((i) => arr.push(layoutArr[i]));
      layouts.push(arr);
    });
    return layouts;
  }

  return (
    <AppContext.Provider
      value={{
        swords,
        viewLayouts,
        changeViewLayouts,
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
        changeTargetHistory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
