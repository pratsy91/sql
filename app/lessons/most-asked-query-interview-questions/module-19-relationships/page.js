import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 19: Relationships - Most Asked Query Interview Questions',
  description:
    'Most asked relationship queries: 1:1, 1:N, M:N, self-join, recursive CTE, orphans, Prisma include',
};

export default function Module19RelationshipQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 19: Relationships &amp; Schema Design</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked relationship query problems — joins, junction tables, trees. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a 1:1 join: user + profile.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT u.id, u.email, p.bio
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.id = 1;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id: 1 },
  include: { profile: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a 1:N query: all orders for a customer with totals.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT c.id, c.name, o.id AS order_id, o.total
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE c.id = 7;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.customer.findUnique({
  where: { id: 7 },
  include: { orders: true },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write M:N: students enrolled in a course (junction table).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT s.id, s.name
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
WHERE c.code = 'CS101';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.student.findMany({
  where: { enrollments: { some: { course: { code: 'CS101' } } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a self-join: employee and manager names.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write a query for orphan orders (customer_id with no matching customer)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT o.*
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE c.id IS NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write a recursive CTE for comments (adjacency list).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`WITH RECURSIVE thread AS (
  SELECT id, parent_id, body, 1 AS depth
  FROM comments
  WHERE post_id = 99 AND parent_id IS NULL
  UNION ALL
  SELECT c.id, c.parent_id, c.body, t.depth + 1
  FROM comments c
  JOIN thread t ON c.parent_id = t.id
)
SELECT * FROM thread ORDER BY depth, id;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write Prisma nested include for user → orders → items without over-fetching."
          >
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    orders: {
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        items: { select: { sku: true, qty: true } },
      },
    },
  },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
