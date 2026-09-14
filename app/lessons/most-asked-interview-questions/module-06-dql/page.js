import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 6: DQL / SELECT - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL DQL interview questions: SELECT, JOINs, GROUP BY, CTEs, window functions, and Prisma findMany patterns — Junior to Senior.',
};

export default function Module6DQL() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 6: DQL / SELECT</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 6 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DQL, and what does SELECT do?">
            <p>
              DQL (Data Query Language) is the subset of SQL used to retrieve data. In PostgreSQL, that is
              essentially the <code>SELECT</code> statement: choose columns, filter rows, join tables, aggregate,
              and return a result set without modifying stored data (aside from side effects like
              <code>SELECT ... FOR UPDATE</code>).
            </p>
            <CodeBlock
              title="Basic SELECT"
              language="sql"
              code={`SELECT id, email, created_at
FROM users
WHERE is_active = true;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does SELECT DISTINCT do? When would you use it?">
            <p>
              <code>DISTINCT</code> removes duplicate rows from the result based on the selected columns. Use it
              when you need unique combinations (e.g., distinct cities), not as a substitute for fixing bad joins
              that inflate rows.
            </p>
            <CodeBlock
              title="DISTINCT"
              language="sql"
              code={`SELECT DISTINCT city
FROM customers
ORDER BY city;

-- Distinct on multiple columns = unique pairs
SELECT DISTINCT department_id, job_title
FROM employees;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between WHERE and HAVING?">
            <p>
              <code>WHERE</code> filters rows <em>before</em> aggregation. <code>HAVING</code> filters groups
              <em>after</em> <code>GROUP BY</code>. You cannot put aggregate conditions in <code>WHERE</code>
              (e.g., <code>COUNT(*) &gt; 5</code> belongs in <code>HAVING</code>).
            </p>
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

          <InterviewQACard level="Junior" question="How do ORDER BY, LIMIT, and OFFSET work together?">
            <p>
              <code>ORDER BY</code> sorts the result. <code>LIMIT n</code> returns at most n rows.
              <code>OFFSET m</code> skips the first m rows. Always pair pagination with a stable
              <code>ORDER BY</code>; without it, which rows you get is undefined.
            </p>
            <CodeBlock
              title="Pagination"
              language="sql"
              code={`SELECT id, title
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 40;  -- page 3 if page size = 20`}
            />
            <CodeBlock
              title="Prisma: orderBy / take / skip"
              language="typescript"
              code={`const posts = await prisma.post.findMany({
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 20,
  skip: 40,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain INNER JOIN vs LEFT JOIN.">
            <p>
              <code>INNER JOIN</code> returns only matching rows from both tables.
              <code>LEFT JOIN</code> returns all rows from the left table and matching rows from the right;
              non-matches get <code>NULL</code> on the right side.
            </p>
            <CodeBlock
              title="INNER vs LEFT"
              language="sql"
              code={`-- Only users who have orders
SELECT u.email, o.id AS order_id
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- All users, including those with no orders
SELECT u.email, o.id AS order_id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you filter NULL values correctly?">
            <p>
              Use <code>IS NULL</code> / <code>IS NOT NULL</code>. Comparisons like <code>= NULL</code> or
              <code>!= NULL</code> never match because any comparison with <code>NULL</code> yields
              <code>UNKNOWN</code>.
            </p>
            <CodeBlock
              title="NULL checks"
              language="sql"
              code={`SELECT *
FROM users
WHERE deleted_at IS NULL;

-- Wrong (never returns rows):
-- WHERE deleted_at = NULL`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, and self joins.">
            <p>
              <code>RIGHT JOIN</code> keeps all right-table rows (mirror of LEFT). <code>FULL OUTER JOIN</code>
              keeps non-matching rows from both sides. <code>CROSS JOIN</code> is a Cartesian product.
              A self join joins a table to itself (common for hierarchies like employee → manager).
            </p>
            <CodeBlock
              title="Join flavors"
              language="sql"
              code={`-- Full outer: customers without orders + orders without customers
SELECT c.name, o.id
FROM customers c
FULL OUTER JOIN orders o ON o.customer_id = c.id;

-- Cross join: every size × every color
SELECT s.label, c.name
FROM sizes s
CROSS JOIN colors c;

-- Self join: employee with manager name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does GROUP BY work with aggregate functions?">
            <p>
              Non-aggregated columns in <code>SELECT</code> must appear in <code>GROUP BY</code> (PostgreSQL
              enforces this). Aggregates like <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>,
              <code>MIN</code>, <code>MAX</code> collapse each group into one row.
            </p>
            <CodeBlock
              title="GROUP BY"
              language="sql"
              code={`SELECT
  status,
  COUNT(*) AS order_count,
  SUM(total_cents) AS revenue
FROM orders
GROUP BY status
ORDER BY revenue DESC;`}
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

          <InterviewQACard level="Mid" question="When would you use a subquery vs a JOIN?">
            <p>
              JOINs are usually clearer and often faster when you need columns from multiple tables.
              Subqueries shine for existence checks, “value from another query,” or filtering with aggregates
              without exploding row counts. Prefer JOINs for set combination; prefer subqueries/EXISTS for
              “does a related row exist?”
            </p>
            <CodeBlock
              title="Subquery vs JOIN"
              language="sql"
              code={`-- Subquery: users with at least one paid order
SELECT *
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.status = 'paid'
);

-- JOIN + DISTINCT/GROUP BY if you need similar filtering
SELECT DISTINCT u.*
FROM users u
JOIN orders o ON o.user_id = u.id AND o.status = 'paid';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between EXISTS and IN?">
            <p>
              <code>IN</code> compares against a list/set of values. <code>EXISTS</code> stops at the first
              matching row and is often preferred for correlated “has related row” checks.
              With <code>NULL</code>s, <code>NOT IN</code> is dangerous: if the subquery returns any
              <code>NULL</code>, <code>NOT IN</code> can return no rows. Prefer <code>NOT EXISTS</code>.
            </p>
            <CodeBlock
              title="EXISTS vs IN / NOT IN trap"
              language="sql"
              code={`-- Safe anti-join
SELECT *
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- Risky if subquery can return NULL department_id
-- SELECT * FROM employees WHERE dept_id NOT IN (SELECT id FROM departments);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are CTEs (WITH), and why use them?">
            <p>
              Common Table Expressions name a subquery for readability, reuse within one statement, and
              recursive hierarchies. In modern PostgreSQL they are often inlined like subqueries; they are
              primarily for clarity unless you use <code>MATERIALIZED</code> / <code>NOT MATERIALIZED</code>
              hints (PG 12+).
            </p>
            <CodeBlock
              title="CTE example"
              language="sql"
              code={`WITH paid_orders AS (
  SELECT user_id, SUM(total_cents) AS spent
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
)
SELECT u.email, p.spent
FROM users u
JOIN paid_orders p ON p.user_id = u.id
WHERE p.spent > 10000
ORDER BY p.spent DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="UNION vs UNION ALL — which should you use?">
            <p>
              <code>UNION</code> concatenates result sets and removes duplicates (extra sort/hash cost).
              <code>UNION ALL</code> keeps duplicates and is cheaper. Prefer <code>UNION ALL</code> unless you
              truly need uniqueness.
            </p>
            <CodeBlock
              title="UNION ALL"
              language="sql"
              code={`SELECT email FROM customers
UNION ALL
SELECT email FROM leads;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you use CASE expressions in SELECT?">
            <p>
              <code>CASE</code> maps conditions to values in the result (or in <code>ORDER BY</code> /
              aggregates). Prefer searched <code>CASE WHEN ... THEN</code> for complex logic.
            </p>
            <CodeBlock
              title="CASE"
              language="sql"
              code={`SELECT
  id,
  total_cents,
  CASE
    WHEN total_cents >= 10000 THEN 'high'
    WHEN total_cents >= 2500 THEN 'medium'
    ELSE 'low'
  END AS value_tier
FROM orders;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Give an overview of window functions: ROW_NUMBER, RANK, LAG/LEAD.">
            <p>
              Window functions compute across related rows without collapsing the result like
              <code>GROUP BY</code>. <code>ROW_NUMBER()</code> assigns unique ranks within a partition.
              <code>RANK()</code> allows gaps after ties. <code>LAG</code>/<code>LEAD</code> access previous/next
              row values — classic for period-over-period comparisons.
            </p>
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you implement keyset (cursor) pagination instead of OFFSET?">
            <p>
              Large <code>OFFSET</code> forces the database to scan and discard skipped rows.
              Keyset pagination filters with <code>WHERE (created_at, id) &lt; ($cursor_ts, $cursor_id)</code>
              and is stable and faster for deep pages.
            </p>
            <CodeBlock
              title="Keyset pagination"
              language="sql"
              code={`SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < ($1::timestamptz, $2::bigint)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do Prisma findMany options map to SQL: where, include, select, orderBy, take, skip?">
            <p>
              <code>where</code> → <code>WHERE</code>, <code>orderBy</code> → <code>ORDER BY</code>,
              <code>take</code>/<code>skip</code> → <code>LIMIT</code>/<code>OFFSET</code>.
              <code>include</code> loads relations (often separate queries or joins).
              <code>select</code> projects specific scalar/relation fields and is better for payload control
              than fetching full models.
            </p>
            <CodeBlock
              title="Prisma findMany"
              language="typescript"
              code={`const users = await prisma.user.findMany({
  where: {
    isActive: true,
    orders: { some: { status: 'paid' } }, // EXISTS-style filter
  },
  select: {
    id: true,
    email: true,
    orders: {
      select: { id: true, totalCents: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  skip: 0,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you write a query that returns users with no orders (anti-join) efficiently?">
            <p>
              Prefer <code>NOT EXISTS</code> or <code>LEFT JOIN ... WHERE right.id IS NULL</code>. Both can use
              indexes on the foreign key. Avoid <code>NOT IN (SELECT ...)</code> when NULLs are possible.
            </p>
            <CodeBlock
              title="Anti-join patterns"
              language="sql"
              code={`SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- Equivalent LEFT JOIN anti-join
SELECT u.id, u.email
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const users = await prisma.user.findMany({
  where: { orders: { none: {} } },
  select: { id: true, email: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is the logical processing order of a SELECT query?">
            <p>
              Rough order interviewers expect: <code>FROM</code>/<code>JOIN</code> → <code>WHERE</code> →
              <code>GROUP BY</code> → <code>HAVING</code> → <code>SELECT</code> (expressions/aliases) →
              <code>DISTINCT</code> → <code>ORDER BY</code> → <code>LIMIT</code>/<code>OFFSET</code>.
              Window functions are evaluated after grouping and before final ordering of the result, which is
              why you often wrap them in a CTE/subquery to filter on <code>ROW_NUMBER</code>.
            </p>
            <CodeBlock
              title="Filter on window result via CTE"
              language="sql"
              code={`WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY created_at DESC
    ) AS rn
  FROM sessions
)
SELECT * FROM ranked WHERE rn = 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
