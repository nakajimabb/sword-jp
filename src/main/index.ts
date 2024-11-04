import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { promises as fsps } from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import Sword, { ModType } from '../utils/Sword';

let mainWindow: BrowserWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false // 一時的に無効にしてテスト
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function zipFilePaths(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  return files
    .map((file) => dirPath + '/' + file)
    .filter(
      (filePath) =>
        !fs.lstatSync(filePath).isDirectory() && path.extname(filePath).toLowerCase() === '.zip'
    );
}

function getResourcePath(relativePath) {
  return path.join(app.isPackaged ? process.resourcesPath : process.cwd(), relativePath);
}

async function loadSwordModules() {
  const resourcePath = getResourcePath('assets');
  const bibleDir = resourcePath + '/BibleTexts';
  const biblePaths = zipFilePaths(bibleDir);
  const bibles = await Promise.all(
    biblePaths.map(async (filePath) => await Sword.loadFile(filePath, 'bible'))
  );
  const dictDir = resourcePath + '/Dictionaries';
  const dictPaths = zipFilePaths(dictDir);
  const dicts = await Promise.all(
    dictPaths.map(async (filePath) => await Sword.loadFile(filePath, 'dictionary'))
  );
  const morphDir = resourcePath + '/Morphologies';
  const morphPaths = zipFilePaths(morphDir);
  const morphs = await Promise.all(
    morphPaths.map(async (filePath) => await Sword.loadFile(filePath, 'morphology'))
  );
  const referenceDir = resourcePath + '/References';
  await Promise.all(
    Array.from(bibles.values()).map(async (bible) => {
      const path = referenceDir + '/' + `${bible.modname}.json.zip`;
      if (fs.existsSync(path)) {
        await bible.loadReference(path);
        return bible.modname;
      }
      return '';
    })
  );

  const settings = await readSetting();

  mainWindow.webContents.send('load-app', {
    modules: bibles.concat(dicts).concat(morphs),
    settings,
    resourcePath
  });
}

async function readSetting() {
  try {
    const resourcePath = getResourcePath('assets');
    const settingPath = resourcePath + '/settings.json';
    const data = await fsps.readFile(settingPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading or parsing file:', error);
    return {};
  }
}

async function saveJSONFromFiles(dirPath: string, csvPath: string) {
  const confPath = dirPath + '/' + 'index.json';
  if (!fs.existsSync(confPath)) return;

  const str = await fsps.readFile(confPath, 'utf8');
  const confs = JSON.parse(str);

  const dict: Map<string, object> = new Map();
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.lemma) {
        dict.set(row.lemma, row);
      }
    })
    .on('end', () => {
      const contents: object = {};
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          return console.error('ディレクトリの読み取りに失敗しました:', err);
        }
        // 取得したファイル名をコンソールに出力
        files.forEach((file) => {
          const reg = /^([GH])(\d+).txt$/;
          const m = file.match(reg);
          if (m) {
            const path = dirPath + '/' + file;
            if (fs.existsSync(path)) {
              const key = m[1] + m[2];
              const meaning = fs
                .readFileSync(path, 'utf8')
                .replace(/->/g, '→')
                .replace(/&/g, '＆')
                .replace(/>>/g, '≫')
                .replace(/</g, '＜')
                .replace(/>/g, '＞')
                // .replace(/\)/g, "）")
                // .replace(/\(/g, "（")
                .replace(/…/g, '•••');
              const content = dict.get(key);
              if (meaning && content) {
                const spell = 'spell' in content ? String(content.spell) : '';
                const pronunciation =
                  'pronunciation' in content
                    ? String(content.pronunciation).replace(/[()]/g, '')
                    : '';
                contents[key] = { meaning, spell, pronunciation };
              } else {
                console.log(`${key} not found!`);
              }
            }
          }
        });
        const dirName = path.basename(dirPath);
        const jsonPath = path.dirname(dirPath) + '/' + `${dirName}.json`;
        const jsonString = JSON.stringify({ confs, contents }, null, 2);
        fs.writeFile(jsonPath, jsonString, (err) => {
          if (err) {
            console.error('JSONファイルの保存に失敗しました:', err);
            return;
          }
          console.log('JSONファイルが正常に保存されました');
        });
      });
    });
}

async function saveJSONFromDir() {
  // ディレクトリの指定
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  const dirPath = result.filePaths[0];
  // CSVファイルの指定
  const result2 = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'CSVファイルの読み込み',
    filters: [
      {
        name: 'sword module',
        extensions: ['csv']
      }
    ]
  });
  const csvPath = result2.filePaths[0];
  saveJSONFromFiles(dirPath, csvPath);
}

async function saveJSONFromCsv() {
  // CSVファイルの指定
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'CSVファイルの読み込み',
    filters: [
      {
        name: 'sword module',
        extensions: ['csv']
      }
    ]
  });
  // 設定ファイル(JSON)の指定
  const result2 = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: '設定ファイル(JSON)の読み込み',
    filters: [
      {
        name: 'sword module',
        extensions: ['json']
      }
    ]
  });
  const csvPath = result.filePaths[0];
  const confPath = result2.filePaths[0];
  const jsonPath = path.format({
    ...path.parse(csvPath),
    base: undefined, // baseプロパティは設定しないことでnameとextが使われる
    ext: '.json'
  });

  const str = await fsps.readFile(confPath, 'utf8');
  const confs = JSON.parse(str);

  const dict: Map<string, object> = new Map();
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.lemma) {
        dict.set(row.lemma, row);
      }
    })
    .on('end', () => {
      const contents: object = {};
      dict.forEach((content, key) => {
        const meaning = 'meaning' in content ? String(content.meaning) : '';
        const spell = 'spell' in content ? String(content.spell) : '';
        const pronunciation =
          'pronunciation' in content ? String(content.pronunciation).replace(/[()]/g, '') : '';
        contents[key] = { meaning, spell, pronunciation };
      });

      const jsonString = JSON.stringify({ confs, contents }, null, 2);
      fs.writeFile(jsonPath, jsonString, (err) => {
        if (err) {
          console.error('JSONファイルの保存に失敗しました:', err);
          return;
        }
        console.log('JSONファイルが正常に保存されました');
      });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');
  const menu = Menu.buildFromTemplate([
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'load Bible',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFile('bible')
        },
        {
          label: 'load Dictionary',
          click: () => openFile('dictionary')
        },
        {
          label: 'save JSON from directory',
          click: saveJSONFromDir
        },
        {
          label: 'save JSON from csv',
          click: saveJSONFromCsv
        },
        {
          label: '開発ツール',
          click: () => {
            mainWindow.webContents.openDevTools();
          }
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' }
          ]
        },
        { role: 'quit', label: '終了' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();
  // レンダラープロセスが準備完了したらモジュールを読み込む
  ipcMain.on('renderer-ready', () => {
    loadSwordModules();
  });

  ipcMain.on('save-setting', (_, data) => {
    const json = JSON.stringify(data, null, 2);
    const resourcePath = getResourcePath('assets');
    const settingPath = resourcePath + '/settings.json';
    fs.writeFile(settingPath, json, (err) => {
      if (err) {
        console.error('Error saving data:', err);
      }
    });
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function openFile(modtype: ModType) {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'ファイルを選択する',
    filters: [
      {
        name: 'sword module',
        extensions: ['zip']
      }
    ]
  });
  const filePath = result.filePaths[0];
  const sword = await Sword.loadFile(filePath, modtype);
  mainWindow.webContents.send('load-sword-module', sword);
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
