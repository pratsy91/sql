import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: GROUP BY and Aggregates - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on GROUP BY and aggregate functions: WHERE vs HAVING, COUNT(*) vs COUNT(column) vs COUNT(DISTINCT), grouping by several columns, ordering by an aggregate, filtering groups by count, and how NULL behaves in aggregates.',
};

export default function M6L3GroupByAndAggregates() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: GROUP BY and Aggregates</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Grouping turns many rows into one row per group and summarises them. The questions here are about
          which rows get counted, and where the filter goes.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between WHERE and HAVING?">
            <p>
              <code>WHERE</code> keeps or drops individual rows <em>before</em> grouping.
              <code>HAVING</code> keeps or drops groups <em>after</em> <code>GROUP BY</code>.
              You cannot write <code>COUNT(*) &gt; 5</code> in <code>WHERE</code>. That belongs in <code>HAVING</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Filter as much as possible in <code>WHERE</code>. Fewer rows enter the grouping, so the query is faster</li>
              <li>Only use <code>HAVING</code> for conditions that need an aggregate value</li>
              <li>A condition on a plain grouped column works in either place, but <code>WHERE</code> is the right home for it</li>
            </ul>
            <CodeBlock
              title="WHERE vs HAVING"
              language="sql"
              code={`SELECT department_id, COUNT(*) AS emp_count
FROM employees
WHERE hire_date >= '2020-01-01'   -- row filter first
GROUP BY department_id
HAVING COUNT(*) > 5;              -- group filter after`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How does GROUP BY work with aggregate functions?">
            <p>
              <code>GROUP BY</code> bundles rows that share a value, then <code>COUNT</code>, <code>SUM</code>,
              <code>AVG</code>, <code>MIN</code>, and <code>MAX</code> turn each bundle into one row.
              Any column you select that is not inside those functions must be in the <code>GROUP BY</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>If you group by <code>status</code>, you get exactly one row per distinct status</li>
              <li>Selecting an ungrouped, unaggregated column is an error: Postgres cannot know which of the many values to show</li>
              <li>The exception is that grouping by a primary key lets you select any column of that same table, because the key determines them all</li>
              <li>An aggregate with no <code>GROUP BY</code> collapses the whole table into one row</li>
            </ul>
            <CodeBlock
              title="GROUP BY"
              language="sql"
              code={`SELECT
  status,
  COUNT(*) AS order_count,
  SUM(total_cents) AS revenue
FROM orders
GROUP BY status
ORDER BY revenue DESC;

-- Grouping by the primary key lets you select other columns of that table
SELECT u.id, u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;`}
            />
            <CodeBlock
              title="Prisma groupBy"
              language="typescript"
              code={`const byStatus = await prisma.order.groupBy({
  by: ['status'],
  _count: { _all: true },
  _sum: { totalCents: true },
  orderBy: { _sum: { totalCents: 'desc' } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column)?">
            <p>
              They answer three different questions: how many rows, how many rows where that column has a
              value, and how many different values.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong><code>COUNT(*)</code>:</strong> counts rows. Never skips anything, never returns NULL. For an empty group it returns 0</li>
              <li><strong><code>COUNT(col)</code>:</strong> counts rows where <code>col</code> is not NULL. So <code>COUNT(*) - COUNT(col)</code> is the number of NULLs</li>
              <li><strong><code>COUNT(DISTINCT col)</code>:</strong> counts different non-NULL values. More expensive, because Postgres has to sort or hash the values</li>
              <li><code>COUNT(1)</code> is the same as <code>COUNT(*)</code> in PostgreSQL. It is a style preference, not a performance trick</li>
              <li>This matters after a <code>LEFT JOIN</code>: <code>COUNT(*)</code> counts the padded NULL row as 1, so a user with no orders shows 1. <code>COUNT(o.id)</code> correctly shows 0</li>
              <li>An exact <code>COUNT(*)</code> on a huge table always scans, since PostgreSQL has no stored row count. For an estimate, read <code>reltuples</code> from <code>pg_class</code></li>
            </ul>
            <CodeBlock
              title="Three counts, three answers"
              language="sql"
              code={`SELECT
  COUNT(*)                  AS total_rows,
  COUNT(phone)              AS rows_with_phone,
  COUNT(*) - COUNT(phone)   AS rows_missing_phone,
  COUNT(DISTINCT country)   AS distinct_countries
FROM users;

-- The LEFT JOIN trap
SELECT
  u.id,
  COUNT(*)      AS wrong_count,   -- 1 even when the user has no orders
  COUNT(o.id)   AS right_count    -- 0 when the user has no orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;

-- Fast approximate row count
SELECT reltuples::bigint AS approx_rows
FROM pg_class WHERE relname = 'orders';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you group by more than one column?">
            <p>
              List the columns after <code>GROUP BY</code>, separated by commas. You then get one row per
              distinct <em>combination</em> of those values.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Grouping by <code>(country, status)</code> gives one row per country-and-status pair, not per country</li>
              <li>Expect more rows and smaller groups than a single-column grouping. That is the usual confusion</li>
              <li>You can group by an expression, such as <code>date_trunc(&apos;month&apos;, created_at)</code>, which is how monthly reports are written</li>
              <li><code>GROUP BY 1, 2</code> refers to the first and second items in the <code>SELECT</code> list. Handy for long expressions, though naming them is clearer</li>
              <li>For subtotals and a grand total in the same result, use <code>ROLLUP</code>, <code>CUBE</code>, or <code>GROUPING SETS</code> instead of running several queries and stitching them together</li>
            </ul>
            <CodeBlock
              title="Grouping by several columns"
              language="sql"
              code={`SELECT country, status, COUNT(*) AS orders
FROM orders
GROUP BY country, status
ORDER BY country, status;

-- Group by a derived value: revenue per month
SELECT
  date_trunc('month', created_at) AS month,
  COUNT(*)                        AS orders,
  SUM(total_cents)                AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;

-- Subtotals per country plus a grand total row
SELECT country, status, COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (country, status)
ORDER BY country NULLS LAST, status NULLS LAST;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you sort results by an aggregate value?">
            <p>
              Put the aggregate in <code>ORDER BY</code>, or give it an alias in the <code>SELECT</code> list and
              order by that alias. Both work, because <code>ORDER BY</code> runs after grouping.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ordering by an alias is allowed, unlike in <code>WHERE</code>. This is a favourite interview detail</li>
              <li>You can also order by an aggregate you did not select, for example sort by total revenue while only showing the count</li>
              <li>Add <code>DESC</code> for “biggest first”, and add a tiebreaker column so the order is stable across runs</li>
              <li>With <code>LIMIT</code>, this is the standard “top 10 customers by spend” query</li>
              <li>NULL sorts last with <code>ASC</code> and first with <code>DESC</code> by default. Use <code>NULLS LAST</code> when that looks wrong in a report</li>
            </ul>
            <CodeBlock
              title="Ordering by an aggregate"
              language="sql"
              code={`SELECT
  u.id,
  u.email,
  SUM(o.total_cents) AS revenue
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email
ORDER BY revenue DESC NULLS LAST, u.id   -- alias, plus a stable tiebreaker
LIMIT 10;

-- Order by an aggregate that is not in the SELECT list
SELECT category, COUNT(*) AS product_count
FROM products
GROUP BY category
ORDER BY SUM(price) DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you find groups that have more than N rows, like duplicate emails?">
            <p>
              Group by the column, then filter with <code>HAVING COUNT(*) &gt; 1</code>. This is the standard way
              to find duplicates before adding a unique constraint.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>HAVING</code> is the only place an aggregate condition can go</li>
              <li>Group by the normalised value, such as <code>lower(email)</code>, or you will miss duplicates that differ only in letter case</li>
              <li>Add the ids to the output with <code>array_agg(id)</code> or <code>min(id)</code> so you know which rows to keep and which to remove</li>
              <li>You can combine several aggregate conditions, for example “more than 3 orders and total spend above a threshold”</li>
              <li>The reverse direction is just as common: <code>HAVING COUNT(*) = 1</code> finds groups with exactly one row</li>
            </ul>
            <CodeBlock
              title="Find and inspect duplicates"
              language="sql"
              code={`-- Duplicate emails, case-insensitive
SELECT
  lower(email)   AS email_key,
  COUNT(*)       AS copies,
  MIN(id)        AS keep_id,
  array_agg(id ORDER BY id) AS all_ids
FROM users
GROUP BY lower(email)
HAVING COUNT(*) > 1
ORDER BY copies DESC;

-- Several aggregate conditions at once
SELECT user_id, COUNT(*) AS orders, SUM(total_cents) AS spend
FROM orders
GROUP BY user_id
HAVING COUNT(*) >= 3
   AND SUM(total_cents) > 50000;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What happens to NULL inside aggregate functions?">
            <p>
              Every aggregate except <code>COUNT(*)</code> simply ignores NULL. It does not treat NULL as zero —
              the row is skipped completely.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>SUM</code>, <code>AVG</code>, <code>MIN</code>, and <code>MAX</code> skip NULL inputs</li>
              <li>This makes <code>AVG</code> the trap: with values 10, 20, and NULL, the average is 15, not 10. If missing should count as zero, write <code>AVG(COALESCE(x, 0))</code></li>
              <li><code>SUM</code> of an empty set, or of all NULLs, returns <strong>NULL</strong>, not 0. Wrap it: <code>COALESCE(SUM(x), 0)</code>. <code>COUNT</code> of nothing returns 0</li>
              <li><code>GROUP BY</code> itself does the opposite — it treats all NULLs as one group, so you get a single row with a NULL key</li>
              <li><code>array_agg</code> and <code>string_agg</code> do keep NULL entries, which is why an aggregated array can contain nulls. Filter them out with a <code>FILTER</code> clause</li>
              <li><code>bool_and</code> and <code>bool_or</code> also skip NULLs, so a group of all NULLs returns NULL rather than true or false</li>
            </ul>
            <CodeBlock
              title="NULL behaviour in aggregates"
              language="sql"
              code={`-- ratings: 10, 20, NULL
SELECT
  COUNT(*)                 AS rows_total,     -- 3
  COUNT(rating)            AS rated_rows,     -- 2
  SUM(rating)              AS total,          -- 30
  AVG(rating)              AS avg_rated,      -- 15  (NULL skipped)
  AVG(COALESCE(rating, 0)) AS avg_all         -- 10  (NULL counted as zero)
FROM reviews;

-- Empty group: SUM is NULL, COUNT is 0
SELECT COALESCE(SUM(total_cents), 0) AS revenue, COUNT(*) AS orders
FROM orders
WHERE created_at > now();

-- FILTER keeps unwanted values out of one aggregate only
SELECT
  COUNT(*)                                   AS all_orders,
  COUNT(*) FILTER (WHERE status = 'paid')     AS paid_orders,
  array_agg(id) FILTER (WHERE status = 'paid') AS paid_ids
FROM orders;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
