import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Trigger Incidents - Production Scenarios",
  description: "How to find and fix trigger failures and recursion",
};

export default function ScenarioM08L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Trigger Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The app SQL looks fine. The error comes from a trigger the developer forgot existed.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="An insert fails with an error that is not in the application SQL. How do you find it?">
            <p><strong>What you see:</strong> The statement is a simple INSERT. The error mentions a function name.</p>
            <p><strong>Why it happens:</strong> A BEFORE trigger ran and raised an exception, so the insert rolled back.</p>
            <p><strong>How to confirm:</strong> List triggers on the table. Read the function body.</p>
            <p><strong>How to fix:</strong> Fix the trigger condition or the data it rejects. If the trigger is obsolete, drop it in a reviewed migration. Do not disable triggers globally on a production table.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'orders'::regclass AND NOT tgisinternal;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Writes fail with &quot;stack depth limit exceeded&quot; after a trigger change. How do you fix it?">
            <p><strong>What you see:</strong> One update explodes. The log shows the same function over and over.</p>
            <p><strong>Why it happens:</strong> The trigger updates the same table, which fires the trigger again.</p>
            <p><strong>How to confirm:</strong> Read the function. Look for UPDATE on the trigger table without a guard.</p>
            <p><strong>How to fix:</strong> Update only when the value actually changes. Or use a BEFORE trigger that assigns NEW.column instead of issuing another UPDATE. For audit tables, write to a different table.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`IF NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
  RETURN NEW;
END IF;
NEW.updated_at := now();
RETURN NEW;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A trigger updates stock, and under load the stock is wrong even though each order committed. How do you fix it?">
            <p><strong>What you see:</strong> No error. Stock drifts from the sum of order items.</p>
            <p><strong>Why it happens:</strong> The trigger did a read-modify-write without locking the stock row, or it fired per row in an order that deadlocked and the app retried poorly.</p>
            <p><strong>How to confirm:</strong> Compare stock to the ledger. Read the trigger for SELECT then UPDATE.</p>
            <p><strong>How to fix:</strong> Update stock in one statement: SET qty = qty - NEW.qty. Keep an append-only ledger as the source of truth. Make the trigger idempotent if the app retries.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE stock SET qty = qty - NEW.qty WHERE sku = NEW.sku;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
