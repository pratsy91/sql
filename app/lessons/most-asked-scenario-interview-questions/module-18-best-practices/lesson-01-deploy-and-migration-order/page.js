import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Deploy and Migration Order - Production Scenarios",
  description: "How to fix outages caused by shipping schema and code in the wrong order",
};

export default function ScenarioM18L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Deploy and Migration Order</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          During a rolling deploy, two versions of the app share one database.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="You renamed a column and deployed. Half the pods crash. How do you fix it?">
            <p><strong>What you see:</strong> New pods look for the new name. Old pods look for the old name. One of them errors.</p>
            <p><strong>Why it happens:</strong> A rename is a breaking change. Rolling deploys are not atomic.</p>
            <p><strong>How to confirm:</strong> The error is column does not exist, and it names whichever column that pod version uses.</p>
            <p><strong>How to fix:</strong> Add the new column, backfill, deploy code that writes both, deploy code that reads the new one, then drop the old column. To recover now, add the missing name back as a column or a view so both versions boot.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE users ADD COLUMN full_name text;
UPDATE users SET full_name = name WHERE full_name IS NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The migration ran after the new code, and the new code crashed on a missing column. How do you fix the pipeline?">
            <p><strong>What you see:</strong> The app rolled out first. Every request errors until migrate deploy finishes.</p>
            <p><strong>Why it happens:</strong> The pipeline ordered the app deploy before the schema change. The new code requires the new column.</p>
            <p><strong>How to confirm:</strong> Deploy logs show the app healthy check failing before the migration job.</p>
            <p><strong>How to fix:</strong> Run expand migrations before the app rollout. The new code must tolerate the old schema until the migration is done, or the migration must be finished first. Gate the rollout on a successful migrate deploy.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Two services deployed incompatible migrations at the same time. How do you fix it?">
            <p><strong>What you see:</strong> Service A added a constraint. Service B's old writer now fails that constraint. Or they both tried to migrate and one waits on a lock.</p>
            <p><strong>Why it happens:</strong> There is no single owner of the schema. Each service applied its own change.</p>
            <p><strong>How to confirm:</strong> List the two migration histories and the error each service logs.</p>
            <p><strong>How to fix:</strong> Stop one deploy. Roll the schema back to something both running versions accept, which usually means dropping the new constraint, not dropping data. Make one service own migrations. The other service consumes the schema and does not migrate production.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
