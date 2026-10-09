import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Migration Drift and Failed Deploys - Production Scenarios",
  description: "How to fix Prisma migration drift and half-applied migrations",
};

export default function ScenarioM16L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Migration Drift and Failed Deploys</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The deploy is blocked before the new code starts, or it started and the schema is half changed.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="prisma migrate deploy fails with &quot;drift detected&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The command refuses to run. It says the database schema is not the expected result of the migration history.</p>
            <p><strong>Why it happens:</strong> Somebody changed the database by hand, or a hotfix SQL was applied outside Prisma, or a migration was edited after it had been applied.</p>
            <p><strong>How to confirm:</strong> Read the drift summary. Compare _prisma_migrations with the files in prisma/migrations.</p>
            <p><strong>How to fix:</strong> Do not reset a production database. If the live schema is what you want, add a follow-up migration that matches it, or baseline carefully. If a bad hotfix was applied, write a migration that corrects it. Never edit a migration that already ran in production.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY started_at;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A migration failed in the middle. Some columns exist and the app is crashing. How do you fix it?">
            <p><strong>What you see:</strong> _prisma_migrations has a row with finished_at null. The new code expects a column that only some requests see.</p>
            <p><strong>Why it happens:</strong> The migration ran statements and then errored. Postgres rolled back its transaction, but if the migration was marked non-transactional, part of it stuck.</p>
            <p><strong>How to confirm:</strong> Look at the failed migration row and the actual columns.</p>
            <p><strong>How to fix:</strong> If the transaction rolled back, fix the SQL and deploy again. If it partly applied, restore the schema to the previous shape or finish the remaining statements by hand, then mark the migration resolved with migrate resolve only after the database matches that migration. Do not mark it resolved while the schema is still wrong.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT migration_name, started_at, finished_at, logs
FROM _prisma_migrations
WHERE finished_at IS NULL AND rolled_back_at IS NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="migrate dev fails on the shadow database with a missing extension, but production is fine. How do you fix it?">
            <p><strong>What you see:</strong> CI cannot create a migration. The error is gen_random_uuid or postgis on the shadow database.</p>
            <p><strong>Why it happens:</strong> Prisma replays the whole history onto an empty shadow database. Extensions created by hand in production are not in the history.</p>
            <p><strong>How to confirm:</strong> The error happens before your new SQL. The extension is in production and not in any migration file.</p>
            <p><strong>How to fix:</strong> Add a first migration that creates the extension, and baseline existing databases so they do not run it twice. Or set shadowDatabaseUrl to a database where the extension packages exist. CREATE EXTENSION IF NOT EXISTS is safe to add at the start of the history only with a careful baseline.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
