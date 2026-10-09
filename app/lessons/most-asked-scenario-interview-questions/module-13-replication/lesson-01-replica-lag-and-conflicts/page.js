import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Replica Lag and Conflicts - Production Scenarios",
  description: "How to fix replica lag and hot standby conflicts",
};

export default function ScenarioM13L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Replica Lag and Conflicts</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The primary is healthy. Users still see stale or canceled reads.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Users do not see the row they just wrote. The primary has it. How do you fix it?">
            <p><strong>What you see:</strong> The write returned success. The following read, served by a replica, does not show the row.</p>
            <p><strong>Why it happens:</strong> Replica lag. The read was not sent to the primary.</p>
            <p><strong>How to confirm:</strong> On the replica, subtract pg_last_xact_replay_timestamp() from now().</p>
            <p><strong>How to fix:</strong> Route that user to the primary until the replica catches up, or stop using the replica for read-your-writes screens. If lag is minutes, not milliseconds, look for a slow replica, a network problem, or a heavy query holding replay.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT now() - pg_last_xact_replay_timestamp() AS lag;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Reports on the replica fail with &quot;canceling statement due to conflict with recovery&quot;. How do you fix it?">
            <p><strong>What you see:</strong> A long SELECT dies. The primary just vacuumed or updated the same rows.</p>
            <p><strong>Why it happens:</strong> Replay needs to apply a change that conflicts with the running query on the hot standby.</p>
            <p><strong>How to confirm:</strong> The error text says conflict with recovery. pg_stat_database_conflicts shows the reason.</p>
            <p><strong>How to fix:</strong> Raise hot_standby_feedback or max_standby_streaming_delay if you accept the cost on the primary. Or run the long report on a dedicated replica. Do not disable vacuum on the primary to save the report.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT * FROM pg_stat_database_conflicts WHERE datname = current_database();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Lag stays high even though the replica CPU is idle. How do you fix it?">
            <p><strong>What you see:</strong> Replay timestamp is old. The replica is not CPU-bound. WAL may be piling up on the primary.</p>
            <p><strong>Why it happens:</strong> The replica cannot write fast enough, the network is saturated, or a single long transaction on the primary only ships when it commits.</p>
            <p><strong>How to confirm:</strong> Compare sent, write, flush, and replay LSN in pg_stat_replication. A gap at replay is the replica. A gap at sent is the network or the primary.</p>
            <p><strong>How to fix:</strong> Fix the disk on the replica if replay is behind flush. Avoid huge transactions on the primary. Add network capacity if sent is behind. Scale the replica disk before you add replicas that will lag the same way.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT application_name, state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_bytes
FROM pg_stat_replication;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
