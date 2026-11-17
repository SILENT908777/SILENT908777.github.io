document.addEventListener("DOMContentLoaded", () => {
  const yearNode = document.querySelector("[data-current-year]");
  const themeToggle = document.querySelector("[data-theme-toggle]");

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  if (!themeToggle) {
    return;
  }

  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let hasSavedTheme = false;

  try {
    const savedTheme = localStorage.getItem("portfolio-theme");
    hasSavedTheme = savedTheme === "light" || savedTheme === "dark";
  } catch (error) {
    console.warn("Unable to read the saved theme preference.", error);
  }

  const updateTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  };

  updateTheme(root.dataset.theme);

  themeToggle.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    updateTheme(theme);
    hasSavedTheme = true;

    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      console.warn("Unable to save the theme preference.", error);
    }
  });

  systemTheme.addEventListener("change", (event) => {
    if (!hasSavedTheme) {
      updateTheme(event.matches ? "dark" : "light");
    }
  });
});
