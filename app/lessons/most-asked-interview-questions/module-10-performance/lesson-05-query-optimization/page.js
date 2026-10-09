import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Query Optimization - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked SQL query optimization interview questions: avoiding SELECT *, functions on filtered columns, rewriting OR as UNION ALL, LIMIT with a matching index, fresh statistics, and debugging a slow production query.',
};

export default function MaiqPerfLesson05QueryOptimization() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Query Optimization</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most slow queries are not slow because the database is weak. They are slow because the query
          asks for more data than it needs, or it is written in a way that stops the index from being
          used. These are the rewrite patterns interviewers expect you to know by heart.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Why should you avoid SELECT * in application code?">
            <p>
              <code>SELECT *</code> asks for every column, even the ones you never read. That costs more
              disk reads, more network traffic, more memory in your app, and it quietly blocks some of the
              best optimizations.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Wide columns like a big <code>text</code> or <code>jsonb</code> body get fetched for nothing
              </li>
              <li>
                It blocks index-only scans, because the index cannot hold every column
              </li>
              <li>
                It breaks silently when someone adds or reorders a column, especially with positional access
              </li>
              <li>
                Naming columns is also self-documenting: the next reader sees what the query really needs
              </li>
              <li>
                It is fine for quick manual checks in <code>psql</code>, just not in shipped code
              </li>
            </ul>
            <CodeBlock
              title="Ask for what you need"
              language="sql"
              code={`-- Reads every column including a huge body column
SELECT * FROM articles WHERE author_id = 9;

-- Reads three small columns, and can be served by a covering index
SELECT id, title, published_at FROM articles WHERE author_id = 9;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="List practical query optimization tips interviewers expect.">
            <p>
              Index foreign keys and common filter or sort columns; make the most selective{' '}
              <code>WHERE</code> condition indexable; avoid <code>SELECT *</code> on wide tables; rewrite{' '}
              <code>OR</code> into <code>UNION ALL</code> when needed; prefer keyset pagination over a huge{' '}
              <code>OFFSET</code>; keep statistics fresh with <code>ANALYZE</code>; avoid functions on
              indexed columns in <code>WHERE</code>; batch writes; and use connection pooling.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Filter and aggregate in the database, not in application code after fetching everything
              </li>
              <li>
                Replace <code>NOT IN (subquery)</code> with <code>NOT EXISTS</code>, which handles NULL
                correctly and usually plans better
              </li>
              <li>
                Use <code>EXISTS</code> instead of <code>COUNT(*) &gt; 0</code> when you only need to know if
                a row exists
              </li>
              <li>
                Use <code>UNION ALL</code> instead of <code>UNION</code> unless you really need duplicate
                removal, which costs a sort
              </li>
              <li>
                Push <code>LIMIT</code> down: get the page of ids first, then join to fetch details
              </li>
            </ul>
            <CodeBlock
              title="Keyset pagination instead of big OFFSET"
              language="sql"
              code={`-- Slow on page 500: the database still walks 10000 rows first
SELECT id, title FROM articles ORDER BY id LIMIT 20 OFFSET 10000;

-- Fast: jump straight to the position using the index
SELECT id, title FROM articles
WHERE id > 10000
ORDER BY id
LIMIT 20;`}
            />
            <CodeBlock
              title="EXISTS and NOT EXISTS"
              language="sql"
              code={`-- Cheaper than counting all matches
SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = 42) AS has_orders;

-- NOT EXISTS is NULL-safe, unlike NOT IN
SELECT u.id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why does a function on a filtered column kill the index?">
            <p>
              An index stores the raw column values in sorted order. If you wrap the column in a function,
              the database would have to compute that function for every row before it could compare, so the
              sorted order of the index is useless. A condition that can use an index is called{' '}
              <em>sargable</em>. The fix is either to move the function to the other side of the comparison,
              or to index the expression itself.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>WHERE lower(email) = &apos;a@b.com&apos;</code> cannot use an index on{' '}
                <code>email</code>
              </li>
              <li>
                <code>WHERE date(created_at) = &apos;2026-01-01&apos;</code> cannot use an index on{' '}
                <code>created_at</code>. Use a range instead
              </li>
              <li>
                An implicit cast counts as a function. Comparing a <code>text</code> column to a number can
                force one
              </li>
              <li>
                Arithmetic on the column, such as <code>WHERE price * 1.1 &gt; 100</code>, has the same
                problem. Rewrite it as <code>WHERE price &gt; 100 / 1.1</code>
              </li>
            </ul>
            <CodeBlock
              title="Make the filter index-friendly"
              language="sql"
              code={`-- Not sargable: function wraps the indexed column
SELECT * FROM orders WHERE date(created_at) = '2026-01-01';

-- Sargable: half-open range, uses an index on created_at
SELECT * FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <  '2026-01-02';

-- Not sargable
SELECT * FROM users WHERE lower(email) = 'alice@example.com';

-- Option A: index the expression
CREATE INDEX users_lower_email_idx ON users (lower(email));

-- Option B: store the value already normalized, or use citext
CREATE EXTENSION IF NOT EXISTS citext;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How and why do you rewrite OR into UNION ALL?">
            <p>
              An <code>OR</code> across two different columns often stops PostgreSQL from using one clean
              index, so it falls back to a sequential scan or a bitmap combination. Splitting the query into
              two halves lets each half use its own index. You join them with <code>UNION ALL</code>, which
              does not sort or deduplicate, so it is cheap.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Only use <code>UNION</code> instead of <code>UNION ALL</code> if a row could match both
                halves and you must not return it twice
              </li>
              <li>
                An <code>OR</code> on the same column with equality is usually fine as{' '}
                <code>IN (...)</code>, which the planner handles well
              </li>
              <li>
                Modern PostgreSQL can sometimes do this itself with a bitmap OR, so always compare both
                plans with <code>EXPLAIN ANALYZE</code> before committing to the rewrite
              </li>
            </ul>
            <CodeBlock
              title="OR rewritten as UNION ALL"
              language="sql"
              code={`-- Often a sequential scan: two unrelated columns
SELECT id, email, phone FROM users
WHERE email = 'alice@example.com' OR phone = '+15550001111';

-- Each branch uses its own index
SELECT id, email, phone FROM users WHERE email = 'alice@example.com'
UNION ALL
SELECT id, email, phone FROM users
WHERE phone = '+15550001111'
  AND email <> 'alice@example.com';

-- Same column, keep it simple
SELECT * FROM orders WHERE status IN ('pending', 'paid');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is LIMIT only fast when the index matches?">
            <p>
              <code>LIMIT</code> lets the database stop early, but only if the rows arrive in the right
              order already. If the index matches the <code>WHERE</code> plus <code>ORDER BY</code>,
              PostgreSQL walks the index, collects the first N rows, and stops. If there is no matching
              index, it must read and sort everything first, then throw almost all of it away, so{' '}
              <code>LIMIT 10</code> costs the same as no limit at all.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Good plan shows <code>Limit</code> directly over an <code>Index Scan</code>
              </li>
              <li>
                Bad plan shows <code>Limit</code> over a <code>Sort</code> over a <code>Seq Scan</code>
              </li>
              <li>
                Build the index as filter columns first, then the sort column with the same direction
              </li>
              <li>
                Always pair <code>LIMIT</code> with <code>ORDER BY</code>. Without it the rows you get are
                arbitrary and can change between runs
              </li>
            </ul>
            <CodeBlock
              title="Index built for the top-N query"
              language="sql"
              code={`-- The query pattern
SELECT id, total_cents FROM orders
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 20;

-- The index that makes it stop after 20 rows
CREATE INDEX orders_status_created_idx
ON orders (status, created_at DESC);

EXPLAIN ANALYZE
SELECT id, total_cents FROM orders
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 20;
-- Limit -> Index Scan using orders_status_created_idx`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you keep statistics fresh, and why does it matter?">
            <p>
              The planner does not look at your data when it plans. It looks at statistics: roughly how many
              rows the table has, how many distinct values a column holds, and which values are most common.
              If those numbers are stale, the plan is built on a wrong picture of the table. Refreshing them
              is often a one-line fix for a query that got slow overnight.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Autovacuum runs <code>ANALYZE</code> automatically, but a bulk load can move far more rows
                than the trigger threshold expects
              </li>
              <li>
                Always run <code>ANALYZE</code> manually after a migration, a restore, or a large import
              </li>
              <li>
                For a skewed column, raise the statistics target so PostgreSQL keeps a longer list of common
                values
              </li>
              <li>
                For columns that depend on each other, create extended statistics so the planner stops
                multiplying probabilities
              </li>
              <li>
                Check <code>last_analyze</code> and <code>last_autoanalyze</code> when a plan looks
                inexplicably bad
              </li>
            </ul>
            <CodeBlock
              title="Statistics maintenance"
              language="sql"
              code={`ANALYZE orders;

SELECT relname, last_analyze, last_autoanalyze, n_mod_since_analyze
FROM pg_stat_user_tables
ORDER BY n_mod_since_analyze DESC
LIMIT 10;

ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

CREATE STATISTICS orders_tenant_status (dependencies, ndistinct)
ON tenant_id, status FROM orders;
ANALYZE orders;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you approach a slow production query end-to-end?">
            <p>
              Reproduce with realistic parameters; capture <code>EXPLAIN (ANALYZE, BUFFERS)</code>; verify
              indexes and the top entries in <code>pg_stat_statements</code>; check lock waits and autovacuum
              lag; validate application-side problems such as N+1 or pool exhaustion; ship the smallest fix,
              an index or a SQL rewrite, with a rollout plan; then measure p95 latency before and after.
              Avoid premature partitioning or big hardware jumps without evidence.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Start with data, not opinions: find the query that costs the most total time, not just the
                slowest single run
              </li>
              <li>
                Separate &quot;slow query&quot; from &quot;slow because it is waiting&quot;. Check{' '}
                <code>pg_stat_activity</code> wait events and <code>pg_locks</code>
              </li>
              <li>
                Create indexes with <code>CONCURRENTLY</code> so you do not block writes, and verify the new
                plan before declaring victory
              </li>
              <li>
                Write down the rollback step. Dropping a new index is easy, rewriting a shipped query is not
              </li>
              <li>
                Close the loop: add an alert or a dashboard so the same regression is caught next time
              </li>
            </ul>
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
            <CodeBlock
              title="Waits, locks, and a safe index rollout"
              language="sql"
              code={`-- Who is waiting, and on what
SELECT pid, state, wait_event_type, wait_event, left(query, 80) AS query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY xact_start;

-- Blocking chains
SELECT pid, pg_blocking_pids(pid) AS blocked_by, left(query, 60) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Build the fix without blocking writes
CREATE INDEX CONCURRENTLY orders_status_created_idx
ON orders (status, created_at DESC);

-- Verify it is actually used, then reset counters to measure the improvement
SELECT pg_stat_statements_reset();`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
