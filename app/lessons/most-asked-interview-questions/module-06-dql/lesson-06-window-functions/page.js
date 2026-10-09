import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: Window Functions - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on window functions: ROW_NUMBER vs RANK vs DENSE_RANK, PARTITION BY, second highest salary, running totals with frames, top N per group, LAG and LEAD, and why you cannot filter a window function in WHERE.',
};

export default function M6L6WindowFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: Window Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A window function looks at a set of nearby rows and still returns one value per row. Nothing is
          collapsed. This is the topic that separates mid-level from senior in most SQL interviews.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Give an overview of window functions: ROW_NUMBER, RANK, LAG/LEAD.">
            <p>
              A window function looks at nearby rows but still returns every row. <code>GROUP BY</code> collapses
              rows into one per group. <code>ROW_NUMBER()</code> gives 1, 2, 3 inside each group.
              <code>RANK()</code> gives the same number to ties, then skips (1, 1, 3).
              <code>LAG</code> and <code>LEAD</code> read the previous or next row, useful for “compared to last order”.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The syntax is <code>function() OVER (PARTITION BY ... ORDER BY ...)</code>. The <code>OVER</code> clause is what makes it a window function</li>
              <li>Ordinary aggregates work as window functions too: <code>SUM(x) OVER (...)</code> gives a running or group total next to each row</li>
              <li><code>LAG</code> and <code>LEAD</code> take an offset and a default: <code>LAG(total, 1, 0)</code></li>
              <li>Window functions run after <code>WHERE</code>, <code>GROUP BY</code>, and <code>HAVING</code>, but before <code>ORDER BY</code> and <code>LIMIT</code></li>
            </ul>
            <CodeBlock
              title="Window functions"
              language="sql"
              code={`SELECT
  user_id,
  ordered_at,
  total_cents,
  ROW_NUMBER() OVER (
    PARTITION BY user_id ORDER BY ordered_at
  ) AS order_seq,
  LAG(total_cents) OVER (
    PARTITION BY user_id ORDER BY ordered_at
  ) AS prev_total,
  RANK() OVER (ORDER BY total_cents DESC) AS spend_rank
FROM orders;`}
            />
            <CodeBlock
              title="Name the window once with WINDOW"
              language="sql"
              code={`SELECT
  user_id,
  ordered_at,
  ROW_NUMBER() OVER w        AS seq,
  LAG(total_cents) OVER w    AS prev_total,
  LEAD(total_cents) OVER w   AS next_total
FROM orders
WINDOW w AS (PARTITION BY user_id ORDER BY ordered_at);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does PARTITION BY mean?">
            <p>
              <code>PARTITION BY</code> splits the rows into independent groups, and the window function starts
              over in each one. It is “group by” for the window only — the rows are not collapsed.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With <code>PARTITION BY user_id</code>, a <code>ROW_NUMBER()</code> restarts at 1 for every user</li>
              <li>Leave <code>PARTITION BY</code> out and the whole result is one partition, so numbering and totals run across everything</li>
              <li><code>ORDER BY</code> inside <code>OVER</code> decides the order <em>within</em> each partition, and it is separate from the query&apos;s final <code>ORDER BY</code></li>
              <li>You can partition by several columns, or by an expression such as <code>date_trunc(&apos;month&apos;, created_at)</code></li>
              <li>An index matching the partition and order columns lets Postgres skip the sort, which matters on large tables</li>
            </ul>
            <CodeBlock
              title="With and without PARTITION BY"
              language="sql"
              code={`SELECT
  user_id,
  total_cents,
  ROW_NUMBER() OVER (ORDER BY total_cents DESC)                       AS rank_overall,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total_cents DESC)  AS rank_for_user,
  SUM(total_cents) OVER ()                                            AS grand_total,
  SUM(total_cents) OVER (PARTITION BY user_id)                        AS user_total,
  ROUND(
    100.0 * total_cents / SUM(total_cents) OVER (PARTITION BY user_id),
    1
  )                                                                   AS pct_of_user
FROM orders;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between ROW_NUMBER, RANK, and DENSE_RANK on ties?">
            <p>
              All three number the rows, and they only differ when two rows have the same value in the
              <code> ORDER BY</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>ROW_NUMBER:</strong> always 1, 2, 3, 4 with no repeats. Tied rows get different numbers, and which one comes first is arbitrary unless you add a tiebreaker column</li>
              <li><strong>RANK:</strong> ties share a number and then it skips. Two rows at the top give 1, 1, 3. This matches how sports rankings work</li>
              <li><strong>DENSE_RANK:</strong> ties share a number and nothing is skipped: 1, 1, 2. Use it when you want “distinct value positions”, for example the second highest distinct salary</li>
              <li>Pick <code>ROW_NUMBER</code> when you need exactly one row per group, such as deduplicating. Pick <code>RANK</code> or <code>DENSE_RANK</code> when ties should genuinely be treated as equals, such as “everyone tied for top seller”</li>
              <li>Always add a deterministic tiebreaker like <code>, id</code> to the window&apos;s <code>ORDER BY</code>, otherwise the same query can return different rows on different runs</li>
              <li>Related: <code>NTILE(4)</code> splits rows into quartiles, and <code>PERCENT_RANK</code> gives a relative position between 0 and 1</li>
            </ul>
            <CodeBlock
              title="Salaries 100, 100, 90, 80"
              language="sql"
              code={`SELECT
  name,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC, id) AS row_number,  -- 1, 2, 3, 4
  RANK()       OVER (ORDER BY salary DESC)     AS rank,        -- 1, 1, 3, 4
  DENSE_RANK() OVER (ORDER BY salary DESC)     AS dense_rank   -- 1, 1, 2, 3
FROM employees;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you find the second highest salary?">
            <p>
              A classic. The right answer depends on one question the interviewer wants you to ask: if two
              people share the top salary, is the second highest the <em>next person</em> or the
              <em> next distinct amount</em>?
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Second distinct amount:</strong> <code>DENSE_RANK() = 2</code>, or <code>SELECT DISTINCT salary ... ORDER BY salary DESC LIMIT 1 OFFSET 1</code></li>
              <li><strong>Second person in the list:</strong> <code>ROW_NUMBER() = 2</code> with a tiebreaker</li>
              <li>The simple <code>ORDER BY salary DESC LIMIT 1 OFFSET 1</code> is fine and fast for one row, but it returns nothing when there is only one employee, and it returns a duplicate top salary when the top is tied</li>
              <li>The <code>MAX</code>-of-the-rest version reads well and always returns one row, NULL if there is no second value: <code>SELECT MAX(salary) FROM employees WHERE salary &lt; (SELECT MAX(salary) FROM employees)</code></li>
              <li>The window version generalises immediately to Nth highest and to per-department, which is why interviewers push you toward it</li>
              <li>Say out loud which definition you chose. That is usually what is actually being graded</li>
            </ul>
            <CodeBlock
              title="Four ways to get the second highest salary"
              language="sql"
              code={`-- 1. Second distinct amount, window version
SELECT DISTINCT salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
  FROM employees
) t
WHERE dr = 2;

-- 2. Second distinct amount, no window function
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- 3. Always returns exactly one row (NULL if there is no second salary)
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- 4. Second highest per department, with the person's name
SELECT department_id, name, salary
FROM (
  SELECT
    department_id, name, salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dr
  FROM employees
) t
WHERE dr = 2
ORDER BY department_id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why can you not filter a window function in WHERE?">
            <p>
              Because of the order the database processes a query. <code>WHERE</code> runs first, and window
              functions are calculated later — after grouping. When <code>WHERE</code> is being evaluated, the
              <code> ROW_NUMBER</code> does not exist yet.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Writing <code>WHERE ROW_NUMBER() OVER (...) = 1</code> is a syntax error, not a slow query</li>
              <li><code>HAVING</code> does not help either — it also runs before window functions</li>
              <li>The fix is to compute the window in a CTE or a derived table, then filter in the outer query</li>
              <li>There is a good reason for the rule: the window is defined over the rows that survived <code>WHERE</code>. If you could filter on it in the same step, the numbering would depend on itself</li>
              <li>Same reason you cannot use a window function in <code>GROUP BY</code>, or in the <code>SET</code> of an <code>UPDATE</code> directly. Wrap it first</li>
              <li>You <em>can</em> use it in <code>ORDER BY</code> and in <code>SELECT</code>, because both run after the window step</li>
            </ul>
            <CodeBlock
              title="Wrap it, then filter"
              language="sql"
              code={`-- Error: window functions are not allowed in WHERE
-- SELECT * FROM sessions WHERE ROW_NUMBER() OVER (ORDER BY created_at) = 1;

WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY created_at DESC
    ) AS rn
  FROM sessions
)
SELECT * FROM ranked WHERE rn = 1;`}
            />
            <CodeBlock
              title="Filtering also works for UPDATE and DELETE"
              language="sql"
              code={`-- Keep only the newest session per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id ORDER BY created_at DESC
  ) AS rn
  FROM sessions
)
DELETE FROM sessions s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you get the top N rows per group?">
            <p>
              Number the rows inside each group with <code>ROW_NUMBER()</code> and keep the ones you want. The
              alternative for small N is a <code>LATERAL</code> join, which is often faster.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Window version: <code>PARTITION BY group_col ORDER BY the_ranking_col DESC</code>, then <code>WHERE rn &lt;= 3</code> in an outer query</li>
              <li>Use <code>RANK</code> instead of <code>ROW_NUMBER</code> if ties should all be included, which can return more than N rows</li>
              <li>The window version scans and sorts the whole table. With many groups and a small N, <code>CROSS JOIN LATERAL</code> with a <code>LIMIT</code> per group can use an index and touch far fewer rows</li>
              <li>For exactly one row per group, PostgreSQL&apos;s <code>DISTINCT ON</code> is the shortest form of all</li>
              <li>The index that makes all three fast is on <code>(group_col, ranking_col DESC)</code></li>
            </ul>
            <CodeBlock
              title="Top 3 orders per user, three ways"
              language="sql"
              code={`-- 1. Window function: the portable answer
WITH ranked AS (
  SELECT
    id, user_id, total_cents,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY total_cents DESC, id
    ) AS rn
  FROM orders
)
SELECT id, user_id, total_cents
FROM ranked
WHERE rn <= 3
ORDER BY user_id, rn;

-- 2. LATERAL: often much faster with many users and a small N
SELECT u.id AS user_id, o.id, o.total_cents
FROM users u
CROSS JOIN LATERAL (
  SELECT id, total_cents
  FROM orders
  WHERE user_id = u.id
  ORDER BY total_cents DESC, id
  LIMIT 3
) o;

-- 3. DISTINCT ON: shortest way to get exactly one row per group
SELECT DISTINCT ON (user_id) user_id, id, total_cents
FROM orders
ORDER BY user_id, total_cents DESC, id;

-- The index that makes these fast
CREATE INDEX orders_user_total_idx ON orders (user_id, total_cents DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you calculate a running total, and what is a window frame?">
            <p>
              A frame is the slice of the partition the function actually looks at for the current row. Adding
              <code> ORDER BY</code> inside <code>OVER</code> changes the default frame from “the whole
              partition” to “everything up to the current row”, which is exactly a running total.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Default with no <code>ORDER BY</code>: the frame is the entire partition, so <code>SUM</code> gives one group total repeated on every row</li>
              <li>Default with <code>ORDER BY</code>: <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>, which accumulates</li>
              <li><strong>The trap:</strong> that default uses <code>RANGE</code>, which includes <em>all</em> rows with the same order value — so tied rows all show the same running total. Write <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> when you want strict row-by-row accumulation</li>
              <li><code>ROWS</code> counts physical rows; <code>RANGE</code> works on values; <code>GROUPS</code> works on peer groups of equal values</li>
              <li>A moving average uses a sliding frame: <code>ROWS BETWEEN 6 PRECEDING AND CURRENT ROW</code> for a 7-day average</li>
              <li><code>RANGE</code> with an interval gives a true time window that is correct even when days are missing from the data</li>
              <li><code>FIRST_VALUE</code>, <code>LAST_VALUE</code>, and <code>NTH_VALUE</code> depend heavily on the frame — <code>LAST_VALUE</code> with the default frame returns the current row, which surprises everyone once</li>
            </ul>
            <CodeBlock
              title="Running total and moving average"
              language="sql"
              code={`SELECT
  day,
  revenue,
  -- Running total, strict row by row
  SUM(revenue) OVER (
    ORDER BY day
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  -- 7 day moving average
  ROUND(AVG(revenue) OVER (
    ORDER BY day
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) AS avg_7d,
  -- True 7 day time window, correct even with missing days
  SUM(revenue) OVER (
    ORDER BY day
    RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW
  ) AS sum_7d,
  -- Day over day change
  revenue - LAG(revenue) OVER (ORDER BY day) AS change_vs_prev,
  -- Group total and the last day in the partition
  SUM(revenue) OVER ()                       AS grand_total,
  LAST_VALUE(revenue) OVER (
    ORDER BY day
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS final_day_revenue
FROM daily_sales
ORDER BY day;`}
            />
            <CodeBlock
              title="Running balance per account"
              language="sql"
              code={`SELECT
  account_id,
  posted_at,
  amount,
  SUM(amount) OVER (
    PARTITION BY account_id
    ORDER BY posted_at, id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS balance
FROM ledger_entries
ORDER BY account_id, posted_at, id;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
