# Habesha Ride v2.0 – Contribution & Git Workflow Guide

This document outlines the **Git branching strategy**, **code contribution workflow**, and **standards** the team must follow.

---

## The Golden Rules

Because this is a **private repository** on a free GitHub plan, we cannot automatically enforce branch protection (e.g., “require 1 approval”).  
Our workflow relies entirely on **team discipline**.

- **NEVER** push directly to `main`, `staging`, or `develop`.  
  All work must be done on a **feature branch**.
- **ALL** new code must be added to `develop` via a **Pull Request (PR)**.
- **NEVER** merge your own Pull Request until the other developer has **reviewed and approved** it.

---

## 1. Branching Strategy

We use a **“Gitflow-Lite”** model with three permanent branches:

### `main`

- **Purpose:** Production code. The official “live” version of our app.
- **Rule:** This branch is sacred — it only receives merges from `staging` after successful testing.

### `staging`

- **Purpose:** Pre-production testing. Deployed to our testing server for final QA.
- **Rule:** Only receives merges from `develop` when a release is ready for testing.

### `develop`

- **Purpose:** Main integration branch — our team’s workbench.
- **Rule:** Always stable and runnable. All feature branches merge into this.

---

## 2. Branch Naming Conventions

All new work (features, fixes, etc.) must be done on a **temporary branch** created from `develop`.

| Type          | When to Use                                             | Example                                       |
| ------------- | ------------------------------------------------------- | --------------------------------------------- |
| **feature/**  | Adding new features or functionality                    | `git checkout -b feature/auth-controller`     |
| **fix/**      | Fixing a bug in `develop` or `staging`                  | `git checkout -b fix/login-password-hash-bug` |
| **refactor/** | Improving structure or performance (no behavior change) | `git checkout -b refactor/user-model-cleanup` |
| **chore/**    | Repo maintenance, configs, or docs                      | `git checkout -b chore/update-readme`         |
| **docs/**     | Writing or updating documentation                       | `git checkout -b docs/add-contribution-guide` |

---

## 3. Step-by-Step Contribution Workflow

Follow these steps **for every new task**.

### **Step 1: Start Your Task**

Before coding, pull the latest `develop` and create your branch.
