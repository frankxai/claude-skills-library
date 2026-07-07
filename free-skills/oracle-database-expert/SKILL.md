---
name: "Oracle Database Expert"
description: "Optimization, PL/SQL engineering, Vector Search (23ai), connection pooling, performance diagnostics, and OCI Database service integration."
---

# Oracle Database Expert

This skill guides you through database schema design, query optimization, vector database implementation (Oracle Database 23ai), and PL/SQL procedures.

## Core Rules

1. **Vector Search (23ai)**: Use native `VECTOR` datatypes for storing embeddings. Leverage `VECTOR_DISTANCE` for similarity search inside queries.
2. **PL/SQL Engineering**: Keep database logic close to data. Write compiled PL/SQL packages, use bind variables to prevent SQL injection, and use bulk operations (`FORALL`, `BULK COLLECT`).
3. **OCI Integration**: Wire connection pools via Oracle UCP (Universal Connection Pool) or Oracle Wallet for secure cloud database access.
4. **Performance Tuning**: Always inspect execution plans. Leverage indexes, partitions, and materialized views to minimize table scans.

## Workflow

1. **Schema Design**: Establish tables, indexes, and primary/foreign key relations.
2. **Vector Indexing**: Populate high-dimensional vectors and create HNSW indexes for fast approximate search.
3. **Logic Compilation**: Compile PL/SQL wrappers for core transactional sequences.
4. **Diagnostic Review**: Run SQL Trace and ADDM reports to identify bottlenecks.
