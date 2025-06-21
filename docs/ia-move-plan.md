# IA Move & Redirect Plan

> **Status:** Draft for execution • Created YYYY-MM-DD  
> Execute after the IA outline (`docs/ia-outline.md`) is approved.

---

## 1. How to Apply Redirects

For each file that is **moved or renamed**, leave the old file in place for one release cycle containing **only** the callout box below (replace `NEW_PATH`):

```markdown
> **ℹ️ Moved:** This page is now located at [`NEW_PATH`](NEW_PATH).  
> Please update your bookmarks.
```

After the grace period, delete the stub file.

---

## 2. File Relocation Matrix

| # | Old Path | New Path | Action |
|---|----------|----------|--------|
| 1 | `README.md` (Quick-Start section portion) | `docs/quick-start/local-setup.md` | **Extract** relevant section |
| 2 | `docs/architecture-design.md` | `docs/overview/architecture.md` | **Move** |
| 3 | `docs/deployment-and-ops.md` (Quick-Start duplicate) | `docs/quick-start/docker-troubleshooting.md` | **Split** section |
| 4 | `docs/performance-guide.md` | `docs/guides/performance.md` | **Move + Rename** |
| 5 | `docs/error-handling.md` | `docs/reference/error-handling.md` | **Move** |
| 6 | *(new)* Extract env table (none) | `docs/reference/env-variables.md` | **New file** |
| 7 | `docs/decisions/tooling.md` | `docs/meta/decisions/tooling.md` | **Move** |
| 8 | `docs/personas.md` | `docs/meta/personas.md` | **Move** |
| 9 | `docs/doc-inventory.md` | `docs/meta/doc-inventory.md` | **Move** |

*Rows not listed remain in place or will be created fresh under the new IA.*

---

## 3. Link-Update Checklist

1. Search for stale paths with  
   ```bash
   grep -R "deployment-and-ops.md" docs | cut -f1 -d:
   ```  
2. Update each link to new location.  
3. Run `markdownlint` & ensure no broken links remain (`markdown-link-check` optional).  

---

## 4. Approval & Execution

* Obtain sign-off from **Docs Maintainer** and **Backend Tech Lead**.  
* Execute moves in a dedicated PR titled **“chore(docs): IA restructure batch 1”**.  
* Verify all GitHub permalinks auto-redirect correctly (GitHub handles renames in PR).  
* After one release cycle, remove redirect stubs and close this plan.
