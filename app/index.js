const { app, BrowserWindow } = require("electron");
const Store = require("electron-store");

const store = new Store();

const defaultUrl = new URL("https://app.slack.com/block-kit-builder/");
const openDevTools = false;
const userAgent = "Slack Block Kit";

let win;

// App Opened
const appOnReady = () => {
  let opts = {
    backgroundColor: store.get("backgroundColor") || "#FFFFFF",
    titleBarStyle: "hidden",
  };
  win = new BrowserWindow(Object.assign(opts, store.get("winBounds")));
  win.loadURL(store.get("url") || defaultUrl.href, { userAgent: userAgent });
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
  store.set("winBounds", win.getBounds());
  store.set("url", saveUrl.href);
};

// Window Web Contents Finished Loading
const winWebContentsOnDidFinishLoad = () => {
  win.webContents.insertCSS(`
    .p-bkb_header {
      box-sizing: unset;
      padding-top: 18px !important;
      -webkit-app-region: drag;
      -webkit-user-select: none;
    }
    .react-codemirror2 {
      max-height: calc(100vh - 118px) !important;
    }
  `);
};

// Register App events
app.on("ready", appOnReady);
app.on("window-all-closed", appOnWindowAllClosed);
