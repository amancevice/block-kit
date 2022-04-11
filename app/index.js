const { app, BrowserWindow } = require("electron");
const Store = require("electron-store");

const store = new Store();
const defaultUrl = new URL("https://app.slack.com/block-kit-builder/");
const backgroundColor = store.get("backgroundColor", "#FFFFFF");
const openDevTools = store.get("openDevTools", false);
const url = store.get("url", defaultUrl.href);
const winBounds = store.get("winBounds", { width: 1000, height: 800 });
const browserOptions = {
  backgroundColor: backgroundColor,
  titleBarStyle: "hidden",
};
const customCSS = `
  .p-bkb_header {
    box-sizing: unset;
    padding-top: 18px !important;
    -webkit-app-region: drag;
    -webkit-user-select: none;
  }
  .react-codemirror2 {
    max-height: calc(100vh - 118px) !important;
  }
`;

let win;

// App Opened
const appOnReady = () => {
  let opts = Object.assign(browserOptions, winBounds);
  if (opts.width < 1024) opts.width = 1024;
  win = new BrowserWindow(opts);
  win.loadURL(url);
  win.once("ready-to-show", win.show);
  win.on("close", winOnClose);
  win.webContents.on("did-finish-load", winWebContentsOnDidFinishLoad);
  if (openDevTools) win.webContents.openDevTools();
};

// All Windows Closed
const appOnWindowAllClosed = () => {
  app.quit();
};

// Window Closed
const winOnClose = () => {
  let lastUrl = new URL(win.getURL());
  let saveUrl = lastUrl.host == defaultUrl.host ? lastUrl : defaultUrl;
  store.set("backgroundColor", win.getBackgroundColor());
  store.set("openDevTools", win.webContents.isDevToolsOpened());
  store.set("url", saveUrl.href);
  store.set("winBounds", win.getBounds());
};

// Window Web Contents Finished Loading
const winWebContentsOnDidFinishLoad = () => {
  win.webContents.insertCSS(customCSS);
};

// Register App events
app.on("ready", appOnReady);
app.on("window-all-closed", appOnWindowAllClosed);
