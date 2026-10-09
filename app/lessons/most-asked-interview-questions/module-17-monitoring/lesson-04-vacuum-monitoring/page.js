import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Vacuum Monitoring - Module 17 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on VACUUM and autovacuum monitoring: dead tuples, last_autovacuum, wraparound age, what to watch, and tuning autovacuum for a hot table',
};

export default function MaiqM17L04VacuumMonitoring() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Vacuum Monitoring</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          PostgreSQL leaves old row versions behind on every update and delete. Vacuum cleans them up, and
          watching it is one of the few maintenance jobs you cannot ignore.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is VACUUM and why does PostgreSQL need it?">
            <p>
              PostgreSQL never changes a row in place. An update writes a new version of the row and marks the
              old one as no longer current. A delete just marks the row. Those leftover versions are dead
              tuples, and VACUUM is the job that cleans them up.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                This design is called MVCC, multi version concurrency control. It is why readers never block
                writers in Postgres, and the leftover rows are the price you pay for that
              </li>
              <li>
                Plain VACUUM marks the dead space as reusable by future inserts. It does not shrink the file
                on disk
              </li>
              <li>
                VACUUM FULL rewrites the whole table and does return space to the operating system, but it
                takes an exclusive lock, so no one can use the table while it runs
              </li>
              <li>
                ANALYZE is the related job. It updates the statistics the planner uses to choose between an
                index scan and a sequential scan
              </li>
              <li>
                Autovacuum is a background process that runs both automatically. It is on by default and you
                should leave it on. Turning it off is how databases die slowly
              </li>
              <li>
                Vacuum also updates the visibility map, which is what makes fast index only scans possible
              </li>
            </ul>
            <CodeBlock
              title="Running it by hand"
              language="sql"
              code={`VACUUM orders;             -- reclaim space for reuse
VACUUM ANALYZE orders;     -- reclaim and refresh planner statistics
VACUUM (VERBOSE) orders;   -- print what it actually did

ANALYZE orders;            -- statistics only, very cheap

SHOW autovacuum;           -- should be on`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a dead tuple, and how do you check the dead tuple count?">
            <p>
              A dead tuple is a row version that no transaction can see any more. Read the counts from{' '}
              <code>pg_stat_user_tables</code>, where <code>n_dead_tup</code> is the number waiting to be
              cleaned and <code>n_live_tup</code> is the number of real rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The raw count means little on its own. Ten thousand dead rows in a table of ten million is
                nothing, and the same count in a table of twenty thousand is a problem
              </li>
              <li>
                Look at the percentage instead: dead divided by live plus dead. Anything that stays above
                roughly twenty percent on a busy table means vacuum is losing the race
              </li>
              <li>
                Both numbers are estimates maintained by the statistics collector, so they can drift. Treat
                them as a signal, not an audit
              </li>
              <li>
                Dead rows are not just wasted disk. Queries still walk past them during scans, and indexes
                still point at them, so a bloated table gets slower as well as bigger
              </li>
              <li>
                If the count keeps climbing even though autovacuum is running, look for the usual blockers: a
                long running transaction, an abandoned replication slot, or a session sitting idle in
                transaction
              </li>
              <li>
                <code>n_mod_since_analyze</code> is the matching number for statistics. A large value means
                the planner is working from an out of date picture of the table
              </li>
            </ul>
            <CodeBlock
              title="Dead tuples by proportion, not raw count"
              language="sql"
              code={`SELECT relname,
       n_live_tup,
       n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       n_mod_since_analyze,
       last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="What stops vacuum from cleaning up"
              language="sql"
              code={`-- oldest transaction still holding a snapshot
SELECT pid, state, now() - xact_start AS xact_age, left(query, 100)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 5;

-- inactive replication slots pin the cleanup horizon too
SELECT slot_name, active, xmin, catalog_xmin
FROM pg_replication_slots;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What should you monitor about VACUUM and autovacuum?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Autovacuum reclaims dead tuples and refreshes planner statistics. Under MVCC this is not
                optional housekeeping, it is what keeps the database usable
              </li>
              <li>
                Watch tables with high dead tuple counts, a long time since the last vacuum or analyze, and
                any sign of transaction ID wraparound risk
              </li>
              <li>
                Symptoms of vacuum problems: table bloat, queries suddenly choosing sequential scans because
                statistics went stale, and wraparound warnings in the log
              </li>
              <li>
                Watch how many autovacuum workers are busy. If all of them are permanently occupied, tables at
                the back of the queue may wait hours, and the default of three workers is often too few
              </li>
              <li>
                Watch how long a vacuum takes on your biggest table. If one run takes longer than the interval
                between runs, you will never catch up
              </li>
              <li>
                Turn on <code>log_autovacuum_min_duration</code> so slow runs land in the log with the number
                of pages removed and skipped
              </li>
            </ul>
            <CodeBlock
              title="Vacuum health queries"
              language="sql"
              code={`SELECT relname,
       n_live_tup,
       n_dead_tup,
       last_vacuum,
       last_autovacuum,
       last_analyze,
       last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- Wraparound safety (age of the oldest transaction id)
SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;`}
            />
            <CodeBlock
              title="Vacuum running right now, and per table wraparound age"
              language="sql"
              code={`SELECT pid, datname, relid::regclass AS table,
       phase, heap_blks_total, heap_blks_scanned
FROM pg_stat_progress_vacuum;

SELECT c.relname,
       age(c.relfrozenxid) AS xid_age,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public'
ORDER BY age(c.relfrozenxid) DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What do last_autovacuum and last_autoanalyze tell you?">
            <p>
              They are the timestamps of the last time the background process vacuumed or analysed that
              table. The four columns come in pairs: the plain ones are manual runs, the auto ones are
              autovacuum.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A NULL <code>last_autovacuum</code> with a big <code>n_dead_tup</code> is the alarming
                combination. It means the table has never been cleaned and something is preventing it
              </li>
              <li>
                A NULL on a small, quiet table is completely normal. Autovacuum only wakes up once the dead
                tuple count crosses a threshold, so a table nobody updates is simply never eligible
              </li>
              <li>
                A very old timestamp on a busy table means the workers are saturated, autovacuum is being
                cancelled repeatedly by lock conflicts, or the thresholds are too high for that table size
              </li>
              <li>
                <code>last_autoanalyze</code> is the one people forget. Stale statistics make the planner
                choose bad plans, and that shows up as a query that got slow with no code change
              </li>
              <li>
                The counters <code>autovacuum_count</code> and <code>autoanalyze_count</code> tell you the
                frequency, which is more useful than a single timestamp
              </li>
              <li>
                A practical alert: any table with more than fifty thousand dead tuples whose last autovacuum
                is older than a day, or NULL
              </li>
            </ul>
            <CodeBlock
              title="Tables autovacuum is not reaching"
              language="sql"
              code={`SELECT relname,
       n_live_tup,
       n_dead_tup,
       last_autovacuum,
       last_autoanalyze,
       autovacuum_count,
       autoanalyze_count,
       now() - coalesce(last_autovacuum, last_vacuum) AS since_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 50000
  AND (last_autovacuum IS NULL OR last_autovacuum < now() - interval '1 day')
ORDER BY n_dead_tup DESC;`}
            />
            <CodeBlock
              title="Are the workers saturated"
              language="sql"
              code={`SHOW autovacuum_max_workers;

SELECT count(*) AS running_now
FROM pg_stat_activity
WHERE backend_type = 'autovacuum worker';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you tune autovacuum for a hot table?">
            <p>
              The defaults are proportional, and that is the problem. Autovacuum triggers when dead tuples
              pass fifty plus twenty percent of the table. On a table with fifty million rows that means ten
              million dead rows before it even starts, and then one enormous vacuum run.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Tune per table with <code>ALTER TABLE ... SET</code>, never globally. Your hot table needs
                different settings from a lookup table with two hundred rows
              </li>
              <li>
                Lower <code>autovacuum_vacuum_scale_factor</code> to something like 0.01, or to zero combined
                with a fixed <code>autovacuum_vacuum_threshold</code>. Frequent small vacuums beat rare huge
                ones every time
              </li>
              <li>
                Do the same for <code>autovacuum_analyze_scale_factor</code>, because stale statistics on a
                fast growing table cause bad plans long before bloat causes pain
              </li>
              <li>
                Raise <code>autovacuum_vacuum_cost_limit</code> and lower{' '}
                <code>autovacuum_vacuum_cost_delay</code> so the worker is allowed to do real work. The
                defaults deliberately throttle vacuum to protect input and output on slow disks, which is the
                wrong trade on modern hardware
              </li>
              <li>
                Raise <code>autovacuum_max_workers</code> if many tables are queueing, but remember the cost
                budget is shared, so more workers each go slower unless you raise the limit too
              </li>
              <li>
                On PostgreSQL 13 and later, <code>autovacuum_vacuum_insert_threshold</code> handles
                append only tables, which never used to be vacuumed at all because they had no dead rows
              </li>
              <li>
                Measure before and after. The target is that dead tuple percentage stays flat and low under
                normal load, not that a specific setting is used
              </li>
              <li>
                Structural fixes beat tuning for the biggest tables: partition by time so old data is dropped
                rather than deleted, keep transactions short, and use <code>pg_repack</code> to clear bloat
                that already exists
              </li>
            </ul>
            <CodeBlock
              title="Per table settings for a hot table"
              language="sql"
              code={`ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor  = 0.01,   -- vacuum at 1 percent dead, not 20
  autovacuum_vacuum_threshold     = 1000,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay    = 2,      -- ms of pause between work batches
  autovacuum_vacuum_cost_limit    = 2000    -- more work per batch
);

-- append only table on PG 13+
ALTER TABLE audit_log SET (
  autovacuum_vacuum_insert_threshold    = 10000,
  autovacuum_vacuum_insert_scale_factor = 0.01
);

-- confirm what is set
SELECT relname, reloptions FROM pg_class WHERE relname = 'events';`}
            />
            <CodeBlock
              title="Work out when autovacuum will actually fire"
              language="sql"
              code={`SELECT relname,
       n_dead_tup,
       50 + 0.2 * n_live_tup AS default_trigger_point,
       n_dead_tup > 50 + 0.2 * n_live_tup AS eligible_now
FROM pg_stat_user_tables
WHERE n_live_tup > 100000
ORDER BY n_dead_tup DESC
LIMIT 10;`}
            />
            <CodeBlock
              title="Global knobs worth revisiting on modern hardware"
              language="sql"
              code={`ALTER SYSTEM SET autovacuum_max_workers = 6;
ALTER SYSTEM SET autovacuum_naptime = '15s';
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;
ALTER SYSTEM SET log_autovacuum_min_duration = '5s';
SELECT pg_reload_conf();
-- autovacuum_max_workers needs a restart, the others do not`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
