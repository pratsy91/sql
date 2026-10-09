import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 17: Monitoring - Most Asked Query Interview Questions',
  description: 'Most asked monitoring SQL: pg_stat_activity, statements, sizes, cache hit, long transactions',
};

export default function Module17MonitoringQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 17: Monitoring &amp; Maintenance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked production inspection queries. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query for currently running queries.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pid, usename, state, wait_event_type, now() - query_start AS runtime, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write pg_terminate_backend for a stuck PID (careful in prod).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pg_cancel_backend(12345);
SELECT pg_terminate_backend(12345);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write top queries from pg_stat_statements.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write table and index size queries.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT relname, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write cache hit ratio and connection slot usage.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS cache_hit
FROM pg_statio_user_tables;

SELECT COUNT(*) AS connections, current_setting('max_connections')
FROM pg_stat_activity;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a query for long-running transactions (bloat risk).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pid, usename, xact_start, now() - xact_start AS xact_age, state, query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
