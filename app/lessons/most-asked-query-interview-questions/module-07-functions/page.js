import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 7: Functions & Operators - Most Asked Query Interview Questions',
  description: 'Most asked SQL function/operator query problems: strings, dates, aggregates, JSONB, DISTINCT ON',
};

export default function Module07FunctionQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 7: Functions &amp; Operators</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked function-heavy interview queries. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write queries using CONCAT, TRIM, LOWER, SUBSTRING, and ILIKE.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT CONCAT(first_name, ' ', last_name) AS full_name,
       LOWER(TRIM(email)) AS email_norm,
       SUBSTRING(phone FROM 1 FOR 3) AS area
FROM users
WHERE email ILIKE '%@acme.com';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write COALESCE / NULLIF and ROUND.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT COALESCE(nickname, name, 'unknown') AS display_name,
       ROUND(AVG(total), 2) AS avg_total
FROM orders
LEFT JOIN users ON users.id = orders.user_id
GROUP BY 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write string_agg and COUNT FILTER (very common Postgres question).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT department_id,
       COUNT(*) AS n,
       COUNT(*) FILTER (WHERE salary > 100000) AS high_earners,
       STRING_AGG(name, ', ' ORDER BY name) AS names
FROM employees
GROUP BY department_id;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write DISTINCT ON to get the latest order per user (Postgres-specific, often asked)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT DISTINCT ON (user_id)
  user_id, id, total, created_at
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT DISTINCT ON (user_id) user_id, id, total, created_at FROM orders ORDER BY user_id, created_at DESC'
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write JSONB operator queries: containment and text extraction."
          >
            <p>
              In SQL: <code>-&gt;</code>, <code>-&gt;&gt;</code>, <code>@&gt;</code>.
            </p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT payload->>'email' AS email
FROM events
WHERE payload @> '{"type":"signup"}'::jsonb;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write an expression index for LOWER(email) and the matching query.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE UNIQUE INDEX users_email_lower ON users (LOWER(email));
SELECT * FROM users WHERE LOWER(email) = LOWER('Ann@X.com');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write array overlap and JSON path existence queries.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM posts WHERE tags && ARRAY['sql', 'career'];

SELECT * FROM events
WHERE jsonb_path_exists(payload, '$.items[*] ? (@.sku == "ABC")');`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
