// background.js - reserved for future live alerts or scheduled checks.
// For now it does nothing heavy, but manifest requires a service worker file.
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', () => { console.log('Network Signal Truth activated'); });

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ path: "popup.html", enabled: true });
});

// Optional: let users open the panel by clicking your extension icon
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});


