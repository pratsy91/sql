import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 17: Monitoring - Output-Based Interview Questions',
  description: 'Interpret pg_stat_activity rows, idle-in-transaction, Prisma pool timeout P2024',
};

export default function OutputModule17() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 17: Monitoring &amp; Maintenance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Read this stats row — what is happening, and what do you do?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="pg_stat_activity.state = 'idle'. Is a query running? Should you terminate it?"
          >
            <p>
              No active SQL. Normal for a pool. Do not kill all idle backends. Worry about{' '}
              <code>idle in transaction</code> instead.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="state = 'idle in transaction', xact_age = 4 hours. Output meaning for VACUUM?"
          >
            <p>
              Snapshot held → dead tuples cannot be vacuumed → bloat. Fix the app (commit/rollback), then vacuum.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Prisma throws P2024. What does that output mean?"
          >
            <p>
              Timed out fetching a connection from the pool (exhaustion). Not a SQL syntax error. Fix: shorter
              transactions, pool size, PgBouncer, don&apos;t nest long <code>$transaction</code> callbacks.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="pg_stat_statements: query appears with $1 placeholders and high mean_exec_time. Next output you look at?"
          >
            <p>
              <code>calls</code> vs <code>total_exec_time</code>. A rare slow query vs a cheap query called millions
              of times. Then <code>EXPLAIN ANALYZE</code> a bind of that shape.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
