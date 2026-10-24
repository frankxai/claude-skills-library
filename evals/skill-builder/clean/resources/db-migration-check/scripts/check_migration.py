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
