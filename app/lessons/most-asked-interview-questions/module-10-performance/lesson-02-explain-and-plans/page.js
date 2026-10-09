import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: EXPLAIN and Query Plans - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked EXPLAIN interview questions: EXPLAIN vs EXPLAIN ANALYZE, sequential scan vs index scan, estimated vs actual rows, join types, BUFFERS, and index-only scans.',
};

export default function MaiqPerfLesson02ExplainPlans() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: EXPLAIN and Query Plans</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A query plan is the step-by-step recipe PostgreSQL uses to answer your query.{' '}
          <code>EXPLAIN</code> shows that recipe. Reading it is the single most useful performance skill,
          and interviewers ask about it at every level.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is EXPLAIN ANALYZE and why use it?">
            <p>
              <code>EXPLAIN</code> shows the plan Postgres thinks it will use, without running the query for
              real results. <code>EXPLAIN ANALYZE</code> actually runs the query and shows how long each
              step took and how many rows it saw. If the plan guessed 10 rows but really read 1 million, you
              likely need an index or fresher statistics.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>EXPLAIN</code> is safe and instant. It only estimates
              </li>
              <li>
                <code>EXPLAIN ANALYZE</code> really executes the query, so it also really writes data for an
                UPDATE or DELETE. Wrap those in a transaction and roll back
              </li>
              <li>Always test with realistic parameter values, not with ids that match zero rows</li>
            </ul>
            <CodeBlock
              title="EXPLAIN ANALYZE"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 42;

-- Safe way to analyze a write
BEGIN;
EXPLAIN ANALYZE DELETE FROM orders WHERE created_at < '2020-01-01';
ROLLBACK;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Sequential scan vs index scan - when is each OK?">
            <p>
              A sequential scan reads every row in the table. That is fine for a small table, or when almost
              every row matches. An index scan jumps to matching rows. That is better when you want a few
              rows out of many. Postgres may still scan the whole table even if an index exists, when that
              is cheaper.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Seq Scan:</strong> read the table front to back. Cheap per row, expensive in total on
                big tables
              </li>
              <li>
                <strong>Index Scan:</strong> walk the index, then fetch each matching row from the table. Best
                for a small number of matches
              </li>
              <li>
                <strong>Bitmap Index Scan:</strong> the middle ground. Collect all matching row locations
                first, sort them, then read the table pages in order. Postgres picks this when there are too
                many matches for a plain index scan
              </li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What do estimated rows and actual rows mean, and why does the gap matter?">
            <p>
              In the plan each step shows <code>rows=</code> (the planner guess) and, with{' '}
              <code>ANALYZE</code>, <code>actual rows=</code> (what really happened). The planner chooses the
              plan from its guesses, so a bad guess gives a bad plan. A large gap is the first thing to look
              for.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Remember <code>loops</code>. Actual rows are shown per loop, so total rows are{' '}
                <code>actual rows x loops</code>
              </li>
              <li>
                Guess far too low usually means stale statistics, or correlated columns the planner treats as
                independent
              </li>
              <li>
                Fix with <code>ANALYZE</code>, a higher statistics target, or extended statistics for related
                columns
              </li>
              <li>
                A wrong small estimate often leads to a nested loop that then runs millions of times
              </li>
            </ul>
            <CodeBlock
              title="Improving the planner guesses"
              language="sql"
              code={`-- Refresh statistics for one table
ANALYZE orders;

-- Keep more detailed stats for a skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

-- Tell the planner that city and state are related
CREATE STATISTICS addr_city_state (dependencies)
ON city, state FROM addresses;
ANALYZE addresses;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain nested loop, hash join, and merge join in simple terms.">
            <p>
              These are the three ways PostgreSQL joins two sets of rows. The planner picks one based on the
              expected row counts and whether the inputs are already sorted.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Nested Loop:</strong> for each row on the outer side, look up matches on the inner
                side. Great when the outer side has few rows and the inner side has an index. Terrible when
                the outer side has millions of rows
              </li>
              <li>
                <strong>Hash Join:</strong> build a hash table in memory from the smaller side, then stream
                the bigger side through it. Great for joining two large sets on equality. Needs{' '}
                <code>work_mem</code>, otherwise it spills to disk in batches
              </li>
              <li>
                <strong>Merge Join:</strong> sort both sides by the join key, then walk them together like
                zipping two lists. Good when both sides are already sorted, often from index order
              </li>
            </ul>
            <p>
              A simple rule for the interview: small outer side with an index means nested loop, two big
              tables on equality means hash join, already sorted inputs or a range join means merge join.
            </p>
            <CodeBlock
              title="Reading a join in the plan"
              language="sql"
              code={`EXPLAIN ANALYZE
SELECT u.email, o.total_cents
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.id = 42;

-- Typical good plan for a single user:
-- Nested Loop
--   -> Index Scan using users_pkey on users
--   -> Index Scan using orders_user_id_idx on orders

-- Typical good plan for a whole-table report:
-- Hash Join
--   -> Seq Scan on orders
--   -> Hash
--        -> Seq Scan on users`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does the BUFFERS option show you?">
            <p>
              <code>BUFFERS</code> reports how many 8 KB blocks each step touched, and where they came from.
              It turns a slow query into a concrete I/O story instead of a guess. In PostgreSQL 16 and newer{' '}
              <code>EXPLAIN ANALYZE</code> includes buffer numbers by default, but writing it explicitly is
              still the safe habit.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>shared hit:</strong> found in the cache. Fast
              </li>
              <li>
                <strong>shared read:</strong> had to be read from the operating system or disk. Slow
              </li>
              <li>
                <strong>shared dirtied / written:</strong> the query modified pages or had to flush them
              </li>
              <li>
                <strong>temp read / written:</strong> a sort or hash did not fit in <code>work_mem</code> and
                spilled to temporary files. This is a strong signal to raise <code>work_mem</code> for that
                query or to reduce the row count
              </li>
              <li>
                Thousands of buffer reads to return 10 rows means the query is reading far too much data.
                Usually a missing or wrong index
              </li>
            </ul>
            <CodeBlock
              title="Buffers and timing together"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Buffers: shared hit=12 read=48210
-- 48k blocks read for a small result set means look for an index on created_at`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you read EXPLAIN output for bottlenecks?">
            <p>
              Look for: large gaps between estimated and actual rows; high-cost sequential scans on large
              tables; nested loop joins with huge inner iterations; sort/hash spilling to disk; repeated heap
              fetches when an index-only scan was expected (visibility map / all-visible issues). Fix stats,
              indexes, rewrite joins, or increase <code>work_mem</code> carefully for sorts/hashes.
            </p>
            <p>
              A practical reading order: start at the bottom of the tree, because plans execute inside out.
              Find the node where actual time jumps, then check whether the row count or the access method is
              the cause.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>actual time</code> on a node includes its children, so subtract to find the real cost
                of one step
              </li>
              <li>
                <code>Rows Removed by Filter</code> tells you how much work was wasted after reading rows
              </li>
              <li>
                <code>Heap Fetches</code> on an index-only scan means the visibility map is not up to date
              </li>
              <li>
                <code>Batches</code> greater than 1 on a hash join means it spilled to disk
              </li>
              <li>
                Watch for parallel workers: <code>Workers Launched</code> lower than planned means the plan
                did not get the parallelism it expected
              </li>
            </ul>
            <CodeBlock
              title="Useful EXPLAIN options"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, SETTINGS, WAL)
SELECT u.email, COUNT(*)
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.email;

-- SETTINGS shows non-default planner settings, which explains surprising plans
-- WAL shows how much write-ahead log a write statement generated`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is an index-only scan, and what can block it?">
            <p>
              An index-only scan answers a query from the index alone. PostgreSQL still checks the visibility
              map; if pages are not all-visible, it heap-fetches. Frequent updates delay all-visible status
              until vacuum. Covering indexes plus timely vacuum improve index-only scan rates.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Every column the query needs must be in the index, either as a key column or in{' '}
                <code>INCLUDE</code>
              </li>
              <li>
                <code>SELECT *</code> almost always blocks it, because the index does not hold every column
              </li>
              <li>
                A heavily updated table has many pages that are not all-visible, so you see high{' '}
                <code>Heap Fetches</code> and lose most of the benefit
              </li>
              <li>
                Index types that do not store the original value, such as a hash index or a GIN index, cannot
                serve an index-only scan
              </li>
            </ul>
            <CodeBlock
              title="Making an index-only scan possible"
              language="sql"
              code={`CREATE INDEX orders_user_covering
ON orders (user_id)
INCLUDE (total_cents, status);

-- Can be index-only, because every selected column lives in the index
EXPLAIN (ANALYZE, BUFFERS)
SELECT total_cents, status FROM orders WHERE user_id = 42;

-- Helps the visibility map catch up so Heap Fetches drops
VACUUM (ANALYZE) orders;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
