import React, { useState, useEffect, useContext, createContext } from 'react';
import Sword from '../../utils/Sword';

export type Layout = {
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
};

const AppContext = createContext({
  swords: new Map(),
  layouts: [],
  osisRef: '',
  setOsisRef: (_: string) => {},
  targetWord: {},
  setTargetWord: (_: TargetWord) => {}
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

  useEffect(() => {
    // メインプロセスからのメッセージを受け取る
    window.electron.ipcRenderer.on('load-app', (_, swords: Sword[]) => {
      const clones = swords.map(
        (sword) => new Sword(sword.modname, sword.modtype, sword.confs, sword.binary, sword.indexes)
      );
      const modules: Map<string, Sword> = new Map();
      clones.forEach((clone) => modules.set(clone.modname, clone));
      setSwords(modules);
      const layoutArr: Layout[] = clones
        .map((clone) => ({
          modname: clone.modname,
          textSize: 100,
          doubled: false,
          minimized: false,
          disabled: false
        }))
        .slice(0, 9);
      const indexes: number[][] = LayoutIndexes[layoutArr.length];
      const newLayouts: Layout[][] = [];
      indexes.forEach((idxes) => {
        const arr: Layout[] = [];
        idxes.forEach((i) => arr.push(layoutArr[i]));
        newLayouts.push(arr);
      });
      setLayouts(newLayouts);
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
        const sws: Map<string, Sword> = new Map(prev);
        sws.set(clone.modname, clone);
        return sws;
      });
      setLayouts((prev) => {
        const flatten = prev.flat().concat({
          modname: clone.modname,
          textSize: 100,
          doubled: false,
          minimized: false,
          disabled: false
        });
        if (flatten.length <= 9) {
          const indexes: number[][] = LayoutIndexes[flatten.length];
          const newLayouts: Layout[][] = [];
          indexes.forEach((idxes) => {
            const arr: Layout[] = [];
            idxes.forEach((i) => arr.push(flatten[i]));
            newLayouts.push(arr);
          });
          return newLayouts;
        } else {
          return prev;
        }
      });
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners('load-sword-module');
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        swords,
        layouts,
        osisRef,
        setOsisRef,
        targetWord,
        setTargetWord
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
