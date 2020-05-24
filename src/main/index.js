'use strict'

import { app } from 'electron'
import { initializeSQLite } from './sqlite.init'
import { initIpcListeners } from './ipcProcesses'
const windowManager = require('electron-window-manager');
const Path = require('path');

initializeSQLite();
initIpcListeners();

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// Workaround for production build not finding ffmpeg
// The path can break after production build
// TODO: deal with other OS's
const ffmpegDirectory = process.env.NODE_ENV === 'development' ?
  Path.resolve(__dirname, "../../bin/ffmpeg.exe") : Path.resolve(__dirname, "../../../../bin/ffmpeg.exe");

const ffprobeDirectory = process.env.NODE_ENV === 'development' ?
  Path.resolve(__dirname, "../../bin/ffprobe.exe") : Path.resolve(__dirname, "../../../../bin/ffprobe.exe");

const gifskiDirectory = process.env.NODE_ENV === 'development' ?
  Path.resolve(__dirname, "../../bin/gifski.exe") : Path.resolve(__dirname, "../../../../bin/gifski.exe");
  

process.env.FFMPEG_PATH = ffmpegDirectory;
process.env.FFPROBE_PATH = ffprobeDirectory;
process.env.GIFSKI_PATH = gifskiDirectory;

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  windowManager.init({
    devMode: process.env.NODE_ENV === 'development'
  });

  mainWindow = windowManager.open("main", "Main Window", winURL, null, {
    width: 1000,
    height: 563,
    minWidth: 1000,
    minHeight: 563,
    resizable: true,
    useContentSize: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  mainWindow.object.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
