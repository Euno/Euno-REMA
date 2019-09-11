import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { format as formatUrl } from 'url'
//import * as Sentry from '@sentry/electron';

import storage from 'electron-json-storage';

const isDevelopment = process.env.NODE_ENV !== 'production';

/*Sentry.init({
    dsn: envConfig.sentry.dsn,
    environment: process.env.NODE_ENV,
    release: envConfig.version
});*/

app.on('ready', () => {
    checkWindow();
});

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

let mainWindow;
let settingsWindow;

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
        show: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if(isDevelopment) {
        mainWindow.loadURL(`http:localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    } else {
        mainWindow.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }));
    }
}

function loadSettingsWindow() {

    if(settingsWindow)
    {
        settingsWindow.focus(); return true;
    }

    settingsWindow = new BrowserWindow({
        width: 300,
        height: 150,
        title: 'EUNO Masternode Payout Settings',
        resizable: false,
        fullscreenable: false,
        show: true,
        frame: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if(isDevelopment) {
        settingsWindow.loadURL(`http:localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}#settings`)
    } else {
        settingsWindow.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }));
    }
}

ipcMain.on('checkSettingsFilled', ()=>{
    settingsWindow.close();
    settingsWindow = false;
    checkWindow();
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

app.on('window-all-closed', () => {
    app.quit()
});