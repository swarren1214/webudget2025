# Tooling Decision Record – Documentation Stack

*Status: Approved • Created: 2025-06-20*

| Area                      | Decision                                                                                                                | Rationale                                                                          | Revisit Date                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| **Authoring format**      | Markdown (`.md`) stored in-repo                                                                                         | Lowest barrier; diff-friendly; matches current workflow                            | When static-site publishing is scheduled  |
| **Diagram source**        | Draw.io (`.drawio`) or Mermaid (`.mmd`) <br>**Store the editable file** plus exported PNG/SVG in `docs/assets`          | Keeps diagrams version-controlled and editable by all; PNG/SVG for quick rendering | Quarterly                                 |
| **Linting**               | [`markdownlint`](https://github.com/markdownlint/markdownlint) via GitHub Actions <br>Config file: `.markdownlint.yaml` | Enforces style guide rules automatically; CI gate maintains quality                | After first 4 weeks of use                |
| **Spell-checking**        | [`cSpell`](https://github.com/streetsidesoftware/cspell) optional local extension; shared wordlist `cspell.json`        | Catches typos without blocking CI initially; scalable to other IDEs                | When docs scale past 50 pages             |
| **IDE recommendations**   | Publish recommended VS Code extensions/config in `.vscode/`                                                             | Smooth onboarding for new engineers                                                | Review every 6 months                     |
| **Static-site generator** | *Deferred* (consider Docusaurus)                                                                                        | Keep surface small now; revisit when external audience grows                       | After first significant external adoption |
| **Localization**          | Not enabled; write with translatability in mind (no hard-coded screenshots, avoid colloquialisms)                       | Simplifies initial scope; keeps path open for future l10n                          | When translation budget is allocated      |

---

## How to update this record

1. Open a Pull Request editing this file.  
2. In the PR description, link to supporting discussion or issue.  
3. Add yourself to the **Authors** section below.

---

## Authors

* Initial draft: *Etienne Beaulac*, 2025-06-20