// popup.js - small network intelligence
const onlineEl = document.getElementById('online');
const effectiveEl = document.getElementById('effective');
const downlinkEl = document.getElementById('downlink');
const rttEl = document.getElementById('rtt');
const statusEl = document.getElementById('status');
const qualityEl = document.getElementById('quality');
const bars = document.querySelectorAll('.bar');
const testBtn = document.getElementById('testBtn');
const liveBtn = document.getElementById('liveBtn');

let live = false;
let liveInterval = null;

// Lightweight ping target (no heavy download). Use a reliable small URL.
// You may change to a nearer server for better measurement in your region.
const PING_URL = 'https://www.google.com/generate_204'; // returns 204 quickly

function setStatus(s){
  statusEl.textContent = s;
}

function setBars(level){
  bars.forEach((b,i)=>{
    if(i < level) b.classList.add('on'); else b.classList.remove('on');
  });
}

function interpret(latency, downlink, effType){
  // Determine quality from latency primarily, then downlink
  // Lower latency is better. These thresholds are conservative teaching estimates.
  if(!navigator.onLine) return {level:0, label:'Offline'};
  if(latency < 80 && downlink >= 10) return {level:5, label:'Excellent'};
  if(latency < 150 && downlink >= 5) return {level:4, label:'Good'};
  if(latency < 300 && downlink >= 1) return {level:3, label:'Fair'};
  if(latency < 600) return {level:2, label:'Poor'};
  return {level:1, label:'Very Poor'};
}

async function pingOnce(){
  const start = performance.now();
  try{
    const resp = await fetch(PING_URL, {method:'HEAD', cache:'no-store', mode:'no-cors'});
    // mode:no-cors with cross origins hides status; we still measure timing
  }catch(e){
    // network error: still measure time for attempt
  } finally {
    const rtt = Math.round(performance.now() - start);
    return rtt;
  }
}

async function runTest(){
  setStatus('Running quick test...');
  // gather navigator.connection info if present
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const effType = conn ? (conn.effectiveType || 'unknown') : 'unknown';
  const downlink = conn ? (conn.downlink || 0) : 0;
  let rtt = conn && conn.rtt ? Math.round(conn.rtt) : null;

  // do a few ping attempts for more reliable latency
  try{
    const attempts = 3;
    let total = 0;
    for(let i=0;i<attempts;i++){
      const t = await pingOnce();
      total += t;
      await new Promise(r=>setTimeout(r, 120)); // short gap
    }
    const avg = Math.round(total / 3);
    rtt = rtt === null ? avg : Math.round((rtt + avg) / 2);
  }catch(e){
    rtt = rtt || 9999;
  }

  // update UI
  onlineEl.textContent = navigator.onLine ? 'Yes' : 'No';
  effectiveEl.textContent = effType;
  downlinkEl.textContent = (downlink || '—');
  rttEl.textContent = (rtt === null ? '—' : rtt + ' ms');

  const q = interpret(rtt || 9999, downlink || 0, effType);
  setBars(q.level);
  qualityEl.textContent = q.label;
  setStatus('Test completed');
  return {rtt, downlink, effType, quality:q.label};
}

testBtn.addEventListener('click', runTest);

function startLive(){
  if(live) {
    clearInterval(liveInterval);
    liveInterval = null;
    live = false;
    liveBtn.textContent = 'Live: Off';
    setStatus('Live monitoring stopped');
    return;
  }
  live = true;
  liveBtn.textContent = 'Live: On';
  setStatus('Live monitoring running...');
  runTest();
  liveInterval = setInterval(runTest, 8000);
}
liveBtn.addEventListener('click', startLive);

// update on online/offline events
window.addEventListener('online', ()=> { setStatus('Back online'); runTest(); });
window.addEventListener('offline', ()=> { setStatus('You are offline'); runTest(); });

// run a quick test when popup opens
runTest();


const layouts = ["popup", "sidebar", "floating", "tab"];
let current = 0;

document.getElementById("layoutMode").addEventListener("click", () => {
  const mode = layouts[current];
  chrome.storage.sync.set({ mode });
  switch (mode) {
    case "popup":
      alert("Popup view is default (this one).");
      break;

    case "sidebar":
      // For Manifest V3, use side panel API
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
      } else {
        alert("Sidebar not supported in this browser version.");
      }
      break;

    case "floating":
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 320,
        height: 450,
        top: 80,
        left: screen.availWidth - 360,
        focused: false
      });
      break;

    case "tab":
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      break;
  }

  // Move to next mode
  current = (current + 1) % layouts.length;
});
chrome.storage.sync.get("mode", (data) => {
  if (data.mode) document.body.classList.add(data.mode);
});
