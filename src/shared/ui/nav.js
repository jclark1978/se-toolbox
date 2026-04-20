import { groupCatalogByCategory } from "../../features/bom-builder/catalog.js";

const SHELL_COLLAPSED_KEY = "fortisku-shell-collapsed";

const ICONS = {
  search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
  layers: `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`,
  refreshCw: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
  bookOpen: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  eraser: `<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>`,
  flaskConical: `<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>`,
  wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
};

function icon(name) {
  return `<svg aria-hidden="true" class="forti-nav-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

function categoryKey(category) {
  return `bom-category-${String(category).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

const TOOLBOX_ITEMS = [
  { key: "sku-finder", label: "SKU Finder", href: "", icon: "search" },
  {
    key: "bom-builder",
    label: "BOM Builder",
    icon: "layers",
    children: groupCatalogByCategory().map(({ category, products }) => ({
      key: categoryKey(category),
      label: category,
      children: products.map((product) => ({
        key: `bom-product-${product.slug}`,
        label: product.label,
        href: `bom-builder/?product=${encodeURIComponent(product.slug)}`
      }))
    }))
  },
  {
    key: "lifecycle",
    label: "LifeCycle",
    icon: "refreshCw",
    children: [
      { key: "hardware-lifecycle", label: "Hardware LifeCycle", href: "hardware-lifecycle/" },
      { key: "software-lifecycle", label: "Software LifeCycle", href: "software-lifecycle/" }
    ]
  },
  { key: "ordering-guides", label: "Ordering Guides", href: "ordering-guides/", icon: "bookOpen" },
  { key: "asset-reports", label: "Asset Report Cleanup", href: "asset-reports/", icon: "eraser" },
  { key: "lab-portal", label: "Lab Portal Generator", href: "lab-portal/", icon: "flaskConical" }
];

function normalizeCurrent(current) {
  if (Array.isArray(current)) {
    return new Set(current.filter(Boolean));
  }
  return new Set(current ? [current] : []);
}

function nodeHasCurrent(node, currentKeys) {
  if (currentKeys.has(node.key)) {
    return true;
  }
  return Array.isArray(node.children) && node.children.some((child) => nodeHasCurrent(child, currentKeys));
}

function renderNode(node, normalizedBase, currentKeys, depth = 0) {
  if (node.children?.length) {
    return renderGroup(node, normalizedBase, currentKeys, depth);
  }
  return renderLink(node, normalizedBase, currentKeys, depth);
}

function renderLink(link, normalizedBase, currentKeys, depth) {
  const href = link.href ? `${normalizedBase}${link.href}` : normalizedBase;
  const currentAttr = currentKeys.has(link.key) ? ' aria-current="page"' : "";
  const iconHtml = link.icon ? icon(link.icon) : "";
  return `<a class="forti-nav-link" data-depth="${depth}" href="${href}"${currentAttr}>${iconHtml}<span>${link.label}</span></a>`;
}

function renderGroup(item, normalizedBase, currentKeys, depth) {
  const isCurrent = item.children.some((link) => nodeHasCurrent(link, currentKeys));
  const expandedAttr = isCurrent ? "true" : "false";
  const currentAttr = isCurrent ? ' data-current="true"' : "";
  const children = item.children
    .map((child) => renderNode(child, normalizedBase, currentKeys, depth + 1))
    .join("");

  return `
    <div class="forti-nav-group" data-depth="${depth}"${currentAttr}>
      <button class="forti-nav-group-trigger" data-depth="${depth}" type="button" aria-expanded="${expandedAttr}">
        ${item.icon ? icon(item.icon) : ""}<span>${item.label}</span>
      </button>
      <div class="forti-nav-group-menu" data-depth="${depth + 1}">
        ${children}
      </div>
    </div>
  `;
}

function preferredCollapsed() {
  return window.localStorage.getItem(SHELL_COLLAPSED_KEY) === "true";
}

function setCollapsed(collapsed) {
  document.body.classList.toggle("forti-shell-collapsed", collapsed);
  window.localStorage.setItem(SHELL_COLLAPSED_KEY, collapsed ? "true" : "false");
  const toggle = document.getElementById("forti-shell-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand navigation menu" : "Collapse navigation menu");
  }
}

function buildShell(nav) {
  const app = nav.closest(".app");
  const header = app ? Array.from(app.children).find((child) => child.tagName === "HEADER") : null;
  if (!app || !header) {
    return;
  }

  const siblings = Array.from(app.children).filter((child) => child !== header);
  const themeToggle = header.querySelector("#theme-toggle");

  const shell = document.createElement("div");
  shell.className = "forti-shell";

  const sidebar = document.createElement("aside");
  sidebar.className = "forti-sidebar";
  sidebar.innerHTML = `
    <div class="forti-sidebar-brand">
      <span class="forti-sidebar-brand-mark" aria-hidden="true"><svg aria-hidden="true" class="forti-nav-icon" style="margin:0;width:18px;height:18px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.wrench}</svg></span>
      <span class="forti-sidebar-brand-text">SE Toolbox</span>
    </div>
  `;

  nav.classList.remove("top-nav");
  nav.classList.add("forti-sidebar-nav");
  sidebar.appendChild(nav);

  const shellMain = document.createElement("div");
  shellMain.className = "forti-shell-main";

  const topbar = document.createElement("div");
  topbar.className = "forti-topbar";
  topbar.innerHTML = `
    <div class="forti-topbar-left">
      <button id="forti-shell-toggle" class="forti-topbar-icon forti-topbar-toggle" type="button" aria-expanded="true" aria-label="Collapse navigation menu">
        <span aria-hidden="true">☰</span>
      </button>
    </div>
    <div class="forti-topbar-right"></div>
  `;

  if (themeToggle) {
    topbar.querySelector(".forti-topbar-right")?.prepend(themeToggle);
  }

  const page = document.createElement("div");
  page.className = "forti-page";
  header.classList.add("forti-page-header");
  page.appendChild(header);
  siblings.forEach((node) => page.appendChild(node));

  shellMain.append(topbar, page);
  shell.append(sidebar, shellMain);
  app.replaceChildren(shell);
}

function wireShellInteractions() {
  const toggle = document.getElementById("forti-shell-toggle");
  const triggers = document.querySelectorAll(".forti-nav-group-trigger");

  toggle?.addEventListener("click", () => {
    setCollapsed(!document.body.classList.contains("forti-shell-collapsed"));
  });

  triggers.forEach((trigger) => {
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
    });
  });

  setCollapsed(preferredCollapsed());
}

export function initToolboxNav({ current, basePath = "./", navId = "toolbox-nav" }) {
  const nav = document.getElementById(navId);
  if (!nav) {
    return;
  }

  if (!nav.closest(".forti-shell")) {
    buildShell(nav);
  }

  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const currentKeys = normalizeCurrent(current);
  nav.innerHTML = TOOLBOX_ITEMS
    .map((item) => renderNode(item, normalizedBase, currentKeys, 0))
    .join("");

  wireShellInteractions();
}
