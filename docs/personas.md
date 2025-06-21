# Audience Personas – Backend Documentation

> **Scope:** Backend contributors only (Phase 0).  
> **Version:** v0.1 • Created YYYY-MM-DD

## 1. Purpose
Clarify “who we write for” so that every tutorial, guide, or reference page serves an explicit need and uses the right depth of explanation.

## 2. Persona Overview

| ID | Persona | Experience | Primary Goals | Pain Points |
|----|---------|------------|---------------|-------------|
| **BE-New** | New Backend Engineer (onboarding) | 0-3 weeks on WeBudget; 2–4 yrs general Node/Kotlin | *Spin up local stack, run tests, ship first PR* | Env-var sprawl, unclear DB migration steps |
| **BE-Maint** | Maintainer / Senior Backend Engineer | 6+ months on project | *Extend API, optimize queries, guide reviews* | Out-of-date architecture diagrams, missing error semantics |
| **BE-Ops** | Backend DevOps Hybrid (internal rotations) | Familiar with CI/CD, Docker, infra-as-code | *Debug staging issues, tweak compose stacks, manage secrets* | Hidden config nuances, duplicated setup docs |

## 3. Core Scenarios

| Scenario ID | Trigger | Persona(s) | Desired Outcome | Doc Entry Point |
|-------------|---------|------------|-----------------|-----------------|
| **S-01** | New hire clones repo | BE-New | All containers healthy in ≤ 15 min | `README.md` → *Quick Start* |
| **S-02** | Needs to add a new REST endpoint | BE-New, BE-Maint | Endpoint scaffolding + tests pass CI first-try | `docs/backend-development.md` → *API Patterns* |
| **S-03** | DB schema migration fails locally | BE-New | Identify cause and apply fix | `docs/deployment-and-ops.md` → *Troubleshooting DB* |
| **S-04** | Optimize slow query | BE-Maint | Get indexing checklist and profiling tips | `docs/performance-guide.md` |
| **S-05** | Rotate secret in staging | BE-Ops | Complete rotation with zero downtime | `docs/deployment-and-ops.md` → *Secrets Management* |

## 4. Usage Guidelines
* Start each new doc by picking a persona + scenario from above.  
* If your content serves multiple personas, use modular sections (`<details>` blocks) so readers can skip advanced parts.  
* Update this file whenever a new persona or scenario emerges.

---