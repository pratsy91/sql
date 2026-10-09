import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 15: Advanced Features - Most Asked Query Interview Questions',
  description: 'Most asked advanced SQL: partitioning, FTS, JSONB GIN, advisory locks, recursive CTE',
};

export default function Module15AdvancedQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 15: Advanced Features</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked advanced query problems: partitions, FTS, JSONB, locks, windows.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write LISTEN / NOTIFY statements.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`LISTEN orders_channel;
NOTIFY orders_channel, 'order-42';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write RANGE partitioning + a pruned SELECT.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

SELECT * FROM events
WHERE created_at >= '2026-01-10' AND created_at < '2026-01-11';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write full-text search with tsvector / GIN.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE articles
  ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))) STORED;

CREATE INDEX articles_search_idx ON articles USING GIN (search);

SELECT id, title
FROM articles
WHERE search @@ plainto_tsquery('english', 'postgres interview')
ORDER BY ts_rank(search, plainto_tsquery('english', 'postgres interview')) DESC;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write an advisory lock around a singleton job.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pg_advisory_xact_lock(42);
-- critical section until COMMIT`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(42)');
  await tx.job.updateMany({ data: { status: 'running' }, where: { id: 1 } });
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write JSONB GIN containment plus a window FILTER.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT user_id,
       COUNT(*) FILTER (WHERE payload @> '{"status":"paid"}') AS paid_events
FROM events
GROUP BY user_id;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
