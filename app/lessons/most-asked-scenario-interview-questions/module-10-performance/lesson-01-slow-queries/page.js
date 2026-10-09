import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Slow Queries - Production Scenarios",
  description: "How to fix slow queries with EXPLAIN and the right index",
};

export default function ScenarioM10L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Slow Queries</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Start with the slow statement, not with more hardware.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A user page is slow. EXPLAIN shows a sequential scan on orders. How do you fix it?">
            <p><strong>What you see:</strong> The query filters by user_id. The table is large. There is no index on user_id.</p>
            <p><strong>Why it happens:</strong> Postgres must read the whole table to find one user.</p>
            <p><strong>How to confirm:</strong> EXPLAIN (ANALYZE, BUFFERS) the exact query. Check pg_indexes.</p>
            <p><strong>How to fix:</strong> Create the index that matches the filter and the sort, often (user_id, created_at DESC). Use CONCURRENTLY on production.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;

CREATE INDEX CONCURRENTLY orders_user_created_idx
  ON orders (user_id, created_at DESC);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="An index exists and the planner still scans the table. How do you fix it?">
            <p><strong>What you see:</strong> pg_indexes shows an index. EXPLAIN does not use it, or it uses the wrong one.</p>
            <p><strong>Why it happens:</strong> The leading column does not match the WHERE. Or you selected so many columns, including a large JSONB, that a bitmap heap fetch costs more than a scan. Or statistics are stale.</p>
            <p><strong>How to confirm:</strong> Compare the WHERE and ORDER BY to the index column order. Look at rows removed by filter.</p>
            <p><strong>How to fix:</strong> Build a composite index with the equality columns first. ANALYZE the table. Avoid SELECT * on wide rows. Drop unused indexes that slow writes.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ANALYZE orders;
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE relname = 'orders'
ORDER BY idx_scan;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="The query is fast in psql and slow in the app. How do you fix it?">
            <p><strong>What you see:</strong> The same SQL text is instant in a console and times out from Prisma.</p>
            <p><strong>Why it happens:</strong> The app sends a different type and the predicate becomes an implicit cast. Or the app runs the query once per row. Or it sets a different work_mem and the plan spills.</p>
            <p><strong>How to confirm:</strong> Log the SQL Prisma actually sends. EXPLAIN that text, not the one you typed.</p>
            <p><strong>How to fix:</strong> Pass parameters with the column type. Fix the N+1 with a join or a single include that you have measured. Do not add a random index until the real SQL is known.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time * calls DESC
LIMIT 10;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
