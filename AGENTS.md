# Agent Instructions

Before working in this repository:

1. Read the global policy files in:
   `/home/clarks/.codex/policies/`
2. Read this repository's `README.md`
3. Read `Project_Summary.md` if present

## Rule Split

- Global workflow, git habits, coding preferences, and decision rules come from:
  `/home/clarks/.codex/policies/`
- Repository-specific implementation details come from this repository

## If There Is A Conflict

- Follow repository facts for SE Toolbox-specific technical details
- Follow global policies for general collaboration behavior
- Ask for clarification if a conflict materially affects implementation

## Default Expectation

Treat this file as a pointer, not the full policy source of truth.

## Versioning Instructions

- SE Toolbox uses calendar versioning in the format `YYYY.MM.PATCH`.
- `YYYY` is the four-digit year of the release.
- `MM` is the two-digit release month.
- `PATCH` starts at `1` for the first user-visible release in that month and increments by `1` for each later user-visible release in the same month.
- The shared metadata source of truth is `src/shared/ui/app-meta.js`.
- Any user-visible change merged for release must update the version and `lastUpdated` value in `src/shared/ui/app-meta.js`.
- The About popover shown from `forti-brand-name` must continue to display the current author, last updated date, and version from that shared metadata file.
