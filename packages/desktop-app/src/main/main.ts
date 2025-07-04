import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import * as path from 'path';
import * as os from 'os';
import { BackendManager } from './backend-manager';
import { OllamaManager } from './ollama-manager';
import { MenuBuilder } from './menu-builder';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Initialize electron store
const store = new Store();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let backendManager: BackendManager | null = null;
let ollamaManager: OllamaManager | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebug = process.env.DEBUG_PROD === 'true' || isDevelopment;

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async (): Promise<void> => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDevelopment,
    },
  });

  // Load the renderer
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updater
  // eslint-disable-next-line
  new AppUpdater();

  // Initialize backend manager
  backendManager = new BackendManager();
  await backendManager.start();

  // Initialize Ollama manager
  ollamaManager = new OllamaManager();
  await ollamaManager.initialize();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', async () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    // Stop backend and Ollama before quitting
    if (backendManager) {
      await backendManager.stop();
    }
    if (ollamaManager) {
      await ollamaManager.stop();
    }
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

app.on('before-quit', async () => {
  // Stop backend and Ollama before quitting
  if (backendManager) {
    await backendManager.stop();
  }
  if (ollamaManager) {
    await ollamaManager.stop();
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('get-store-value', (event, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow!, options);
  return result;
});

ipcMain.handle('get-backend-status', () => {
  return backendManager?.getStatus() || { running: false, port: null };
});

ipcMain.handle('get-ollama-status', () => {
  return ollamaManager?.getStatus() || { running: false, models: [] };
});

ipcMain.handle('install-ollama-model', async (event, modelName: string) => {
  if (ollamaManager) {
    return await ollamaManager.installModel(modelName);
  }
  return false;
});

ipcMain.handle('remove-ollama-model', async (event, modelName: string) => {
  if (ollamaManager) {
    return await ollamaManager.removeModel(modelName);
  }
  return false;
});

ipcMain.handle('list-ollama-models', async () => {
  if (ollamaManager) {
    return await ollamaManager.listModels();
  }
  return [];
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  autoUpdater.quitAndInstall();
});
