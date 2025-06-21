# WeBudget Documentation Style Guide

> **Status:** Draft v0.1 – Last updated 2025-06-20  
> This guide codifies tone, grammar, formatting, and code-block conventions for all WeBudget backend documentation.

## 1. Purpose
Provide a single reference so writers and engineers produce consistent, readable docs. \
Heavily inspired by Google Developer Style Guide and Microsoft Manual of Style, with WeBudget-specific exceptions.

## 2. Voice & Terminology
| Term | Preferred Form | Notes |
|------|----------------|-------|
| the application | **WeBudget** | Capitalize “W” and “B”. |
| database | PostgreSQL | Specify when multiple DBs appear. |
<!-- Add more as needed -->

*Write in second person (“you”), active voice, and present tense whenever feasible.*

## 3. Structural Conventions
### 3.1 Headings
* Use sentence case (`## Run migrations locally`).
* Skip heading levels (H1→H2→H3) **only** when unavoidable.

### 3.2 Code Blocks
<pre><code>```bash
docker compose up --build
```</code></pre>

* Caption optional but encouraged for multi-step snippets.

## 4. Accessibility
* Provide alt text for every diagram.
* Never rely on color alone for meaning.

## 5. File & Directory Naming
* Docs live in `docs/…`, lowercase with hyphens (`error-handling.md`).
* Decision records in `docs/decisions/`.

## 6. Linting Rules (preview)
* markdownlint-config: enforce line length ≤ 120, no trailing whitespace.
* Spell-check dictionary: add project-specific terms (WeBudget, Plaid).

---

*This document will evolve. Propose changes via Pull Request.*