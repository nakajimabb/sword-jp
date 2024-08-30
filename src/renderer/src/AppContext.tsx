import React, { useState, useEffect, useContext, createContext } from 'react';
import Sword from '../../utils/Sword';

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
  morphologies: Sword[];
};

const AppContext = createContext({
  swords: new Map(),
  layouts: [],
  osisRef: '',
  setOsisRef: (_: string) => {},
  targetWord: {},
  setTargetWord: (_: TargetWord) => {},
  dictionaries: [],
  morphologies: []
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
  const [morphologies, setMorphologies] = useState<Sword[]>([]);

  useEffect(() => {
    // メインプロセスからのメッセージを受け取る
    window.electron.ipcRenderer.on('load-app', (_, modules: Sword[]) => {
      const swds: Map<string, Sword> = new Map();
      modules.forEach((m) =>
        swds.set(m.modname, new Sword(m.modname, m.modtype, m.confs, m.binary, m.indexes))
      );
      setSwords(swds);
      const swdarr = Array.from(swds.values());
      const bibleNames = swdarr
        .filter((sword) => sword.modtype === 'bible')
        .map((sword) => sword.modname);
      const dicts = swdarr.filter((sword) => sword.modtype === 'dictionary');
      if (dicts.length > 0) setDictionaries(dicts);
      setLayouts(makeLayouts(bibleNames, dicts.length > 0));
    });
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
        sword.indexes
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
        morphologies
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
