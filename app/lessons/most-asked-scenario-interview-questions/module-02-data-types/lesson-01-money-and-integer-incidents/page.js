import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Money and Integer Incidents - Production Scenarios",
  description: "How to find and fix float money bugs and integer overflow in production",
};

export default function ScenarioM02L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Money and Integer Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two incidents show up in almost every senior interview: money that drifts, and an id sequence that hits the integer ceiling.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Invoice totals are off by a few paise after thousands of orders. How do you fix it?">
            <p><strong>What you see:</strong> A single row looks fine. The daily sum does not match the payment provider.</p>
            <p><strong>Why it happens:</strong> The column is FLOAT or DOUBLE PRECISION. Values like 0.1 are not exact in binary, so the error grows as you add rows.</p>
            <p><strong>How to confirm:</strong> Check the column type in information_schema. Compare sum of the float column with a numeric cast of the same source values.</p>
            <p><strong>How to fix:</strong> Store money as NUMERIC(12, 2), or as BIGINT in the smallest unit. Stop writing floats. Backfill with a one-time correction from the source of truth, not by rounding the already-wrong float if you still have the original amounts.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'total';

ALTER TABLE orders
  ALTER COLUMN total TYPE numeric(12, 2)
  USING round(total::numeric, 2);`}
            />
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`model Order {
  total Decimal @db.Decimal(12, 2)
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Inserts fail with &quot;integer out of range&quot; on a table that worked for years. How do you fix it?">
            <p><strong>What you see:</strong> Every new insert fails. Reads still work. The error mentions integer, not a check constraint.</p>
            <p><strong>Why it happens:</strong> A SERIAL or INTEGER id reached 2147483647. Postgres does not wrap. It rejects the statement.</p>
            <p><strong>How to confirm:</strong> Look at the sequence last_value and max_value. Check the column type.</p>
            <p><strong>How to fix:</strong> Change the id to BIGINT and point the sequence at the new column. On a large table, do not rewrite in one lock: add a bigint column, backfill in batches, then swap. Until the swap, you can raise the app to stop creating rows if you are already at the ceiling.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT sequencename, last_value, max_value
FROM pg_sequences
ORDER BY last_value DESC NULLS LAST;

ALTER TABLE events ALTER COLUMN id TYPE bigint;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A report query fails with integer out of range even though every column is fine. How do you fix it?">
            <p><strong>What you see:</strong> The table accepts new rows. SELECT sum(quantity) blows up on a large table.</p>
            <p><strong>Why it happens:</strong> sum() of INTEGER stays in integer until you cast. The total crossed 2.1 billion.</p>
            <p><strong>How to confirm:</strong> Run the sum with a bigint cast. If that works, the column type is not the problem.</p>
            <p><strong>How to fix:</strong> Cast inside the aggregate: sum(quantity::bigint). Do the same in Prisma with a raw query if the ORM generates a plain sum.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT sum(quantity::bigint) FROM order_items;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Prices round to the wrong value, such as 9.999 becoming 10.00. Is that a bug, and how do you fix the write path?">
            <p><strong>What you see:</strong> The API sent 9.999 and the row shows 10.00, or the insert errors with numeric field overflow.</p>
            <p><strong>Why it happens:</strong> NUMERIC(10, 2) rounds to the scale on write. If the rounded value needs more digits than the precision allows, Postgres errors instead of storing a lie.</p>
            <p><strong>How to confirm:</strong> Read the numeric precision and scale. Replay the insert in a transaction you roll back.</p>
            <p><strong>How to fix:</strong> Validate scale in the app before insert. Widen precision if the business really needs more digits. Do not switch to float to silence the error.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT 9.999::numeric(10, 2);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You must widen an INTEGER primary key to BIGINT on a hot table without taking the site down. How do you do it?">
            <p><strong>What you see:</strong> The sequence is past 70 percent of the integer max. A plain ALTER would lock writes for a long time.</p>
            <p><strong>Why it happens:</strong> ALTER COLUMN TYPE rewrites the table under a strong lock. Foreign keys pointing at that id must change too.</p>
            <p><strong>How to confirm:</strong> List every foreign key that references the column before you start.</p>
            <p><strong>How to fix:</strong> Add a nullable bigint, backfill in batches, keep a trigger in sync, build a unique index concurrently, then swap the primary key in a short transaction. Repeat for each foreign key. Drop the old column only after the app reads the new one.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT conrelid::regclass AS child, conname
FROM pg_constraint
WHERE confrelid = 'events'::regclass AND contype = 'f';

ALTER TABLE events ADD COLUMN id_big bigint;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
