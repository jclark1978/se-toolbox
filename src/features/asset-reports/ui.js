const STATUS_TIMEOUT_DEFAULT = 4500;

export function initAssetReportUI(handlers) {
  const customerNameInput = document.getElementById("ar-customer-name");
  const fileInput = document.getElementById("ar-file-input");
  const buildButton = document.getElementById("ar-build-button");
  const clearButton = document.getElementById("ar-clear-button");
  const uploadState = document.getElementById("ar-upload-state");
  const statusEl = document.getElementById("ar-status");

  const sourceFileEl = document.getElementById("ar-source-file");
  const sourceSheetEl = document.getElementById("ar-source-sheet");
  const rowCountEl = document.getElementById("ar-row-count");
  const modelCountEl = document.getElementById("ar-model-count");
  const quarterCountEl = document.getElementById("ar-quarter-count");
  const outputNameEl = document.getElementById("ar-output-name");
  const modelsBody = document.getElementById("ar-models-body");
  const quartersBody = document.getElementById("ar-quarters-body");

  let statusTimeoutId = null;
  let hasWorkbook = false;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      handlers.onFileSelected(file);
    }
    fileInput.value = "";
  });

  customerNameInput.addEventListener("input", () => {
    handlers.onCustomerNameChange(customerNameInput.value);
    syncBuildState();
  });

  buildButton.addEventListener("click", () => {
    handlers.onBuild({ customerName: customerNameInput.value.trim() });
  });

  clearButton.addEventListener("click", () => {
    handlers.onClear();
  });

  function setLoading(isLoading) {
    fileInput.disabled = isLoading;
    customerNameInput.disabled = isLoading;
    buildButton.disabled = isLoading || !hasWorkbook || !customerNameInput.value.trim();
    clearButton.disabled = isLoading;
    uploadState.textContent = isLoading
      ? "Processing workbook…"
      : hasWorkbook
        ? "Workbook ready"
        : "Waiting for workbook";
  }

  function setReadyState() {
    setLoading(false);
    clearStatus();
    renderEmptyModelsPreview("Upload a workbook to preview the summary.");
    renderEmptyQuarterPreview("Upload a workbook to preview the summary.");
    outputNameEl.textContent = "—";
    sourceFileEl.textContent = "—";
    sourceSheetEl.textContent = "—";
    rowCountEl.textContent = "0";
    modelCountEl.textContent = "0";
    quarterCountEl.textContent = "0";
    hasWorkbook = false;
    syncBuildState();
  }

  function renderWorkbook(summary) {
    hasWorkbook = true;
    sourceFileEl.textContent = summary.sourceFilename || "—";
    sourceSheetEl.textContent = summary.sheetName || "—";
    rowCountEl.textContent = summary.rowCount.toLocaleString();
    modelCountEl.textContent = summary.assetCounts.length.toLocaleString();
    quarterCountEl.textContent = summary.renewalCounts.length.toLocaleString();
    renderModelsTable(
      modelsBody,
      sortRowsByCountDescending(summary.assetCounts),
      summary.assetCountsEmptyMessage || "No models found."
    );
    renderCountTable(
      quartersBody,
      sortRowsByCountDescending(summary.renewalCounts),
      "No quarters found."
    );
    syncBuildState();
  }

  function setOutputFilename(filename) {
    outputNameEl.textContent = filename || "—";
  }

  function showStatus(level, message, options = {}) {
    const dismissAfter = options.dismissAfter ?? STATUS_TIMEOUT_DEFAULT;
    statusEl.textContent = message;
    statusEl.className = `status-message ${level}`;

    if (statusTimeoutId) {
      window.clearTimeout(statusTimeoutId);
      statusTimeoutId = null;
    }

    if (dismissAfter > 0) {
      statusTimeoutId = window.setTimeout(() => {
        clearStatus();
      }, dismissAfter);
    }
  }

  function clearStatus() {
    statusEl.textContent = "";
    statusEl.className = "status-message info";
  }

  function triggerDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    customerNameInput.value = "";
    setReadyState();
  }

  function syncBuildState() {
    buildButton.disabled = !hasWorkbook || !customerNameInput.value.trim() || fileInput.disabled;
    setOutputFilename(handlers.getOutputFilename(customerNameInput.value.trim()));
  }

  return {
    setLoading,
    setReadyState,
    renderWorkbook,
    setOutputFilename,
    showStatus,
    triggerDownload,
    reset
  };
}

function renderCountTable(body, rows, emptyMessage) {
  body.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = emptyMessage;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    const left = document.createElement("td");
    left.textContent = row.label;
    const right = document.createElement("td");
    right.textContent = row.count.toLocaleString();
    tr.appendChild(left);
    tr.appendChild(right);
    fragment.appendChild(tr);
  }
  body.appendChild(fragment);
}

function renderEmptyModelsPreview(message) {
  const body = document.getElementById("ar-models-body");
  body.innerHTML = `<tr class="empty-row"><td colspan="2">${escapeHtml(message)}</td></tr>`;
}

function renderEmptyQuarterPreview(message) {
  const body = document.getElementById("ar-quarters-body");
  body.innerHTML = `<tr class="empty-row"><td colspan="2">${escapeHtml(message)}</td></tr>`;
}

function renderModelsTable(body, rows, emptyMessage) {
  body.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = emptyMessage;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");

    const product = document.createElement("td");
    product.textContent = row.label;
    const tooltipText = buildLifecycleTooltip(row);
    if (tooltipText) {
      const hint = document.createElement("button");
      hint.type = "button";
      hint.className = "lifecycle-hint";
      hint.textContent = "i";
      hint.setAttribute("aria-label", tooltipText);
      const tooltip = document.createElement("span");
      tooltip.className = "lifecycle-tooltip";
      tooltip.textContent = tooltipText;
      tooltip.setAttribute("aria-hidden", "true");
      hint.appendChild(tooltip);
      product.appendChild(hint);
    }
    tr.appendChild(product);

    const count = document.createElement("td");
    count.textContent = row.count.toLocaleString();
    tr.appendChild(count);

    fragment.appendChild(tr);
  }

  body.appendChild(fragment);
}

function sortRowsByCountDescending(rows) {
  return [...(rows || [])].sort((left, right) => {
    const countDiff = Number(right?.count || 0) - Number(left?.count || 0);
    if (countDiff !== 0) {
      return countDiff;
    }

    return String(left?.label || "").localeCompare(String(right?.label || ""), undefined, {
      sensitivity: "base"
    });
  });
}

function buildLifecycleTooltip(row) {
  const entries = [
    ["End of Order", formatLifecycleDate(row.endOfOrderDate)],
    ["End of Service Extension", formatLifecycleDate(row.lastServiceExtensionDate)],
    ["End of Life", formatLifecycleDate(row.endOfSupportDate)]
  ].filter(([, value]) => value);

  if (!entries.length) {
    return "";
  }

  return entries.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function formatLifecycleDate(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) {
    return text;
  }

  return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1].slice(-2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
