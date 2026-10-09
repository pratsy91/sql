import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Disk, Wraparound, and Connection Spikes - Production Scenarios",
  description: "How to respond to disk, wraparound, and connection alerts",
};

export default function ScenarioM17L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Disk, Wraparound, and Connection Spikes</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These alerts are the ones that become outages if you only restart the app.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Disk usage crossed 90 percent on the database volume. What do you check first, and how do you fix it?">
            <p><strong>What you see:</strong> The host alert fires. Writes still work, for now.</p>
            <p><strong>Why it happens:</strong> The usual causes are WAL retained by a slot, a bloated table, logs on the same disk, or a one-off file in the data directory.</p>
            <p><strong>How to confirm:</strong> df, then the size of the data directory versus pg_wal. Check inactive replication slots.</p>
            <p><strong>How to fix:</strong> Delete old logs that are not inside pg_wal. Drop a dead slot if that is the WAL holder. VACUUM will not always return space to the OS. Add disk before you hit 100 percent, because a full WAL disk stops the database.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_size_pretty(pg_database_size(current_database()));`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The log warns that the database must be vacuumed to prevent wraparound. How do you fix it?">
            <p><strong>What you see:</strong> Autovacuum is being forced. age(datfrozenxid) is very high.</p>
            <p><strong>Why it happens:</strong> Something stopped freezing: a long transaction, a slot, or autovacuum losing the race.</p>
            <p><strong>How to confirm:</strong> Query database age and the oldest backend xmin.</p>
            <p><strong>How to fix:</strong> End the session or slot holding the old xmin. Let autovacuum finish. If you are close to the shutdown limit, run VACUUM FREEZE and keep traffic down until age drops. Do not ignore this warning.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Connections climb every minute until login fails. The app did not deploy. How do you fix it?">
            <p><strong>What you see:</strong> A slow leak. Each new pod or a retry loop opens pools and never closes them. max_connections fills.</p>
            <p><strong>Why it happens:</strong> undefined</p>
            <p><strong>How to confirm:</strong> Group pg_stat_activity by client_addr, usename, and application_name.</p>
            <p><strong>How to fix:</strong> Stop the runaway deploy or retry loop. Terminate idle backends from the bad client. Put a pooler in front. Cap pool size in the app. Add an alert on connection count at 70 percent, not at 100.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT client_addr, usename, count(*)
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
