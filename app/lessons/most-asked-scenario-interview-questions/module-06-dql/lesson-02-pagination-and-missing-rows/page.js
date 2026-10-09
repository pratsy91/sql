import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Pagination and Missing Rows - Production Scenarios",
  description: "How to fix offset pagination and NULL filters",
};

export default function ScenarioM06L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Pagination and Missing Rows</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The user refreshes and a row vanishes, or the same row appears on two pages.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="WHERE phone = NULL returns nothing, but some phones are null. How do you fix it?">
            <p><strong>What you see:</strong> The screen that should list unknown phones is empty.</p>
            <p><strong>Why it happens:</strong> NULL equals nothing, including NULL. The comparison is unknown, so WHERE drops the row.</p>
            <p><strong>How to confirm:</strong> Run the predicate with IS NULL and compare counts.</p>
            <p><strong>How to fix:</strong> Use IS NULL or IS NOT DISTINCT FROM. In Prisma, use null inside the where object, which generates IS NULL.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT count(*) FROM users WHERE phone IS NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Infinite scroll skips items and sometimes shows the same item twice. How do you fix it?">
            <p><strong>What you see:</strong> New orders arrive while the user pages with OFFSET. Rows shift between pages.</p>
            <p><strong>Why it happens:</strong> OFFSET counts rows, it does not remember the last row you saw. Inserts and deletes move the window.</p>
            <p><strong>How to confirm:</strong> Reproduce by inserting a row between page 1 and page 2.</p>
            <p><strong>How to fix:</strong> Keyset pagination: WHERE (created_at, id) &lt; the last pair you returned, ORDER BY created_at DESC, id DESC, LIMIT 20. Keep a tie-breaker.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT id, created_at
FROM orders
WHERE (created_at, id) < ('2026-04-01 10:00+05:30', 1000)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="The API list is missing rows that exist on the primary, and only for a few seconds after a write. How do you fix it?">
            <p><strong>What you see:</strong> The user creates an order and the next GET does not show it. A refresh a second later does.</p>
            <p><strong>Why it happens:</strong> The read went to a replica that is behind. This is not a bad WHERE.</p>
            <p><strong>How to confirm:</strong> Compare the row on the primary and the replica. Check replica lag.</p>
            <p><strong>How to fix:</strong> Read-your-writes: send the user who just wrote to the primary, or wait until replay passes that LSN. Do not tell the user to refresh as the product fix.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT now() - pg_last_xact_replay_timestamp() AS lag;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
