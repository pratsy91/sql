import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 10: Performance - Most Asked Query Interview Questions',
  description: 'Most asked EXPLAIN, index, rewrite, and pagination performance queries with Prisma select vs include',
};

export default function Module10PerformanceQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 10: Performance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked performance interview queries: EXPLAIN, rewrites, indexes, pagination.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write EXPLAIN ANALYZE for a slow query.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Rewrite SELECT * into a covering column list and matching index."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT id, user_id, total, created_at
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 20;

CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.order.findMany({
  where: { userId: 42 },
  select: { id: true, userId: true, total: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Rewrite a correlated subquery into a JOIN / aggregation."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`-- Slow pattern
SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;

-- Better
SELECT u.*, COALESCE(c.n, 0) AS order_count
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS n FROM orders GROUP BY user_id
) c ON c.user_id = u.id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a partial index for a hot filtered query.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE INDEX orders_open_idx ON orders (created_at)
WHERE status = 'open';

SELECT * FROM orders WHERE status = 'open' ORDER BY created_at;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Contrast OFFSET pagination vs keyset; write both."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`-- OFFSET gets slower as page grows
SELECT * FROM events ORDER BY id DESC OFFSET 10000 LIMIT 20;

-- Keyset
SELECT * FROM events
WHERE id < 500000
ORDER BY id DESC
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write a query to find sequential scans on large tables (pg_stat_user_tables)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT relname, seq_scan, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 1000 AND n_live_tup > 10000
ORDER BY seq_scan DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Show Prisma include vs select — write the cheaper list query."
          >
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({
  take: 50,
  select: {
    id: true,
    email: true,
    _count: { select: { orders: true } },
  },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
