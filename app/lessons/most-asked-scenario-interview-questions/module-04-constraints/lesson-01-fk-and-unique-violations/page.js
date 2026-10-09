import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Foreign Key and Unique Violations - Production Scenarios",
  description: "How to fix foreign key and unique constraint incidents in production",
};

export default function ScenarioM04L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Foreign Key and Unique Violations</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These are the constraint errors support tickets are made of.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Deleting a user fails with a foreign key violation. How do you fix it?">
            <p><strong>What you see:</strong> The DELETE errors and names a child table such as orders.</p>
            <p><strong>Why it happens:</strong> Child rows still point at that user. The foreign key is NO ACTION or RESTRICT, which is the default.</p>
            <p><strong>How to confirm:</strong> Count child rows. Read the constraint definition.</p>
            <p><strong>How to fix:</strong> If the business wants to keep history, do not delete the user. Mark the user inactive. If the children should go away, delete them first or change the foreign key to ON DELETE CASCADE after you understand the blast radius. Never disable the foreign key to force the delete.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'orders'::regclass AND contype = 'f';

SELECT count(*) FROM orders WHERE user_id = 42;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Two users signed up with the same email at the same time and one request got a unique violation. How do you fix it?">
            <p><strong>What you see:</strong> One request returns 500. The other user exists. The log says duplicate key value.</p>
            <p><strong>Why it happens:</strong> Both transactions passed a SELECT that saw no row, then both inserted. The unique index correctly rejected the second.</p>
            <p><strong>How to confirm:</strong> The error includes the constraint name. There is one row, not two.</p>
            <p><strong>How to fix:</strong> Treat the unique violation as &quot;already exists&quot; and return that user. Use INSERT ON CONFLICT, or catch Prisma P2002. Do not drop the unique index.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`INSERT INTO users (email) VALUES ('a@x.com')
ON CONFLICT (email) DO NOTHING
RETURNING id;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A user delete succeeded and took orders, payments, and files with it. How do you stop that happening again?">
            <p><strong>What you see:</strong> One DELETE removed a tree of data. Nobody ran a delete on those child tables.</p>
            <p><strong>Why it happens:</strong> ON DELETE CASCADE was set on several foreign keys. It did what it was defined to do.</p>
            <p><strong>How to confirm:</strong> List cascade constraints that reference the parent.</p>
            <p><strong>How to fix:</strong> Restore from backup if this was unintended. Change cascades you do not want to RESTRICT. Soft-delete the parent instead. Add a guard in the app, but the database rule is what actually ran.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT conrelid::regclass, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE confrelid = 'users'::regclass
  AND contype = 'f'
  AND pg_get_constraintdef(oid) ILIKE '%CASCADE%';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Inserting an order and its invoice fails on a foreign key even though both rows are in the same transaction. How do you fix it?">
            <p><strong>What you see:</strong> Two tables reference each other. The first insert fails because the other row does not exist yet.</p>
            <p><strong>Why it happens:</strong> Foreign keys are checked per statement, not at commit, unless they are DEFERRABLE.</p>
            <p><strong>How to confirm:</strong> Read the constraint. If it is not deferrable, the cycle cannot be inserted in one statement order.</p>
            <p><strong>How to fix:</strong> Make the foreign key DEFERRABLE INITIALLY DEFERRED, or insert a null and update it after both rows exist. Prefer a design that does not need a cycle.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders ALTER CONSTRAINT orders_invoice_fk DEFERRABLE INITIALLY DEFERRED;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
