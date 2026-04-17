import { get, set, del } from "../../../vendor/idb-keyval.mjs";

export const SOFTWARE_LIFECYCLE_SCHEMA_VERSION = "1";

const KEY_PREFIX = "fortisku-software-lifecycle";
const KEY_ROWS = `${KEY_PREFIX}:rows:v${SOFTWARE_LIFECYCLE_SCHEMA_VERSION}`;
const KEY_INDEX = `${KEY_PREFIX}:index:v${SOFTWARE_LIFECYCLE_SCHEMA_VERSION}`;
const KEY_META = `${KEY_PREFIX}:meta:v${SOFTWARE_LIFECYCLE_SCHEMA_VERSION}`;

export async function loadSoftwareLifecyclePersisted() {
  const meta = await get(KEY_META);
  if (!meta || meta.schemaVersion !== SOFTWARE_LIFECYCLE_SCHEMA_VERSION) {
    await clearSoftwareLifecyclePersisted();
    return null;
  }

  const rows = await get(KEY_ROWS);
  const indexJSON = await get(KEY_INDEX);

  if (!rows || !indexJSON) {
    await clearSoftwareLifecyclePersisted();
    return null;
  }

  return {
    rows,
    indexJSON,
    meta
  };
}

export async function saveSoftwareLifecyclePersisted(rows, indexJSON, meta) {
  const payload = {
    ...meta,
    schemaVersion: SOFTWARE_LIFECYCLE_SCHEMA_VERSION
  };

  await Promise.all([set(KEY_ROWS, rows), set(KEY_INDEX, indexJSON), set(KEY_META, payload)]);

  return payload;
}

export async function clearSoftwareLifecyclePersisted() {
  await Promise.all([del(KEY_ROWS), del(KEY_INDEX), del(KEY_META)]);
}

export function estimateSoftwareLifecycleSizeBytes(rows, indexJSON) {
  const rowsBytes = new TextEncoder().encode(JSON.stringify(rows)).length;
  const indexBytes = new TextEncoder().encode(JSON.stringify(indexJSON)).length;
  return rowsBytes + indexBytes;
}
