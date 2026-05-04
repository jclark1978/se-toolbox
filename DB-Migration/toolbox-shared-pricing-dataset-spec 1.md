## Scope

This document defines the dataset-specific IndexedDB specification for storing Fortinet official price list data in a shared browser-side IndexedDB format.

The shared IndexedDB database and object store are common across all shared datasets. This document defines only the Fortinet Price List dataset module that lives inside that shared storage container.

Other datasets may also be stored in the same shared IndexedDB database, but each dataset must have its own separate specification defining its dataset key, record shape, validation rules, import behavior, metadata, and compatibility requirements.

The Fortinet Price List dataset is stored under the unique dataset key `pricing`. This key is reserved for the Fortinet Price List dataset and must not be reused by any other dataset.

Importing or replacing the Fortinet Price List dataset must only update the record with key `pricing`. It must not delete, overwrite, migrate, or modify other records in the `datasets` object store.

This document defines:

- The shared IndexedDB database name and version
- The shared object store name and configuration
- The `onupgradeneeded` initialization behavior
- The Fortinet Price List dataset key
- The Fortinet Price List record shape
- Required Fortinet Price List headers
- Row formatting rules
- CSV and Excel import rules
- Valid `source.type` values
- `effectiveDate` formatting rules
- Validation behavior
- Dataset metadata requirements
- Versioning expectations
- How to read the dataset from other applications
- Compatibility requirements between projects

This document does not define schemas for unrelated datasets. Future datasets should be documented in separate dataset-specific specification documents that follow the same modular pattern.

## Additional Information

All shared datasets should live in the same IndexedDB database and object store, but must use unique dataset keys to avoid collisions.

The naming convention of these documents indicates their specific purpose. If a change is made to a document, consider that a change to that specific dataset.

Recommended naming convention:

- `toolbox-shared-indexeddb-overview.md`
- `toolbox-shared-pricing-dataset-spec.md`
- `toolbox-shared-[dataset-name]-dataset-spec.md`

## IndexedDB Price List Dataset Specification

### 1. IndexedDB Name
```
toolbox_shared
```

### 2. IndexedDB Version

Open the database with version `2`:
```javascript
const req = indexedDB.open('toolbox_shared', 2);
```

The top-level `version` field inside each dataset record (e.g. `{ key: "pricing", version: 1, ... }`) is the schema version for that specific record. It is separate from, and must not be confused with, the IndexedDB database version number above.

### 3. Object Store Name and Configuration

The `datasets` object store uses `keyPath: 'key'` so each dataset record is addressed by its unique dataset key. `autoIncrement` is not set (defaults to false).

```javascript
db.createObjectStore('datasets', { keyPath: 'key' });
```

No secondary indexes are defined on this object store.

### 4. `onupgradeneeded` Behavior

When the database is opened with version `2` and an upgrade is needed, the handler must drop the existing `datasets` store (if present) and recreate it:

```javascript
req.onupgradeneeded = (e) => {
  const db = e.target.result;
  if (db.objectStoreNames.contains('datasets')) {
    db.deleteObjectStore('datasets');
  }
  db.createObjectStore('datasets', { keyPath: 'key' });
};
```

This destructive upgrade pattern means any existing dataset records are cleared when the schema version changes. Applications that add new datasets to this store must be aware of this behavior and re-import data after an upgrade if necessary.

### 5. Dataset Key

The key `pricing` is reserved for the Fortinet Price List dataset. No other dataset should use this key.

```
pricing
```

### 6. Top-Level Record Shape

```javascript
{
  key: "pricing",
  version: 1,
  source: {},
  data: {},
  meta: {}
}
```

### 7. `source` Object

The `source` object describes the origin of the imported file.

```javascript
source: {
  type: importType,        // "csv" or "xlsx" — see Valid source.type Values below
  filename: file?.name ?? null,
  importedAt: new Date().toISOString()
}
```

#### Valid `source.type` Values

| Value    | When to use                                  |
|----------|----------------------------------------------|
| `"csv"`  | File was imported as a `.csv` text file       |
| `"xlsx"` | File was imported as a `.xlsx` Excel file     |

No other values are valid. Do not use `"excel"` or any other string.

### 8. `data` Object

```javascript
data: {
  ok: true,
  name: "AMERICAS 2026 Price List",    // Populated from imported file — do not hardcode
  effectiveDate: "May 04, 2026",        // Populated from imported file — do not hardcode
  headers: [...],                       // The 39 required headers in exact order
  rows: [...],                          // One object per data row
  uploadedAt: new Date().toISOString()
}
```

#### `effectiveDate` Formatting

The `effectiveDate` value is stored exactly as it appears in the source file — no normalization, conversion to ISO 8601, or reformatting is applied. The value may be a human-readable string such as `"May 04, 2026"` or any other format the source file uses. Consumers of this field must not assume a fixed format.

#### `data.name`

The `data.name` value is read from the source file (e.g., a preamble row such as `"AMERICAS 2026 Price List"`). It must not be hardcoded. If the source file does not contain a recognizable name, fall back to `"Fortinet Price List"`.

### 9. `meta` Object

```javascript
meta: {
  rowCount: rows.length,
  headerCount: headers.length,
  effectiveDate: "May 04, 2026",      // Same value as data.effectiveDate
  datasetName: "AMERICAS 2026 Price List"  // Same value as data.name
}
```

### 10. Required Headers

The `data.headers` array must contain exactly 39 headers, in this exact order:

```javascript
[
  "Comments",
  "Identifier",
  "Product Family Group",
  "Product",
  "Product Type",
  "Item",
  "SKU",
  "Description #1",
  "Description #2",
  "Price",
  "Category",
  "Fx Translated Price",
  "UPC Code",
  "FED",
  "GSA",
  "COO",
  "Single Pack Weight (lbs.)",
  "Single Pack Length (in.)",
  "Single Pack Width (in.)",
  "Single Pack Height (in.)",
  "Case Pack Quantity",
  "Case Pack Weight (lbs.)",
  "Case Pack Length (in.)",
  "Case Pack Width (in.)",
  "Case Pack Height (in.)",
  "Ground Pallet Quantity",
  "Ground Pallet Weight (lbs.)",
  "Ground Pallet Length (in.)",
  "Ground Pallet Width (in.)",
  "Ground Pallet Height (in.)",
  "Air Pallet Quantity",
  "Air Pallet Weight (lbs.)",
  "Air Pallet Length (in.)",
  "Air Pallet Width (in.)",
  "Air Pallet Height (in.)",
  "AutoStart",
  "E-Rate",
  "Pillar",
  "Term (Month)"
]
```

### 11. Header Name Rules

Do not rename, normalize, lowercase, or transform the header names.

The following are DIFFERENT and must NOT be treated as interchangeable:

```
"Description #1"
"description_1"
"description1"
"Description 1"
```

Only the exact original header string must be used.

### 12. Row Shape

The `data.rows` array contains one object per imported data row, keyed by exact header names:

```javascript
{
  "Comments": "",
  "Identifier": "FG-100F",
  "Product Family Group": "FortiGate",
  "Product": "FortiGate 100F",
  "Product Type": "Hardware",
  "Item": "",
  "SKU": "FG-100F",
  "Description #1": "FortiGate 100F Hardware",
  "Description #2": "",
  "Price": "1234.00",
  "Category": "",
  "Fx Translated Price": "",
  "UPC Code": "",
  "FED": "",
  "GSA": "",
  "COO": "",
  "Single Pack Weight (lbs.)": "",
  "Single Pack Length (in.)": "",
  "Single Pack Width (in.)": "",
  "Single Pack Height (in.)": "",
  "Case Pack Quantity": "",
  "Case Pack Weight (lbs.)": "",
  "Case Pack Length (in.)": "",
  "Case Pack Width (in.)": "",
  "Case Pack Height (in.)": "",
  "Ground Pallet Quantity": "",
  "Ground Pallet Weight (lbs.)": "",
  "Ground Pallet Length (in.)": "",
  "Ground Pallet Width (in.)": "",
  "Ground Pallet Height (in.)": "",
  "Air Pallet Quantity": "",
  "Air Pallet Weight (lbs.)": "",
  "Air Pallet Length (in.)": "",
  "Air Pallet Width (in.)": "",
  "Air Pallet Height (in.)": "",
  "AutoStart": "",
  "E-Rate": "",
  "Pillar": "",
  "Term (Month)": ""
}
```

### 13. Import Rules (CSV and Excel)

- Read the first recognized header row as column names.
- Validate that headers match the required 39 headers exactly (count, names, and order).
- Preserve the header order.
- Convert each following row into an object keyed by the exact header names.
- Empty cells must be stored as empty strings `""`. Never store `undefined`.
- Preserve all values as strings unless the application explicitly requires numeric conversion later.
- Do not modify SKUs, prices, weights, or dimensions during import.
- Strip non-numeric characters from the `Price` field during import (e.g., `"$1,234.00"` → `"1234.00"`), but preserve the result as a string.
- If the imported file is missing required headers, contains extra headers, or has headers in the wrong order, the import must fail with a clear validation error and must not overwrite the existing `pricing` dataset.

#### CSV-Specific Rules

- The file may contain preamble rows above the header row (e.g., price list name, effective date). Scan the first 30 rows to locate the header row. The header row is identified by its first cell being `"Comments"` and the row containing `"SKU"`.
- The price list name is typically a standalone row before the effective date row (first cell non-empty, all other cells empty).
- The effective date row begins with `"Effective Date:"` followed by the date string.

#### Excel (XLSX)-Specific Rules

- Read from the sheet named `"DataSet"` (case-insensitive match if exact match not found).
- Apply the same preamble scanning logic as CSV to locate the header row, name, and effective date. Metadata may appear in any column of the preamble rows.
- Strip trailing empty columns from the header row before validation.

### 14. Complete Record Example

```javascript
const pricingDataset = {
  key: "pricing",
  version: 1,
  source: {
    type: "csv",                          // or "xlsx"
    filename: "Fortinet_Price_List.csv",
    importedAt: new Date().toISOString()
  },
  data: {
    ok: true,
    name: "AMERICAS 2026 Price List",     // Read from file
    effectiveDate: "May 04, 2026",        // Read from file, stored as-is
    headers: [ /* 39 headers in order */ ],
    rows: [ /* one object per row */ ],
    uploadedAt: new Date().toISOString()
  },
  meta: {
    rowCount: rows.length,
    headerCount: headers.length,
    effectiveDate: "May 04, 2026",
    datasetName: "AMERICAS 2026 Price List"
  }
};
```

### 15. Writing the Record

Use a `readwrite` transaction on the `datasets` object store. Use `put()` (not `add()`) so that reimporting replaces the existing record without affecting other dataset keys.

```javascript
async function savePricingIDB(record) {
  const db = await openSharedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readwrite');
    tx.objectStore('datasets').put(record);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}
```

### 16. Reading the Record

Use a `readonly` transaction to retrieve the pricing record by its key:

```javascript
async function getPricingIDB() {
  const db = await openSharedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readonly');
    const req = tx.objectStore('datasets').get('pricing');
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}
```

Returns the full dataset record, or `null` if no pricing data has been imported yet.

### 17. Deleting the Record

Use a `readwrite` transaction and call `delete()` with the dataset key. This removes only the `pricing` record and does not affect other dataset records.

```javascript
async function deletePricingIDB() {
  const db = await openSharedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readwrite');
    tx.objectStore('datasets').delete('pricing');
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}
```

### 18. Versioning and Schema Migration

The top-level `version` field inside the record (currently `1`) represents the schema version of the `pricing` record shape, not the IndexedDB database version.

If the record schema changes in a future revision, increment this field. Consumers reading a `pricing` record should check this field and handle or reject unknown versions gracefully.

The IndexedDB database version (currently `2`) must be incremented any time a structural change to the database is required (e.g., adding a new object store, adding an index). Note that the current `onupgradeneeded` handler is destructive — it drops and recreates the `datasets` store, clearing all records. Any increment to the database version will require all datasets to be re-imported.
