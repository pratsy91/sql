import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Finding the Bad Query and the Blocker - Production Scenarios",
  description: "How to find the slow query and the session blocking everyone",
};

export default function ScenarioM17L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Finding the Bad Query and the Blocker</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Do this before you restart the database.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The site is slow and you do not know which query it is. How do you find it?">
            <p><strong>What you see:</strong> CPU or IO is high. No single request log stands out.</p>
            <p><strong>Why it happens:</strong> You are guessing from the application instead of asking Postgres what it is running.</p>
            <p><strong>How to confirm:</strong> pg_stat_activity shows live queries. pg_stat_statements shows what is expensive over time.</p>
            <p><strong>How to fix:</strong> Install pg_stat_statements if it is missing. Sort by total time. EXPLAIN the winner. Fix that query or index. Restarting Postgres hides the evidence and does not fix the plan.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, now() - query_start AS age, state, left(query, 160)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Many sessions are waiting on a lock. How do you find the blocker and fix it?">
            <p><strong>What you see:</strong> Requests pile up. wait_event is Lock or a transaction id.</p>
            <p><strong>Why it happens:</strong> One session holds the row, table, or transaction the others need. It may be idle in transaction.</p>
            <p><strong>How to confirm:</strong> pg_blocking_pids on the waiting sessions. Join to the blocker query.</p>
            <p><strong>How to fix:</strong> If the blocker is idle and abandoned, terminate it. If it is a real transaction, wait or cancel the migration that is queued behind it. Fix the app so it does not hold transactions open.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT a.pid, a.state, pg_blocking_pids(a.pid) AS blocked_by, left(a.query, 120)
FROM pg_stat_activity a
WHERE cardinality(pg_blocking_pids(a.pid)) > 0;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="pg_stat_statements is empty or reset right after an incident. How do you still find the cause next time?">
            <p><strong>What you see:</strong> You arrive and the stats were reset by a restart or by someone running pg_stat_statements_reset.</p>
            <p><strong>Why it happens:</strong> The view is memory. A restart drops it. You have no history.</p>
            <p><strong>How to confirm:</strong> stats_reset is recent. The log has no slow-query lines.</p>
            <p><strong>How to fix:</strong> Turn on log_min_duration_statement at a threshold you can afford. Ship logs off the server. Snapshot pg_stat_statements on a schedule. Do not reset stats during an incident.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SHOW log_min_duration_statement;
SELECT stats_reset FROM pg_stat_statements_info;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
