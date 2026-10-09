import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Migration Locks - Production Scenarios",
  description: "How to find and clear locks that stall production DDL",
};

export default function ScenarioM03L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Migration Locks</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The most common DDL incident is a migration that waits forever and then the app waits behind it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A deploy has been running for ten minutes on ALTER TABLE. The site is timing out. What do you do?">
            <p><strong>What you see:</strong> Writes pile up. The migration session is idle or active, and new queries wait.</p>
            <p><strong>Why it happens:</strong> ALTER TABLE needs a lock. A long-running query or an idle transaction is holding a conflicting lock, so the alter waits. Once it waits, later queries queue behind it.</p>
            <p><strong>How to confirm:</strong> Look at pg_stat_activity for sessions waiting on a lock, and pg_blocking_pids for who blocks the migration.</p>
            <p><strong>How to fix:</strong> Cancel the migration if it has not changed data yet. Find the blocker and end that session if it is idle. Retry the alter when the blocker is gone. Do not kill random active transactions without knowing what they are doing.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, state, wait_event_type, wait_event, left(query, 120) AS query,
       pg_blocking_pids(pid) AS blocked_by
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY state;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Adding a column with a default locked the table for a long time. How do you add columns safely?">
            <p><strong>What you see:</strong> On an old Postgres version, ADD COLUMN ... DEFAULT rewrote the whole table. Traffic stalled for the rewrite.</p>
            <p><strong>Why it happens:</strong> Before Postgres 11, a non-null default rewrote every row. Even on new versions, a default that is not constant, or a backfill UPDATE, still rewrites.</p>
            <p><strong>How to confirm:</strong> Check server version and whether the default expression is volatile. Look at the migration for a following UPDATE that fills the column.</p>
            <p><strong>How to fix:</strong> On Postgres 11+, a constant default is fast. If you must backfill, add the column nullable, backfill in batches, then set NOT NULL and the default in a short lock. Never backfill in one UPDATE on a hot table.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders ADD COLUMN source text;
-- batch backfill, then:
ALTER TABLE orders ALTER COLUMN source SET DEFAULT 'web';
ALTER TABLE orders ALTER COLUMN source SET NOT NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Two deploys deadlock: one alters a table, the other alters a related table. How do you fix it?">
            <p><strong>What you see:</strong> Both migrations sit in idle or active and Postgres reports a deadlock, or they wait on each other.</p>
            <p><strong>Why it happens:</strong> Each deploy locked tables in a different order. App traffic took locks in between.</p>
            <p><strong>How to confirm:</strong> Read the deadlock detail in the log. It names both statements.</p>
            <p><strong>How to fix:</strong> Run one migration at a time. Take locks in a fixed order. Use lock_timeout so a migration fails fast instead of stalling the site. Retry after the other deploy finishes.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN note text;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You must drop a column the old app still reads. How do you do it without an outage?">
            <p><strong>What you see:</strong> The moment the column disappears, old pods throw &quot;column does not exist&quot;.</p>
            <p><strong>Why it happens:</strong> The deploy order was wrong. Schema was contracted before every app replica stopped selecting that column.</p>
            <p><strong>How to confirm:</strong> Check running app versions and whether any query still names the column. pg_stat_statements helps.</p>
            <p><strong>How to fix:</strong> Expand, then migrate, then contract. First stop writing the column. Deploy app code that does not read it. Only then drop the column. If you already dropped it, add the column back with a default so old pods boot, then repeat the safe order.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE users ADD COLUMN legacy_flag boolean DEFAULT false;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
