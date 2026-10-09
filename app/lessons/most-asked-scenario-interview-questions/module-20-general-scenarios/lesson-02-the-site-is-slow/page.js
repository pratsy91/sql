import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: The Site Is Slow - Production Scenarios",
  description: "How to narrow a slow production site to a query, a lock, a pool, or a replica",
};

export default function ScenarioM20L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: The Site Is Slow</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Do not add CPU first. Find which wait you are in.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Every page is slow starting this morning. Nothing deployed. How do you narrow it down?">
            <p><strong>What you see:</strong> Latency is high for most routes. Error rate may be normal.</p>
            <p><strong>Why it happens:</strong> A bad plan, a lock pile-up, a full disk, a replica used for reads that is lagging, or a connection pool wait. Each looks like slowness in the app.</p>
            <p><strong>How to confirm:</strong> Check database CPU, disk, connection count, and the longest queries. Check whether the app is waiting before it gets a connection.</p>
            <p><strong>How to fix:</strong> If one query dominates, EXPLAIN and index it. If sessions are waiting on a lock, remove the blocker. If the pool is waiting, fix pool size and idle transactions. If the replica is lagged, send reads to the primary until it catches up.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT now() - query_start AS age, state, wait_event_type, left(query, 140)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Only one endpoint is slow, and it got slow after the table grew. How do you fix it?">
            <p><strong>What you see:</strong> One route accounts for the latency. The SQL is stable.</p>
            <p><strong>Why it happens:</strong> A sequential scan or a nested loop that was fine at 10,000 rows is not fine at 10 million. Often an N+1 on top.</p>
            <p><strong>How to confirm:</strong> Capture the SQL for that route. EXPLAIN ANALYZE. Count round trips.</p>
            <p><strong>How to fix:</strong> Add the composite index the WHERE and ORDER BY need. Collapse the N+1. Limit the page size. ANALYZE after a big load so the planner is not guessing.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="The database is not busy, and the app is still slow. How do you find the wait?">
            <p><strong>What you see:</strong> Postgres CPU is low. Queries in the log are fast. Users still wait.</p>
            <p><strong>Why it happens:</strong> Time is in the pool queue, in the application, in DNS, in TLS, or in a downstream that is not Postgres. A replica health check may be passing while lag is high.</p>
            <p><strong>How to confirm:</strong> Compare app span time with the SQL time in the same trace. Look at pool wait metrics.</p>
            <p><strong>How to fix:</strong> Fix the layer that owns the time. If SQL is 5 ms and the request is 2 s, stop tuning indexes. If pool wait is the span, fix connection reuse. If a remote FDW or HTTP call sits inside a transaction, move it out.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT state, wait_event_type, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
