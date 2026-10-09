import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 18: Best Practices - Most Asked Query Interview Questions',
  description: 'Most asked query-pattern interview problems: pagination, anti-joins, upsert, Prisma select',
};

export default function Module18BestPracticeQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 18: Best Practices</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked “how would you write this safely/efficiently” query patterns.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Rewrite SELECT * into an explicit column list for an API payload."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, email, name FROM users WHERE id = 1;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id: 1 },
  select: { id: true, email: true, name: true },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write an anti-join with NOT EXISTS (preferred over NOT IN).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write idempotent UPSERT for a webhook (same event id).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO webhook_events (id, payload)
VALUES ('evt_123', '{"ok":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a partial unique index: one primary email per user.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE UNIQUE INDEX emails_one_primary
  ON user_emails (user_id)
  WHERE is_primary;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write keyset pagination SQL that stays stable with concurrent inserts."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, created_at, title
FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
