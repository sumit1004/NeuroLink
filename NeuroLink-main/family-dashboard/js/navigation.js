const loaders = {};

export function initNavigation(registeredLoaders) {
  Object.assign(loaders, registeredLoaders);
  const navButtons = document.querySelectorAll(".nav-link");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("page-title").textContent = btn.textContent.trim();
      loadTab(btn.dataset.tab);
    });
  });

  const first = document.querySelector(".nav-link.active");
  if (first) {
    document.getElementById("page-title").textContent =
      first.textContent.trim();
    loadTab(first.dataset.tab);
  }
}

export async function loadTab(tabName) {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="card">Loading ${tabName}...</div>`;

  const html = await fetch(`partials/${tabName}.html`).then((r) => r.text());
  content.innerHTML = html;

  const loader = loaders[tabName];
  if (typeof loader === "function") {
    loader();
  }
}

