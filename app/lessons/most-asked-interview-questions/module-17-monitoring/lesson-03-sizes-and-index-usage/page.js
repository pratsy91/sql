import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Sizes, Cache and Index Usage - Module 17 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on table and index sizes, pg_relation_size vs pg_total_relation_size, finding the biggest tables, cache hit ratio, index usage statistics, and estimating bloat',
};

export default function MaiqM17L03SizesAndIndexUsage() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Sizes, Cache and Index Usage</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Where the disk is going, whether your data fits in memory, and which indexes are earning their
          keep.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you check table and index sizes in PostgreSQL?">
            <CodeBlock
              title="Relation sizes"
              language="sql"
              code={`SELECT relname AS name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
       pg_size_pretty(pg_relation_size(c.oid)) AS table_only,
       pg_size_pretty(pg_indexes_size(c.oid)) AS indexes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- Single object
SELECT pg_size_pretty(pg_total_relation_size('public.orders'));`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>pg_relation_size</code> is the main heap, while{' '}
                <code>pg_total_relation_size</code> is the heap plus TOAST plus indexes
              </li>
              <li>Sudden growth usually means bloat, missing cleanup, or unexpected write volume</li>
              <li>
                <code>pg_size_pretty</code> just formats the byte count into something readable, so sort by
                the raw function, not by the pretty string
              </li>
              <li>
                In psql the shortcuts <code>\dt+</code> and <code>\di+</code> show sizes without writing any
                query
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is the difference between pg_relation_size and pg_total_relation_size?"
          >
            <p>
              A table is not one file. PostgreSQL stores the rows in a heap, oversized values in a side table
              called TOAST, and each index separately. The two functions measure different parts of that.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>pg_relation_size:</strong> the main heap only, which is the row data itself
              </li>
              <li>
                <strong>pg_table_size:</strong> the heap plus TOAST plus the free space map and visibility
                map, but no indexes
              </li>
              <li>
                <strong>pg_indexes_size:</strong> every index on the table added together
              </li>
              <li>
                <strong>pg_total_relation_size:</strong> everything, so table size plus index size. This is
                what you actually free by dropping the table
              </li>
              <li>
                TOAST matters more than people expect. A table with big text or JSONB columns can have a small
                heap and a huge TOAST table, which makes the heap number look misleadingly healthy
              </li>
              <li>
                If total is much larger than the heap, your indexes are the story. Having index bytes exceed
                table bytes is common and often means there are indexes nobody uses
              </li>
            </ul>
            <CodeBlock
              title="Breaking one table down"
              language="sql"
              code={`SELECT pg_size_pretty(pg_relation_size('orders'))       AS heap_only,
       pg_size_pretty(pg_table_size('orders'))          AS heap_plus_toast,
       pg_size_pretty(pg_indexes_size('orders'))        AS all_indexes,
       pg_size_pretty(pg_total_relation_size('orders')) AS everything;`}
            />
            <CodeBlock
              title="Seeing the TOAST table on its own"
              language="sql"
              code={`SELECT c.relname AS table_name,
       pg_size_pretty(pg_relation_size(c.oid))   AS heap,
       pg_size_pretty(pg_relation_size(t.oid))   AS toast
FROM pg_class c
LEFT JOIN pg_class t ON t.oid = c.reltoastrelid
WHERE c.relkind = 'r' AND c.relname = 'events';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you find the biggest tables in a database?">
            <p>
              Order by <code>pg_total_relation_size</code> and look at the top twenty. This is normally the
              first query anyone runs when a disk alert fires.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use <code>pg_class</code> joined to <code>pg_namespace</code> so you can filter by schema and
                skip system tables
              </li>
              <li>
                Include partitions and materialised views by widening the <code>relkind</code> filter, since a
                partitioned parent reports as empty on its own
              </li>
              <li>
                Watch growth, not just size. A table that doubled this week matters more than a large table
                that has been flat for a year, so store these numbers daily
              </li>
              <li>
                Include the row count from <code>pg_stat_user_tables</code>. Big table with few live rows
                means bloat, big table with many rows means you need archiving or partitioning
              </li>
              <li>
                Also check whole database size, and remember WAL and replication slots live outside your
                tables but still fill the same disk
              </li>
            </ul>
            <CodeBlock
              title="Top tables with row counts"
              language="sql"
              code={`SELECT n.nspname AS schema,
       c.relname AS table,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
       pg_size_pretty(pg_indexes_size(c.oid))        AS indexes,
       s.n_live_tup AS live_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE c.relkind IN ('r', 'p', 'm')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="Database level and the things outside your tables"
              language="sql"
              code={`SELECT datname, pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- a stale replication slot can hold WAL forever and fill the disk
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the cache hit ratio, and what is a good value?">
            <p>
              It is the share of block reads that were served from the PostgreSQL shared buffer cache instead
              of going to the operating system or the disk. On a healthy transactional database it should sit
              above ninety nine percent.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>heap_blks_hit</code> counts blocks found in shared buffers, and{' '}
                <code>heap_blks_read</code> counts blocks that had to be fetched. The ratio is hits divided by
                hits plus reads
              </li>
              <li>
                A drop usually means one of three things: the working set outgrew{' '}
                <code>shared_buffers</code>, a large query swept the cache, or a missing index turned point
                lookups into sequential scans
              </li>
              <li>
                Important caveat: a read is not always a disk read. The operating system has its own page
                cache, so a low PostgreSQL ratio can still be fast. Confirm with actual disk input and output
                metrics before buying more memory
              </li>
              <li>
                Look at it per table, not only globally. One cold archive table dragging the number down is a
                very different problem from your hottest table missing
              </li>
              <li>
                It is a trend metric, not an alert on its own. Alert on latency and disk input and output, and
                use the ratio to explain why they moved
              </li>
              <li>
                <code>shared_buffers</code> is typically set to around twenty five percent of the machine
                memory, leaving the rest for the operating system cache
              </li>
            </ul>
            <CodeBlock
              title="Cache hit ratio, overall and per table"
              language="sql"
              code={`SELECT
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS hit_ratio
FROM pg_statio_user_tables;

SELECT relname,
       heap_blks_hit,
       heap_blks_read,
       round(100.0 * heap_blks_hit /
             nullif(heap_blks_hit + heap_blks_read, 0), 2) AS hit_pct
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 10000
ORDER BY hit_pct ASC
LIMIT 15;`}
            />
            <CodeBlock
              title="Index cache, and the sequential scan smell"
              language="sql"
              code={`SELECT sum(idx_blks_hit) /
       nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) AS index_hit_ratio
FROM pg_statio_user_indexes;

-- big tables being scanned end to end
SELECT relname, seq_scan, seq_tup_read, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > 100000
ORDER BY seq_tup_read DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What index usage stats should you check before dropping an index?"
          >
            <CodeBlock
              title="Unused and low use indexes"
              language="sql"
              code={`SELECT s.relname AS table,
       i.relname AS index,
       pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes ui
JOIN pg_class i ON i.oid = ui.indexrelid
JOIN pg_class s ON s.oid = ui.relid
ORDER BY idx_scan ASC, pg_relation_size(i.oid) DESC
LIMIT 30;`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An <code>idx_scan</code> of zero over a long period may mean the index is unused, but first
                confirm the statistics were not reset and that the index is not there for a rare but critical
                path such as a monthly report
              </li>
              <li>Unique and primary key indexes protect data integrity even when scans are low</li>
              <li>
                Check every replica too. A read replica serving analytics may be the only place that index is
                used, and its statistics are separate
              </li>
              <li>
                Look for duplicates and prefixes as well as unused ones. An index on the first column of
                another index is usually redundant
              </li>
              <li>
                Safer than dropping: mark it invisible by setting <code>indisvalid</code> to false is not
                supported, so the practical approach is to drop it inside a transaction you can roll back, or
                keep the CREATE INDEX statement ready to rebuild CONCURRENTLY
              </li>
              <li>
                Remember the cost of keeping it. Every index slows down inserts, updates, and deletes, and it
                consumes cache space that your hot data wants
              </li>
            </ul>
            <CodeBlock
              title="Reset the counters so the window is honest"
              language="sql"
              code={`SELECT pg_stat_reset();
-- wait a full business cycle, including month end reports, then check again

SELECT relname, idx_scan, stats_reset
FROM pg_stat_user_indexes ui
JOIN pg_stat_database d ON d.datname = current_database()
LIMIT 5;`}
            />
            <CodeBlock
              title="Duplicate and redundant indexes"
              language="sql"
              code={`SELECT indrelid::regclass AS table,
       array_agg(indexrelid::regclass) AS same_columns
FROM pg_index
GROUP BY indrelid, indkey
HAVING count(*) > 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you estimate table and index bloat?">
            <p>
              Bloat is the space a table or index occupies that no longer holds live data. PostgreSQL never
              overwrites a row in place. An update writes a new version and leaves the old one behind, and
              vacuum only marks that space reusable, it does not give it back to the operating system.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A quick first signal is dead tuples in <code>pg_stat_user_tables</code>. When dead tuples are
                a large fraction of live tuples, vacuum is not keeping up
              </li>
              <li>
                A more accurate estimate compares actual size against the size the rows should need, based on
                average row width and the number of live rows. That is what the well known bloat queries do,
                and what tools like pgstattuple measure exactly at the cost of a full scan
              </li>
              <li>
                Treat all of these as estimates. Roughly twenty percent bloat is normal and healthy, since
                free space gets reused. Chasing a small number is wasted effort
              </li>
              <li>
                Common causes: long running transactions holding back the vacuum horizon, autovacuum tuned too
                gently for a hot table, mass updates and deletes, and abandoned replication slots
              </li>
              <li>
                <strong>Fixing table bloat:</strong> plain VACUUM only makes space reusable. VACUUM FULL
                rewrites the table and returns the space but takes an exclusive lock, so it is offline
                surgery. <code>pg_repack</code> does the same rewrite online and is the production answer
              </li>
              <li>
                <strong>Fixing index bloat:</strong> REINDEX CONCURRENTLY rebuilds an index without blocking
                writes. Index bloat is usually worse than table bloat on heavily updated tables
              </li>
              <li>
                <strong>Preventing it</strong> beats fixing it: tune autovacuum per hot table, keep
                transactions short, and use partitioning so old data is dropped rather than deleted
              </li>
            </ul>
            <CodeBlock
              title="Quick signal from dead tuples"
              language="sql"
              code={`SELECT relname,
       n_live_tup,
       n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="Rough estimate from average row width"
              language="sql"
              code={`SELECT c.relname,
       pg_size_pretty(pg_relation_size(c.oid)) AS actual_size,
       pg_size_pretty(
         (s.n_live_tup * (SELECT sum(avg_width) FROM pg_stats
                          WHERE schemaname = 'public' AND tablename = c.relname))::bigint
       ) AS rough_needed
FROM pg_class c
JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE c.relkind = 'r' AND s.n_live_tup > 10000
ORDER BY pg_relation_size(c.oid) DESC
LIMIT 15;`}
            />
            <CodeBlock
              title="Exact measurement and the fixes"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgstattuple;
SELECT * FROM pgstattuple('orders');        -- exact, but scans the table
SELECT * FROM pgstatindex('orders_pkey');

-- index rebuild without blocking writes
REINDEX INDEX CONCURRENTLY orders_pkey;

-- table rewrite: offline
VACUUM FULL orders;

-- table rewrite: online, needs the pg_repack extension
-- pg_repack --table=orders --no-superuser-check mydb`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
