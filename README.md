# Wise Bloom Care

A premium, privacy-first **Mother & Child Health platform** that preserves **one continuous health record** across the entire family journey — from conception, through pregnancy, delivery, and newborn care, into infancy, toddlerhood, and beyond.

> **Design-first.** This repository is the complete **architecture and product documentation set** for Wise Bloom Care. Per the project's working method, the platform is fully designed before production features are implemented. It contains architecture and documentation only — no application code yet.

- **Domain:** care.wisehomeopathy.com
- **Founding thesis:** one journey, one linked record — the mother's pregnancy timeline and the child's growth timeline are two views of a single family record. At delivery, the baby profile is created automatically and permanently linked to the mother. No reset, no migration, no duplicates.
- **Safety:** the product **educates, never diagnoses**; content is typed Educational / Clinical Recommendation / Emergency Warning and never mixed; every medical statement is sourced.

## Documentation map (`docs/`)

| Section | Contents |
|---|---|
| `00-Vision` | Vision, manifesto, mission, principles, brand, glossary |
| `01-Product` | PRD, scope, feature matrix, modules, roadmap, milestones, release plan, non-goals, risk register |
| `02-Research` | WHO / ACOG / FIGO / NICE, immunization, WHO growth, CDC milestones, references, medical disclaimer (cited) |
| `03-UX` | Personas, journeys, IA, navigation, dashboard, design system, components, color, typography, iconography, accessibility, responsive |
| `04-Architecture` | System, frontend, backend, Apps Script, Sheets schema, data model, API spec, auth, security, folder structure, deployment, domains, backup, logging, monitoring |
| `05-Data` | Data dictionary, ERD, field specs, validation, retention, audit logs, import/export, versioning |
| `06-Modules` | 18 module specifications (auth → settings), incl. the delivery-transition keystone |
| `07-AI` | AI architecture, knowledge base, prompt library, RAG, prediction engine, guardrails, OCR, voice |
| `08-Timeline` | Pregnancy, delivery transition, postpartum, baby, vaccine, development timelines |
| `09-Security` | Threat model, encryption, sessions, access control, secrets, incident response, privacy, terms |
| `10-Testing` | Test plan, cases, manual, UAT, performance, security/AI-safety, regression |
| `11-Development` | Coding standards, contributing, git workflow, branch strategy, commits, PR template, DoD, changelog |
| `12-Operations` | Runbook, backup/restore, disaster recovery, maintenance, support guide |
| `13-Future` | V2, V3, long-term vision, ideas, backlog |
| `ADR/` | ADR-001 Google Sheets · 002 Apps Script · 003 Astro · 004 Auth · 005 AI · 006 Domains |

## Knowledge base (`knowledge-base/`)

Independent, versioned medical/educational content that feeds both direct education and AI (RAG): pregnancy weeks `week01`–`week40`, plus category folders (delivery, newborn, growth, milestones, vaccination, nutrition, exercise, emergency, medicines). Every item is typed and sourced; unverified specifics are marked `[VERIFY]` and must be confirmed against a primary source before user display.

## Initial technical stack (per design)

Astro · React · TypeScript · Tailwind CSS · Chart.js (frontend) · Google Apps Script (backend, v1) · private Google Sheets (storage, v1, behind a swappable adapter). The architecture is deliberately modular so the backend can migrate to PostgreSQL / Supabase / Firebase / Cloud SQL **without a frontend rewrite** (the API contract is the boundary).

## Start here

`docs/00-Vision/00-VISION.md` → `docs/01-Product/10-PRD.md` → `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md`.
