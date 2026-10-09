import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 5: DML - Most Asked Query Interview Questions',
  description: 'Most asked INSERT/UPDATE/DELETE/UPSERT/MERGE interview queries with Prisma equivalents',
};

export default function Module05DmlQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 5: DML</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked write-query interview problems: INSERT, UPDATE, DELETE, UPSERT, MERGE. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write INSERT ... RETURNING for a new user.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('a@x.com', 'Ann')
RETURNING id, email, created_at;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const user = await prisma.user.create({
  data: { email: 'a@x.com', name: 'Ann' },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write UPDATE and DELETE with a WHERE clause (never forget WHERE).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`UPDATE users SET name = 'Ann Lee' WHERE id = 1;
DELETE FROM sessions WHERE user_id = 1 AND expires_at < NOW();`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Ann Lee' },
});
await prisma.session.deleteMany({
  where: { userId: 1, expiresAt: { lt: new Date() } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Write DELETE vs TRUNCATE vs DROP as statements and say what each does."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
TRUNCATE TABLE logs;
DROP TABLE logs;`}
            />
            <p>
              DELETE removes rows (can WHERE, logged, rollback). TRUNCATE empties the table fast (no WHERE). DROP
              removes the table.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write UPSERT: insert user or update name on email conflict.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('a@x.com', 'Ann')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name
RETURNING *;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.upsert({
  where: { email: 'a@x.com' },
  create: { email: 'a@x.com', name: 'Ann' },
  update: { name: 'Ann' },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write a query to delete duplicate emails, keeping the lowest id (classic)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`DELETE FROM users u
USING users d
WHERE u.email = d.email
  AND u.id > d.id;

-- Window version
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM users
  ) t
  WHERE rn > 1
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write INSERT ... SELECT and UPDATE from a join.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO archive_orders (id, user_id, total)
SELECT id, user_id, total FROM orders WHERE status = 'cancelled';

UPDATE orders o
SET user_email = u.email
FROM users u
WHERE u.id = o.user_id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write Prisma createMany with skipDuplicates.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.createMany({
  data: [
    { email: 'a@x.com', name: 'A' },
    { email: 'b@x.com', name: 'B' },
  ],
  skipDuplicates: true,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write MERGE (PostgreSQL 15+) to upsert from a staging table.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`MERGE INTO users AS t
USING staging_users AS s
ON t.email = s.email
WHEN MATCHED THEN
  UPDATE SET name = s.name
WHEN NOT MATCHED THEN
  INSERT (email, name) VALUES (s.email, s.name);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write a bulk UPDATE that increments counters without lost updates (single statement)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`UPDATE products
SET stock = stock - 1
WHERE id = 42 AND stock >= 1
RETURNING id, stock;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
