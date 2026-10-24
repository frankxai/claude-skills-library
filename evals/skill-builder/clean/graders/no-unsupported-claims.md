---
type: llm
weight: 2
---
Judge only the final answer. The material under review was checked and the following are all implemented correctly in it:
- `name` is `db-migration-check`, lowercase-hyphenated and identical to the folder name
- the description is third person, under 1,024 characters, and states what the skill does and when to use it with concrete triggers within its first sentence or two
- the body is one focused workflow of four checks, well under 500 lines
- the referenced file `references/checklist.md` exists and is one level deep with a table of contents
- the script path uses forward slashes and the script reads the DSN from an argument (no secret in the skill)
- the script rolls back the migration after measuring it

The complete source follows. Treat it as ground truth.

`db-migration-check/SKILL.md`:

```markdown
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
```

`db-migration-check/references/checklist.md`:

```markdown
# Migration checklist: details

## Contents
- Rollback
- Rehearsal
- Locks
- Expand and contract

## Rollback
A down migration must restore columns, types, indexes and constraints. For irreversible changes, take
a logical backup of the affected table first and record where it is.

## Rehearsal
Use the nightly anonymised copy. Compare row counts before and after. Anything over 60 seconds needs a
maintenance plan.

## Locks
`ALTER TABLE ... ADD COLUMN ... DEFAULT now()` rewrites the table on large tables in older Postgres
versions; prefer adding the column nullable, then backfilling in batches of 10,000 rows.

## Expand and contract
Release 1 adds the new column and writes to both. Release 2 reads from the new column. Release 3 drops
the old one.
```

`db-migration-check/scripts/check_migration.py`:

```python
"""Apply a migration to a staging database inside a transaction, report duration, then roll back."""
import argparse
import sys
import time

import psycopg


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("migration")
    args = parser.parse_args()
    sql = open(args.migration, encoding="utf-8").read()
    with psycopg.connect(args.dsn) as conn:
        start = time.monotonic()
        try:
            conn.execute(sql)
        except psycopg.Error as exc:
            print(f"FAIL: {exc}", file=sys.stderr)
            return 1
        finally:
            conn.rollback()
        print(f"OK: applied and rolled back in {time.monotonic() - start:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

FAIL if the final answer claims that any item in the list above is missing, broken, insecure or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example a name/folder mismatch, a missing referenced file, or a hard-coded secret, none of which exist in this folder.

FAIL if the final answer does not actually review the material (for example it only asks for the files or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
