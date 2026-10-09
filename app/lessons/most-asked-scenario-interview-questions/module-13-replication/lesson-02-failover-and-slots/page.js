import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Failover and Replication Slots - Production Scenarios",
  description: "How to fix split-brain writes and unused replication slots",
};

export default function ScenarioM13L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Failover and Replication Slots</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          After failover, the dangerous part is where the app sends writes.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="You promoted a replica, and some writes still go to the old primary. How do you fix it?">
            <p><strong>What you see:</strong> Two servers accept connections. Data diverges. Users see different rows.</p>
            <p><strong>Why it happens:</strong> The application connection string, or DNS, still targets the old host. You now have split brain.</p>
            <p><strong>How to confirm:</strong> Check pg_is_in_recovery() on both. If both say false, both think they are primary.</p>
            <p><strong>How to fix:</strong> Stop the old primary or make it reject writes. Point every pooler and app at the new primary. Rebuild the old primary as a replica. Do not try to merge the two write streams by hand.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_is_in_recovery();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The disk filled and pg_replication_slots shows a slot that is not active. How do you fix it?">
            <p><strong>What you see:</strong> WAL is retained far behind the current LSN. The subscriber or replica is gone.</p>
            <p><strong>Why it happens:</strong> A replication slot keeps WAL until that consumer confirms it. An inactive slot keeps it forever.</p>
            <p><strong>How to confirm:</strong> active is false and the retained WAL size is large.</p>
            <p><strong>How to fix:</strong> If the consumer is gone for good, drop the slot. If it will return, free disk another way and let it catch up, or rebuild it. Set max_slot_wal_keep_size so a dead slot cannot fill the disk next time.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots;

SELECT pg_drop_replication_slot('abandoned_sub');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Logical replication broke after a deploy added a column. How do you fix it?">
            <p><strong>What you see:</strong> The subscription errors. New rows on the publisher never appear. The log mentions the schema or a missing column.</p>
            <p><strong>Why it happens:</strong> Logical replication does not copy DDL by itself. The subscriber table does not match.</p>
            <p><strong>How to confirm:</strong> Compare columns on both sides. Look at the subscription error in the log.</p>
            <p><strong>How to fix:</strong> Add the column on the subscriber first, in a compatible way, then resume. For a breaking change, pause writes, refresh the publication, or resync that table. Deploy schema to the subscriber before the publisher starts sending the new shape.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER SUBSCRIPTION app_sub REFRESH PUBLICATION;
ALTER SUBSCRIPTION app_sub ENABLE;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
