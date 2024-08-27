import React, { useState, useEffect, useContext, createContext } from 'react';
import Sword from '../../utils/Sword';

export type Layout = {
  modname: string;
  textSize: number; // text size percentage
  doubled: boolean;
  minimized: boolean;
  disabled: boolean;
};

export type ContextType = {
  swords: Map<string, Sword>;
  layouts: Layout[][]; // jagged Array
  osisRef: string;
  setOsisRef: React.Dispatch<React.SetStateAction<string>>;
};

const AppContext = createContext({
  swords: new Map(),
  layouts: [],
  osisRef: '',
  setOsisRef: (_: string) => {}
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

  useEffect(() => {
    // メインプロセスからのメッセージを受け取る
    window.electron.ipcRenderer.on('message-from-main', (_, sword: Sword) => {
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
        console.log({ sws });
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
      window.electron.ipcRenderer.removeAllListeners('message-from-main');
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        swords,
        layouts,
        osisRef,
        setOsisRef
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
