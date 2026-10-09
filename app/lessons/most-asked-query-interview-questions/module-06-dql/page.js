import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 6: DQL / SELECT - Most Asked Query Interview Questions',
  description:
    'Classic most-asked SELECT interview queries: joins, 2nd highest salary, duplicates, windows, CTEs, Prisma',
};

export default function Module06DqlQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 6: DQL / SELECT</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The densest module — these are the queries interviewers actually ask you to write. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query to select specific columns, filter, sort, and limit.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, email, name
FROM users
WHERE is_active = TRUE
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({
  where: { isActive: true },
  select: { id: true, email: true, name: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write INNER JOIN vs LEFT JOIN: users with orders, and users with no orders.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT u.email, o.id AS order_id
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

SELECT u.*
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({
  where: { orders: { none: {} } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write COUNT, DISTINCT, LIKE, BETWEEN, IS NULL.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT city) FROM users;
SELECT * FROM users WHERE email ILIKE '%@gmail.com';
SELECT * FROM orders WHERE total BETWEEN 10 AND 100;
SELECT * FROM users WHERE last_login_at IS NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Write a query for the 2nd highest salary (the most asked SQL question)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
OFFSET 1 LIMIT 1;

SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) t
WHERE rnk = 2;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to find duplicate emails and their counts.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a self-join: employees who earn more than their manager.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write GROUP BY + HAVING: departments with average salary greater than 80k."
          >
            <p>
              Filter rows with WHERE, groups with HAVING. Do not put <code>AVG(salary) &gt; 80000</code> in WHERE.
            </p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT department_id, AVG(salary) AS avg_salary, COUNT(*) AS n
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 80000;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const rows = await prisma.employee.groupBy({
  by: ['departmentId'],
  _avg: { salary: true },
  _count: { _all: true },
  having: { salary: { _avg: { gt: 80000 } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write EXISTS vs IN: users who placed at least one order.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- Prefer NOT EXISTS over NOT IN (NULL trap)
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write UNION vs UNION ALL, CASE, and a CTE.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT email FROM customers
UNION ALL
SELECT email FROM leads;

SELECT id,
  CASE
    WHEN total >= 100 THEN 'high'
    WHEN total >= 50 THEN 'mid'
    ELSE 'low'
  END AS band
FROM orders;

WITH paid AS (
  SELECT user_id, SUM(total) AS spent
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
)
SELECT u.email, p.spent
FROM paid p
JOIN users u ON u.id = p.user_id;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write top N orders per user (ROW_NUMBER or DISTINCT ON)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM orders o
) t
WHERE rn <= 3;

SELECT DISTINCT ON (user_id) *
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a running total of order amounts per user.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT user_id, created_at, total,
       SUM(total) OVER (
         PARTITION BY user_id
         ORDER BY created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a recursive CTE for an org chart (employee → manager).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 AS depth, name::text AS path
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1, t.path || ' > ' || e.name
  FROM employees e
  JOIN tree t ON e.manager_id = t.id
)
SELECT * FROM tree ORDER BY path;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write keyset pagination (better than OFFSET for large pages).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, created_at, email
FROM users
WHERE (created_at, id) < ('2024-01-01+00', 1000)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({
  take: 20,
  skip: 1,
  cursor: { id: 1000 },
  orderBy: { id: 'desc' },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
