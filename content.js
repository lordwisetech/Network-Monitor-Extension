function blockVideos() {
  // Pause and disable autoplay
  document.querySelectorAll("video").forEach(v => {
    v.pause();
    v.removeAttribute("autoplay");
    v.muted = true; // mute just in case
  });

  // Stop new videos that load later (like infinite scroll)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.tagName === "VIDEO") {
          node.pause();
          node.removeAttribute("autoplay");
          node.muted = true;
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function showWarning(sizeMB, images, videos) {
  let banner = document.createElement("div");
  banner.className = "dsr-banner";
  banner.innerHTML = `
    ⚠ Heavy Site Detected: ${sizeMB.toFixed(2)} MB  
    (${images} images, ${videos} videos)
    <button id="dsr-block">Block Videos</button>
    <button id="dsr-close">X</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("dsr-block").onclick = () => {
    blockVideos();
    banner.innerHTML = "✅ All videos blocked (autoplay disabled).";
    setTimeout(() => banner.remove(), 4000);
  };

  document.getElementById("dsr-close").onclick = () => banner.remove();
}
