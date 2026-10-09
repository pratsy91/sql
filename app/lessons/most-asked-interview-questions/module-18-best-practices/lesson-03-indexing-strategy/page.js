import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Indexing Strategy - Module 18 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL indexing strategy interview questions: a sensible baseline, indexing foreign keys, composite index column order, measuring with EXPLAIN before adding an index, finding and dropping unused indexes, and reviewing indexes after an incident.',
};

export default function M18L3IndexingStrategy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Indexing Strategy</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          An index is a sorted copy of some columns that lets PostgreSQL find rows without reading the whole
          table. Every index speeds up some reads and slows down every write, so the skill is deciding which ones
          earn their keep.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a sensible baseline indexing strategy?">
            <p>
              Start from the queries, not the tables. A good baseline covers the lookups every application does,
              and nothing more.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Primary keys are indexed automatically, and so is every <code>UNIQUE</code> constraint
              </li>
              <li>Index foreign key columns that you join or filter on — PostgreSQL does not do this for you</li>
              <li>
                Index columns that appear in frequent <code>WHERE</code> clauses, in <code>ORDER BY</code>, and in
                single-row lookups
              </li>
              <li>
                Prefer one composite index that matches a real query pattern over several single-column indexes
              </li>
              <li>
                Do not index every column. Each index means more work per write, a bigger write-ahead log, slower
                bulk loads and more disk
              </li>
            </ul>
            <CodeBlock
              title="Common indexes"
              language="sql"
              code={`CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

-- Composite: filter by user, then sort by date
CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);

-- Partial: only index the rows you actually query
CREATE INDEX orders_pending_idx ON orders (created_at)
WHERE status = 'pending';`}
            />
            <p>
              That last one is worth remembering. A <strong>partial index</strong> has a{' '}
              <code>WHERE</code> clause and only stores matching rows. If 99% of orders are not pending, the index
              is 1% of the size, which makes it far cheaper to maintain and more likely to stay in memory.
            </p>
            <CodeBlock
              title="The same indexes in Prisma"
              language="typescript"
              code={`model Order {
  id        BigInt   @id @default(autoincrement())
  userId    Int
  status    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
}`}
            />
            <p>
              A number worth knowing: as a rough guide, if a query needs more than roughly 5 to 10% of a table,
              PostgreSQL will often choose a sequential scan anyway, because reading pages in order is faster than
              jumping around. So an index on a low-variety column such as a boolean flag usually does nothing,
              unless it is a partial index on the rare value.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Does PostgreSQL index foreign key columns automatically?"
          >
            <p>
              No. It indexes the parent side, because the referenced column must be a primary key or unique. The
              child column gets nothing. This surprises people coming from MySQL with InnoDB, which does create
              the index for you.
            </p>
            <p>Missing that index hurts in three separate ways:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Joining child to parent, or filtering children by parent (<code>WHERE order_id = 5</code>), has to
                scan the child table
              </li>
              <li>
                Deleting or updating a parent row makes PostgreSQL check the child table for references. With no
                index that is a full scan of the child per deleted parent row, which turns a small delete into a
                long lock
              </li>
              <li>
                <code>ON DELETE CASCADE</code> has the same problem, multiplied by the depth of the tree
              </li>
            </ul>
            <CodeBlock
              title="Add the index with the foreign key"
              language="sql"
              code={`CREATE TABLE order_items (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku      TEXT NOT NULL,
  qty      INT NOT NULL
);

-- Not automatic. Do it yourself.
CREATE INDEX order_items_order_id_idx ON order_items (order_id);`}
            />
            <CodeBlock
              title="Find foreign keys with no index"
              language="sql"
              code={`SELECT c.conrelid::regclass AS child_table,
       a.attname               AS fk_column
FROM pg_constraint c
JOIN unnest(c.conkey) AS k(attnum) ON true
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND i.indkey[0] = k.attnum
  )
ORDER BY 1, 2;`}
            />
            <p>
              Prisma has the same gap: declaring <code>@relation</code> creates the constraint, not the index. You
              still write <code>@@index([orderId])</code>. The exception is a one-to-one relation, where the{' '}
              <code>@unique</code> already gives you an index.
            </p>
            <CodeBlock
              title="Prisma: relation plus index"
              language="typescript"
              code={`model OrderItem {
  id      BigInt @id @default(autoincrement())
  orderId BigInt
  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="How do you choose the column order in a composite index?"
          >
            <p>
              A composite index is sorted by the first column, then the second within each value of the first, like
              a phone book sorted by surname then first name. You can look up all the Smiths, but you cannot look
              up everyone called John.
            </p>
            <p>
              That gives the <strong>left prefix rule</strong>: an index on{' '}
              <code>(a, b, c)</code> can serve queries that filter on <code>a</code>, on <code>a</code> and{' '}
              <code>b</code>, or on all three. It cannot efficiently serve a query that filters only on{' '}
              <code>b</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Put equality columns first, then the range or sort column last</li>
              <li>
                A range condition ends the useful part of the index, so nothing after it can be used for further
                filtering
              </li>
              <li>
                If the index ends with the <code>ORDER BY</code> column in the matching direction, PostgreSQL can
                skip the sort step entirely
              </li>
              <li>
                Among equality columns, order does not matter much for matching, but putting the more selective
                one first usually gives a smaller scan
              </li>
            </ul>
            <CodeBlock
              title="Order follows the query"
              language="sql"
              code={`-- The query we must support
SELECT id, total
FROM orders
WHERE tenant_id = $1
  AND status = 'paid'
  AND created_at >= $2
ORDER BY created_at DESC
LIMIT 20;

-- Right: equality columns first, range/sort column last
CREATE INDEX orders_tenant_status_created_idx
  ON orders (tenant_id, status, created_at DESC);

-- Wrong: the range column comes first, so status cannot be used to seek
CREATE INDEX orders_created_tenant_status_idx
  ON orders (created_at DESC, tenant_id, status);`}
            />
            <p>
              Two consequences worth mentioning. First, <code>(tenant_id, status, created_at)</code> also serves
              queries that filter on <code>tenant_id</code> alone, so a separate index on{' '}
              <code>tenant_id</code> is redundant and should be dropped. Second, PostgreSQL can read any B-tree
              index backwards, so a single index supports both <code>ASC</code> and <code>DESC</code>; direction
              only matters when you mix them, such as <code>ORDER BY a ASC, b DESC</code>.
            </p>
            <CodeBlock
              title="INCLUDE for a covering index"
              language="sql"
              code={`-- total is not used for searching, only returned.
-- INCLUDE stores it in the leaf pages so the query never touches the table.
CREATE INDEX orders_tenant_created_incl_idx
  ON orders (tenant_id, created_at DESC) INCLUDE (total);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you measure whether an index is needed before adding it?"
          >
            <p>
              You run the real query with <code>EXPLAIN (ANALYZE, BUFFERS)</code> and read the plan.{' '}
              <code>EXPLAIN</code> alone shows the plan and estimates; <code>ANALYZE</code> actually runs the query
              and shows real times and row counts; <code>BUFFERS</code> shows how many pages were read.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Seq Scan</strong> on a large table with a selective filter is the classic signal
              </li>
              <li>
                Compare <code>rows=</code> (the estimate) with <code>actual rows</code>. A large gap means the
                planner has bad statistics, and the fix may be <code>ANALYZE</code> rather than an index
              </li>
              <li>
                A <code>Rows Removed by Filter</code> count in the thousands means you read a lot of rows to
                return a few
              </li>
              <li>
                An explicit <code>Sort</code> node with a high cost often disappears if the index ends with the
                sort column
              </li>
            </ul>
            <CodeBlock
              title="Measure, change, measure again"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total FROM orders
WHERE tenant_id = 42 AND status = 'paid'
ORDER BY created_at DESC LIMIT 20;

-- Before: Seq Scan on orders, Rows Removed by Filter: 1,204,338

CREATE INDEX orders_tenant_status_created_idx
  ON orders (tenant_id, status, created_at DESC);
ANALYZE orders;

-- After: Index Scan using orders_tenant_status_created_idx, no Sort node`}
            />
            <p>
              There is a way to test a candidate index without paying to build it on a huge table: create it inside
              a transaction, run <code>EXPLAIN</code>, then roll back. DDL is transactional in PostgreSQL, so the
              index disappears. This still does the build work, so use it on a copy of production, not the live
              primary.
            </p>
            <CodeBlock
              title="Try an index and throw it away"
              language="sql"
              code={`BEGIN;
CREATE INDEX tmp_test_idx ON orders (tenant_id, status, created_at DESC);
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM orders WHERE tenant_id = 42 AND status = 'paid'
ORDER BY created_at DESC LIMIT 20;
ROLLBACK;`}
            />
            <p>
              Also check the write side before you commit to it. Run your heaviest insert or update path and
              compare timings, and check the index size with{' '}
              <code>pg_size_pretty(pg_relation_size(&apos;...&apos;))</code>. An index that adds 30% to your bulk
              load in exchange for a query nobody runs hourly is a bad trade.
            </p>
            <CodeBlock
              title="Find the queries worth optimising at all"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT calls,
       round(mean_exec_time::numeric, 2) AS avg_ms,
       round(total_exec_time::numeric)   AS total_ms,
       left(query, 80) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;`}
            />
            <p>
              Order by total time, not average. A query that takes 5ms but runs a million times a day costs more
              than a nightly report that takes 30 seconds.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you find and safely drop unused indexes?"
          >
            <p>
              PostgreSQL counts how many times each index was used in{' '}
              <code>pg_stat_user_indexes</code>. An index with zero scans after a full business cycle is a
              candidate for removal.
            </p>
            <CodeBlock
              title="Unused and duplicate indexes"
              language="sql"
              code={`-- Never scanned, and not backing a constraint
SELECT s.relname            AS table_name,
       s.indexrelname       AS index_name,
       s.idx_scan           AS scans,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- Redundant: one index is a left prefix of another
SELECT a.indexrelid::regclass AS narrow,
       b.indexrelid::regclass AS wide
FROM pg_index a
JOIN pg_index b
  ON a.indrelid = b.indrelid
 AND a.indexrelid <> b.indexrelid
 AND array_to_string(b.indkey, ' ') LIKE array_to_string(a.indkey, ' ') || '%'
WHERE NOT a.indisunique;`}
            />
            <p>Before you drop anything, check these four things:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Statistics are per server and reset on <code>pg_stat_reset()</code> or a major upgrade. Check{' '}
                <code>stats_reset</code> in <code>pg_stat_database</code> so you know the window is long enough
              </li>
              <li>
                Check the replicas too. A read replica may serve a reporting query that never touches the primary,
                and index usage counters are per node
              </li>
              <li>
                Never drop a unique index that backs a constraint by accident; drop the constraint instead if the
                rule is truly gone
              </li>
              <li>Monthly and quarterly jobs mean the window has to be longer than a month</li>
            </ul>
            <p>
              The safe way to remove one is to make it invisible first. PostgreSQL has no &quot;invisible
              index&quot; feature, but you can mark it invalid so the planner ignores it while the definition
              stays, then drop it later if nothing breaks.
            </p>
            <CodeBlock
              title="Soft disable, then drop"
              language="sql"
              code={`-- Planner stops using it, definition is still there
UPDATE pg_index SET indisvalid = false
WHERE indexrelid = 'orders_old_idx'::regclass;

-- Re-enable if something regresses
UPDATE pg_index SET indisvalid = true
WHERE indexrelid = 'orders_old_idx'::regclass;

-- Finally, without a long lock
DROP INDEX CONCURRENTLY orders_old_idx;`}
            />
            <p>
              Editing a system catalogue directly is a blunt instrument and needs superuser, so treat it as an
              incident tool rather than routine practice. Always use{' '}
              <code>DROP INDEX CONCURRENTLY</code> for the real removal: the plain form takes an
              AccessExclusiveLock on the table and blocks every query against it.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Describe a pragmatic indexing review process after a production incident."
          >
            <p>
              The goal is a small, defensible change, not a rewrite. Work from evidence at every step.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Pull the top query digests from <code>pg_stat_statements</code> for the incident window, ordered by
                total execution time
              </li>
              <li>
                Run <code>EXPLAIN (ANALYZE, BUFFERS)</code> on the worst ones. Look for sequential scans on large
                tables, high shared block reads, and estimates far from actual rows
              </li>
              <li>
                Propose the minimal composite index that matches the filter plus the sort. Resist adding four
                indexes to fix one query
              </li>
              <li>
                Check the write impact on the same table, and check whether the new index makes an existing one
                redundant
              </li>
              <li>
                Deploy with <code>CREATE INDEX CONCURRENTLY</code>, then watch p95 latency, the connection pool
                and replication lag during the rollout
              </li>
              <li>
                Revisit after one or two weeks: compare <code>idx_scan</code> against index size, and drop the
                experiments that nothing used
              </li>
            </ul>
            <p>
              Two things that are often the real fix instead of an index. Stale statistics, cured by{' '}
              <code>ANALYZE</code> or by raising the statistics target on a skewed column. And table bloat from a
              long-running transaction, where the table is physically huge but mostly dead rows; an index will not
              help until vacuum can catch up.
            </p>
            <CodeBlock
              title="Build the index without blocking writes"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY orders_user_created_idx
ON orders (user_id, created_at DESC);

-- CONCURRENTLY cannot run inside a transaction block.
-- If it fails it leaves an INVALID index behind, so check and clean up:
SELECT indexrelid::regclass AS name
FROM pg_index WHERE NOT indisvalid;

DROP INDEX CONCURRENTLY orders_user_created_idx;

-- Watch progress on a big table
SELECT phase, blocks_done, blocks_total
FROM pg_stat_progress_create_index;`}
            />
            <CodeBlock
              title="Statistics and skew"
              language="sql"
              code={`ANALYZE orders;

-- Give the planner more detail on a skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

-- Teach it that two columns are correlated
CREATE STATISTICS orders_tenant_status_stat (dependencies)
  ON tenant_id, status FROM orders;
ANALYZE orders;`}
            />
            <p>
              Finish the incident with a written note: the query, the plan before, the index added, the plan after,
              and the measured p95 change. That note is what stops someone re-adding the index you dropped six
              months later.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
