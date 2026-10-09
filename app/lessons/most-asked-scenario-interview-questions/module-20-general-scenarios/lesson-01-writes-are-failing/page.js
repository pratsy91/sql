import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Writes Are Failing - Production Scenarios",
  description: "How to debug a production incident where writes fail and reads still work",
};

export default function ScenarioM20L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Writes Are Failing</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Start with the error text. It usually names the real limit: disk, connections, a lock, or a read-only server.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Reads succeed and every insert fails. What do you check, in order, and how do you fix the common causes?">
            <p><strong>What you see:</strong> GET works. POST returns 500. The error is the same on every write.</p>
            <p><strong>Why it happens:</strong> The database is read-only, the disk is full, a connection cannot be opened, or a lock is blocking writers. Those are different fixes.</p>
            <p><strong>How to confirm:</strong> Read the first database error, not only the HTTP status. Check pg_is_in_recovery, disk free space, and connection count.</p>
            <p><strong>How to fix:</strong> If it is a replica, point writes at the primary. If the disk is full, free space outside pg_wal and then fix the slot or archive. If connections are exhausted, terminate leaked idle sessions and shrink the pool. If a lock is the cause, find the blocker before you restart anything.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_is_in_recovery();
SELECT count(*) FROM pg_stat_activity;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Only some writes fail, with deadlock or serialization errors, and a retry works. How do you stop it getting worse?">
            <p><strong>What you see:</strong> The error rate is a few percent. Users who retry succeed. It started after a traffic spike or a new job.</p>
            <p><strong>Why it happens:</strong> Two writers lock the same rows in different orders, or a serializable job conflicts with checkout.</p>
            <p><strong>How to confirm:</strong> Group errors by SQLSTATE. 40P01 is deadlock. 40001 is serialization failure.</p>
            <p><strong>How to fix:</strong> Add a short retry in the app. Order locks by id. Move the batch job off the hot rows or run it in smaller transactions. Do not turn off constraints.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, wait_event_type, left(query, 100)
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Writes fail only for one tenant, and the error is a statement timeout. How do you fix it without blocking everyone else?">
            <p><strong>What you see:</strong> One customer's saves die at 30 seconds. Other tenants are fine. The query is a big update for that tenant.</p>
            <p><strong>Why it happens:</strong> Their data volume crossed a plan that used to be fine. The timeout is doing its job and also blocking the product.</p>
            <p><strong>How to confirm:</strong> EXPLAIN the statement with their ids. Look at locks they hold.</p>
            <p><strong>How to fix:</strong> Kill the stuck statement if it is still running. Rewrite it to batches. Add the missing index. Keep the timeout so one tenant cannot hold a lock all day. Tell the user the save did not finish if you canceled it.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE pid = 1234 AND usename = 'app_user';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
