# FabricBOM Builder Integration Plan

## Goal

Keep BOM Builder as a native-feeling SE Toolbox page while using `FabricBOM` as an upstream-synced embedded workspace.

The current direction is:

- SE Toolbox owns the route, shell, navigation, and theme behavior
- `FabricBOM` owns the embedded BOM workspace and product generators
- SKU Finder remains the shared pricing source
- local integration patches stay thin and deliberate

## Current State

As of this migration pass:

- the vendored upstream snapshot has been refreshed from `msalty/FabricBOM`
- the BOM Builder wrapper still embeds the vendored app through `/bom-builder/`
- SE Toolbox navigation can now reach the newer upstream products
- pricing still comes from the shared IndexedDB pricing database used by SKU Finder
- the theme bridge has been expanded to cover the newer upstream shell controls

Current local integration points:

- `bom-builder/index.html`
- `src/features/bom-builder/main.js`
- `src/features/bom-builder/catalog.js`
- `src/features/bom-builder/theme-bridge.css`
- `vendor/FortiBOM/`

Note:

- the vendored folder path remains `vendor/FortiBOM/` for now to avoid a larger path and cache refactor during the upstream migration
- user-facing naming in SE Toolbox should use `FabricBOM`

## Architecture Decision

Do not import `FabricBOM` wholesale into the SE Toolbox shell.

Do not rewrite the whole tool natively yet either.

The best fit right now is an adapter-style integration:

- SE Toolbox owns the surrounding experience
- `FabricBOM` stays vendored as the upstream BOM engine
- local patches focus on wrapper behavior, theme bridging, and pricing integration

This gives us:

- a realistic path for future upstream refreshes
- a consistent SE Toolbox user experience
- less duplicated logic
- an easier future migration path if selected products become native modules later

## Ownership Split

SE Toolbox-owned:

- route and wrapper page
- shared navigation and shell
- theme synchronization
- embedded-frame control logic
- product catalog mapping for SE Toolbox navigation
- local documentation and migration workflow

FabricBOM-owned initially:

- upstream hub shell and product iframe loader
- per-product generators
- Project BOM semantics
- import/export behavior
- local storage/session behavior

Shared boundary:

- iframe host in `bom-builder/index.html`
- embedded control hooks used by the wrapper:
  - `loadProduct()`
  - `showPBV()`
  - `showSavedProjects()`
- postMessage add-to-BOM flow
- shared pricing IndexedDB access

## Pricing Model

Pricing must continue to come from the shared SE Toolbox dataset rather than a separate BOM-only upload flow.

Current integration behavior:

- SKU Finder populates the shared browser pricing data
- embedded `FabricBOM` reads that shared dataset from IndexedDB
- Project BOM pricing and custom SKU lookup depend on that shared store

Practical rule:

- preserve the shared pricing database seam during upstream refreshes
- do not reintroduce a separate BOM-only pricing workflow unless intentionally approved

## Upstream Refresh Workflow

Recommended workflow for future updates:

1. refresh the vendored snapshot from `msalty/FabricBOM`
2. compare upstream changes against local wrapper assumptions
3. preserve only the minimum local integration patches
4. verify:
   - embedded route loads
   - product navigation still works
   - Project BOM still works
   - Saved Projects still works
   - shared pricing still resolves
   - service worker asset list still matches vendored files
5. update this plan if the boundary changes

Practical rule:

- do not scatter `FabricBOM` edits across unrelated SE Toolbox files
- keep local changes concentrated in the wrapper, catalog bridge, theme bridge, and carefully chosen vendor patches

## Naming Convention

Use `FabricBOM` in:

- SE Toolbox page copy
- README and project docs
- planning and migration docs
- status and UI messaging where the embedded tool is referenced by name

The legacy filesystem path `vendor/FortiBOM/` can remain temporarily until we intentionally perform a follow-up vendor-path rename.

That later rename should be treated as its own cleanup task because it will affect:

- wrapper iframe paths
- service worker cached URLs
- root service worker asset lists
- documentation references

## Migration Strategy

### Phase 1: Stable Upstream Wrapper

Keep the current wrapper-based integration healthy:

- SE Toolbox shell around embedded `FabricBOM`
- shared navigation into products and views
- shared pricing database
- service-worker and asset alignment
- thin local styling bridge

Status:

- in progress and now materially advanced

### Phase 2: Harden The Boundary

Improve the wrapper and maintenance model:

- record upstream commit/version in a lightweight note if needed
- isolate any vendor patches we intentionally carry
- add a small validation checklist for upstream refreshes
- reduce stale `FortiBOM` naming in local docs and UI

### Phase 3: Selective Native Replacement

Only if it proves valuable, replace selected upstream product flows with native SE Toolbox modules.

Good candidates later:

- FortiGate
- FortiSwitch
- FortiAP

Criteria before replacing a product natively:

- the upstream flow is stable and well understood
- the SE Toolbox version would materially improve usability or maintainability
- the module can still emit normalized BOM rows compatible with the shared cart/export model

### Phase 4: Optional Vendor Path Cleanup

If we want naming consistency all the way down, rename the vendored folder from `vendor/FortiBOM/` to something like `vendor/FabricBOM/`.

Do this only as a deliberate follow-up after:

- wrapper paths are updated together
- cache keys and cached asset paths are updated together
- docs and references are updated together

## Immediate Next Steps

1. smoke-test `/bom-builder/` in the browser
2. verify one standard product flow end to end
3. verify `Search & Custom Entry` against shared pricing data
4. verify Project BOM pricing/export behavior
5. decide whether to keep the vendor path as-is for now or schedule the path rename as a separate cleanup pass

## Strong Recommendation

Keep BOM Builder on the current path:

- upstream-synced `FabricBOM`
- SE Toolbox-owned shell
- shared SKU Finder pricing
- minimal, well-contained integration patches

That is the best balance of maintainability, upgradeability, and speed right now.
