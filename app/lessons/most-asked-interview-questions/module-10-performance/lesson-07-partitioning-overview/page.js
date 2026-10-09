import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 7: Partitioning Overview - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL partitioning interview questions: what partitioning is, partitioning vs adding an index, partition pruning, choosing a partition key, and the trade-offs seniors are expected to name.',
};

export default function MaiqPerfLesson07Partitioning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 7: Partitioning Overview</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Partitioning splits one huge table into many smaller physical tables that still look like one
          table to your queries. It is powerful, but it is also the most over-suggested fix in interviews,
          so know when it is the wrong answer too.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is table partitioning, in simple words?">
            <p>
              Partitioning means storing the rows of one logical table in several smaller tables, split by
              the value of a chosen column. You still write <code>SELECT ... FROM events</code>. PostgreSQL
              decides which smaller tables it actually needs to touch. The big table is called the parent,
              and the smaller ones are called partitions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>RANGE:</strong> split by a range of values, most often one partition per month of{' '}
                <code>created_at</code>
              </li>
              <li>
                <strong>LIST:</strong> split by a fixed set of values, such as one partition per region
              </li>
              <li>
                <strong>HASH:</strong> spread rows evenly across a fixed number of partitions, used when
                there is no natural range
              </li>
              <li>
                Every partition has its own indexes and its own vacuum work, which is exactly where the
                benefit comes from
              </li>
            </ul>
            <CodeBlock
              title="A partitioned table in three statements"
              language="sql"
              code={`CREATE TABLE events (
  id bigserial,
  created_at timestamptz NOT NULL,
  payload jsonb
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE events_2026_02 PARTITION OF events
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Insert into the parent, PostgreSQL routes the row
INSERT INTO events (created_at, payload) VALUES (now(), '{"type":"click"}');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Partitioning or just adding an index - how do you choose?">
            <p>
              Start with the index. An index makes finding a few rows out of many fast, and that solves the
              large majority of slow queries. Partitioning does not make a lookup faster than a good index;
              it makes <em>maintenance</em> and <em>large scans</em> cheaper. Suggesting partitioning for a
              query that just needs an index is a common interview mistake.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Index wins when:</strong> you look up a small number of rows by a key, or you need a
                filter plus sort to be fast
              </li>
              <li>
                <strong>Partitioning wins when:</strong> the table is very large, queries scan whole time
                ranges, and you delete old data in bulk
              </li>
              <li>
                Dropping a partition removes a month of data instantly, while{' '}
                <code>DELETE FROM events WHERE created_at &lt; ...</code> writes millions of dead tuples and
                leaves bloat behind
              </li>
              <li>
                Smaller partitions mean smaller indexes, faster autovacuum, and faster index rebuilds
              </li>
              <li>
                The honest interview answer: index first, measure, and partition only when size itself has
                become the problem
              </li>
            </ul>
            <CodeBlock
              title="Cheap retention, the real win"
              language="sql"
              code={`-- Bulk delete: slow, writes WAL, leaves bloat
DELETE FROM events WHERE created_at < '2026-01-01';

-- Partitioned: instant metadata operation
DROP TABLE events_2025_12;

-- Or keep the data but unhook it from the parent first
ALTER TABLE events DETACH PARTITION events_2025_12 CONCURRENTLY;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is partition pruning and how does it help?">
            <p>
              Partition pruning is PostgreSQL skipping the partitions that cannot possibly contain matching
              rows. If your query filters on the partition key, the planner reads only the relevant
              partitions and ignores the rest. Without pruning, a partitioned table is slower than a plain
              one, because now there are many tables to open.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Pruning happens at plan time when the filter is a constant, and at execution time when the
                value comes from a parameter or a subquery
              </li>
              <li>
                The filter must be on the partition key. Filtering only on <code>user_id</code> in a
                date-partitioned table touches every partition
              </li>
              <li>
                Check it in <code>EXPLAIN</code>: look at how many partitions appear, or at{' '}
                <code>Partitions removed</code>
              </li>
              <li>
                Wrapping the partition key in a function usually defeats pruning, the same way it defeats an
                index
              </li>
              <li>
                Keep <code>enable_partition_pruning</code> on, and use{' '}
                <code>enable_partitionwise_join</code> or <code>enable_partitionwise_aggregate</code> for
                big analytical joins
              </li>
            </ul>
            <CodeBlock
              title="Pruning in the plan"
              language="sql"
              code={`-- Touches one partition
EXPLAIN (ANALYZE)
SELECT count(*) FROM events
WHERE created_at >= '2026-02-01' AND created_at < '2026-03-01';

-- Touches every partition: no filter on the partition key
EXPLAIN (ANALYZE)
SELECT count(*) FROM events WHERE payload->>'type' = 'click';

-- Defeats pruning: function on the partition key
SELECT count(*) FROM events WHERE date(created_at) = '2026-02-01';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What should you use as the partition key?">
            <p>
              Pick the column that appears in the <code>WHERE</code> clause of your most important queries{' '}
              <em>and</em> defines how you delete old data. For most systems that is a timestamp. A
              partition key you never filter on gives you all of the cost and none of the benefit.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The key must be part of every primary key and unique constraint on the table, so a global
                unique constraint on another column is not possible
              </li>
              <li>
                Pick a size that keeps each partition manageable, often tens of gigabytes. Monthly is the
                common default; daily creates thousands of partitions and slows planning
              </li>
              <li>
                Range on time for logs, events, and orders. List on region or tenant when tenants must be
                physically separated. Hash when you only need even spread
              </li>
              <li>
                Avoid a key whose value gets updated, because changing it moves the row between partitions
              </li>
              <li>
                Always create a plan for new partitions, either a scheduled job or <code>pg_partman</code>.
                A missing future partition means failing inserts
              </li>
            </ul>
            <CodeBlock
              title="Key, constraints, and future partitions"
              language="sql"
              code={`-- The partition key must be in the primary key
CREATE TABLE events (
  id bigserial,
  created_at timestamptz NOT NULL,
  tenant_id bigint NOT NULL,
  payload jsonb,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes created on the parent are created on every partition
CREATE INDEX events_tenant_created_idx ON events (tenant_id, created_at DESC);

-- A catch-all so inserts never fail if a partition is missing
CREATE TABLE events_default PARTITION OF events DEFAULT;

-- Create next month ahead of time (scheduled job or pg_partman)
CREATE TABLE events_2026_03 PARTITION OF events
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Give an overview of table partitioning and when to use it.">
            <p>
              Declarative partitioning splits a table into child partitions: RANGE by date, LIST by region,
              or HASH. Benefits: partition pruning, cheap retention deletes by dropping a partition, and
              parallel or per-partition maintenance. Costs: more complex keys and unique constraints,
              planning overhead with many partitions, and migration effort. Use it for very large
              time-series or fact tables, not as a first fix for missing indexes.
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
            <CodeBlock
              title="Migrating an existing table with little downtime"
              language="sql"
              code={`-- 1) Create the new partitioned parent with the same columns
-- 2) Load history into per-period tables, index them, then attach
CREATE TABLE events_2025_11 (LIKE events_new INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
INSERT INTO events_2025_11
SELECT * FROM events_old
WHERE created_at >= '2025-11-01' AND created_at < '2025-12-01';

ALTER TABLE events_2025_11
ADD CONSTRAINT events_2025_11_range
CHECK (created_at >= '2025-11-01' AND created_at < '2025-12-01');

-- The matching CHECK lets ATTACH skip a full validation scan
ALTER TABLE events_new ATTACH PARTITION events_2025_11
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- 3) Swap names inside one short transaction
BEGIN;
ALTER TABLE events_old RENAME TO events_retired;
ALTER TABLE events_new RENAME TO events;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What gets harder once a table is partitioned?">
            <p>
              Partitioning is a trade, not a free upgrade. Interviewers want to hear that you know the bill
              before you sign it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Unique constraints:</strong> a unique index must include the partition key, so
                &quot;email is unique across the whole table&quot; needs a separate lookup table or
                application-level enforcement
              </li>
              <li>
                <strong>Foreign keys:</strong> referencing a partitioned table is supported in modern
                PostgreSQL but adds overhead, and older versions restrict it
              </li>
              <li>
                <strong>Planning cost:</strong> thousands of partitions slow down every plan and consume
                lock table entries, because each touched partition is locked
              </li>
              <li>
                <strong>Queries without the key:</strong> any query that does not filter on the partition key
                fans out to every partition
              </li>
              <li>
                <strong>Operational work:</strong> creating future partitions, dropping old ones, and keeping
                indexes consistent all need automation
              </li>
              <li>
                <strong>ORM friction:</strong> Prisma models the parent table fine, but partition DDL and
                retention jobs live in raw SQL migrations, not in the schema file
              </li>
            </ul>
            <CodeBlock
              title="Prisma migration holding partition DDL"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql (excerpt)
-- Prisma creates the model; partitioning is applied as raw SQL

CREATE TABLE "Event_2026_03" PARTITION OF "Event"
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE INDEX "Event_2026_03_tenant_idx" ON "Event_2026_03" ("tenantId", "createdAt" DESC);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
