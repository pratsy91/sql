import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 6: DQL - Output-Based Interview Questions',
  description:
    'Predict JOIN, NULL, GROUP BY, UNION, window, and Prisma findMany output — classic SQL interview results',
};

export default function OutputModule06() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 6: DQL / SELECT</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Densest output module: given data + SQL/Prisma, what rows come back? Junior → Senior.
        </p>

        <p className="mb-6 text-sm">
          Shared sample:{' '}
          <code>users(id, name)</code> = (1, Ann), (2, Bob). <code>orders(id, user_id)</code> = (10, 1), (11, 1).
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="INNER JOIN users-orders vs LEFT JOIN. How many rows, and does Bob appear?"
          >
            <CodeBlock
              title="Given"
              language="sql"
              code={`SELECT u.name, o.id FROM users u INNER JOIN orders o ON o.user_id = u.id;
SELECT u.name, o.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;`}
            />
            <p>
              INNER: <strong>2 rows</strong> (Ann twice). Bob absent. LEFT: <strong>3 rows</strong> — Ann twice, Bob
              with <code>o.id = NULL</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="SELECT * FROM users WHERE name = NULL; vs WHERE name IS NULL; Output?"
          >
            <p>
              <code>= NULL</code> is unknown → <strong>0 rows</strong>. <code>IS NULL</code> returns users whose name
              is actually null.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="This Prisma is meant to load users without orders. What does it actually return?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`const users = await prisma.user.findMany({
  include: { orders: true },
});
const none = users.filter((u) => u.orders.length === 0);`}
            />
            <p>
              Works but over-fetches every order. Interview-correct filter is in the query.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`const none = await prisma.user.findMany({
  where: { orders: { none: {} } },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="SELECT COUNT(*) vs COUNT(user_id) vs COUNT(DISTINCT user_id) on orders (2 rows, same user)."
          >
            <p>
              <code>2</code>, <code>2</code>, <code>1</code>. <code>COUNT(col)</code> skips NULLs;{' '}
              <code>COUNT(*)</code> counts rows.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="SELECT name FROM users UNION SELECT name FROM users; vs UNION ALL. Output row count?"
          >
            <p>
              UNION: <strong>2</strong> (distinct). UNION ALL: <strong>4</strong> (duplicates kept).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="SELECT id, name FROM users GROUP BY id; vs GROUP BY name only when names are unique — which errors?"
          >
            <p>
              Postgres: grouping by PK <code>id</code> is allowed (id determines name). <code>GROUP BY name</code>{' '}
              while selecting <code>id</code> <strong>errors</strong> unless id is functionally dependent (it is not).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Salaries 100, 100, 90. What does DENSE_RANK vs RANK vs ROW_NUMBER return for 2nd place?"
          >
            <CodeBlock
              title="Given"
              language="sql"
              code={`SELECT salary,
  RANK() OVER (ORDER BY salary DESC) AS r,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS d,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS n
FROM employees;`}
            />
            <p>
              Two 100s: RANK 1,1 then 3; DENSE_RANK 1,1 then 2; ROW_NUMBER 1,2,3. “2nd highest salary” interviews
              usually want <strong>90</strong> via <code>DENSE_RANK = 2</code>, not RANK.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="NOT IN (SELECT manager_id FROM employees) when some manager_id are NULL. Output?"
          >
            <p>
              Often <strong>empty</strong>. <code>x NOT IN (1, NULL)</code> is unknown for every x. Prefer{' '}
              <code>NOT EXISTS</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="CROSS JOIN users and orders (2 users, 2 orders). Row count? What if someone writes it by mistake instead of INNER JOIN?"
          >
            <p>
              <strong>4 rows</strong> (cartesian). Interviews use this when a missing ON clause “duplicates” data.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Prisma: include and select on the same findMany. Output?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.user.findMany({
  select: { id: true },
  include: { orders: true },
});`}
            />
            <p>
              <strong>Throws</strong> at runtime: cannot mix top-level <code>select</code> and <code>include</code>.
              Nest the relation under <code>select</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findMany({
  select: { id: true, orders: true },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
