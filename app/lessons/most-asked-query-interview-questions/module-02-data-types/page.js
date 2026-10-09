import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 2: Data Types - Most Asked Query Interview Questions',
  description: 'Most asked SQL queries involving PostgreSQL data types, JSONB, dates, arrays, UUID, and Prisma mapping',
};

export default function Module02DataTypeQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 2: Data Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked query problems for Phase 2 — casts, timestamps, JSONB, arrays, UUID. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query to cast a text column to integer and filter numeric strings.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, amount_text::integer AS amount
FROM payments
WHERE amount_text ~ '^[0-9]+$';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to get today's date and rows created in the last 7 days (TIMESTAMPTZ).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT CURRENT_DATE, NOW();

SELECT *
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const orders = await prisma.order.findMany({
  where: { createdAt: { gte: since } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to filter BOOLEAN flags and NULLs correctly.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM users WHERE is_active IS TRUE;
SELECT * FROM users WHERE is_active IS NOT TRUE; -- includes FALSE and NULL
SELECT * FROM users WHERE is_active IS NULL;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({ where: { isActive: true } });
await prisma.user.findMany({ where: { isActive: null } });`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write an INSERT that generates a UUID primary key in PostgreSQL.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO customers (id, email)
VALUES (gen_random_uuid(), 'a@example.com')
RETURNING id, email;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`model Customer {
  id    String @id @default(uuid()) @db.Uuid
  email String @unique
}

const c = await prisma.customer.create({
  data: { email: 'a@example.com' },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Write a query to extract JSONB fields: status as text and nested customer id."
          >
            <p>
              Use <code>-&gt;</code> for JSONB and <code>-&gt;&gt;</code> for text. This is one of the most asked
              Postgres query questions.
            </p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  id,
  payload->>'status' AS status,
  payload->'customer'->>'id' AS customer_id,
  (payload->>'total')::numeric AS total
FROM events
WHERE payload->>'status' = 'paid';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const paid = await prisma.event.findMany({
  where: {
    payload: { path: ['status'], equals: 'paid' },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query using date_trunc and AGE.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT date_trunc('month', created_at) AS month, COUNT(*)
FROM orders
GROUP BY 1
ORDER BY 1;

SELECT id, AGE(NOW(), hired_at) AS tenure
FROM employees;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to unnest an array column and count tags.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT tag, COUNT(*)
FROM posts, unnest(tags) AS tag
GROUP BY tag
ORDER BY COUNT(*) DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to find rows whose array contains a value.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM posts WHERE 'sql' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['sql', 'postgres'];`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write a query using a GIN-friendly JSONB containment predicate (and an expression index on a hot key)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE INDEX events_payload_gin ON events USING GIN (payload jsonb_path_ops);
CREATE INDEX events_status_btree ON events ((payload->>'status'));

SELECT * FROM events
WHERE payload @> '{"status":"paid"}'::jsonb;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a query that uses a GENERATED column derived from JSONB.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE events
  ADD COLUMN status text GENERATED ALWAYS AS (payload->>'status') STORED;

CREATE INDEX events_status_idx ON events (status);

SELECT * FROM events WHERE status = 'paid';`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write a query that compares NUMERIC money correctly (never FLOAT)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, amount
FROM invoices
WHERE amount >= 100.00
ORDER BY amount DESC;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`model Invoice {
  id     Int     @id @default(autoincrement())
  amount Decimal @db.Decimal(12, 2)
}

await prisma.invoice.findMany({
  where: { amount: { gte: '100.00' } },
  orderBy: { amount: 'desc' },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
