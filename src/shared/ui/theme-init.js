(function () {
  var key = "fortisku-theme";
  var theme = "light";
  try {
    var stored = window.localStorage.getItem(key);
    if (stored === "light" || stored === "dark") {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  }

  document.documentElement.style.colorScheme = theme;

  function apply() {
    if (!document.body) return false;
    document.body.classList.toggle("theme-dark", theme === "dark");
    return true;
  }

  if (apply()) return;

  var observer = new MutationObserver(function () {
    if (apply()) {
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
