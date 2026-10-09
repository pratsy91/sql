import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Locks, NOTIFY, and FDW - Production Scenarios",
  description: "How to fix stuck advisory locks, missed NOTIFY, and FDW hangs",
};

export default function ScenarioM15L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Locks, NOTIFY, and FDW</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These features fail quietly: a lock stays, a message is missed, a remote query never returns.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A job says it is already running, but no worker is doing anything. How do you fix it?">
            <p><strong>What you see:</strong> pg_try_advisory_lock returns false. The job exits. The work is not happening.</p>
            <p><strong>Why it happens:</strong> A previous session took a session-level advisory lock and the process died without a clean exit, or the pool reused a session that still holds it. Session locks die with the session, so a pool that keeps sessions alive keeps the lock.</p>
            <p><strong>How to confirm:</strong> Look at pg_locks where locktype is advisory. Match the pid to pg_stat_activity.</p>
            <p><strong>How to fix:</strong> Terminate the idle backend that holds the lock. Prefer a transaction-level advisory lock so commit releases it. Do not take session locks on pooled connections.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, locktype, mode, granted, classid, objid
FROM pg_locks
WHERE locktype = 'advisory';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="LISTEN/NOTIFY works in a script and misses events in the app. How do you fix it?">
            <p><strong>What you see:</strong> A NOTIFY fired. The app callback never ran. A dedicated psql LISTEN saw it.</p>
            <p><strong>Why it happens:</strong> The app used a pooled connection. LISTEN is per session. The next checkout may be a different session, and notifications are not queued for sessions that were not listening.</p>
            <p><strong>How to confirm:</strong> See which backend ran LISTEN. Compare it to the backend that should receive the event.</p>
            <p><strong>How to fix:</strong> Use one dedicated connection for LISTEN, outside the request pool. Or skip NOTIFY and use a jobs table the worker polls. Do not LISTEN on a Prisma pooled connection.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, query FROM pg_stat_activity WHERE query ILIKE 'LISTEN%';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A page that joins a foreign table sometimes hangs until the request timeout. How do you fix it?">
            <p><strong>What you see:</strong> Local queries are fast. The hang is only on the FDW table. The remote server is slow or unreachable.</p>
            <p><strong>Why it happens:</strong> The foreign scan waits on the remote with no statement timeout, so one bad remote takes down the request and holds a connection.</p>
            <p><strong>How to confirm:</strong> The waiting backend shows a foreign scan. The remote has the real query.</p>
            <p><strong>How to fix:</strong> Set a statement timeout on the foreign server or the user mapping. Fail the page instead of hanging. Cache or copy the remote data if the page cannot tolerate remote latency. Fix the remote query plan too.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER SERVER reporting OPTIONS (ADD fetch_size '1000');
ALTER ROLE app_user SET statement_timeout = '5s';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
