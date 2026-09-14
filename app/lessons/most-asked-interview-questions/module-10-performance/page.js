import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 10: Performance Optimization - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL performance interview questions: EXPLAIN ANALYZE, indexes, vacuum, N+1, Prisma select/include, partitioning, pooling — Junior to Senior.',
};

export default function Module10Performance() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 10: Performance Optimization</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 10 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is EXPLAIN ANALYZE and why use it?">
            <p>
              <code>EXPLAIN</code> shows the planner&apos;s chosen plan. <code>EXPLAIN ANALYZE</code> executes the
              query and reports actual timings and row counts. Compare estimated vs actual rows to find bad
              statistics, missing indexes, or unexpected seq scans.
            </p>
            <CodeBlock
              title="EXPLAIN ANALYZE"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 42;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Sequential scan vs index scan — when is each OK?">
            <p>
              A sequential scan reads the whole table — fine for small tables or when most rows match.
              An index scan / bitmap index scan uses an index to find rows — better for selective filters.
              PostgreSQL may correctly choose a seq scan even when an index exists if selectivity is low.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a B-tree index and when do you use it?">
            <p>
              B-tree is the default index type — ideal for equality and range comparisons
              (<code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code>).
              Most primary keys and foreign keys use B-tree.
            </p>
            <CodeBlock
              title="B-tree index"
              language="sql"
              code={`CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the N+1 query problem?">
            <p>
              Fetching a list (1 query) then querying related data per item (N queries). Common with ORMs when
              lazy-loading relations. Fix by joining, batching, or using Prisma <code>include</code>/
              <code>select</code> so relations load in fewer queries.
            </p>
            <CodeBlock
              title="Prisma: avoid N+1"
              language="typescript"
              code={`// Bad: findMany users, then find orders per user in a loop

// Better: one query graph
const users = await prisma.user.findMany({
  take: 50,
  include: { orders: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="select vs include in Prisma — performance angle?">
            <p>
              <code>include</code> loads full related models. <code>select</code> projects only needed fields and
              can nest relation selects — less data over the wire and often less work. Prefer <code>select</code>
              for hot paths; avoid fetching unused columns/relations.
            </p>
            <CodeBlock
              title="Lean select"
              language="typescript"
              code={`const orders = await prisma.order.findMany({
  where: { status: 'paid' },
  select: {
    id: true,
    totalCents: true,
    user: { select: { email: true } },
  },
  take: 100,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="B-tree vs GIN vs GiST — when do you pick each?">
            <p>
              <strong>B-tree</strong>: scalar equality/range. <strong>GIN</strong>: composite values — arrays,
              JSONB containment, full-text (<code>tsvector</code>), trigrams. <strong>GiST</strong>: ranges,
              geometry/PostGIS, some exclusion constraints, nearest-neighbor. Wrong index type means the planner
              cannot use it for your operator.
            </p>
            <CodeBlock
              title="GIN / GiST examples"
              language="sql"
              code={`CREATE INDEX posts_tags_gin ON posts USING GIN (tags);
CREATE INDEX events_payload_gin ON events USING GIN (payload jsonb_path_ops);
CREATE INDEX reservations_during_gist ON reservations USING GIST (during);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are covering indexes and INCLUDE?">
            <p>
              A covering index can satisfy a query without heap fetches (index-only scan). PostgreSQL&apos;s
              <code>INCLUDE</code> adds non-key columns stored in the index for coverage without affecting
              uniqueness/search order of the key columns.
            </p>
            <CodeBlock
              title="INCLUDE"
              language="sql"
              code={`CREATE INDEX orders_user_covering
ON orders (user_id)
INCLUDE (total_cents, status);

-- Helps: SELECT total_cents, status FROM orders WHERE user_id = $1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are partial indexes and why are they powerful?">
            <p>
              A partial index indexes only rows matching a <code>WHERE</code> predicate — smaller and faster when
              queries always include that filter (e.g., only “open” tickets, non-deleted rows).
            </p>
            <CodeBlock
              title="Partial index"
              language="sql"
              code={`CREATE INDEX orders_open_user_idx
ON orders (user_id)
WHERE status IN ('pending', 'paid');

CREATE UNIQUE INDEX users_active_email_uq
ON users (email)
WHERE deleted_at IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain VACUUM, autovacuum, and table bloat.">
            <p>
              MVCC leaves dead tuples after updates/deletes. <code>VACUUM</code> reclaims them for reuse;
              <code>VACUUM FULL</code> rewrites the table (exclusive lock — rare). Autovacuum runs this
              automatically. If vacuum lags, tables/indexes <strong>bloat</strong>, queries slow down, and
              transaction ID wraparound risk increases. Monitor <code>pg_stat_user_tables</code> dead tup ratios.
            </p>
            <CodeBlock
              title="Vacuum / stats"
              language="sql"
              code={`VACUUM (ANALYZE) orders;
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="List practical query optimization tips interviewers expect.">
            <p>
              Index foreign keys and common filter/sort columns; selective WHERE first; avoid
              <code>SELECT *</code> on wide tables; rewrite <code>OR</code> into <code>UNION ALL</code> when
              needed; prefer keyset pagination over huge <code>OFFSET</code>; keep statistics fresh
              (<code>ANALYZE</code>); avoid functions on indexed columns in WHERE that prevent index use; batch
              writes; use connection pooling.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is connection pooling important?">
            <p>
              Each PostgreSQL connection is memory-heavy. Apps with many serverless/Node workers can exhaust
              <code>max_connections</code>. Use PgBouncer (transaction pooling) or a pooler like Prisma Data Proxy /
              driver adapters. Size app pool × instances below DB max.
            </p>
            <CodeBlock
              title="Prisma datasource note"
              language="typescript"
              code={`// Prefer a pooler URL in production (PgBouncer)
// DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true"
// Direct URL for migrations:
// DIRECT_URL="postgresql://user:pass@primary:5432/db"`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Give an overview of table partitioning and when to use it.">
            <p>
              Declarative partitioning splits a table into child partitions (RANGE by date, LIST by region, HASH).
              Benefits: partition pruning, cheaper retention deletes (<code>DROP PARTITION</code>), parallel
              maintenance. Costs: more complex keys/unique constraints, planning overhead. Use for very large
              time-series/fact tables — not as a first fix for missing indexes.
            </p>
            <CodeBlock
              title="RANGE partitioning sketch"
              language="sql"
              code={`CREATE TABLE events (
  id bigserial,
  created_at timestamptz NOT NULL,
  payload jsonb
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you read EXPLAIN output for bottlenecks?">
            <p>
              Look for: large gaps between estimated and actual rows; high-cost sequential scans on large tables;
              nested loop joins with huge inner iterations; sort/hash spilling to disk; repeated heap fetches
              when an index-only scan was expected (visibility map / all-visible issues). Fix stats, indexes,
              rewrite joins, or increase <code>work_mem</code> carefully for sorts/hashes.
            </p>
            <CodeBlock
              title="Useful EXPLAIN options"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, SETTINGS, WAL)
SELECT u.email, COUNT(*)
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.email;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you diagnose and fix ORM/Prisma performance issues beyond N+1?">
            <p>
              Enable query logging; watch for over-fetching with <code>include</code>; use
              <code>select</code>; add composite indexes matching <code>where + orderBy</code>; prefer
              <code>updateMany</code>/raw SQL for bulk work; avoid interactive transactions that hold connections
              too long; use <code>$transaction</code> with appropriate isolation only when needed; consider
              cursor-based pagination.
            </p>
            <CodeBlock
              title="Composite index matching query"
              language="sql"
              code={`-- Prisma: where status + orderBy createdAt
CREATE INDEX orders_status_created_idx
ON orders (status, created_at DESC);`}
            />
            <CodeBlock
              title="Prisma cursor pagination"
              language="typescript"
              code={`const page = await prisma.order.findMany({
  where: { status: 'paid' },
  orderBy: { id: 'asc' },
  take: 50,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is an index-only scan, and what can block it?">
            <p>
              An index-only scan answers a query from the index alone. PostgreSQL still checks the visibility map;
              if pages are not all-visible, it heap-fetches. Frequent updates delay all-visible status until vacuum.
              Covering indexes + timely vacuum improve IOS rates.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you approach a slow production query end-to-end?">
            <p>
              Reproduce with realistic parameters; capture <code>EXPLAIN (ANALYZE, BUFFERS)</code>; verify indexes
              and <code>pg_stat_statements</code> tops; check lock waits and autovacuum lag; validate app-side
              N+1/pool exhaustion; ship the smallest fix (index/SQL rewrite) with a rollout plan; measure p95
              latency before/after. Avoid premature partitioning or huge hardware jumps without evidence.
            </p>
            <CodeBlock
              title="pg_stat_statements snapshot"
              language="sql"
              code={`SELECT
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
