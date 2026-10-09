import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 12: Backup & Recovery - Most Asked Query Interview Questions',
  description: 'Most asked catalog queries around backup size, vacuum, WAL, and Prisma migrations table',
};

export default function Module12BackupQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 12: Backup &amp; Recovery</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Interviews rarely ask you to type pg_dump flags from memory — they ask <em>queries</em> that prove you
          know what to dump and how big it is. Prisma migrate is not a backup.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query for the size of each table (what would a dump contain?).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  schemaname || '.' || relname AS relation,
  pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query listing objects in public (tables/views).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT table_type, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write a query for last vacuum / analyze times.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT relname, last_vacuum, last_autovacuum, last_analyze, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write a query against _prisma_migrations (schema version is not a data backup)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at DESC;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write queries to inspect WAL / archive-related settings.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SHOW wal_level;
SHOW archive_mode;
SHOW archive_command;
SELECT * FROM pg_stat_wal;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
