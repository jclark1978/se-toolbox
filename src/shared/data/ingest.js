import { read, utils } from "../../../vendor/xlsx.mjs";

const DEFAULT_SHEET_NAME = "DataSet";

const FIELD_MAP = {
  sku: ["sku", "product_sku", "part", "partnumber"],
  description: ["description", "description#1", "description1", "desc", "itemdescription", "productdescription"],
  description2: ["description#2", "description2", "desc2", "itemdescription2", "productdescription2", "secondarydescription"],
  price: ["price", "listprice", "unitprice", "msrp", "usdprice"],
  category: ["category", "productcategory", "family", "productfamily", "familyname", "productline", "bundle", "solution", "segment", "portfolio"],
  comments: ["comments", "comment", "notes", "note"]
};

const HEADER_FIELDS = Object.keys(FIELD_MAP);

const REQUIRED_PRICING_HEADERS = [
  "Comments", "Identifier", "Product Family Group", "Product", "Product Type",
  "Item", "SKU", "Description #1", "Description #2", "Price", "Category",
  "Fx Translated Price", "UPC Code", "FED", "GSA", "COO",
  "Single Pack Weight (lbs.)", "Single Pack Length (in.)", "Single Pack Width (in.)", "Single Pack Height (in.)",
  "Case Pack Quantity", "Case Pack Weight (lbs.)", "Case Pack Length (in.)", "Case Pack Width (in.)", "Case Pack Height (in.)",
  "Ground Pallet Quantity", "Ground Pallet Weight (lbs.)", "Ground Pallet Length (in.)", "Ground Pallet Width (in.)", "Ground Pallet Height (in.)",
  "Air Pallet Quantity", "Air Pallet Weight (lbs.)", "Air Pallet Length (in.)", "Air Pallet Width (in.)", "Air Pallet Height (in.)",
  "AutoStart", "E-Rate", "Pillar", "Term (Month)"
];

export async function ingestWorkbook(file, requestedSheetName) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = await read(arrayBuffer);
  const sheetName = resolveSheetName(workbook, requestedSheetName);
  if (!sheetName) {
    throw new Error(
      requestedSheetName
        ? `Sheet "${requestedSheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
        : "Workbook does not contain any sheets."
    );
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows.length) {
    throw new Error(`Sheet "${sheetName}" is empty.`);
  }

  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) {
    throw new Error("Could not locate a header row containing SKU and Description #1 columns.");
  }

  const dataRows = rows.slice(headerInfo.index + 1);
  const { normalizedRows, stats } = normalizeRows(dataRows, headerInfo.headerMap);
  const coverInfo = extractCoverSheetInfo(workbook);
  const orderingGuideRows = extractOrderingGuideRows(workbook);
  const rawPricingData = buildRawPricingData(rows, headerInfo);

  if (!normalizedRows.length) {
    throw new Error("No data rows contained valid SKU and Description #1 values.");
  }

  return {
    rows: normalizedRows,
    sheetName,
    stats,
    coverInfo,
    orderingGuideRows,
    rawPricingData
  };
}

function extractCoverSheetInfo(workbook) {
  const sheetNames = workbook.SheetNames || [];
  const targets = ["cover sheet", "cover", "coversheet"];
  let sheet = null;
  for (const name of sheetNames) {
    const normalized = String(name).trim().toLowerCase();
    if (targets.includes(normalized)) {
      sheet = workbook.Sheets[name];
      break;
    }
  }

  if (!sheet) {
    return null;
  }

  const rows = sheet.__rows || [];
  const rowIndex = 6; // C7 -> zero-based row 6
  const colIndex = 2; // Column C -> zero-based index 2
  const row = rows[rowIndex];
  if (!row || row[colIndex] === undefined || row[colIndex] === null) {
    return null;
  }
  const value = String(row[colIndex]).trim();
  return value || null;
}

function findHeaderRow(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || !row.length) {
      continue;
    }
    const headerMap = mapHeaders(row);
    if (headerMap.includes("sku") && headerMap.includes("description")) {
      return {
        index,
        headerMap,
        originalHeaders: row.map(h => String(h ?? "").trim())
      };
    }
  }
  return null;
}

function resolveSheetName(workbook, requested) {
  if (requested) {
    const directMatch = workbook.SheetNames.find((name) => name.toLowerCase() === requested.toLowerCase());
    if (directMatch) return directMatch;
  }
  const defaultMatch = workbook.SheetNames.find((name) => name.toLowerCase() === DEFAULT_SHEET_NAME.toLowerCase());
  if (defaultMatch) return defaultMatch;
  return workbook.SheetNames[0] || null;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, "");
}

function mapHeaders(headers) {
  return headers.map((header) => {
    const normalized = normalizeKey(header);
    if (!normalized) return null;

    for (const field of HEADER_FIELDS) {
      if (normalized === field) {
        return field;
      }
    }

    for (const [field, synonyms] of Object.entries(FIELD_MAP)) {
      if (synonyms.includes(normalized)) {
        return field;
      }
    }

    for (const [field, synonyms] of Object.entries(FIELD_MAP)) {
      if (normalized.includes(field)) {
        return field;
      }
      if (synonyms.some((alias) => normalized.includes(alias))) {
        return field;
      }
    }

    return null;
  });
}

function normalizeRows(rows, headerMap) {
  const normalizedRows = [];
  let nextId = 1;
  let skippedRows = 0;

  for (const row of rows) {
    if (!row || row.every((cell) => cell === null || cell === undefined || cell === "")) {
      continue;
    }

    const record = {
      id: `row-${nextId++}`,
      sku: "",
      description: "",
      description2: "",
      price: null,
      price_display: "",
      category: "",
      comments: ""
    };

    for (let colIndex = 0; colIndex < headerMap.length; colIndex++) {
      const field = headerMap[colIndex];
      if (!field) continue;

      const rawValue = row[colIndex];
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        continue;
      }

      if (field === "price") {
        const numeric = coercePrice(rawValue);
        if (numeric !== null) {
          record.price = numeric;
        }
        record.price_display = sanitizeString(rawValue);
        continue;
      }

      record[field] = sanitizeString(rawValue);
    }

    if (!record.sku || !record.description) {
      skippedRows++;
      continue;
    }

    record.sku = record.sku.trim();
    record.description = record.description.trim();
    record.description2 = record.description2.trim();
    record.price_display = record.price_display.trim();
    record.category = record.category.trim();
    record.comments = record.comments.trim();

    normalizedRows.push(record);
  }

  normalizedRows.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { sensitivity: "base" }));

  return {
    normalizedRows,
    stats: {
      skippedRows
    }
  };
}

function sanitizeString(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function coercePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const cleaned = String(value)
    .replace(/[^0-9.-]+/g, "")
    .trim();
  if (!cleaned) return null;
  const numeric = parseFloat(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function extractOrderingGuideRows(workbook) {
  const sheetName = (workbook.SheetNames || []).find((name) => {
    const normalized = String(name).trim().toLowerCase();
    return normalized === "ordering guide" || normalized === "ordering guides" || normalized.includes("ordering guide");
  });
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const merges = Array.isArray(sheet["!merges"]) ? sheet["!merges"] : [];
  const skippedRows = new Set();

  for (const merge of merges) {
    if (!merge || !merge.s || !merge.e) continue;
    const touchesTargetColumn = merge.s.c <= 2 && merge.e.c >= 1;
    if (!touchesTargetColumn) continue;
    for (let rowIndex = merge.s.r; rowIndex <= merge.e.r; rowIndex += 1) {
      skippedRows.add(rowIndex);
    }
  }

  const results = [];
  const startRow = findOrderingGuideStartRow(grid);
  for (let rowIndex = startRow; rowIndex < grid.length; rowIndex += 1) {
    if (skippedRows.has(rowIndex)) {
      continue;
    }

    const row = grid[rowIndex] || [];
    const orderingGuide = sanitizeString(row[1] ?? "");
    const orderingGuideUrl = sanitizeString(
      sheet.__links?.get(`${rowIndex}:1`) || extractUrlFromText(orderingGuide)
    );
    const relatedProducts = sanitizeString(row[2] ?? "");
    const relatedProductsUrl = sanitizeString(
      sheet.__links?.get(`${rowIndex}:2`) || extractUrlFromText(relatedProducts)
    );

    if (!orderingGuide || !relatedProducts) {
      continue;
    }

    results.push({
      id: `ordering-${results.length + 1}`,
      orderingGuide,
      orderingGuideUrl,
      relatedProducts,
      relatedProductsUrl
    });
  }

  return results;
}

function findOrderingGuideStartRow(grid) {
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const row = grid[rowIndex] || [];
    const colB = sanitizeString(row[1] ?? "").toLowerCase();
    const colC = sanitizeString(row[2] ?? "").toLowerCase();
    if (colB === "ordering guide" && colC === "related products") {
      return rowIndex + 1;
    }
  }
  // Fallback to sheet row 8 semantics when explicit header row is not found.
  return 7;
}

function extractUrlFromText(value) {
  const text = sanitizeString(value);
  if (!text) return "";
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  const wwwMatch = text.match(/www\.[^\s)]+/i);
  if (wwwMatch) {
    return `https://${wwwMatch[0]}`;
  }
  return "";
}

// Scans preamble rows (before the header row) for price list name and effective date.
function extractPreamble(rows, headerIndex) {
  let name = null;
  let effectiveDate = null;

  for (let i = 0; i < Math.min(headerIndex, 30); i++) {
    const row = rows[i] || [];

    for (const cell of row) {
      const val = String(cell ?? "").trim();
      if (/^effective date:/i.test(val)) {
        effectiveDate = val.replace(/^effective date:\s*/i, "").trim();
      }
    }

    const firstCell = String(row[0] ?? "").trim();
    if (firstCell && !/^effective date:/i.test(firstCell)) {
      const restEmpty = row.slice(1).every(c => String(c ?? "").trim() === "");
      if (restEmpty) name = firstCell;
    }
  }

  return {
    name: name || "Fortinet Price List",
    effectiveDate: effectiveDate || ""
  };
}

// Returns raw rows keyed by original header names when the sheet has the 39 required pricing headers.
// Returns null if the headers do not match the required pricing schema.
function buildRawPricingData(rows, headerInfo) {
  const trimmedHeaders = headerInfo.originalHeaders.filter(h => h !== "");

  if (
    trimmedHeaders.length !== REQUIRED_PRICING_HEADERS.length ||
    !trimmedHeaders.every((h, i) => h === REQUIRED_PRICING_HEADERS[i])
  ) {
    return null;
  }

  const preamble = extractPreamble(rows, headerInfo.index);
  const rawRows = [];

  for (let i = headerInfo.index + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    if (row.every(c => c === null || c === undefined || c === "")) continue;

    const obj = {};
    for (let j = 0; j < trimmedHeaders.length; j++) {
      const header = trimmedHeaders[j];
      let val = j < row.length ? row[j] : "";

      if (header === "Price") {
        val = String(val ?? "").replace(/[^0-9.]/g, "");
      } else {
        val = val === null || val === undefined ? "" : String(val);
      }

      obj[header] = val;
    }

    rawRows.push(obj);
  }

  return {
    name: preamble.name,
    effectiveDate: preamble.effectiveDate,
    headers: trimmedHeaders,
    rows: rawRows
  };
}
