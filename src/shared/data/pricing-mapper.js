export function buildPricingDataset(rows, meta, rawPricingData) {
  const now = new Date().toISOString();
  const filename = meta.filename ?? null;
  const sourceType = filename?.toLowerCase().endsWith(".csv") ? "csv" : "xlsx";
  const importedAt = meta.updatedAt ?? now;

  if (rawPricingData) {
    return {
      key: "pricing",
      version: 1,
      source: {
        type: sourceType,
        filename,
        importedAt
      },
      data: {
        ok: true,
        name: rawPricingData.name,
        effectiveDate: rawPricingData.effectiveDate,
        headers: rawPricingData.headers,
        rows: rawPricingData.rows,
        uploadedAt: importedAt
      },
      meta: {
        rowCount: rawPricingData.rows.length,
        headerCount: rawPricingData.headers.length,
        effectiveDate: rawPricingData.effectiveDate,
        datasetName: rawPricingData.name
      }
    };
  }

  // Fallback when the workbook does not have the 39 required pricing headers.
  const sharedRows = rows.map((row) => ({
    sku: row.sku,
    description1: row.description,
    description2: row.description2,
    price: row.price,
    priceDisplay: row.price_display,
    category: row.category,
    comments: row.comments
  }));

  const fallbackName = meta.priceListLabel ?? "Fortinet Price List";

  return {
    key: "pricing",
    version: 1,
    source: {
      type: sourceType,
      filename,
      importedAt
    },
    data: {
      ok: true,
      name: fallbackName,
      effectiveDate: "",
      headers: [],
      rows: sharedRows,
      uploadedAt: importedAt
    },
    meta: {
      rowCount: sharedRows.length,
      headerCount: 0,
      effectiveDate: "",
      datasetName: fallbackName
    }
  };
}
