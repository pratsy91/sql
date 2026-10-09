import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: VACUUM and Bloat - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL VACUUM interview questions: dead tuples, VACUUM vs ANALYZE, autovacuum, table bloat, why VACUUM FULL is dangerous, and transaction id wraparound.',
};

export default function MaiqPerfLesson04VacuumBloat() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: VACUUM and Bloat</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          PostgreSQL never overwrites a row in place. It writes a new version and leaves the old one
          behind. VACUUM is the cleanup job that collects the leftovers. If you understand this, you
          understand most PostgreSQL maintenance questions.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are dead tuples?">
            <p>
              A tuple is just PostgreSQL&apos;s word for one row version. When you UPDATE a row, PostgreSQL
              writes a brand new row version and marks the old one as no longer current. When you DELETE a
              row, it only marks it. Those leftover versions are dead tuples: they still take space on disk
              but no transaction can see them any more.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>This design is called MVCC, which lets readers and writers work without blocking</li>
              <li>An UPDATE of one column still creates a whole new row version</li>
              <li>
                Dead tuples cannot be removed while an older transaction might still need to see them, which
                is why long-running transactions are a problem
              </li>
              <li>
                <code>VACUUM</code> marks that space reusable so new rows can go there
              </li>
            </ul>
            <CodeBlock
              title="See dead tuples per table"
              language="sql"
              code={`SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between VACUUM and ANALYZE?">
            <p>
              They are two different jobs that often run together but solve different problems.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>VACUUM</strong> cleans up dead tuples so the space can be reused, and updates the
                visibility map that index-only scans depend on. It is about space and correctness of cleanup
              </li>
              <li>
                <strong>ANALYZE</strong> samples the table and updates the statistics the query planner uses
                to guess row counts. It is about choosing good plans
              </li>
              <li>
                A slow query right after a big data load is usually a missing <code>ANALYZE</code>, not a
                missing <code>VACUUM</code>
              </li>
              <li>
                A table that keeps growing on disk while row count stays flat is usually a{' '}
                <code>VACUUM</code> problem
              </li>
              <li>Autovacuum runs both automatically, each with its own trigger thresholds</li>
            </ul>
            <CodeBlock
              title="Running them"
              language="sql"
              code={`VACUUM orders;             -- clean up dead tuples only
ANALYZE orders;            -- refresh planner statistics only
VACUUM (ANALYZE) orders;   -- both in one pass
VACUUM (VERBOSE) orders;   -- print what it removed`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain VACUUM, autovacuum, and table bloat.">
            <p>
              MVCC leaves dead tuples after updates and deletes. <code>VACUUM</code> reclaims them for
              reuse; <code>VACUUM FULL</code> rewrites the table and takes an exclusive lock, so it is rare.
              Autovacuum runs this automatically in the background. If vacuum lags, tables and indexes{' '}
              <strong>bloat</strong>, queries slow down because they read more pages for the same rows, and
              transaction ID wraparound risk increases. Monitor dead tuple ratios in{' '}
              <code>pg_stat_user_tables</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Bloat means the table or index file is much bigger than the live data inside it
              </li>
              <li>
                Autovacuum triggers roughly when dead tuples pass{' '}
                <code>autovacuum_vacuum_threshold</code> plus a fraction of the table size
              </li>
              <li>
                On a big hot table the default fraction of 20 percent is far too lazy. Lower it per table
              </li>
              <li>
                Common causes of lag: long-running transactions, idle-in-transaction sessions, unused
                replication slots, and autovacuum cost limits that are too strict
              </li>
            </ul>
            <CodeBlock
              title="Vacuum / stats"
              language="sql"
              code={`VACUUM (ANALYZE) orders;
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;`}
            />
            <CodeBlock
              title="Tune autovacuum for one hot table"
              language="sql"
              code={`ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 2000,
  autovacuum_analyze_scale_factor = 0.01
);

-- Find the blockers that stop cleanup
SELECT pid, state, age(clock_timestamp(), xact_start) AS xact_age, query
FROM pg_stat_activity
WHERE state <> 'idle' AND xact_start IS NOT NULL
ORDER BY xact_start;

SELECT slot_name, active, restart_lsn FROM pg_replication_slots;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is VACUUM FULL dangerous in production?">
            <p>
              <code>VACUUM FULL</code> does give the disk space back to the operating system, but it does it
              by rewriting the whole table into a new file. While it runs it holds an{' '}
              <code>ACCESS EXCLUSIVE</code> lock, which blocks every read and every write on that table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                On a large table it can block your application for minutes or hours
              </li>
              <li>
                It needs free disk space roughly equal to the table plus its indexes, because both copies
                exist for a while
              </li>
              <li>
                It generates a lot of WAL, which means replication lag and bigger backups
              </li>
              <li>
                Plain <code>VACUUM</code> does not return space to the OS, but it does make the space
                reusable, which is usually all you need
              </li>
              <li>
                Better option for real bloat: <code>pg_repack</code>, which rebuilds the table with only
                short locks, or <code>REINDEX ... CONCURRENTLY</code> if the bloat is in the indexes
              </li>
            </ul>
            <CodeBlock
              title="Safer alternatives"
              language="sql"
              code={`-- Blocks everything on the table. Avoid on production hot paths.
VACUUM FULL orders;

-- Index bloat only, no long lock
REINDEX TABLE CONCURRENTLY orders;

-- Table bloat with short locks (extension, run from the shell)
-- pg_repack -d shop -t orders

-- Check how big the table and its indexes really are
SELECT
  pg_size_pretty(pg_table_size('orders')) AS table_size,
  pg_size_pretty(pg_indexes_size('orders')) AS indexes_size,
  pg_size_pretty(pg_total_relation_size('orders')) AS total_size;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Explain transaction id wraparound in one simple paragraph.">
            <p>
              Every transaction gets a number, and each row version records the transaction that created it.
              That number is 32 bits, so it can only count to about 4 billion before it runs out and has to
              start again. PostgreSQL decides whether a row is visible by comparing these numbers, so if the
              counter wrapped around freely, old rows would suddenly look like they came from the future and
              data would appear to vanish. To prevent that, VACUUM freezes old rows: it marks them as
              permanently visible so their transaction number no longer matters. If VACUUM cannot keep up,
              the database first starts screaming warnings, then refuses new writes and demands a
              single-user vacuum. In short, wraparound protection is the hard reason autovacuum is not
              optional.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Autovacuum starts a forced anti-wraparound vacuum when a table&apos;s age passes{' '}
                <code>autovacuum_freeze_max_age</code>, and that one cannot be skipped
              </li>
              <li>
                The usual real-world causes are the same blockers as bloat: a forgotten long transaction, an
                abandoned replication slot, or a prepared transaction nobody committed
              </li>
              <li>
                Monitor the oldest transaction age per database and alert long before the limit
              </li>
              <li>
                PostgreSQL 16 and newer make this cheaper by skipping already frozen pages, but the limit
                still exists
              </li>
            </ul>
            <CodeBlock
              title="Monitor wraparound risk"
              language="sql"
              code={`-- How close each table is to needing a forced freeze
SELECT
  c.relname,
  age(c.relfrozenxid) AS xid_age,
  current_setting('autovacuum_freeze_max_age') AS freeze_max_age
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'm') AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY age(c.relfrozenxid) DESC
LIMIT 10;

-- Database level view
SELECT datname, age(datfrozenxid) AS xid_age FROM pg_database ORDER BY xid_age DESC;

-- Things that hold back freezing
SELECT gid, prepared FROM pg_prepared_xacts;
SELECT slot_name, active FROM pg_replication_slots WHERE NOT active;

-- Manual catch-up on a specific table
VACUUM (FREEZE, VERBOSE) big_table;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
