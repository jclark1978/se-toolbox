const TOOLBOX_ITEMS = [
  { key: "finder", label: "FortiSKU Finder", href: "" },
  { key: "bom-builder", label: "BOM Builder", href: "bom-builder/" },
  {
    key: "lifecycle",
    label: "LifeCycle",
    children: [
      { key: "hardware-lifecycle", label: "Hardware", href: "hardware-lifecycle/" },
      { key: "software-lifecycle", label: "Software", href: "software-lifecycle/" }
    ]
  },
  { key: "ordering-guides", label: "Ordering Guides", href: "ordering-guides/" },
  { key: "asset-reports", label: "Asset Reports", href: "asset-reports/" },
  { key: "lab-portal", label: "Lab Portal Generator", href: "lab-portal/" }
];

function renderLink(link, href, current) {
  const currentAttr = link.key === current ? ' aria-current="page"' : "";
  return `<a href="${href}"${currentAttr}>${link.label}</a>`;
}

function renderGroup(item, normalizedBase, current) {
  const childLinks = item.children
    .map((link) => {
      const href = `${normalizedBase}${link.href}`;
      return renderLink(link, href, current);
    })
    .join("");
  const isCurrent = item.children.some((link) => link.key === current);
  const currentAttr = isCurrent ? ' data-current="true"' : "";

  return `
    <div class="nav-group"${currentAttr}>
      <button class="nav-group-trigger" type="button" aria-haspopup="true" aria-expanded="false">${item.label}</button>
      <div class="nav-group-menu" role="menu" aria-label="${item.label}">
        ${childLinks}
      </div>
    </div>
  `;
}

export function initToolboxNav({ current, basePath = "./", navId = "toolbox-nav" }) {
  const nav = document.getElementById(navId);
  if (!nav) {
    return;
  }

  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  nav.innerHTML = TOOLBOX_ITEMS
    .map((item) => {
      if (item.children) {
        return renderGroup(item, normalizedBase, current);
      }

      const href = item.href ? `${normalizedBase}${item.href}` : normalizedBase;
      return renderLink(item, href, current);
    })
    .join("");
}
