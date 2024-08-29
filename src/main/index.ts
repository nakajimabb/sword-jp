import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import Sword from '../utils/Sword';

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

async function loadSwordModules() {
  const currentDirectory = process.cwd();
  const bibleDir = currentDirectory + '/files/BibleTexts';
  const bibleFiles = await fs.promises.readdir(bibleDir);
  const bibles = await Promise.all(
    bibleFiles.map(async (file) => {
      const filePath = bibleDir + '/' + file;
      return await Sword.loadFile(filePath, 'bible');
    })
  );
  const dictDir = currentDirectory + '/files/Dictionaries';
  const dictFiles = await fs.promises.readdir(dictDir);
  const dicts = await Promise.all(
    dictFiles.map(async (file) => {
      const filePath = dictDir + '/' + file;
      return await Sword.loadFile(filePath, 'dictionary');
    })
  );
  mainWindow.webContents.send('load-app', bibles.concat(dicts));
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
          label: 'モジュール読込',
          accelerator: 'CmdOrCtrl+O',
          click: openFile
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

async function openFile() {
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
  const sword = await Sword.loadFile(filePath, 'bible');

  mainWindow.webContents.send('load-sword-module', sword);
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.