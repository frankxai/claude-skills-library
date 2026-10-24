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
