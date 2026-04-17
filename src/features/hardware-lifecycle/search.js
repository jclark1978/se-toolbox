import {
  createLifecycleSearchIndex as createSharedLifecycleSearchIndex,
  loadLifecycleSearchIndex,
  searchLifecycleRows
} from "../../shared/lifecycle/search.js";

const STORE_FIELDS = [
  "product",
  "category",
  "endOfOrderDate",
  "lastServiceExtensionDate",
  "endOfSupportDate"
];

export function createLifecycleSearchIndex(rows) {
  return createSharedLifecycleSearchIndex(rows, STORE_FIELDS);
}

export { loadLifecycleSearchIndex, searchLifecycleRows };
