import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Upsert and Bulk Load Failures - Production Scenarios",
  description: "How to fix upsert no-ops and bulk load failures",
};

export default function ScenarioM05L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Upsert and Bulk Load Failures</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The write path is &quot;correct&quot; SQL that still leaves stale or missing data.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A CSV load fails halfway and no rows from the file are visible. How do you fix it?">
            <p><strong>What you see:</strong> COPY or a multi-row INSERT errors on one bad line. The table is unchanged.</p>
            <p><strong>Why it happens:</strong> COPY is one statement. One bad row rolls the statement back.</p>
            <p><strong>How to confirm:</strong> The error names the line and the column, often a type cast or a NOT NULL.</p>
            <p><strong>How to fix:</strong> Clean the file, or load into a text staging table and insert the good rows with a filter. Reject bad rows into an error table instead of failing the whole batch.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE TABLE import_raw (line text);
-- load, then
INSERT INTO products (sku, price)
SELECT split_part(line, ',', 1), split_part(line, ',', 2)::numeric
FROM import_raw
WHERE split_part(line, ',', 2) ~ '^[0-9]+(\\.[0-9]+)?$';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Upserts run without error, but names stay stale. How do you fix it?">
            <p><strong>What you see:</strong> The job logs success. Old names remain. New emails are inserted.</p>
            <p><strong>Why it happens:</strong> ON CONFLICT DO NOTHING skips the update. Or the conflict target does not match the unique index, so you get duplicate errors instead. Or DO UPDATE sets the wrong columns.</p>
            <p><strong>How to confirm:</strong> Read the conflict target and compare it to pg_get_indexdef of the unique index.</p>
            <p><strong>How to fix:</strong> Use DO UPDATE SET name = EXCLUDED.name for the columns that should change. Match the conflict target to a real unique index.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('a@x.com', 'Ada')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name, updated_at = now();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Two workers upsert the same inventory row and stock goes negative or is lost. How do you fix it?">
            <p><strong>What you see:</strong> Stock does not match the sum of movements. No unique error was thrown.</p>
            <p><strong>Why it happens:</strong> Both workers read stock, subtracted in the app, and wrote the result back. The second write overwrote the first. ON CONFLICT on the product id still loses the update if you set stock to an absolute value from the app.</p>
            <p><strong>How to confirm:</strong> Compare the stock column to sum of the movement table.</p>
            <p><strong>How to fix:</strong> Apply the delta in SQL: SET stock = stock - EXCLUDED.delta, or insert an immutable movement row and compute stock. Retry serialization failures. Do not read-modify-write a balance in the application.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`INSERT INTO stock (sku, qty) VALUES ('ABC', -2)
ON CONFLICT (sku) DO UPDATE
SET qty = stock.qty + EXCLUDED.qty;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
