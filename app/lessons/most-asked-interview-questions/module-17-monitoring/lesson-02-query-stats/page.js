import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Query Statistics - Module 17 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on finding slow PostgreSQL queries: pg_stat_statements, total time vs mean time, normalised queries with placeholders, log_min_duration_statement, and using EXPLAIN as part of monitoring',
};

export default function MaiqM17L02QueryStats() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Query Statistics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How you find the queries that are actually costing you, using aggregated statistics and the slow
          query log, and how you decide which one to fix first.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you enable and use the slow query log?">
            <p>
              The slow query log writes every statement that takes longer than a threshold into the
              PostgreSQL log file, with its full text and real parameter values.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>log_min_duration_statement</code> logs any statement taking longer than N milliseconds
              </li>
              <li>
                <code>log_statement</code> set to all, ddl, or mod logs by category. Setting it to all is very
                noisy on a busy server
              </li>
              <li>
                Cloud providers expose these through parameter groups and their own logging dashboards
              </li>
              <li>
                Unlike <code>pg_stat_statements</code>, the log keeps the actual values, so you can replay the
                exact slow request. That also means it can contain personal data, so treat log access
                carefully
              </li>
            </ul>
            <CodeBlock
              title="Turn it on and check it"
              language="sql"
              code={`-- Log queries slower than 500ms
ALTER SYSTEM SET log_min_duration_statement = 500;
SELECT pg_reload_conf();

SHOW log_min_duration_statement;
SHOW logging_collector;
SHOW log_directory;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is pg_stat_statements and how do you use it to find slow queries?"
          >
            <p>
              <code>pg_stat_statements</code> is an extension that keeps running totals for every query
              shape: how many times it ran, how much time it used, and how many rows it returned. It is the
              single most useful tool for finding expensive SQL, in interviews and in production.
            </p>
            <CodeBlock
              title="Enable and query the top offenders"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT calls,
       round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows,
       left(query, 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Reset after investigating a window
-- SELECT pg_stat_statements_reset();`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Sort by <code>total_exec_time</code> for overall load, and by <code>mean_exec_time</code> for
                individual outliers
              </li>
              <li>
                Pair it with <code>EXPLAIN (ANALYZE, BUFFERS)</code> on the worst query shapes
              </li>
              <li>
                It needs <code>shared_preload_libraries</code> to include the extension, which means a restart
                the first time. Most managed providers have it on already
              </li>
              <li>
                It tracks a limited number of statements, set by <code>pg_stat_statements.max</code>. Rare
                queries can be evicted, so the list is the common shapes, not everything
              </li>
              <li>
                Counters are cumulative since the last reset. To measure one window, snapshot the view, wait,
                then subtract
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="When prioritising, do you sort by total time or mean time?"
          >
            <p>
              Sort by total time to find what is actually consuming your database. Sort by mean time to find
              what is annoying an individual user. They usually point at different queries, and both matter.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Total time</strong> equals calls multiplied by mean time. A five millisecond query
                called two million times per hour costs far more than a two second report run twice a day
              </li>
              <li>
                Fixing high total time queries is what actually lowers CPU and frees capacity. That is the
                number to lead with
              </li>
              <li>
                <strong>Mean time</strong> finds the query that makes one page feel broken. Users do not
                experience your total, they experience one request
              </li>
              <li>
                Mean hides spikes. A query that is fast when cached and terrible when it is not has a
                reasonable mean, so also look at <code>max_exec_time</code> and{' '}
                <code>stddev_exec_time</code>
              </li>
              <li>
                Check <code>rows</code> divided by <code>calls</code> too. A query averaging fifty thousand
                rows per call is usually a missing LIMIT or an accidental cross join
              </li>
              <li>
                A practical order of work: first the top few by total time, then anything with a mean above
                your latency budget, then anything with a huge standard deviation
              </li>
            </ul>
            <CodeBlock
              title="Both views side by side"
              language="sql"
              code={`-- What is eating the server
SELECT calls,
       round(total_exec_time::numeric) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(100 * total_exec_time / sum(total_exec_time) OVER (), 1) AS pct_of_total,
       left(query, 100) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- What feels slow to a user, ignoring rare one offs
SELECT calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(max_exec_time::numeric, 2) AS max_ms,
       round(stddev_exec_time::numeric, 2) AS stddev_ms,
       left(query, 100) AS query
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_exec_time DESC
LIMIT 10;`}
            />
            <CodeBlock
              title="Queries returning far too many rows"
              language="sql"
              code={`SELECT calls,
       rows,
       round(rows::numeric / nullif(calls, 0), 1) AS rows_per_call,
       left(query, 100) AS query
FROM pg_stat_statements
WHERE calls > 50
ORDER BY rows_per_call DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why do queries in pg_stat_statements show $1 placeholders?">
            <p>
              Because the view stores a normalised fingerprint, not the literal query text. Constants are
              replaced with numbered placeholders so that a thousand lookups with different ids collapse into
              one row you can actually read.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Without normalising, the same query with a million different ids would fill the whole table
                with a million rows and tell you nothing
              </li>
              <li>
                This is why you cannot copy a row straight into EXPLAIN. You have to put real values back in,
                typically a representative one rather than a rare edge case
              </li>
              <li>
                Two queries that differ only in whitespace or case are still different fingerprints, since
                normalising works on parsed constants, not formatting
              </li>
              <li>
                Values in an IN list are also collapsed, so <code>IN ($1, $2, $3)</code> and a version with
                ten values may appear separately depending on the PostgreSQL version
              </li>
              <li>
                Normalising also means the view holds no customer data, which is a real advantage over the
                slow query log for privacy
              </li>
              <li>
                The matching id is <code>queryid</code>, a stable hash you can use to track one query shape
                across time in your monitoring system
              </li>
            </ul>
            <CodeBlock
              title="Fingerprint, then put real values back for EXPLAIN"
              language="sql"
              code={`-- what the view shows
-- SELECT * FROM "Post" WHERE "authorId" = $1 AND published = $2 LIMIT $3

-- what you run to see the plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "Post" WHERE "authorId" = 42 AND published = true LIMIT 20;`}
            />
            <CodeBlock
              title="Tracking one shape over time with queryid"
              language="sql"
              code={`SELECT queryid,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       left(query, 80) AS query
FROM pg_stat_statements
WHERE query LIKE '%FROM "Post"%'
ORDER BY total_exec_time DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you pick a value for log_min_duration_statement, and what else is worth logging?"
          >
            <p>
              Pick a number just above what a healthy request should take, so the log stays small enough to
              read. One second is a safe starting point on a busy system, then tighten it as you fix things.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Setting it to 0 logs every statement. That is fine for a few minutes of debugging and awful as
                a permanent setting, because logging itself becomes a bottleneck and fills the disk
              </li>
              <li>
                Setting it to minus one turns logging off completely
              </li>
              <li>
                On a high traffic system, use <code>log_min_duration_sample</code> together with{' '}
                <code>log_statement_sample_rate</code> to log a percentage of the merely slow queries while
                still logging every truly slow one
              </li>
              <li>
                Set it per role or per database rather than globally when you only care about the application
                user. Reports and migrations can have their own threshold
              </li>
              <li>
                Also worth turning on: <code>log_lock_waits</code> with <code>deadlock_timeout</code>, so you
                see which statements waited on locks. <code>log_temp_files</code> to catch sorts spilling to
                disk. <code>log_checkpoints</code> and <code>log_autovacuum_min_duration</code> for
                maintenance visibility
              </li>
              <li>
                Make <code>log_line_prefix</code> useful. Without the timestamp, the user, the database, and
                the application name, a slow query line tells you almost nothing about who ran it
              </li>
              <li>
                Log and statistics are complements: the log gives you one real incident with real values,{' '}
                <code>pg_stat_statements</code> gives you the aggregate trend
              </li>
            </ul>
            <CodeBlock
              title="A sensible logging baseline"
              language="sql"
              code={`ALTER SYSTEM SET log_min_duration_statement = '1s';
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';
ALTER SYSTEM SET log_temp_files = 0;          -- log every temp file
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_autovacuum_min_duration = '10s';
ALTER SYSTEM SET log_line_prefix = '%m [%p] %u@%d app=%a ';
SELECT pg_reload_conf();`}
            />
            <CodeBlock
              title="Sampling on a very busy server, and per role thresholds"
              language="sql"
              code={`-- always log over 5s, and sample 10 percent of anything over 200ms
ALTER SYSTEM SET log_min_duration_statement = '5s';
ALTER SYSTEM SET log_min_duration_sample = '200ms';
ALTER SYSTEM SET log_statement_sample_rate = 0.1;
SELECT pg_reload_conf();

-- stricter for the API, looser for the reporting user
ALTER ROLE api_user SET log_min_duration_statement = '300ms';
ALTER ROLE report_user SET log_min_duration_statement = '30s';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do EXPLAIN plans fit into an ongoing monitoring practice?">
            <p>
              Monitoring tells you <em>which</em> queries hurt. <code>EXPLAIN (ANALYZE, BUFFERS)</code> tells
              you <em>why</em>. One without the other leaves you either guessing or optimising something
              nobody runs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Capture plans for regressions after a deploy or a schema change, and store slow query samples
                with their plans in your APM when the tooling supports it
              </li>
              <li>
                Read the estimated rows against the actual rows. A large gap means the planner has bad
                statistics, and the fix is ANALYZE, a higher statistics target, or extended statistics on
                correlated columns
              </li>
              <li>
                BUFFERS shows how much data was read and how much came from cache. A query reading gigabytes
                of buffers to return ten rows is a missing index, even if the timing looks acceptable today
              </li>
              <li>
                Watch for sorts and hashes that spill to disk, shown as external merge. That usually means{' '}
                <code>work_mem</code> is too small for that query
              </li>
              <li>
                Plans change over time even when the SQL does not, because the data grows and the statistics
                move. A plan captured once is not a permanent answer, which is why plan capture belongs in
                monitoring rather than in a one off investigation
              </li>
              <li>
                <code>auto_explain</code> is the production version of this. It logs the plan automatically
                for any statement over a threshold, so you get the plan from the real incident rather than a
                recreation
              </li>
            </ul>
            <CodeBlock
              title="Explain for a hot query"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.email, count(*)
FROM "User" u
JOIN "Post" p ON p."authorId" = u.id
WHERE p.published = true
GROUP BY u.email;`}
            />
            <CodeBlock
              title="auto_explain: capture the plan from the real incident"
              language="sql"
              code={`-- postgresql.conf
-- shared_preload_libraries = 'pg_stat_statements,auto_explain'

ALTER SYSTEM SET auto_explain.log_min_duration = '2s';
ALTER SYSTEM SET auto_explain.log_analyze = on;
ALTER SYSTEM SET auto_explain.log_buffers = on;
ALTER SYSTEM SET auto_explain.log_nested_statements = on;
SELECT pg_reload_conf();`}
            />
            <CodeBlock
              title="Fixing the planner when estimates are wrong"
              language="sql"
              code={`ANALYZE orders;

-- keep finer statistics on a skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

-- teach the planner that two columns are correlated
CREATE STATISTICS orders_city_country (dependencies)
  ON city, country FROM orders;
ANALYZE orders;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
