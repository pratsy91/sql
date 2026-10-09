import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Subqueries and CTEs - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on subqueries and CTEs: subquery vs JOIN, EXISTS vs IN and the NOT IN NULL trap, correlated subqueries, scalar subqueries, derived tables, WITH clauses, and recursive CTEs for a manager tree.',
};

export default function M6L4SubqueriesAndCtes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Subqueries and CTEs</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A subquery is a query inside another query. A CTE is the same idea with a name in front, written
          above the main query so it reads top to bottom.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When would you use a subquery vs a JOIN?">
            <p>
              Use a JOIN when you need columns from both tables. Use a subquery when you only need to check
              “does a related row exist?” or to filter by a single value from another query.
              A JOIN can duplicate rows if one user has many orders. A subquery often avoids that.
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
              <code>IN</code> checks if a value is in a list. <code>EXISTS</code> stops as soon as it finds one
              matching row, which is a good way to ask “does this user have an order?”
              <code>NOT IN</code> is unsafe if the list contains NULL: the whole filter can return no rows.
              Use <code>NOT EXISTS</code> instead.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Why <code>NOT IN</code> breaks: <code>x NOT IN (1, NULL)</code> means <code>x &lt;&gt; 1 AND x &lt;&gt; NULL</code>. The second part is unknown, so the whole thing is never true and you get zero rows</li>
              <li><code>IN</code> with a NULL in the list is safe for matches, it just cannot prove a non-match</li>
              <li>For plain <code>IN</code> versus <code>EXISTS</code>, PostgreSQL usually plans both as a semi-join, so performance is similar. Choose based on readability</li>
              <li><code>IN</code> is more natural for a small fixed list of literals; <code>EXISTS</code> is more natural for a related table with extra conditions</li>
            </ul>
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
-- SELECT * FROM employees WHERE dept_id NOT IN (SELECT id FROM departments);

-- If you must use NOT IN, exclude NULLs explicitly
SELECT * FROM employees
WHERE dept_id NOT IN (SELECT id FROM departments WHERE id IS NOT NULL);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a correlated subquery, and what does it cost?">
            <p>
              A correlated subquery mentions a column from the outer query, so it depends on the current outer
              row. Conceptually it runs once per outer row, which is where the cost comes from.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>An <strong>uncorrelated</strong> subquery can run once and be reused, for example <code>WHERE price &gt; (SELECT avg(price) FROM products)</code></li>
              <li>A <strong>correlated</strong> one cannot, because the answer changes per row: <code>WHERE o.user_id = u.id</code> ties it to the outer row</li>
              <li>The naive cost is a nested loop: a million outer rows means a million inner lookups. With a good index on the correlated column each lookup is cheap, and the plan is fine</li>
              <li>PostgreSQL often rewrites correlated <code>EXISTS</code> and <code>IN</code> into a semi-join or hash join, so in practice it is usually fast. Correlated subqueries in the <code>SELECT</code> list are the ones that stay as nested loops</li>
              <li>When it is slow, the fix is to aggregate once in a derived table or CTE and join to it, turning N lookups into one pass</li>
              <li>Read the plan: <code>SubPlan</code> that runs per row is the warning sign, and the loop count in <code>EXPLAIN ANALYZE</code> tells you how many times</li>
            </ul>
            <CodeBlock
              title="Correlated, and the set-based rewrite"
              language="sql"
              code={`-- Correlated: one lookup per user
SELECT
  u.id,
  u.email,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;

-- Set-based rewrite: one aggregation pass, then a join
SELECT u.id, u.email, COALESCE(c.order_count, 0) AS order_count
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS order_count
  FROM orders
  GROUP BY user_id
) c ON c.user_id = u.id;

-- Uncorrelated: evaluated once
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a scalar subquery in the SELECT list?">
            <p>
              A scalar subquery returns exactly one row and one column, so it can be used anywhere a single
              value is expected — including as a column in your result.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>If it returns no row, the value is NULL. If it returns more than one row, the query errors at run time</li>
              <li>Add <code>LIMIT 1</code> and an <code>ORDER BY</code> when “one row” is not guaranteed, so you control which row wins</li>
              <li>It is the tidiest way to add one or two counts to a list without any join fan-out risk</li>
              <li>Wrap it in <code>COALESCE</code> when NULL should display as 0</li>
              <li>Do not stack five of them on a large result set — that is five lookups per row. Switch to a join against a grouped subquery, or use <code>LATERAL</code> if you need several columns from the same related row</li>
              <li>Scalar subqueries also work in <code>WHERE</code>, <code>ORDER BY</code>, and even <code>SET</code> in an <code>UPDATE</code></li>
            </ul>
            <CodeBlock
              title="Scalar subqueries"
              language="sql"
              code={`SELECT
  u.id,
  u.email,
  COALESCE((SELECT COUNT(*)   FROM orders o WHERE o.user_id = u.id), 0) AS order_count,
  (SELECT MAX(o.created_at)   FROM orders o WHERE o.user_id = u.id)     AS last_order_at,
  (SELECT o.status FROM orders o
    WHERE o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 1)                                                            AS last_status
FROM users u
ORDER BY last_order_at DESC NULLS LAST;

-- Several columns from the same related row: LATERAL is cleaner
SELECT u.email, last_order.id, last_order.total_cents
FROM users u
LEFT JOIN LATERAL (
  SELECT id, total_cents
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
) AS last_order ON true;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a derived table in FROM?">
            <p>
              A derived table is a subquery used in the <code>FROM</code> clause. Its result is treated like a
              temporary table for the rest of the query, and it must be given an alias.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Also called an inline view. It exists only for this one statement — nothing is stored</li>
              <li>PostgreSQL requires the alias, so <code>) AS t</code> is not optional</li>
              <li>Its main job is to reduce a one-to-many table to one row per key <em>before</em> joining, which is the standard fix for duplicated rows and inflated sums</li>
              <li>It also lets you filter on something you cannot filter on directly, such as a column alias or an aggregate result</li>
              <li>A CTE does the same job with a name at the top, so pick whichever reads better. Deeply nested derived tables are usually clearer as CTEs</li>
              <li>The planner can usually flatten a simple derived table into the outer query, so there is no inherent performance penalty</li>
            </ul>
            <CodeBlock
              title="Derived table in FROM"
              language="sql"
              code={`SELECT u.email, o.order_count, o.revenue
FROM users u
JOIN (
  SELECT user_id, COUNT(*) AS order_count, SUM(total_cents) AS revenue
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
) AS o ON o.user_id = u.id     -- alias is required
WHERE o.revenue > 10000
ORDER BY o.revenue DESC;

-- Filter on a computed value you could not reference in WHERE
SELECT *
FROM (
  SELECT id, total_cents / 100.0 AS dollars FROM orders
) AS t
WHERE dollars > 250;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are CTEs (WITH), and why use them?">
            <p>
              A CTE (<code>WITH</code>) gives a name to a query so you can use it later in the same statement.
              It makes long queries easier to read, and it can walk a tree (a manager and their reports).
              Postgres often runs it like a normal subquery. You only force it to run first with <code>MATERIALIZED</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You can chain several CTEs, and a later one can use an earlier one, which turns a monster query into readable steps</li>
              <li>Before PostgreSQL 12, every CTE was an optimisation fence and always ran separately. From 12 onward a CTE used once is inlined, unless you write <code>MATERIALIZED</code></li>
              <li>Use <code>MATERIALIZED</code> when the CTE is expensive and referenced several times, or when you deliberately want to stop the planner pushing filters inside</li>
              <li>A CTE can also contain <code>INSERT</code>, <code>UPDATE</code>, or <code>DELETE</code> with <code>RETURNING</code>, which is how you move rows between tables in one statement</li>
            </ul>
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
            <CodeBlock
              title="Chained CTEs and MATERIALIZED"
              language="sql"
              code={`WITH recent AS MATERIALIZED (
  SELECT * FROM orders WHERE created_at >= current_date - 30
),
per_user AS (
  SELECT user_id, COUNT(*) AS orders, SUM(total_cents) AS spend
  FROM recent
  GROUP BY user_id
)
SELECT u.email, p.orders, p.spend
FROM per_user p
JOIN users u ON u.id = p.user_id
ORDER BY p.spend DESC
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you write a recursive CTE to walk a manager tree?">
            <p>
              A recursive CTE has two halves joined by <code>UNION ALL</code>. The first half is the starting
              row or rows. The second half joins back to the CTE itself to find the next level, and it repeats
              until nothing new is found.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Write <code>WITH RECURSIVE</code>, even when only one of several CTEs is recursive</li>
              <li>The first part is the <strong>anchor</strong>: the top manager, or the employee you are starting from</li>
              <li>The second part is the <strong>recursive step</strong>: join the table to the CTE name to fetch children of what you already have</li>
              <li>Carry a depth counter so you can limit how deep you go and sort the output sensibly</li>
              <li>Carry a path array and add <code>WHERE NOT id = ANY(path)</code> to survive a cycle. Without that, one bad row where someone manages themselves loops forever</li>
              <li><code>UNION</code> instead of <code>UNION ALL</code> removes duplicates each round, which also stops simple cycles but costs more</li>
              <li>Same pattern for any hierarchy: category trees, comment threads, bill of materials, graph reachability</li>
              <li>Alternative for deep trees that are read constantly: store a materialised path or use the <code>ltree</code> extension, so reads are a single index scan</li>
            </ul>
            <CodeBlock
              title="Recursive CTE: everyone under a manager"
              language="sql"
              code={`WITH RECURSIVE org AS (
  -- Anchor: the person we start from
  SELECT id, name, manager_id, 1 AS depth, ARRAY[id] AS path
  FROM employees
  WHERE id = 1

  UNION ALL

  -- Recursive step: direct reports of everyone found so far
  SELECT e.id, e.name, e.manager_id, o.depth + 1, o.path || e.id
  FROM employees e
  JOIN org o ON e.manager_id = o.id
  WHERE o.depth < 20                 -- safety limit
    AND NOT e.id = ANY(o.path)       -- cycle protection
)
SELECT depth, repeat('  ', depth - 1) || name AS chart, id, manager_id
FROM org
ORDER BY path;`}
            />
            <CodeBlock
              title="Walk upward: the chain of managers above one employee"
              language="sql"
              code={`WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE id = 42

  UNION ALL

  SELECT m.id, m.name, m.manager_id, c.level + 1
  FROM employees m
  JOIN chain c ON m.id = c.manager_id
)
SELECT level, name FROM chain ORDER BY level;`}
            />
            <CodeBlock
              title="Prisma needs raw SQL for recursion"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'WITH RECURSIVE org AS (' +
  '  SELECT id, name, manager_id, 1 AS depth FROM employees WHERE id = $1' +
  '  UNION ALL' +
  '  SELECT e.id, e.name, e.manager_id, o.depth + 1' +
  '  FROM employees e JOIN org o ON e.manager_id = o.id' +
  '  WHERE o.depth < 20' +
  ') SELECT * FROM org ORDER BY depth, id',
  rootId
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
