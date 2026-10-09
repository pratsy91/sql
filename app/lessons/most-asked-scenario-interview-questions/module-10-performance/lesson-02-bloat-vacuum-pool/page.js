import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Bloat, Vacuum, and Pool Timeouts - Production Scenarios",
  description: "How to fix bloat and connection pool timeouts",
};

export default function ScenarioM10L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Bloat, Vacuum, and Pool Timeouts</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The SQL is fine. The table and the pool are not.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The app times out with &quot;timed out fetching a new connection from the pool&quot;. The database looks idle. How do you fix it?">
            <p><strong>What you see:</strong> CPU on Postgres is low. Requests wait before they run a query.</p>
            <p><strong>Why it happens:</strong> Every app process holds its pool slots. Many replicas times a large pool is more than max_connections, or slots are stuck idle in transaction.</p>
            <p><strong>How to confirm:</strong> Count sessions and compare to the Prisma connection_limit times replica count.</p>
            <p><strong>How to fix:</strong> Lower connection_limit. Add a pooler. Kill leaked idle transactions. Do not raise max_connections as the first move.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT count(*) FROM pg_stat_activity;
SHOW max_connections;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="After a bulk update, reads on that table got much slower. How do you fix it?">
            <p><strong>What you see:</strong> The row count did not grow. The table size did. Plans that used to be index-only now hit the heap.</p>
            <p><strong>Why it happens:</strong> The update left dead tuples and bloated indexes. Autovacuum has not caught up, or an old snapshot blocked it.</p>
            <p><strong>How to confirm:</strong> n_dead_tup is high. pg_relation_size is large versus the live rows.</p>
            <p><strong>How to fix:</strong> Clear old transactions. VACUUM (ANALYZE). If the file must shrink, schedule pg_repack or VACUUM FULL in a window. Avoid updating indexed columns when the value did not change.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`VACUUM (VERBOSE, ANALYZE) orders;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Autovacuum runs but never finishes on one table, and you are heading toward wraparound. How do you fix it?">
            <p><strong>What you see:</strong> Logs say autovacuum is canceled or launched again and again. Age of the database is climbing.</p>
            <p><strong>Why it happens:</strong> A long transaction, a replication slot, or a prepared transaction holds back the freeze horizon. Workers are also too polite to keep up with the update rate.</p>
            <p><strong>How to confirm:</strong> Check age(datfrozenxid), replication slots, and sessions with an old xact_start.</p>
            <p><strong>How to fix:</strong> Drop unused slots. End the old transaction. Then run a manual VACUUM FREEZE in a window if age is close to the warning. Tune autovacuum for that hot table only after the horizon can move.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
