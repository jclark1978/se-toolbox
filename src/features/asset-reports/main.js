import { initThemeToggle } from "../../shared/ui/theme.js";
import { initToolboxNav } from "../../shared/ui/nav.js";
import { loadLifecycleRssPersisted } from "../hardware-lifecycle/storage.js";
import { buildAssetReportWorkbook, buildOutputFilename, inspectAssetWorkbook } from "./workbook.js";
import { initAssetReportUI } from "./ui.js";

let inspectedWorkbook = null;
const LIFECYCLE_MAX_AGE_DAYS = 30;

const ui = initAssetReportUI({
  onFileSelected: handleFileSelected,
  onCustomerNameChange: handleCustomerNameChange,
  onBuild: handleBuild,
  onClear: handleClear,
  getOutputFilename: (customerName) => buildOutputFilename(customerName, inspectedWorkbook?.sourceFilename || "")
});

initToolboxNav({ current: "asset-reports", basePath: "../" });
initThemeToggle();
ui.setReadyState();

async function handleFileSelected(file) {
  ui.setLoading(true);
  try {
    inspectedWorkbook = await inspectAssetWorkbook(file);
    const lifecycleSummary = await loadLifecycleSummary(inspectedWorkbook.assetCounts);
    inspectedWorkbook = {
      ...inspectedWorkbook,
      assetCounts: lifecycleSummary.assetCounts,
      assetCountsEmptyMessage: lifecycleSummary.emptyMessage
    };
    ui.renderWorkbook(inspectedWorkbook);
    ui.setOutputFilename(buildOutputFilename("", inspectedWorkbook.sourceFilename));

    let message = `Loaded ${inspectedWorkbook.rowCount.toLocaleString()} asset row`;
    message += inspectedWorkbook.rowCount === 1 ? "" : "s";
    message += ` from “${inspectedWorkbook.sheetName}”.`;
    if (inspectedWorkbook.skippedRows) {
      message += ` Skipped ${inspectedWorkbook.skippedRows} invalid row`;
      message += inspectedWorkbook.skippedRows === 1 ? "." : "s.";
    }
    ui.showStatus("success", message, { dismissAfter: 5000 });
  } catch (error) {
    inspectedWorkbook = null;
    ui.setReadyState();
    ui.showStatus("error", error.message || "Failed to read workbook.", { dismissAfter: 0 });
  } finally {
    ui.setLoading(false);
  }
}

function handleCustomerNameChange() {
  if (!inspectedWorkbook) {
    ui.setOutputFilename("—");
  }
}

async function handleBuild({ customerName }) {
  if (!inspectedWorkbook) {
    ui.showStatus("warn", "Upload a workbook before generating the report.");
    return;
  }
  if (!customerName) {
    ui.showStatus("warn", "Enter a customer name before generating the report.");
    return;
  }

  ui.setLoading(true);
  try {
    const lifecycleRows = await loadFreshHardwareLifecycleRows();
    const assetCountsWithLifecycle = mergeLifecycleDates(inspectedWorkbook.assetCounts, lifecycleRows);

    const result = buildAssetReportWorkbook({
      customerName,
      sourceFilename: inspectedWorkbook.sourceFilename,
      sheetName: inspectedWorkbook.sheetName,
      detailRows: inspectedWorkbook.detailRows,
      assetCounts: assetCountsWithLifecycle,
      renewalCounts: inspectedWorkbook.renewalCounts
    });
    ui.triggerDownload(result.filename, result.blob);
    ui.setOutputFilename(result.filename);
    ui.showStatus("success", `Generated ${result.filename}`, { dismissAfter: 5000 });
  } catch (error) {
    ui.showStatus("error", error.message || "Failed to generate workbook.", { dismissAfter: 0 });
  } finally {
    ui.setLoading(false);
  }
}

function handleClear() {
  inspectedWorkbook = null;
  ui.reset();
}

async function loadFreshHardwareLifecycleRows() {
  try {
    const persisted = await loadLifecycleRssPersisted();
    return validateLifecyclePersistence(persisted).rows;
  } catch (error) {
    throw normalizeLifecycleStorageError(
      error,
      "Update Hardware LifeCycle data before generating the report. The stored lifecycle data could not be read."
    );
  }
}

function parseLifecycleUpdatedAt(meta) {
  const value = meta?.updatedAt || meta?.feedUpdatedAt;
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateLifecyclePersistence(persisted) {
  if (!persisted?.rows?.length) {
    throw new Error("Update Hardware LifeCycle data before generating the report. No lifecycle RSS data is stored yet.");
  }

  const refreshedAt = parseLifecycleUpdatedAt(persisted.meta);
  if (!refreshedAt) {
    throw new Error("Update Hardware LifeCycle data before generating the report. The stored lifecycle refresh date is unavailable.");
  }

  const ageInDays = (Date.now() - refreshedAt.getTime()) / 86400000;
  if (ageInDays > LIFECYCLE_MAX_AGE_DAYS) {
    const roundedAge = Math.floor(ageInDays);
    throw new Error(`Update Hardware LifeCycle data before generating the report. The stored lifecycle data is ${roundedAge} day${roundedAge === 1 ? "" : "s"} old.`);
  }

  return persisted;
}

async function loadLifecycleSummary(assetCounts) {
  try {
    const persisted = await loadLifecycleRssPersisted();
    const valid = validateLifecyclePersistence(persisted);
    const mergedAssetCounts = mergeLifecycleDates(assetCounts, valid.rows);
    return {
      assetCounts: mergedAssetCounts,
      emptyMessage: mergedAssetCounts.length ? "" : "No models found."
    };
  } catch (error) {
    return {
      assetCounts,
      emptyMessage: normalizeLifecycleStorageError(
        error,
        "Update Hardware LifeCycle data to preview lifecycle dates."
      ).message
    };
  }
}

function mergeLifecycleDates(assetCounts, lifecycleRows) {
  const lifecycleByProduct = new Map();
  for (const row of lifecycleRows) {
    const key = normalizeLifecycleKey(row.product);
    if (key && !lifecycleByProduct.has(key)) {
      lifecycleByProduct.set(key, row);
    }
  }

  return assetCounts.map((row) => {
    const lifecycle = lifecycleByProduct.get(normalizeLifecycleKey(row.label));
    return {
      ...row,
      endOfOrderDate: lifecycle?.endOfOrderDate || "",
      lastServiceExtensionDate: lifecycle?.lastServiceExtensionDate || "",
      endOfSupportDate: lifecycle?.endOfSupportDate || ""
    };
  }).sort(compareAssetCountsByEndOfOrderDate);
}

function normalizeLifecycleKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function compareAssetCountsByEndOfOrderDate(left, right) {
  const leftDate = parseComparableLifecycleDate(left.endOfOrderDate);
  const rightDate = parseComparableLifecycleDate(right.endOfOrderDate);

  if (leftDate && rightDate) {
    const dateDiff = leftDate.getTime() - rightDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    const countDiff = Number(right.count || 0) - Number(left.count || 0);
    if (countDiff !== 0) return countDiff;
  } else if (leftDate) {
    return -1;
  } else if (rightDate) {
    return 1;
  } else {
    const countDiff = Number(right.count || 0) - Number(left.count || 0);
    if (countDiff !== 0) return countDiff;
  }

  return String(left.label || "").localeCompare(String(right.label || ""), undefined, { sensitivity: "base" });
}

function parseComparableLifecycleDate(value) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) {
    return null;
  }

  const parsed = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLifecycleStorageError(error, fallbackMessage) {
  const message = String(error?.message || "").trim();
  const name = String(error?.name || "").trim();

  if (
    name === "InvalidStateError" ||
    name === "TransactionInactiveError" ||
    /database connection is closing/i.test(message) ||
    /transaction.*IDBDatabase/i.test(message)
  ) {
    return new Error(fallbackMessage);
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
}
