---
name: db-migration-check
description: Checks Postgres migrations for rollback, lock and deploy risks. Use when writing, reviewing or merging a database migration (ALTER TABLE, CREATE INDEX, column renames or drops), or when a deploy includes schema changes.
---

# Database migration check

Run these four checks on every migration before it merges. Report each as pass or fail with the
evidence (file and line, or command output).

1. **Rollback exists.** The migration has a down step that restores the previous schema. If it
   cannot (data-destroying drops), say so and require a backup step instead.
2. **Rehearsed on production-sized data.** Run it against the latest anonymised production copy:
   `python scripts/check_migration.py --dsn "$STAGING_DSN" path/to/migration.sql`. Record the duration.
3. **No long locks on large tables.** For tables over 1 million rows: create indexes with
   `CREATE INDEX CONCURRENTLY`, add columns without volatile defaults, and backfill in batches.
4. **Works with old and new code.** The running app version must work with the new schema during the
   deploy window. Renames and drops go in two releases: expand (add, dual-write), then contract.

Details and examples for each check: [references/checklist.md](references/checklist.md).

If any check fails, stop and report; do not apply the migration.
