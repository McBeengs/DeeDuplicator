import { BrowserWindow } from 'electron'
const { ipcMain } = require('electron');
const windowManager = require('electron-window-manager');

const fork = require('child_process').fork;
const Path = require('path');

export function initIpcListeners() {

    ipcMain.on("showWindow", (args) => {
        const modalPath = process.env.NODE_ENV === 'development'
            ? 'http://localhost:9080/#'
            : `file://${__dirname}/index.html#`

        let win = windowManager.createNew(args.name, args.title, `${modalPath}/${args.route}`, null, {
            width: args.width,
            height: args.height,
            frame: args.frameless === undefined ? false : args.frameless,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true
            }
        }, false);

        win.open();

        win.object.on('close', function () { win = null });
    });

    ipcMain.on("closeWindow", (args) => {
        windowManager.get(args.name).object.destroy();
        windowManager.get("main").object.show();

        if (args.redirectTo) {
            const path = process.env.NODE_ENV === 'development'
                ? 'http://localhost:9080/#'
                : `file://${__dirname}/index.html#`

                windowManager.get("main").loadURL(`${path}/${args.redirectTo}`);
        }
    })

    ipcMain.on("hideMainWindow", () => {
        windowManager.get("main").object.hide();
    });

    ipcMain.on("showMainWindow", () => {
        windowManager.get("main").object.show();
    });

    ipcMain.on("runWorker", (args) => {
        const file = args.file;

        if (file === undefined || file === null) {
            throw "file was not informed";
        }

        try {
            // Workaround for production build not finding workers
            // The path can break after production build
            const directory = process.env.NODE_ENV === 'development' ?
                Path.resolve(__dirname, "../workers") : Path.resolve(__dirname, "../../src/workers");

            const childProcess = fork(Path.join(directory, file), args.params);
            console.log(`New worker [${file}] succesfully forked`);

            childProcess.on("message", (m) => {
                try {
                    if (args.listeners !== undefined) {
                        const listener = args.listeners[m.event];

                        if (listener !== undefined) {
                            listener(m.data);
                        }
                    }
                } catch (ex) {
                    childProcess.kill();
                }
            });

            childProcess.on("exit", (code, signal) => {
                console.log(`Worker [${file}] with PID of ${childProcess.pid} exitted`);
            });

            if (args.callback !== undefined) {
                args.callback(childProcess.pid);
            }
        } catch (ex) {
            console.error("Error while running new worker", ex);
            log.error("Error while running new worker", ex);
        }
    });
}