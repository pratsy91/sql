import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Invalid Indexes and Dependencies - Production Scenarios",
  description: "How to repair invalid indexes and objects that block DROP",
};

export default function ScenarioM03L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Invalid Indexes and Dependencies</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The migration tool says it failed, but it still left something behind.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="DROP COLUMN fails because a view depends on it. How do you fix it?">
            <p><strong>What you see:</strong> The error names a view or a rule that uses the column.</p>
            <p><strong>Why it happens:</strong> Postgres will not drop something another object still references.</p>
            <p><strong>How to confirm:</strong> Query pg_depend or read the error. Open the view definition.</p>
            <p><strong>How to fix:</strong> Drop or replace the view first, drop the column, then recreate the view without that column. Use CREATE OR REPLACE VIEW when the new definition is compatible.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_get_viewdef('orders_v'::regclass);
DROP VIEW orders_v;
ALTER TABLE orders DROP COLUMN old_note;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="CREATE INDEX CONCURRENTLY failed and now inserts are slower, or the migration cannot be retried. How do you fix it?">
            <p><strong>What you see:</strong> The index exists but is invalid. A second create says the relation already exists.</p>
            <p><strong>Why it happens:</strong> CONCURRENTLY cannot run inside a transaction. If it fails, Postgres keeps an invalid index so it does not lose the name.</p>
            <p><strong>How to confirm:</strong> Check pg_index.indisvalid for that index.</p>
            <p><strong>How to fix:</strong> Drop the invalid index, then create it again outside a transaction. Do not wrap CONCURRENTLY in a migration transaction. Prisma users often put concurrent indexes in a hand-written migration that is not transactional.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT c.relname, i.indisvalid
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid;

DROP INDEX CONCURRENTLY orders_user_id_idx;
CREATE INDEX CONCURRENTLY orders_user_id_idx ON orders (user_id);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A unique index build succeeded, but duplicates appeared anyway. How is that possible, and how do you fix it?">
            <p><strong>What you see:</strong> The index exists. A later read finds two rows that should be unique.</p>
            <p><strong>Why it happens:</strong> The unique index is partial, or it is not the constraint the app thinks it is. Or the duplicates differ by case, spaces, or a type cast the index does not cover.</p>
            <p><strong>How to confirm:</strong> Read the index definition with pg_get_indexdef. Look for WHERE, lower(), or an expression.</p>
            <p><strong>How to fix:</strong> Clean the duplicates, then create the unique index that matches the real rule, such as unique on lower(email). Do not trust a constraint the predicate does not cover.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_get_indexdef(indexrelid), indisunique, indisvalid
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE i.indrelid = 'users'::regclass;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
