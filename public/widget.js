(function () {
  "use strict";

  var currentScript = document.currentScript;

  if (!currentScript) {
    console.error("Assistora: Could not find widget script.");
    return;
  }

  var businessSlug = currentScript.getAttribute("data-business") || currentScript.getAttribute("data-assistora");

  if (!businessSlug || !/^[a-z0-9-]+$/i.test(businessSlug.trim())) {
    console.error('Assistora: Missing or invalid "data-business" attribute.');
    return;
  }

  businessSlug = businessSlug.trim();

  var rootId = "assistora-widget-root-" + businessSlug;
  if (document.getElementById(rootId)) {
    return;
  }

  var scriptUrl = new URL(currentScript.src, window.location.href);
  var assistoraOrigin = scriptUrl.origin;
  var configUrl = assistoraOrigin + "/api/public/widget/" + encodeURIComponent(businessSlug);
  var iframeUrl = assistoraOrigin + "/widget/" + encodeURIComponent(businessSlug) + "?embed=1";

  function setCss(element, styles) {
    Object.keys(styles).forEach(function (key) {
      element.style[key] = styles[key];
    });
  }

  fetch(configUrl)
    .then(function (response) {
      if (!response.ok) {
        return null;
      }

      return response.json();
    })
    .then(function (configResult) {
      var widget = configResult && configResult.widget ? configResult.widget : null;

      if (!widget || widget.enabled === false) {
        return;
      }

      var root = document.createElement("div");
      root.id = rootId;
      root.setAttribute("aria-live", "polite");
      setCss(root, {
        position: "fixed",
        zIndex: "2147483647",
        fontFamily: "Arial, sans-serif",
        bottom: "20px",
        right: widget.position === "bottom-left" ? "auto" : "20px",
        left: widget.position === "bottom-left" ? "20px" : "auto",
      });
      document.body.appendChild(root);

      var buttonSize = widget.buttonSize === "small" ? 46 : widget.buttonSize === "large" ? 64 : 54;
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "Open Assistora AI chat");
      button.innerHTML = "💬";
      setCss(button, {
        width: buttonSize + "px",
        height: buttonSize + "px",
        border: "none",
        borderRadius: "50%",
        background: widget.primaryColor || "#6366F1",
        color: "#ffffff",
        fontSize: "22px",
        cursor: "pointer",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        zIndex: "1",
      });
      button.onmouseenter = function () {
        button.style.transform = "scale(1.05)";
      };
      button.onmouseleave = function () {
        button.style.transform = "scale(1)";
      };
      root.appendChild(button);

      var panel = document.createElement("div");
      var radiusMap = {
        small: "16px",
        medium: "20px",
        large: "28px",
      };
      setCss(panel, {
        position: "absolute",
        bottom: buttonSize + 18 + "px",
        right: widget.position === "bottom-left" ? "auto" : "0",
        left: widget.position === "bottom-left" ? "0" : "auto",
        width: "380px",
        maxWidth: "calc(100vw - 32px)",
        height: "600px",
        maxHeight: "calc(100vh - 120px)",
        background: "#ffffff",
        borderRadius: radiusMap[widget.borderRadius] || "28px",
        overflow: "hidden",
        boxShadow: "0 18px 60px rgba(15, 23, 42, 0.18)",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        display: "none",
      });
      root.appendChild(panel);

      var iframe = document.createElement("iframe");
      iframe.src = iframeUrl;
      iframe.title = "Assistora AI Customer Support";
      iframe.setAttribute("allow", "clipboard-write");
      iframe.setAttribute("loading", "lazy");
      setCss(iframe, {
        width: "100%",
        height: "100%",
        border: "0",
        display: "block",
        background: "#fff",
      });
      panel.appendChild(iframe);

      var isOpen = false;
      button.onclick = function () {
        isOpen = !isOpen;
        panel.style.display = isOpen ? "block" : "none";
        button.innerHTML = isOpen ? "×" : "💬";
        button.style.fontSize = isOpen ? "24px" : "22px";
      };
    })
    .catch(function (error) {
      console.warn("Assistora widget failed to load configuration:", error);
    });
})();
