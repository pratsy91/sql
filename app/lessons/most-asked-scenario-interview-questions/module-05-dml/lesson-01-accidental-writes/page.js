import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Accidental Writes - Production Scenarios",
  description: "How to respond when an UPDATE or DELETE hits the wrong rows",
};

export default function ScenarioM05L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Accidental Writes</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          This is the incident everyone hopes they only see in an interview.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Someone ran UPDATE prices SET amount = 0 and forgot the WHERE. How do you fix it?">
            <p><strong>What you see:</strong> Every price is 0. The statement already committed if autocommit was on.</p>
            <p><strong>Why it happens:</strong> UPDATE and DELETE apply to every row when there is no WHERE. psql and many tools commit each statement.</p>
            <p><strong>How to confirm:</strong> Check when the statement finished in the log. See if you are still inside an open transaction. If you are, ROLLBACK.</p>
            <p><strong>How to fix:</strong> If the transaction is open, roll it back. If it committed, restore the table from a backup or from PITR to a new database and copy the prices back. Do not guess the old values. Afterward, revoke ad-hoc write access and require WHERE in reviews.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`-- only if the transaction is still open
ROLLBACK;

-- otherwise restore prices from a recovered copy
UPDATE prices p
SET amount = b.amount
FROM prices_backup b
WHERE p.id = b.id;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The app says the update worked, but the row did not change. How do you debug it?">
            <p><strong>What you see:</strong> HTTP 200. The database row is unchanged. No error.</p>
            <p><strong>Why it happens:</strong> The WHERE matched zero rows. UPDATE does not error in that case. Or a trigger rewrote the value. Or you updated a replica by mistake and the write went nowhere because the session was read-only and the error was swallowed.</p>
            <p><strong>How to confirm:</strong> Use RETURNING and check the row count. Run the same WHERE as a SELECT.</p>
            <p><strong>How to fix:</strong> Check the affected row count and treat zero as a failure in the app. Log the WHERE values. Prisma update throws if the id is missing. updateMany does not.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE orders SET status = 'paid' WHERE id = 999 RETURNING id;`}
            />
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`const result = await prisma.order.updateMany({
  where: { id: orderId, status: 'pending' },
  data: { status: 'paid' },
});
if (result.count !== 1) throw new Error('order was not updated');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A cleanup job deleted rows the product still needed, and the delete was batched. How do you recover and prevent a repeat?">
            <p><strong>What you see:</strong> A nightly job removed &quot;old&quot; rows. Customers cannot see orders from last month. The job used a wrong timestamp filter.</p>
            <p><strong>Why it happens:</strong> The predicate compared a timestamp without a zone, or it used created_at instead of closed_at. Batches committed as they went, so you cannot roll back the job.</p>
            <p><strong>How to confirm:</strong> Read the job SQL and the row counts it logged. Find the newest surviving row and the oldest missing id.</p>
            <p><strong>How to fix:</strong> Restore the missing id range from PITR into a side table and insert them back if they do not already exist. Fix the predicate. Dry-run with SELECT count and a LIMIT before the next delete. Put a statement timeout on the job role.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`INSERT INTO orders
SELECT * FROM orders_recovered r
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = r.id);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
