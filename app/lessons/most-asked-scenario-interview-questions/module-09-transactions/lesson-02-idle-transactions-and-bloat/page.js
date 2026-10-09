import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Idle Transactions and Bloat - Production Scenarios",
  description: "How to find and clear idle transactions that cause bloat",
};

export default function ScenarioM09L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Idle Transactions and Bloat</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Nothing looks locked. Autovacuum still cannot clean the table.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A psql session from yesterday is &quot;idle in transaction&quot; and new deploys hang. How do you fix it?">
            <p><strong>What you see:</strong> One backend has been idle in transaction for hours. Other sessions wait.</p>
            <p><strong>Why it happens:</strong> Somebody ran BEGIN, or a tool opened a transaction, and never committed. It holds locks and a snapshot.</p>
            <p><strong>How to confirm:</strong> Query pg_stat_activity for that state and xact_start.</p>
            <p><strong>How to fix:</strong> Commit or roll back if it is yours. Otherwise pg_terminate_backend on that pid. Set idle_in_transaction_session_timeout so the server kills the next one.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, usename, state, xact_start, query
FROM pg_stat_activity
WHERE state = 'idle in transaction';

SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND xact_start < now() - interval '5 minutes';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="You deleted millions of rows and the disk did not shrink. How do you fix it?">
            <p><strong>What you see:</strong> The table has few live rows and a huge file. Queries are slower than the row count suggests.</p>
            <p><strong>Why it happens:</strong> Deletes only mark rows dead. Vacuum reclaims space inside the file. It does not return the file to the OS. A long-running transaction also stops vacuum from freezing old rows.</p>
            <p><strong>How to confirm:</strong> Compare n_live_tup and n_dead_tup. Check vacuum age and any old snapshot.</p>
            <p><strong>How to fix:</strong> End the old transaction. Let autovacuum run, or VACUUM (VERBOSE). Use VACUUM FULL only in a maintenance window because it locks the table. pg_repack is the online alternative.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Prisma interactive transactions time out and leave &quot;idle in transaction&quot; sessions. How do you fix it?">
            <p><strong>What you see:</strong> Requests fail with a transaction timeout. Connection count climbs. Later requests cannot get a connection.</p>
            <p><strong>Why it happens:</strong> The timeout aborted the app wait, but the database transaction stayed open until the pool dropped the connection, or the timeout was longer than the pool timeout.</p>
            <p><strong>How to confirm:</strong> Match Prisma timeout settings to the sessions in pg_stat_activity.</p>
            <p><strong>How to fix:</strong> Keep the interactive transaction short. Set a timeout that rolls the transaction back. Set idle_in_transaction_session_timeout on the database as a backstop. Do not do HTTP calls inside the transaction.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER DATABASE app SET idle_in_transaction_session_timeout = '30s';`}
            />
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.order.update({ where: { id }, data: { status: 'paid' } });
}, { timeout: 5000, maxWait: 2000 });`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
