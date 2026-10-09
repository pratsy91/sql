import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 13: Replication - Most Asked Query Interview Questions',
  description: 'Most asked replication catalog queries: lag, slots, pg_is_in_recovery, publications',
};

export default function Module13ReplicationQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 13: Replication</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked replication inspection queries. Never write to a replica.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query to check if this node is a replica.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pg_is_in_recovery();
SHOW transaction_read_only;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write a query for streaming replicas and lag (on primary).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  client_addr,
  state,
  sync_state,
  replay_lag,
  write_lag,
  flush_lag
FROM pg_stat_replication;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query listing replication slots.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT slot_name, slot_type, active, restart_lsn, confirmed_flush_lsn
FROM pg_replication_slots;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write catalog queries for logical publication/subscription.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
SELECT * FROM pg_stat_subscription;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
