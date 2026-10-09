import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Time, JSON, and ENUM Incidents - Production Scenarios",
  description: "How to fix timezone bugs, JSONB field loss, and failed ENUM migrations",
};

export default function ScenarioM02L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Time, JSON, and ENUM Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These incidents look like application bugs. The column type is what makes them happen.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Created-at times are off by 5 hours 30 minutes for every user in India. How do you fix it?">
            <p><strong>What you see:</strong> The instant is right in the database session and wrong in the UI, or the stored clock time has no zone and gets shifted again by the app.</p>
            <p><strong>Why it happens:</strong> The column is TIMESTAMP without time zone, and one layer assumes UTC while another assumes Asia/Kolkata.</p>
            <p><strong>How to confirm:</strong> Check the column type and SHOW TIME ZONE. Compare a known event with the payment-provider timestamp.</p>
            <p><strong>How to fix:</strong> Store instants as TIMESTAMPTZ. Keep DATE for birthdays. In Prisma set the native type to timestamptz. Convert existing rows with AT TIME ZONE only after you agree which zone the naive values were written in.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT data_type FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'created_at';

ALTER TABLE orders
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="A birthday shows as the previous day for users west of the server. How do you fix it?">
            <p><strong>What you see:</strong> The profile says 2 July in India and 1 July in the US.</p>
            <p><strong>Why it happens:</strong> A calendar date was stored as TIMESTAMPTZ at midnight UTC, then formatted in a negative offset.</p>
            <p><strong>How to confirm:</strong> Read the raw value and the column type. If it is timestamptz, the shift is the bug.</p>
            <p><strong>How to fix:</strong> Move birthdays to DATE. Stop sending them through timezone conversion in the API.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE people ADD COLUMN birthday date;
UPDATE people SET birthday = (born_at AT TIME ZONE 'UTC')::date;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="An update of one JSONB field wiped coupon and items. How do you fix it?">
            <p><strong>What you see:</strong> The status changed to paid. Every other key in the document is gone.</p>
            <p><strong>Why it happens:</strong> The app replaced the whole JSONB value with a small object. Prisma Json updates do that unless you merge.</p>
            <p><strong>How to confirm:</strong> Read the application update. If it sets data to a new object, it is a replace, not a patch.</p>
            <p><strong>How to fix:</strong> Merge in SQL with the concatenation operator, or read-modify-write under a transaction if you must do it in the app. Prefer real columns for fields you update often.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE orders
SET data = data || '{"status":"paid"}'::jsonb
WHERE id = 1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="A Prisma migration that adds an ENUM value fails, and the deploy rolls back. How do you fix it?">
            <p><strong>What you see:</strong> The migration errors with unsafe use of new value, or ADD VALUE cannot run inside a transaction.</p>
            <p><strong>Why it happens:</strong> Postgres lets you add an enum value inside a transaction from version 12, but you cannot use that new value in the same transaction. Older servers refuse ADD VALUE in a transaction at all. Prisma wraps migrations in a transaction.</p>
            <p><strong>How to confirm:</strong> Read the migration SQL. Look for ADD VALUE followed by an UPDATE or a default that uses the new label in the same file.</p>
            <p><strong>How to fix:</strong> Split into two migrations. The first only adds the value. Deploy it. The second starts using the value. Do not try to remove an enum value in a hurry. That needs a new type.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A report grouped by day is missing or double-counting rows around midnight. How do you fix it?">
            <p><strong>What you see:</strong> The UTC report and the business-day report disagree for the last hour of the day.</p>
            <p><strong>Why it happens:</strong> date_trunc without a zone uses the session TimeZone. Sessions differ between the app, the replica, and the analyst.</p>
            <p><strong>How to confirm:</strong> Print the session time zone on each client. Run the same date_trunc in UTC and in the business zone.</p>
            <p><strong>How to fix:</strong> Trunc in the business zone on purpose: date_trunc with AT TIME ZONE. Set the database or role time zone to UTC so accidental session zones stop changing results.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS business_day,
       count(*)
FROM orders
GROUP BY 1
ORDER BY 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
