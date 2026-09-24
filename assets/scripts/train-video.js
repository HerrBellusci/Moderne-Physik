(() => {
  "use strict";

  function initTrainVideos() {
    document.querySelectorAll("[data-train-video]").forEach((container) => {
      if (container.dataset.initialized) return;
      container.dataset.initialized = "true";

      const video = container.querySelector("video");
      const controls = container.querySelector(".mp-train-controls");
      const message = container.querySelector(".mp-train-error");
      const sources = {
        moving: "Videos%20einbinden/Zugf%C3%A4hrt%20aus.mp4",
        stationary: "Videos%20einbinden/Zug%20steht.mp4"
      };
      let request = 0;
      let selectedChoice = null;
      const randomScene = () => Math.random() < 0.5 ? "moving" : "stationary";
      const showChoice = (choice) => {
        selectedChoice = choice;
        controls.querySelectorAll("button[data-train-choice]").forEach((button) => {
          button.setAttribute("aria-pressed", String(button.dataset.trainChoice === choice));
        });
      };

      // A random scene is ready for the native play button, without autoplay.
      video.src = sources[randomScene()];
      controls.hidden = false;

      controls.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-train-choice]");
        if (!button) return;
        const currentRequest = ++request;
        const choice = button.dataset.trainChoice;
        const scene = choice === "random" ? randomScene() : choice;
        showChoice(choice);
        video.pause();
        message.hidden = true;
        video.src = sources[scene];
        video.load();
        try {
          await video.play();
        } catch (error) {
          if (currentRequest !== request || error.name === "AbortError") return;
          message.textContent = "Die Wiedergabe konnte nicht starten. Versuche es mit dem Abspielknopf im Video.";
          message.hidden = false;
        }
      });

      video.addEventListener("play", () => {
        if (selectedChoice === null) showChoice("random");
      });

      video.addEventListener("error", () => {
        message.textContent = "Das Video konnte nicht geladen werden. Lade die Seite neu und versuche es noch einmal.";
        message.hidden = false;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrainVideos, { once: true });
  } else {
    initTrainVideos();
  }
})();
