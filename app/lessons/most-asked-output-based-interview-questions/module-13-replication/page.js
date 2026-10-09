import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 13: Replication - Output-Based Interview Questions',
  description: 'Predict pg_is_in_recovery, write-on-replica errors, lag query meaning',
};

export default function OutputModule13() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 13: Replication</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Given replica vs primary, what does the statement return or throw?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="On a hot standby: SELECT pg_is_in_recovery(); then INSERT INTO t VALUES (1); Output?"
          >
            <p>
              First: <code>true</code>. Second: error — cannot write on a replica (read-only).
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Primary INSERT commits. Replica SELECT immediately after. Can output miss the row?"
          >
            <p>
              Yes — async replication lag. <code>pg_stat_replication.replay_lag</code> explains delay. Sync replica
              waits on commit (slower writes, fresher reads).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Prisma pointed at a replica URL. create() output?"
          >
            <p>
              Write fails (read-only). Fix: <code>DATABASE_URL</code> primary for writes; optional read replica client
              for <code>findMany</code> only.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Inactive replication slot. What grows, and what does pg_wal directory look like over days?"
          >
            <p>
              WAL is retained for the slot → disk growth. <code>pg_replication_slots.active = false</code> is a pager
              alert. Drop or consume the slot.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
