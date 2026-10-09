import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Deadlocks and Lost Updates - Production Scenarios",
  description: "How to fix deadlocks and lost updates",
};

export default function ScenarioM09L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Deadlocks and Lost Updates</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The statements are valid. The interleaving is the bug.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The API returns &quot;deadlock detected&quot; on checkout. How do you fix it?">
            <p><strong>What you see:</strong> One request fails. The other commits. It happens when two orders touch the same products in a different order.</p>
            <p><strong>Why it happens:</strong> Each transaction locks rows the other wants. Postgres kills one of them.</p>
            <p><strong>How to confirm:</strong> The log shows the two statements and the lock each one held.</p>
            <p><strong>How to fix:</strong> Always lock rows in a stable order, such as by product id. Retry the request that was killed. Keep transactions short.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT id FROM products WHERE id IN (3, 1, 2) ORDER BY id FOR UPDATE;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Two withdrawals both read the same balance and the account goes negative, or one withdrawal disappears. How do you fix it?">
            <p><strong>What you see:</strong> No deadlock. The final balance does not match the ledger.</p>
            <p><strong>Why it happens:</strong> Read-modify-write under read committed. Both read 100, both write 100 minus their amount. The second commit overwrites the first.</p>
            <p><strong>How to confirm:</strong> The ledger sum and the balance column disagree.</p>
            <p><strong>How to fix:</strong> Update in one statement: SET balance = balance - 30 WHERE balance &gt;= 30, and check the row count. Or SELECT FOR UPDATE before you change the balance. Store movements as insert-only rows.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE accounts
SET balance = balance - 30
WHERE id = 7 AND balance >= 30
RETURNING balance;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Jobs fail with &quot;could not serialize access due to concurrent update&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The error appears only under serializable isolation. A retry succeeds.</p>
            <p><strong>Why it happens:</strong> Serializable aborted a transaction that would have produced a result the isolation level forbids. This is not corruption.</p>
            <p><strong>How to confirm:</strong> The SQLSTATE is 40001. The application has no retry.</p>
            <p><strong>How to fix:</strong> Retry the whole transaction a few times with backoff. Do not catch it and continue as if the write happened. If retries storm, shorten the transaction or lower the isolation level only if the business rule allows it.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`-- application must retry SQLSTATE 40001
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- work
COMMIT;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
