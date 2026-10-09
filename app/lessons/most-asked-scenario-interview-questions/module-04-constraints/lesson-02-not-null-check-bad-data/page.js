import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: NOT NULL, CHECK, and Bad Data - Production Scenarios",
  description: "How to fix NOT NULL and CHECK incidents without locking the table for hours",
};

export default function ScenarioM04L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: NOT NULL, CHECK, and Bad Data</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The data is already dirty. Adding the constraint is what exposes it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="SET NOT NULL fails because some rows are null. How do you fix it?">
            <p><strong>What you see:</strong> The migration errors and names the column. The table is large.</p>
            <p><strong>Why it happens:</strong> Postgres scans the table and refuses if any row is null. A single null blocks the constraint.</p>
            <p><strong>How to confirm:</strong> Count nulls. Find which business case left them.</p>
            <p><strong>How to fix:</strong> Backfill a real value in batches. Then set NOT NULL. If you cannot fill them honestly, do not invent a sentinel. Keep the column nullable and handle null in the app.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT count(*) FROM orders WHERE source IS NULL;
UPDATE orders SET source = 'unknown'
WHERE id IN (SELECT id FROM orders WHERE source IS NULL LIMIT 5000);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The app sends status &quot;done&quot; and the insert fails a CHECK. How do you fix it?">
            <p><strong>What you see:</strong> New writes fail. Old rows are fine. The error is a check constraint violation.</p>
            <p><strong>Why it happens:</strong> The allowed list in the database and the list in the new app version drifted.</p>
            <p><strong>How to confirm:</strong> Read the check definition. Compare it to the enum or string the app sends.</p>
            <p><strong>How to fix:</strong> Either stop the app sending that value, or update the check. Add the new check as NOT VALID, then VALIDATE so you do not hold a long lock while old rows are scanned. Deploy the database change before the app that sends the new value.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE tickets DROP CONSTRAINT tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('open', 'pending', 'done', 'closed')) NOT VALID;
ALTER TABLE tickets VALIDATE CONSTRAINT tickets_status_check;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A report of inactive users is short. The flag column has nulls. How do you fix the data and the query?">
            <p><strong>What you see:</strong> WHERE is_active = false misses rows that look inactive in the product.</p>
            <p><strong>Why it happens:</strong> NULL is not false. Those rows were inserted before the column had a default.</p>
            <p><strong>How to confirm:</strong> Count nulls versus false.</p>
            <p><strong>How to fix:</strong> Backfill nulls to false, then set NOT NULL DEFAULT false. Change the query to IS NOT TRUE only as a temporary read fix. The lasting fix is to remove the third state.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE users SET is_active = false WHERE is_active IS NULL;
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
