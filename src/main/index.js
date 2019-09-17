import { app, BrowserWindow, ipcMain } from 'electron'
//import path from 'path'
//import { format as formatUrl } from 'url'
import * as Sentry from '@sentry/electron';

import storage from 'electron-json-storage';

const isDevelopment = process.env.NODE_ENV !== 'production';

Sentry.init({
    dsn: "https://da525356c1d2433da5bc1e2d753289df@sentry.io/1725936",
    environment: process.env.NODE_ENV,
    release: "0.0.1-alpha"
});

let mainWindow = false;
let settingsWindow = false;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock)
{
    app.quit()
}
else
{
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow)
        {
            if (mainWindow.isMinimized())
                mainWindow.restore();

            mainWindow.focus();
        }

        if (settingsWindow)
        {
            if (settingsWindow.isMinimized())
                settingsWindow.restore();

            settingsWindow.focus();
        }
    });

    app.on('ready', () => {
        checkWindow();
    });
}

function checkWindow(){
    storage.has('eunoPayoutSettings', function(error, hasKey) {
        if (error) throw error;

        if (hasKey)
        {
            loadMainWindow();
        }
        else
        {
            loadSettingsWindow();
        }
    });
}

function loadMainWindow() {

    if(mainWindow)
    {
        mainWindow.focus();
        return true;
    }

    mainWindow = new BrowserWindow({
        width: 500,
        height: 350,
        title: 'EUNO Masternode Payout',
        resizable: false,
        fullscreenable: false,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if(isDevelopment) {
        mainWindow.loadURL(`http:localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    } else {
        mainWindow.loadURL(`file://${__dirname}/index.html`)
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

function loadSettingsWindow() {

    if(settingsWindow)
    {
        settingsWindow.focus(); return true;
    }

    settingsWindow = new BrowserWindow({
        width: 440,
        height: 350,
        title: 'EUNO Masternode Payout Settings',
        resizable: false,
        fullscreenable: false,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if(isDevelopment) {
        settingsWindow.loadURL(`http:localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}#settings`)
    } else {
        settingsWindow.loadURL(`file://${__dirname}/index.html#settings`)
    }

    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
    })
}

ipcMain.on('checkSettingsFilled', ()=>{
    storage.has('eunoPayoutSettings', function(error, hasKey) {
        if (error) throw error;

        if (hasKey)
        {
            loadMainWindow();

            setTimeout(()=>{
                settingsWindow.close();
                settingsWindow = false;
            }, 1000);
        }
        else
        {
            loadSettingsWindow();
        }
    });
});

ipcMain.on('openSettingsScreen', ()=>{
    loadSettingsWindow();
});

ipcMain.on('minifyMainWindow', ()=>{
    mainWindow.minimize();
});

ipcMain.on('closeMainWindow', ()=>{
    mainWindow.close();
    mainWindow = false;
});

ipcMain.on('closeSettingsWindow', ()=>{
    loadMainWindow();

    setTimeout(()=> {
        settingsWindow.close();
        settingsWindow = false;
    }, 1000);
});

app.on('window-all-closed', () => {
    app.quit()
});