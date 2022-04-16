const { app, shell, BrowserView, BrowserWindow, Menu } = require("electron");
const Store = require("electron-store");

const store = new Store();
const defaultUrl = new URL("https://app.slack.com/block-kit-builder/");
const isMac = process.platform === "darwin";

let splash, win;

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

  splash = new BrowserView();
  win.setBrowserView(splash);
  let y = (win.getBounds().height - 384) / 2;
  splash.setBounds(Object.assign(win.getBounds(), { x: 0, y: y }));
  splash.webContents.loadFile("./app/index.html");

  win.loadURL(store.get("url", defaultUrl.href));
  win.on("moved", setBrowserWindowBounds);
  win.on("resized", setBrowserWindowBounds);
  win.on("enter-full-screen", winOnEnterFullScreen);
  win.on("leave-full-screen", winOnLeaveFullScreen);
  win.on("close", winOnClose);
  win.once("ready-to-show", win.show);
  win.webContents.on("did-finish-load", winWebContentsOnDidFinishLoad);
  if (store.get("openDevTools")) win.webContents.openDevTools();
  const menuTemplate = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        {
          label: "Toggle Dark Mode",
          type: "checkbox",
          accelerator: isMac ? "Cmd+Shift+D" : "Ctrl+Shift+D",
          checked: store.get("theme") === "dark",
          click: toggleTheme,
        },
        { type: "separator" },
        {
          role: "togglefullscreen",
          accelerator: isMac ? "Cmd+Ctrl+F" : "F11",
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac ? [] : [{ role: "close" }]),
      ],
    },
    {
      role: "Help",
      submenu: [
        {
          label: "Block Element Reference",
          click: async () => {
            await shell.openExternal(
              "https://api.slack.com/reference/block-kit/block-elements"
            );
          },
        },
        {
          label: "Issues",
          click: async () => {
            await shell.openExternal(
              "https://github.com/amancevice/block-kit/issues"
            );
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

// All Windows Closed
const appOnWindowAllClosed = () => {
  if (isMac) app.quit();
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
  win.webContents.insertCSS(customCSS);
  if (store.get("theme") === "dark") enableDarkMode();
  win.removeBrowserView(splash);
};

const toggleTheme = async () => {
  store.get("theme") === "dark" ? enableLightMode() : enableDarkMode();
};

const enableDarkMode = () => {
  store.set("theme", "dark");
  var customJS = `${setTheme.toString()}\nsetTheme("dark");`;
  win.webContents.executeJavaScript(customJS).catch(console.error);
};

const enableLightMode = () => {
  store.set("theme", "light");
  var customJS = `${setTheme.toString()}\nsetTheme("light");`;
  win.webContents.executeJavaScript(customJS).catch(console.error);
};

// Dark Mode
function setTheme(name) {
  var menuId = "block-kit-builder-theme-select_button-option";
  var optId = `block-kit-builder-theme-select_option_${
    name === "dark" ? 1 : 0
  }`;
  function asyncSetTheme() {
    return new Promise((resolve) => {
      var menu = document.getElementById(menuId);
      if (menu !== null) {
        menu.click();
        document.getElementById(optId).click();
        resolve();
      } else {
        setTimeout(asyncSetTheme, 100);
      }
    });
  }
  return asyncSetTheme();
}

// Register App events
app.on("ready", appOnReady);
app.on("window-all-closed", appOnWindowAllClosed);
