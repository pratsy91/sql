import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Designs That Break in Production - Production Scenarios",
  description: "How to fix schema and query designs that fail under real traffic",
};

export default function ScenarioM18L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Designs That Break in Production</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These pass a demo and fail when the table is large or a parent row is deleted.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Deleting a popular user locks the app for seconds. The foreign key is indexed on the parent, and deletes are still slow. How do you fix it?">
            <p><strong>What you see:</strong> DELETE FROM users WHERE id = ... waits, and other queries on orders wait behind it.</p>
            <p><strong>Why it happens:</strong> Postgres must find child rows. If orders.user_id is not indexed, it locks and scans the child table.</p>
            <p><strong>How to confirm:</strong> Look for an index whose leading column is the foreign key.</p>
            <p><strong>How to fix:</strong> CREATE INDEX CONCURRENTLY on orders(user_id). Do this for every foreign key that is deleted or joined often.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY orders_user_id_idx ON orders (user_id);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The team stored the whole order as JSONB and now reports and updates are slow and wrong. How do you fix it?">
            <p><strong>What you see:</strong> Every filter is a JSON path. Totals are hard to trust. One update rewrites a large document.</p>
            <p><strong>Why it happens:</strong> Fields you filter, sum, and join are not columns, so you have weak constraints and weak indexes.</p>
            <p><strong>How to confirm:</strong> The hot predicates in pg_stat_statements all use JSON operators.</p>
            <p><strong>How to fix:</strong> Promote hot fields to real columns. Keep JSONB for the leftovers. Backfill the columns, index them, and change the app to write both during the move.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders ADD COLUMN status text;
UPDATE orders SET status = data->>'status' WHERE status IS NULL;
CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A nightly job is correct on 1,000 rows and does not finish on 5 million. How do you fix it?">
            <p><strong>What you see:</strong> The job selects all ids, then updates one row at a time from the app. It holds a transaction the whole night.</p>
            <p><strong>Why it happens:</strong> The round trips dominate. The long transaction blocks vacuum.</p>
            <p><strong>How to confirm:</strong> pg_stat_activity shows one old transaction and thousands of similar updates.</p>
            <p><strong>How to fix:</strong> Do the work in SQL set operations, or batch by primary key ranges and commit each batch. Put a timeout on the job. Do not open one transaction for the whole table.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE orders SET archived = true
WHERE id > 100000 AND id <= 110000
  AND created_at < now() - interval '2 years';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
