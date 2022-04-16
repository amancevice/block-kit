const { app, BrowserWindow } = require("electron");
const Store = require("electron-store");

const store = new Store();
const defaultUrl = new URL("https://app.slack.com/block-kit-builder/");

let win;

// Get New Window Options
const getBrowserWindowOptions = () => {
  var options = {};
  var backgroundColor = store.get("backgroundColor", "#FFFFFF");
  var fullscreen = store.get("fullscreen");
  Object.assign(options, getBrowserWindowBounds());
  if (fullscreen) options.fullscreen = true;
  options.backgroundColor = backgroundColor;
  options.titleBarStyle = "hidden";
  return options;
};

// Get Window Bounds
const getBrowserWindowBounds = () => {
  var winBounds = store.get("winBounds", { width: 1024, height: 800 });
  if (winBounds.width < 1024) winBounds.width = 1024;
  return winBounds;
};

// Set Window Bounds
const setBrowserWindowBounds = () => {
  var isFullscreen = win.isFullScreen();
  var winBounds = win.getBounds();
  if (!isFullscreen) store.set("winBounds", winBounds);
};

// App Opened
const appOnReady = () => {
  win = new BrowserWindow(getBrowserWindowOptions());
  win.loadURL(store.get("url", defaultUrl.href));
  win.on("moved", setBrowserWindowBounds);
  win.on("resized", setBrowserWindowBounds);
  win.on("enter-full-screen", winOnEnterFullScreen);
  win.on("leave-full-screen", winOnLeaveFullScreen);
  win.on("close", winOnClose);
  win.once("ready-to-show", win.show);
  win.webContents.on("did-finish-load", winWebContentsOnDidFinishLoad);
  if (store.get("openDevTools")) win.webContents.openDevTools();
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
};

// Window Enter Full Screen
const winOnEnterFullScreen = () => {
  store.set("fullscreen", true);
};

// Window Leave Full Screen
const winOnLeaveFullScreen = () => {
  store.set("fullscreen", false);
};

// Window Web Contents Finished Loading
const winWebContentsOnDidFinishLoad = () => {
  var customCSS = `
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
  var customJS = `
    ${setDarkMode.toString()}
    setDarkMode().catch(console.error);
  `;
  win.webContents.insertCSS(customCSS);
  win.webContents.executeJavaScript(customJS).catch(console.error);
};

// Dark Mode
function setDarkMode() {
  return new Promise((resolve) => {
    var menuId = "block-kit-builder-theme-select_button-option";
    var menu = document.getElementById(menuId);
    if (menu !== null) {
      menu.click();
      var opt1Id = "block-kit-builder-theme-select_option_1";
      var opt1 = document.getElementById(opt1Id);
      opt1.click();
      resolve();
    } else {
      setTimeout(setDarkMode, 100);
    }
  });
}

// Register App events
app.on("ready", appOnReady);
app.on("window-all-closed", appOnWindowAllClosed);
