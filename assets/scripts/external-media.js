(() => {
  "use strict";
  const storageKey = "workbook-wikimedia-v1";
  const readChoice = () => {
    try { return sessionStorage.getItem(storageKey); } catch { return null; }
  };
  const saveChoice = choice => {
    try { sessionStorage.setItem(storageKey, choice); } catch { /* Page-only fallback. */ }
  };

  function init() {
    const deferred = [...document.querySelectorAll("[data-wikimedia-src], [data-wikimedia-poster], [data-wikimedia-srcset], [data-wikimedia-href]")];
    const media = new Set(deferred.map(node => node.tagName === "SOURCE" ? node.parentElement : node).filter(node => node.tagName !== "A"));
    const placeholders = [];
    let enabled = false;
    media.forEach(node => {
      const placeholder = document.createElement("span");
      placeholder.className = "wikimedia-placeholder";
      placeholder.textContent = "Externes Medium von Wikimedia · noch nicht freigegeben";
      (node.closest(".rubin-photo, a") || node).before(placeholder);
      placeholders.push(placeholder);
    });

    const panel = document.createElement("section");
    panel.id = "wikimedia-freigabe";
    panel.className = "wikimedia-consent";
    panel.setAttribute("aria-labelledby", "wikimedia-consent-title");
    panel.innerHTML = '<h2 id="wikimedia-consent-title">Bilder und Videos von Wikimedia</h2>' +
      '<p>Einige Medien werden von Wikimedia geladen. Dabei erhält Wikimedia deine IP-Adresse und Browserangaben und kann Cookies zur Besucherzählung, für Tests und zum Schutz vor DDoS-Attacken setzen. Deine Freigabe gilt für alle Kapitel in diesem Browser-Tab. Texte und eigene Veranschaulichungen bleiben auch ohne Freigabe nutzbar. <a href="datenschutz.html#medien-von-wikimedia-commons">Datenschutzhinweise</a></p>' +
      '<div class="wikimedia-consent-actions"><button type="button" class="btn btn-primary" data-wikimedia-allow>Wikimedia-Medien laden</button><button type="button" class="btn btn-outline-secondary" data-wikimedia-dismiss>Ohne externe Medien weiterlesen</button></div>';
    const title = document.querySelector("main #title-block-header");
    if (title) title.after(panel);
    else document.querySelector("main")?.prepend(panel);

    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "wikimedia-settings";
    settings.textContent = "Externe Medien";
    const footer = document.querySelector(".nav-footer-center") || document.querySelector("footer");
    footer?.append(settings);
    settings.addEventListener("click", () => {
      panel.hidden = false;
      panel.scrollIntoView({block:"center"});
      panel.querySelector("button").focus({preventScroll:true});
    });

    function enable() {
      if (enabled) return;
      enabled = true;
      deferred.forEach(node => {
        for (const attribute of ["src", "srcset", "poster", "href", "class"]) {
          const value = node.getAttribute(`data-wikimedia-${attribute}`);
          if (value !== null) node.setAttribute(attribute, value);
        }
      });
      window.lightboxQuarto?.reload();
      placeholders.forEach(node => node.hidden = true);
      panel.querySelector("h2").textContent = "Wikimedia-Medien sind freigegeben";
      panel.querySelector("[data-wikimedia-allow]").textContent = "Freigabe widerrufen";
      panel.querySelector("[data-wikimedia-dismiss]").textContent = "Schließen";
      settings.textContent = "Externe Medien: freigegeben";
      document.dispatchEvent(new Event("wikimedia-media-enabled"));
    }
    panel.querySelector("[data-wikimedia-allow]").addEventListener("click", () => {
      if (enabled) {
        saveChoice("blocked");
        // Reload discards media, in-flight fetches and blobs.
        window.location.reload();
      } else {
        saveChoice("allowed");
        enable();
        panel.hidden = true;
      }
    });
    panel.querySelector("[data-wikimedia-dismiss]").addEventListener("click", () => {
      if (!enabled) saveChoice("blocked");
      panel.hidden = true;
    });
    const initialChoice = readChoice();
    if (initialChoice === "allowed") enable();
    panel.hidden = initialChoice === "allowed" || initialChoice === "blocked";
    window.addEventListener("pageshow", event => {
      if (event.persisted && enabled !== (readChoice() === "allowed")) window.location.reload();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
