(() => {
  "use strict";

  function initVideos() {
    document.querySelectorAll("video[data-start-time]").forEach(async (video) => {
      const source = video.querySelector("source");
      const start = Number(video.dataset.startTime);
      if (!source || !Number.isFinite(start) || start < 0) return;

      // A complete Blob supports seeking even on servers
      // that do not implement HTTP range requests.
      video.controls = false;
      let objectUrl;
      try {
        const response = await fetch(source.src.split("#")[0]);
        if (!response.ok) throw new Error(`Video: HTTP ${response.status}`);
        objectUrl = URL.createObjectURL(await response.blob());
        video.addEventListener("loadedmetadata", () => {
          video.currentTime = Math.min(start, video.duration);
        }, { once: true });
        video.addEventListener("seeked", () => {
          video.controls = true;
        }, { once: true });
        video.src = objectUrl;
        video.load();
      } catch (error) {
        // Keep the native player and the original media fragment as fallback.
        video.controls = true;
        video.load();
      }
      video.addEventListener("error", () => { video.controls = true; });
      window.addEventListener("pagehide", (event) => {
        if (objectUrl && !event.persisted) URL.revokeObjectURL(objectUrl);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideos, { once: true });
  } else {
    initVideos();
  }
})();
