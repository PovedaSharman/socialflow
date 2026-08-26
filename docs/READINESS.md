# Release readiness report

Status: **not production-ready**  
Assessment date: 26 August 2026

## Verified

- Empty starting directory and absence of prior Git metadata.
- Exact import of upstream Postiz `v2.23.0` into the root.
- Presence of the documented monorepo components and baseline feature code.

## Not yet verified

- Compatible local runtime, dependency install, migrations and full service startup.
- Registration-to-onboarding journey and email delivery.
- Tenant isolation and role matrix under adversarial tests.
- Provider OAuth using a controlled documented test provider.
- Retry-safe scheduled publishing.
- Scoped MCP creation/use/revocation and immediate-publish default denial.
- Stripe test checkout, portal and webhook lifecycle.
- GDPR export/deletion, audit completeness, backup restore and monitoring.
- WCAG AA automation, keyboard review, responsive visual review and production builds.

## External blockers

Production domains/infrastructure, social platform apps and approvals, email domain, Stripe account/mode decision, object storage, monitoring destinations, legal/privacy decisions and operational ownership.

This report must be updated with commands, test artefacts and dates; code presence alone is not evidence.
