# Proposed Information Architecture – WeBudget Docs

> **Status:** Draft for review • Created 2025-06-20  
> Scope: Markdown-in-repo navigation only (no static-site generator yet).

---

## 0. Top-Level Navigation

| Order | Section | Purpose | Primary Persona(s) |
|-------|---------|---------|--------------------|
| 1 | **Overview** | Elevator pitch, system diagram, architecture decisions | BE-New |
| 2 | **Quick Start** | Clone, configure, run stack in ≤ 15 min | BE-New |
| 3 | **Guides** | How-to’s & concept docs for common tasks | BE-New, BE-Maint, BE-Ops |
| 4 | **Reference** | Stable, exhaustive facts (API spec, env vars, error codes) | BE-Maint |
| 5 | **Meta** | Style guide, personas, decision records, contributing | Docs maintainers |

---

## 1. File-and-Folder Map (proposed moves)

| New Path | Action | Source | Notes |
|----------|--------|--------|-------|
| `docs/overview/project-overview.md` | **NEW** | (n/a) | 1-paragraph elevator pitch + links |
| `docs/overview/architecture.md` | **MOVE** | `docs/architecture-design.md` (TBD exact filename) | Includes finished diagrams |
| `README.md` | **TRIM** | `README.md` | Keep ONLY elevator pitch + link to Quick Start |
| `docs/quick-start/local-setup.md` | **MOVE+SPLIT** | Part of current `README.md` | 5-step local setup |
| `docs/quick-start/docker-troubleshooting.md` | **MOVE** | Section from `docs/deployment-and-ops.md` | |
| `docs/guides/deployment-and-ops.md` | **KEEP (rename folder)** | `docs/deployment-and-ops.md` | Remove duplicated Quick-Start bits |
| `docs/guides/backend-development.md` | **KEEP** | same | |
| `docs/guides/performance.md` | **MOVE (rename)** | `docs/performance-guide.md` | |
| `docs/reference/error-handling.md` | **MOVE** | `docs/error-handling.md` | Canonical error catalog |
| `docs/reference/env-variables.md` | **NEW (extracted)** | data from `docs/deployment-and-ops.md` | Single source for all `.env` keys |
| `docs/reference/api/openapi.yaml` | **KEEP** | existing OpenAPI spec | |
| `docs/meta/style-guide/README.md` | **KEEP** | already exists | |
| `docs/meta/decisions/tooling.md` | **MOVE** | `docs/decisions/tooling.md` | Folder change only |
| `docs/meta/personas.md` | **MOVE** | `docs/personas.md` | |
| `docs/meta/doc-inventory.md` | **MOVE** | `docs/doc-inventory.md` | |
| `docs/meta/contributing.md` | **NEW** | (n/a) | To be authored in Phase 6 |

---

## 2. Redirect / Link Strategy

Since we serve Markdown directly from GitHub:

* Add a **yellow callout** at the top of any moved file left in its old location:  
  > “ℹ️ This page moved to `NEW_PATH`; please update your bookmarks.”  
* Old file then contains only the callout and a direct link; keep for one release cycle.

---

## 3. Rationale Highlights

* **Overview vs Quick Start** separation aligns with Diátaxis and Google Dev Doc patterns: concept first, then how-to.  
* **Guides vs Reference** prevents “how-to” creep in reference pages and vice-versa.  
* Extracting **env-variables** table into Reference eliminates duplication across README and Ops Guide.  
* **Meta** folder keeps contributor-facing material out of the main doc flow, reducing noise for engineers.

---

## 4. Next Steps Once Approved

1. Execute move/rename actions in batches (will break links until redirects land—coordinate).  
2. Update all intra-doc links (`grep -R "(docs/)"`) to new paths.  
3. Drop duplicated content (e.g., Quick-Start bits in Deployment Guide).  
4. Commit redirect stubs with callouts.

*These operational steps will be scheduled in a later phase.*

---