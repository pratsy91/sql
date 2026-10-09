import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Bulk Loads and COPY - Module 5 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on bulk data loading in PostgreSQL: COPY vs INSERT speed, staging tables, batching large deletes, why one huge transaction is risky, write concurrency at scale, and Prisma bulk write pitfalls.',
};

export default function M5L4BulkLoadsAndCopy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Bulk Loads and COPY</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Writing one row is easy. Writing ten million rows while the site stays up is a design question,
          and it is the part senior interviews focus on.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is COPY and when do you use it?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>COPY</code> bulk-loads or exports data efficiently (CSV/binary)</li>
              <li>Much faster than thousands of single-row inserts</li>
              <li><code>COPY ... FROM STDIN</code> used by drivers and tools; server-side <code>FROM &apos;file&apos;</code> needs filesystem access and superuser-level rights</li>
              <li><code>\\copy</code> in psql runs client-side and is preferred for local files</li>
              <li>It still respects constraints, triggers, and foreign keys, so it is not a way to sneak in bad data</li>
              <li>One bad line aborts the whole <code>COPY</code>, so load into a staging table and validate there</li>
            </ul>
            <CodeBlock
              title="COPY examples"
              language="sql"
              code={`COPY staging_users (email, name)
FROM STDIN WITH (FORMAT csv, HEADER true);

\\copy products FROM 'products.csv' WITH (FORMAT csv, HEADER true);

COPY orders TO STDOUT WITH (FORMAT csv, HEADER true);

-- Export the result of a query, not a whole table
COPY (
  SELECT id, email FROM users WHERE created_at >= current_date - 7
) TO STDOUT WITH (FORMAT csv, HEADER true);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is COPY faster than INSERT, and how much faster?">
            <p>
              Expect something like ten times faster than batched multi-row inserts, and far more than that
              against single-row inserts in a loop. The reason is how much work each row costs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>One insert per row:</strong> each row is its own statement, its own parse and plan, its own network round trip, and if autocommit is on, its own commit and disk flush. That last part dominates</li>
              <li><strong>Multi-row insert:</strong> amortises parsing and round trips across the batch. A big improvement already</li>
              <li><strong>COPY:</strong> one statement, a streaming protocol with no per-row parsing, and internal fast paths for building rows and pages. Indexes and triggers are still paid per row</li>
              <li>Rough shape of the numbers on ordinary hardware: single inserts with autocommit are thousands of rows per second, multi-row inserts are tens of thousands, <code>COPY</code> is hundreds of thousands</li>
              <li>So the ranking is: <code>COPY</code>, then multi-row <code>INSERT</code>, then <code>INSERT ... SELECT</code> for in-database work, and single-row inserts last</li>
              <li>What slows any of them down is the same list: indexes, foreign keys, and row triggers. That is why big loads often drop secondary indexes first and rebuild them after</li>
            </ul>
            <CodeBlock
              title="Load fast, then rebuild"
              language="sql"
              code={`-- An UNLOGGED staging table skips WAL: fastest possible landing zone
CREATE UNLOGGED TABLE staging_events (LIKE events INCLUDING DEFAULTS);

\\copy staging_events FROM 'events.csv' CSV HEADER;

-- Drop secondary indexes on the target, load, then rebuild
DROP INDEX IF EXISTS events_user_id_idx;

INSERT INTO events SELECT * FROM staging_events;

CREATE INDEX CONCURRENTLY events_user_id_idx ON events (user_id);

-- Make the planner aware of the new data
ANALYZE events;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What bulk insert patterns are commonly asked?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Multi-row <code>INSERT INTO t VALUES (...), (...), (...)</code></li>
              <li><code>INSERT ... SELECT</code> from staging tables</li>
              <li><code>COPY</code> for very large loads</li>
              <li>Batch size trade-off: fewer round-trips vs memory and lock duration</li>
              <li><code>unnest()</code> of arrays, which keeps the parameter count at two no matter how many rows you send</li>
            </ul>
            <CodeBlock
              title="Multi-row insert"
              language="sql"
              code={`INSERT INTO events (user_id, event_type)
VALUES
  (1, 'login'),
  (1, 'view'),
  (2, 'login');`}
            />
            <CodeBlock
              title="Prisma createMany"
              language="typescript"
              code={`await prisma.event.createMany({
  data: [
    { userId: 1, eventType: 'login' },
    { userId: 1, eventType: 'view' },
    { userId: 2, eventType: 'login' },
  ],
  skipDuplicates: true, // ON CONFLICT DO NOTHING style when unique would collide
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does Prisma skipDuplicates do?">
            <ul className="list-disc pl-6 space-y-1">
              <li>On <code>createMany</code>, maps to ignoring unique conflicts (PostgreSQL: <code>ON CONFLICT DO NOTHING</code>)</li>
              <li>Does not update existing rows — use <code>upsert</code> or raw SQL for true upserts in bulk</li>
              <li><code>createMany</code> does not return created rows on most databases; on PostgreSQL use <code>createManyAndReturn</code> when you need them</li>
              <li>Duplicates <em>inside</em> the same batch are also skipped, so the count you get back can be lower than the array length</li>
              <li>The count is your only feedback, so you cannot tell which rows were skipped</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you design bulk loads without hurting live traffic?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Load into a staging UNLOGGED/temp table, validate, then insert into live tables</li>
              <li>Batch commits; avoid one multi-hour transaction (vacuum/xmin horizon issues)</li>
              <li>Drop/disable nonessential indexes during huge loads, then rebuild (with care)</li>
              <li>Watch WAL volume, autovacuum, and replication lag on replicas</li>
              <li>Throttle: a short pause between batches lets autovacuum and the replicas catch up, and keeps the disk from saturating</li>
              <li>Run <code>ANALYZE</code> after the load so the planner does not keep using stale statistics</li>
              <li>Make the job resumable and idempotent — track the last batch you finished, and use <code>ON CONFLICT DO NOTHING</code> so a retry is harmless</li>
            </ul>
            <CodeBlock
              title="Staging then promote"
              language="sql"
              code={`CREATE TABLE staging_users (LIKE users INCLUDING DEFAULTS);

\\copy staging_users (email, name) FROM 'users.csv' CSV HEADER;

INSERT INTO users (email, name)
SELECT email, name FROM staging_users
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Why is one huge transaction risky?">
            <p>
              A transaction that runs for hours does not just take a long time. It holds back
              cleanup for the entire database while it runs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Bloat:</strong> autovacuum cannot remove any dead row newer than your open transaction, because your snapshot might still need it. The whole database accumulates bloat, not just your table</li>
              <li><strong>Locks held to the end:</strong> every lock you take is kept until commit or rollback, so migrations and other writers queue behind you</li>
              <li><strong>Rollback cost:</strong> if it fails at 95%, you lose everything and start over. Hours of work gone, and the rollback itself takes time</li>
              <li><strong>Replication lag:</strong> the commit ships one enormous burst of WAL, and replicas fall behind at the worst moment</li>
              <li><strong>Resource use:</strong> subtransactions, deferred constraint checks, and trigger queues all grow in memory</li>
              <li><strong>No progress visibility:</strong> nothing is visible to anyone else until commit, so you cannot monitor how far along it is</li>
              <li>Fix: many small committed batches, with a bookmark so the job can resume. Accept that the overall operation is no longer atomic and design each batch to be safe to repeat</li>
            </ul>
            <CodeBlock
              title="Resumable batched backfill"
              language="sql"
              code={`-- Run this repeatedly; each call is its own short transaction
WITH batch AS (
  SELECT id FROM orders
  WHERE tier IS NULL
  ORDER BY id
  LIMIT 5000
)
UPDATE orders o
SET tier = c.tier
FROM batch b
JOIN customers c ON c.id = o.customer_id
WHERE o.id = b.id
RETURNING o.id;

-- Stop when the returned row count is 0`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you delete millions of rows without locking up the database?">
            <p>
              Never as one statement. Delete in small batches, each in its own transaction, with a pause
              between them.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A single giant <code>DELETE</code> holds row locks on everything it touches, writes a huge amount of WAL, and leaves a mountain of dead rows for autovacuum</li>
              <li>Batch by primary key or by time range so each statement uses an index and finishes in well under a second</li>
              <li>Loop until the affected row count is zero, and sleep briefly between batches so autovacuum and replicas keep up</li>
              <li>If you are deleting most of the table, it is often faster to copy the rows you keep into a new table, then swap names. That also reclaims disk space immediately</li>
              <li>If the data is time-based, partition it and just <code>DROP</code> or detach old partitions. That turns a huge delete into an instant metadata change — this is the answer interviewers hope for</li>
              <li><code>DELETE</code> does not return disk to the operating system. Expect to <code>VACUUM</code>, or rewrite the table, if space matters</li>
            </ul>
            <CodeBlock
              title="Batched delete loop"
              language="sql"
              code={`-- One batch: short, index-driven, own transaction
DELETE FROM events
WHERE id IN (
  SELECT id FROM events
  WHERE created_at < now() - interval '90 days'
  ORDER BY id
  LIMIT 10000
);
-- Repeat while row count > 0, with a short sleep between runs`}
            />
            <CodeBlock
              title="Better: partition by month and drop"
              language="sql"
              code={`CREATE TABLE events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL,
  payload    JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Retention becomes instant, with no dead rows and almost no WAL
DROP TABLE events_2026_01;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What concurrency issues appear with UPDATE/DELETE at scale?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Row-level locks: two transactions updating the same row queue or abort on serialization failures</li>
              <li>Hot rows (counters, inventory) become bottlenecks — consider queues, sharding keys, or advisory locks</li>
              <li><code>SELECT ... FOR UPDATE SKIP LOCKED</code> for worker job claims</li>
              <li>Idempotent retries for transient unique violations and deadlocks</li>
              <li>Deadlocks usually come from two jobs touching the same rows in different orders. Sort every batch by primary key before writing and most of them disappear</li>
              <li>Set a <code>lock_timeout</code> on background jobs so a stuck job fails fast instead of blocking the queue behind it</li>
            </ul>
            <CodeBlock
              title="SKIP LOCKED job claim"
              language="sql"
              code={`BEGIN;
SELECT id FROM jobs
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

UPDATE jobs SET status = 'running', locked_at = now()
WHERE id = $1
RETURNING *;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What Prisma write pitfalls do seniors call out?">
            <ul className="list-disc pl-6 space-y-1">
              <li>N+1 writes in loops — prefer <code>createMany</code>, transactions, or raw bulk SQL</li>
              <li><code>upsert</code> is not always optimal under heavy contention; know SQL <code>ON CONFLICT</code></li>
              <li>Interactive transactions (<code>prisma.$transaction(async tx =&gt; ...)</code>) hold connections — keep them short with poolers</li>
              <li>Use <code>$transaction([...])</code> sequential batching for independent writes when appropriate</li>
              <li>There is no bulk upsert and no streaming <code>COPY</code> in the client, so genuinely large loads belong in raw SQL or a dedicated loader</li>
              <li>Default transaction timeouts are short (a few seconds). A big backfill inside <code>$transaction</code> will be cancelled; run it as batched statements instead</li>
              <li>Connection limits: serverless functions each open a pool, so use a pooler and keep write transactions short</li>
            </ul>
            <CodeBlock
              title="Prisma interactive transaction"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({
    data: { userId: 1, total: 42.5 },
  });
  await tx.inventory.update({
    where: { productId: 10 },
    data: { qty: { decrement: 1 } },
  });
  return order;
});`}
            />
            <CodeBlock
              title="Batched backfill instead of one transaction"
              language="typescript"
              code={`let processed = 0;
for (;;) {
  const rows = await prisma.order.findMany({
    where: { tier: null },
    select: { id: true },
    orderBy: { id: 'asc' },
    take: 5000,
  });
  if (rows.length === 0) break;

  await prisma.order.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { tier: 'standard' },
  });

  processed += rows.length;
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
