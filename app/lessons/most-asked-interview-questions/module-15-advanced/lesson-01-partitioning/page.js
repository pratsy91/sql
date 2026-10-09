import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Partitioning - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL partitioning interview questions: why partition, RANGE LIST and HASH, partition pruning, attach and detach, partitioning vs indexing, primary keys on partitioned tables, and lifecycle management.',
};

export default function Module15Lesson01Partitioning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Partitioning</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Partitioning splits one big table into several smaller physical tables while your queries still see
          a single table. Interviewers care less about the syntax and more about whether you know when it
          helps, when it does not, and who creates next month&apos;s partition.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is table partitioning and why use it?">
            <p>
              You declare a <strong>parent</strong> table that holds no data itself, and PostgreSQL stores the
              rows in <strong>partitions</strong> (child tables) chosen by a column such as a date, a tenant, or
              a hash. Your application keeps inserting into and selecting from the parent, and PostgreSQL
              routes the rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Faster queries</strong>: a query for last week only reads last week&apos;s partition and
                skips the rest.
              </li>
              <li>
                <strong>Cheap deletion</strong>: dropping a partition removes a month of data instantly.{' '}
                <code>DELETE</code> on a billion rows is slow and leaves bloat behind.
              </li>
              <li>
                <strong>Easier maintenance</strong>: <code>VACUUM</code>, <code>ANALYZE</code>, and index builds
                work on one manageable chunk at a time.
              </li>
              <li>
                <strong>Best fit</strong>: large time-series data such as events, logs, and metrics, or large
                multi-tenant fact tables.
              </li>
              <li>
                <strong>Bad fit</strong>: small tables. Under a few million rows partitioning usually adds
                complexity and no speed.
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Should you partition, or would an index be enough?"
          >
            <p>
              Reach for an index first. Partitioning is not a general performance fix, and proposing it for a
              slow query is a common wrong answer.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>An index</strong> makes finding a few rows out of many fast. That covers the large
                majority of slow queries and costs you nothing structurally.
              </li>
              <li>
                <strong>Partitioning</strong> helps when the table is so large that maintenance is the real
                problem: index builds take hours, autovacuum cannot keep up, deleting old data locks things up,
                or the index no longer fits comfortably in memory.
              </li>
              <li>
                A well-indexed 50 million row table is usually fine unpartitioned. If queries only ever touch
                recent data, a smaller partial index can beat partitioning with far less complexity.
              </li>
              <li>
                Partitioning can even make things <em>worse</em>: queries without the partition key must check
                every partition, and planning time grows with partition count.
              </li>
            </ul>
            <p>
              The decision rule to say out loud: partition when the dominant pain is <strong>data lifecycle
              and maintenance at scale</strong>, index when the pain is <strong>finding rows</strong>. They are
              complements, not alternatives, and a partitioned table still needs indexes.
            </p>
            <CodeBlock
              title="Try the cheap option first"
              language="sql"
              code={`-- Slow: SELECT * FROM events WHERE created_at > now() - interval '7 days'
CREATE INDEX events_created_at_idx ON events (created_at DESC);

-- Even smaller, if you only ever query recent rows
CREATE INDEX events_recent_idx ON events (created_at DESC)
  WHERE created_at > '2026-01-01';

-- Check the real problem before redesigning
SELECT pg_size_pretty(pg_total_relation_size('events')) AS total,
       (SELECT count(*) FROM events) AS rows;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain RANGE, LIST, and HASH partitioning.">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>RANGE</strong>: each partition owns a continuous span of values, such as one month of
                dates. The lower bound is included and the upper bound excluded, so adjacent partitions never
                overlap. This is by far the most common choice.
              </li>
              <li>
                <strong>LIST</strong>: each partition owns a specific set of values, such as a region code or a
                tenant tier. Use it when the key has a small, known set of values.
              </li>
              <li>
                <strong>HASH</strong>: PostgreSQL hashes the key and spreads rows evenly across a fixed number
                of partitions. Use it when there is no natural range but you want to break up a hot table.
              </li>
            </ul>
            <p>
              Add a <code>DEFAULT</code> partition to RANGE and LIST so an unexpected value does not fail the
              insert. Note the trade-off: a default partition blocks some later <code>ATTACH</code> operations,
              because PostgreSQL must scan it to prove no misplaced rows exist.
            </p>
            <CodeBlock
              title="RANGE partitioning"
              language="sql"
              code={`CREATE TABLE events (
  id         BIGSERIAL,
  created_at TIMESTAMPTZ NOT NULL,
  payload    JSONB NOT NULL,
  PRIMARY KEY (id, created_at)          -- must include the partition key
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_09 PARTITION OF events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE events_2026_10 PARTITION OF events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE events_default PARTITION OF events DEFAULT;`}
            />
            <CodeBlock
              title="LIST and HASH"
              language="sql"
              code={`-- LIST: a known set of values per partition
CREATE TABLE customers (
  id     BIGSERIAL,
  region TEXT NOT NULL,
  name   TEXT NOT NULL,
  PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE customers_eu PARTITION OF customers FOR VALUES IN ('DE', 'FR', 'ES');
CREATE TABLE customers_us PARTITION OF customers FOR VALUES IN ('US', 'CA');
CREATE TABLE customers_other PARTITION OF customers DEFAULT;

-- HASH: even spread, no natural ranges
CREATE TABLE sessions (
  id      UUID NOT NULL,
  user_id UUID NOT NULL,
  PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Partition pruning: what should candidates know?">
            <p>
              Pruning is the planner skipping partitions that cannot possibly contain matching rows. It is the
              whole reason partitioning speeds up reads, and it only works if your <code>WHERE</code> clause
              lets PostgreSQL compare against the partition boundaries.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Filter on the partition key.</strong> No partition key in the query means every
                partition is scanned.
              </li>
              <li>
                <strong>Do not wrap the key in a function.</strong>{' '}
                <code>WHERE date_trunc(&apos;month&apos;, created_at) = ...</code> hides the range and defeats
                pruning. Write a plain range comparison instead.
              </li>
              <li>
                <strong>Two kinds of pruning</strong>: plan-time, which uses constants, and run-time, which
                handles parameters and values only known during execution. Run-time pruning appears in{' '}
                <code>EXPLAIN ANALYZE</code> as &quot;Subplans Removed&quot;.
              </li>
              <li>
                <strong>Verify, never assume.</strong> Read <code>EXPLAIN</code> and count the partitions
                actually scanned.
              </li>
              <li>
                Keep partition count sensible. Thousands of partitions make planning slow even with perfect
                pruning.
              </li>
            </ul>
            <CodeBlock
              title="Pruning that works and pruning that does not"
              language="sql"
              code={`-- Good: a plain range on the partition key. One partition is scanned.
EXPLAIN (ANALYZE, COSTS OFF)
SELECT count(*) FROM events
WHERE created_at >= '2026-09-01' AND created_at < '2026-10-01';

-- Bad: the key is inside a function, so no pruning happens
EXPLAIN (COSTS OFF)
SELECT count(*) FROM events
WHERE date_trunc('month', created_at) = '2026-09-01';

-- Bad: no partition key at all, so every partition is read
EXPLAIN (COSTS OFF) SELECT * FROM events WHERE payload @> '{"type":"login"}';

SHOW enable_partition_pruning;   -- should be on`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you attach and detach a partition?">
            <p>
              <code>ATTACH</code> brings an existing standalone table in as a partition.{' '}
              <code>DETACH</code> removes a partition and leaves it as an independent table with its data
              intact. Together they are how you load and archive data without touching live rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Attach validates.</strong> PostgreSQL must prove every row fits the new bounds, which
                means a full scan holding a strong lock. Add a matching <code>CHECK</code> constraint first and
                PostgreSQL trusts it and skips the scan.
              </li>
              <li>
                <strong>The table must match</strong>: identical columns, types, and order, and no extra
                columns.
              </li>
              <li>
                <strong>Use CONCURRENTLY where possible.</strong> PostgreSQL 14 added{' '}
                <code>DETACH PARTITION ... CONCURRENTLY</code>, which avoids blocking queries on the parent.
              </li>
              <li>
                <strong>Detach then drop</strong> is the safe archive pattern: detach, back it up or move it to
                cold storage, then drop it. A direct <code>DROP TABLE</code> on a partition is instant and
                irreversible.
              </li>
              <li>
                Indexes on the parent are created on attached partitions automatically, but building them at
                attach time is slow. Create them on the standalone table first.
              </li>
            </ul>
            <CodeBlock
              title="Attach without a full scan"
              language="sql"
              code={`-- 1. Build the table standalone, load it, and index it
CREATE TABLE events_2026_11 (LIKE events INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
-- bulk load here
CREATE INDEX ON events_2026_11 (created_at DESC);

-- 2. Prove the bounds up front so ATTACH skips the validation scan
ALTER TABLE events_2026_11 ADD CONSTRAINT events_2026_11_range
  CHECK (created_at >= '2026-11-01' AND created_at < '2026-12-01');

-- 3. Attach: fast, because the CHECK already guarantees the range
ALTER TABLE events ATTACH PARTITION events_2026_11
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

-- 4. The redundant CHECK can now go
ALTER TABLE events_2026_11 DROP CONSTRAINT events_2026_11_range;`}
            />
            <CodeBlock
              title="Detach for archival"
              language="sql"
              code={`-- PostgreSQL 14+: does not block readers on the parent
ALTER TABLE events DETACH PARTITION events_2025_01 CONCURRENTLY;

-- Now an ordinary table: archive it, then remove it
-- pg_dump -t events_2025_01 shop > events_2025_01.sql
DROP TABLE events_2025_01;

-- What partitions exist right now?
SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bounds
FROM pg_class c
JOIN pg_inherits i ON i.inhrelid = c.oid
WHERE i.inhparent = 'events'::regclass
ORDER BY c.relname;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do indexes and primary keys work on partitioned tables?"
          >
            <p>
              The rule that catches everyone: <strong>a unique constraint or primary key on a partitioned table
              must include every partition key column</strong>. PostgreSQL enforces uniqueness inside each
              partition using that partition&apos;s own index, and it has no way to check across partitions. So
              a plain <code>PRIMARY KEY (id)</code> on a table partitioned by <code>created_at</code> is
              rejected.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Consequence</strong>: your key becomes composite, such as{' '}
                <code>PRIMARY KEY (id, created_at)</code>. Two rows could then share an <code>id</code> in
                different partitions, so use a UUID or a shared sequence to keep ids globally unique in
                practice.
              </li>
              <li>
                <strong>Foreign keys pointing at a partitioned table</strong> must reference that full composite
                key, which often means adding the partition key column to the child table. Foreign keys{' '}
                <em>from</em> a partitioned table to a normal table work fine.
              </li>
              <li>
                <strong>Indexes on the parent cascade.</strong> Creating an index on the parent creates a
                matching one on every partition, and on future ones too. On a big table create each
                partition&apos;s index <code>CONCURRENTLY</code> and then attach it to a parent index declared{' '}
                <code>ON ONLY</code>, so you never take a long lock.
              </li>
              <li>
                <code>CREATE INDEX CONCURRENTLY</code> is not supported directly on a partitioned parent, which
                is exactly why the two-step pattern exists.
              </li>
            </ul>
            <CodeBlock
              title="Composite key, and a lock-free index rollout"
              language="sql"
              code={`-- Rejected: the partition key is missing from the key
-- CREATE TABLE events (id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL)
--   PARTITION BY RANGE (created_at);
-- ERROR: unique constraint on partitioned table must include partition key

-- Correct: composite key including the partition key
CREATE TABLE events (
  id         BIGSERIAL,
  created_at TIMESTAMPTZ NOT NULL,
  user_id    UUID NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Adding an index later without blocking writes:
-- 1. Parent-only index, no partitions touched yet
CREATE INDEX events_user_idx ON ONLY events (user_id);

-- 2. Each partition, concurrently
CREATE INDEX CONCURRENTLY events_2026_09_user_idx ON events_2026_09 (user_id);
CREATE INDEX CONCURRENTLY events_2026_10_user_idx ON events_2026_10 (user_id);

-- 3. Attach them, which marks the parent index valid
ALTER INDEX events_user_idx ATTACH PARTITION events_2026_09_user_idx;
ALTER INDEX events_user_idx ATTACH PARTITION events_2026_10_user_idx;

SELECT indexrelid::regclass, indisvalid FROM pg_index
WHERE indrelid = 'events'::regclass;`}
            />
            <CodeBlock
              title="Prisma with a partitioned table"
              language="prisma"
              code={`// Prisma cannot declare PARTITION BY, so the table is created in raw SQL
// inside a migration. The model then describes the resulting shape.
model Event {
  id        BigInt   @default(autoincrement())
  createdAt DateTime @map("created_at")
  userId    String   @map("user_id") @db.Uuid
  payload   Json

  @@id([id, createdAt])
  @@index([userId])
  @@map("events")
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you manage partitions over time in PostgreSQL 15 to 17?"
          >
            <p>
              Partitioning is not a one-off DDL change, it is an ongoing job. The failure mode is specific and
              brutal: nobody created next month&apos;s partition, and at midnight every insert fails because no
              partition accepts the row. Automating creation is the whole answer to this question.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Create ahead of time.</strong> Keep several future partitions ready, not one. Run the
                job daily so a single failed run cannot cause an outage.
              </li>
              <li>
                <strong>Automate it</strong> with <code>pg_partman</code>, <code>pg_cron</code>, or an external
                scheduler. <code>pg_partman</code> also handles retention and pre-creating indexes.
              </li>
              <li>
                <strong>A DEFAULT partition is a safety net, not a plan.</strong> It stops inserts failing, but
                rows land in the wrong place and you then cannot attach the correct partition without moving
                them.
              </li>
              <li>
                <strong>Retention by detach and drop</strong>, never by <code>DELETE</code>. Detach
                concurrently, archive, then drop.
              </li>
              <li>
                <strong>Version notes</strong>: declarative partitioning arrived in PostgreSQL 10;
                PostgreSQL 11 added default partitions and automatic index creation; 12 and 13 sharply improved
                planning with many partitions; 14 added <code>DETACH CONCURRENTLY</code>; 15 through 17
                continued improving pruning, parallel joins, and per-partition maintenance. The composite-key
                constraint still stands in 17.
              </li>
              <li>
                <strong>Monitor</strong>: alert if the newest partition&apos;s upper bound is less than some
                days away, and alert if the default partition is non-empty.
              </li>
            </ul>
            <CodeBlock
              title="Self-maintaining monthly partitions"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION ensure_event_partitions(months_ahead INT DEFAULT 3)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  start_month DATE;
  i INT;
  part_name TEXT;
BEGIN
  FOR i IN 0..months_ahead LOOP
    start_month := date_trunc('month', now())::date + (i || ' months')::interval;
    part_name := 'events_' || to_char(start_month, 'YYYY_MM');

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF events FOR VALUES FROM (%L) TO (%L)',
        part_name,
        start_month,
        start_month + interval '1 month'
      );
      RAISE NOTICE 'Created partition %', part_name;
    END IF;
  END LOOP;
END;
$$;

-- Run it daily so one failure is never fatal
-- SELECT cron.schedule('partitions', '0 3 * * *', 'SELECT ensure_event_partitions(3)');`}
            />
            <CodeBlock
              title="Retention, and alerting on the gap"
              language="sql"
              code={`-- Archive anything older than 24 months
ALTER TABLE events DETACH PARTITION events_2024_09 CONCURRENTLY;
-- archive, then:
DROP TABLE events_2024_09;

-- How far ahead are we covered? Alert if this drops below ~14 days.
SELECT max(
         (regexp_replace(pg_get_expr(c.relpartbound, c.oid),
            '.*TO \\(''([0-9-]+).*', '\\1'))::date
       ) - current_date AS days_of_headroom
FROM pg_class c
JOIN pg_inherits i ON i.inhrelid = c.oid
WHERE i.inhparent = 'events'::regclass;

-- Rows that fell into DEFAULT are a bug: investigate immediately
SELECT count(*) FROM events_default;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
