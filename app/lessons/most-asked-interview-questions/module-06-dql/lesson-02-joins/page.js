import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Joins - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on SQL joins: INNER vs LEFT, RIGHT and FULL OUTER and CROSS and self joins, anti-joins, joining on multiple columns, join fan-out and duplicate rows, ON vs USING, and the LEFT JOIN WHERE trap.',
};

export default function M6L2Joins() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Joins</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A join combines rows from two tables using a matching condition. This is the single most asked
          SQL topic in interviews, and the duplicate-row question below is where most people slip.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Explain INNER JOIN vs LEFT JOIN.">
            <p>
              <code>INNER JOIN</code> returns only rows that match on both sides.
              <code>LEFT JOIN</code> returns every row from the left table. If the right table has no match,
              those columns are <code>NULL</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ask yourself: do I still want the left row when there is no match? Yes means <code>LEFT JOIN</code></li>
              <li>“All users with their order count, including users with zero orders” needs a <code>LEFT JOIN</code></li>
              <li><code>JOIN</code> on its own means <code>INNER JOIN</code></li>
            </ul>
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

          <InterviewQACard level="Junior" question="How do you join on more than one column?">
            <p>
              Put both conditions in the <code>ON</code> clause, joined with <code>AND</code>. This is normal
              whenever the key is composite, or when the match needs a tenant id as well as a row id.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Composite keys, like a junction table on <code>(student_id, course_id)</code>, always join on both columns</li>
              <li>Multi-tenant schemas join on <code>tenant_id</code> plus the real key, which also keeps a tenant from ever seeing another tenant&apos;s rows</li>
              <li>The index should cover the same columns in the same leading order as the join condition</li>
              <li>Forgetting one column does not error — it silently multiplies rows, which is the bug in the next question</li>
              <li>A range condition can sit in <code>ON</code> too, for example matching a price to the rate card that was valid at that date</li>
            </ul>
            <CodeBlock
              title="Multi-column joins"
              language="sql"
              code={`-- Composite key
SELECT e.enrolled_at, s.name, c.title
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses  c ON c.id = e.course_id;

-- Tenant-scoped join: both columns matter
SELECT o.id, i.sku
FROM orders o
JOIN order_items i
  ON i.order_id  = o.id
 AND i.tenant_id = o.tenant_id;

-- Range condition in the ON clause
SELECT s.id, s.sold_at, r.rate
FROM sales s
JOIN rate_cards r
  ON r.currency = s.currency
 AND s.sold_at >= r.valid_from
 AND s.sold_at <  r.valid_to;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, and self joins.">
            <p>
              <code>RIGHT JOIN</code> keeps every row from the right table (the opposite of LEFT).
              <code>FULL OUTER JOIN</code> keeps rows that match and rows that do not match on either side.
              <code>CROSS JOIN</code> pairs every row of A with every row of B.
              A self join joins a table to itself, for example an employee row to their manager row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>RIGHT JOIN</code> is rare in real code. Most teams flip the table order and use <code>LEFT JOIN</code> because it reads top to bottom</li>
              <li><code>CROSS JOIN</code> is deliberate when you want every combination, such as generating a grid of dates by products. An accidental one comes from a missing <code>ON</code> clause and explodes the row count</li>
              <li>A self join needs table aliases, because both sides are the same table name</li>
            </ul>
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
            <p>
              A lateral join is the useful one people forget: it lets the right side reference each left row,
              which is how you get “the 3 most recent orders per user”.
            </p>
            <CodeBlock
              title="LATERAL join"
              language="sql"
              code={`SELECT u.email, o.id, o.created_at
FROM users u
CROSS JOIN LATERAL (
  SELECT id, created_at
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 3
) o;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why does a join sometimes duplicate rows, and how do you fix it?">
            <p>
              This is called fan-out. If one user has five orders, joining users to orders gives that user five
              rows. Nothing is broken — the join is row by row — but your totals are now wrong.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>It happens on any one-to-many join, and it gets worse when you join two different one-to-many tables at once. Three orders and four addresses become twelve rows, and <code>SUM(total)</code> is four times too big</li>
              <li><strong>Do not</strong> paper over it with <code>DISTINCT</code>. It hides the cause and cannot repair a wrong sum</li>
              <li><strong>Fix 1 — aggregate before joining:</strong> reduce the many side to one row per key in a subquery or CTE, then join. This is the most reliable answer</li>
              <li><strong>Fix 2 — use EXISTS:</strong> if you only need “does a related row exist”, an anti/semi join never duplicates</li>
              <li><strong>Fix 3 — scalar subquery in the SELECT list:</strong> good for one or two small counts</li>
              <li><strong>Fix 4 — LATERAL with LIMIT:</strong> when you want a fixed number of related rows per parent</li>
              <li>Sanity check: <code>COUNT(DISTINCT u.id)</code> against <code>COUNT(*)</code>. If they differ, you have fan-out</li>
            </ul>
            <CodeBlock
              title="The bug and the fix"
              language="sql"
              code={`-- WRONG: revenue is multiplied by the number of addresses per user
SELECT u.id, SUM(o.total_cents) AS revenue
FROM users u
JOIN orders    o ON o.user_id = u.id
JOIN addresses a ON a.user_id = u.id
GROUP BY u.id;

-- RIGHT: collapse each side to one row per user first
SELECT
  u.id,
  COALESCE(o.revenue, 0)   AS revenue,
  COALESCE(a.addr_count, 0) AS addr_count
FROM users u
LEFT JOIN (
  SELECT user_id, SUM(total_cents) AS revenue
  FROM orders GROUP BY user_id
) o ON o.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS addr_count
  FROM addresses GROUP BY user_id
) a ON a.user_id = u.id;

-- Or keep it simple with scalar subqueries
SELECT
  u.id,
  (SELECT COALESCE(SUM(total_cents), 0) FROM orders    WHERE user_id = u.id) AS revenue,
  (SELECT COUNT(*)                      FROM addresses WHERE user_id = u.id) AS addr_count
FROM users u;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between ON and USING?">
            <p>
              Both say how two tables match. <code>USING (col)</code> is a shortcut for when the column has the
              exact same name on both sides.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>USING (user_id)</code> means the same thing as <code>ON a.user_id = b.user_id</code>, but shorter</li>
              <li><code>USING</code> merges the joined column, so the output has one <code>user_id</code>, not two. That also means <code>SELECT *</code> returns one fewer column</li>
              <li>After <code>USING</code> you refer to that column unqualified, as plain <code>user_id</code>. Writing <code>b.user_id</code> is an error in some contexts</li>
              <li><code>USING</code> only handles equality on identically named columns. Anything else — different names, multiple conditions, ranges, extra filters — needs <code>ON</code></li>
              <li>Most production code uses <code>ON</code> everywhere, because it is explicit and does not break when someone renames a column</li>
              <li><code>NATURAL JOIN</code> goes one step further and joins on every same-named column automatically. Avoid it: adding an unrelated <code>created_at</code> column to both tables silently changes the join</li>
            </ul>
            <CodeBlock
              title="ON vs USING"
              language="sql"
              code={`-- Equivalent results
SELECT u.email, o.id
FROM users u
JOIN orders o ON o.user_id = u.id;

SELECT email, id, user_id     -- user_id is unqualified, appears once
FROM users
JOIN orders USING (user_id);  -- only works because the names match

-- USING with several columns
SELECT * FROM orders JOIN order_items USING (order_id, tenant_id);

-- Needs ON: different names plus an extra condition
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id AND c.is_active;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Does join order matter, and how should you lay out a multi-table query?">
            <p>
              For correctness with inner joins, no — the planner reorders them freely and picks its own order
              from the statistics. For outer joins and for readability, yes it matters.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Inner joins are commutative, so writing A then B or B then A gives the same rows and usually the same plan</li>
              <li>Outer joins are not. Moving a <code>LEFT JOIN</code> earlier or later changes which rows are preserved, so the written order is part of the meaning</li>
              <li>Readable style: start from the main table your result is about, then join outward one relationship at a time, and keep each <code>ON</code> next to its table</li>
              <li>Once you <code>LEFT JOIN</code> a table, anything joined to <em>that</em> table should also be a <code>LEFT JOIN</code>, or you turn the whole chain back into an inner join</li>
              <li>Alias tables with short meaningful names and qualify every column. In a five-table query, unqualified columns are how ambiguity bugs get in</li>
              <li>The planner gives up reordering beyond <code>join_collapse_limit</code> (8 by default), so very wide queries can become order-sensitive for performance. If a query has a dozen joins, that is usually a sign to split it with a CTE</li>
            </ul>
            <CodeBlock
              title="Readable multi-table query"
              language="sql"
              code={`SELECT
  o.id                AS order_id,
  o.created_at,
  c.name              AS customer,
  p.name              AS product,
  i.qty,
  COALESCE(d.code, '-') AS discount_code
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN products    p ON p.id = i.product_id
JOIN customers   c ON c.id = o.customer_id
LEFT JOIN discounts d ON d.id = o.discount_id
WHERE o.created_at >= current_date - 30
ORDER BY o.created_at DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why can a WHERE clause cancel out a LEFT JOIN?">
            <p>
              Because <code>WHERE</code> runs after the join. The <code>LEFT JOIN</code> fills the missing side
              with NULL, and then a condition on that side throws those rows away — leaving you with an inner
              join by accident.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Any comparison against NULL is unknown, not true, so unmatched rows fail the filter and disappear</li>
              <li><strong>The rule:</strong> a condition on the <em>optional</em> table belongs in the <code>ON</code> clause. A condition on the <em>kept</em> table belongs in <code>WHERE</code></li>
              <li>The one exception is the deliberate anti-join: <code>WHERE o.id IS NULL</code> keeps only the unmatched rows, and that is the point</li>
              <li>A quick review habit: if a query has a <code>LEFT JOIN</code> and the <code>WHERE</code> mentions the right table, check whether it was meant to be in <code>ON</code></li>
            </ul>
            <CodeBlock
              title="The classic mistake"
              language="sql"
              code={`-- LOOKS like "all users, with their paid orders"
-- ACTUALLY only returns users who have a paid order
SELECT u.email, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid';

-- Correct: move the condition into the ON clause
SELECT u.email, o.id
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id
 AND o.status = 'paid';

-- Correct: filter on the kept table in WHERE
SELECT u.email, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.is_active;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you write a query that returns users with no orders (anti-join) efficiently?">
            <p>
              Use <code>NOT EXISTS</code> or <code>LEFT JOIN ... WHERE the right id IS NULL</code>.
              Both can use an index on the foreign key. Avoid <code>NOT IN (SELECT ...)</code> if that list can contain NULL.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>PostgreSQL plans both of these as an anti-join, so performance is usually the same. Pick the one your team reads more easily</li>
              <li><code>NOT EXISTS</code> is NULL-safe by design, which is why most people prefer it</li>
              <li>The <code>LEFT JOIN</code> form must test a column that is <code>NOT NULL</code> in the right table, normally its primary key. Testing a nullable column gives wrong answers</li>
              <li><code>EXCEPT</code> is a third option, but it deduplicates and compares whole rows, so it is usually slower</li>
              <li>The index that makes this fast is on the child&apos;s foreign key column, <code>orders (user_id)</code></li>
            </ul>
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
        </section>
      </div>
    </LessonLayout>
  );
}
