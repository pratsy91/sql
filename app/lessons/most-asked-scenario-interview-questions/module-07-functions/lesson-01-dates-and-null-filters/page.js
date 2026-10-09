import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Wrong Dates and NULL Filters - Production Scenarios",
  description: "How to fix date_trunc and NULL-handling bugs",
};

export default function ScenarioM07L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Wrong Dates and NULL Filters</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The function is valid SQL. The business result is not.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="COALESCE(phone, email) shows an email when the phone is an empty string. How do you fix it?">
            <p><strong>What you see:</strong> The UI prints a blank, not the email. The column is not null. It is empty text.</p>
            <p><strong>Why it happens:</strong> COALESCE only replaces NULL. An empty string is a value.</p>
            <p><strong>How to confirm:</strong> Select length(phone) and phone IS NULL.</p>
            <p><strong>How to fix:</strong> Use NULLIF(phone, '') inside COALESCE, and stop writing empty strings when you mean unknown.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT COALESCE(NULLIF(phone, ''), email) AS contact FROM users;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A daily revenue chart puts late-night orders on the wrong day. How do you fix it?">
            <p><strong>What you see:</strong> Orders after 18:30 UTC land on the next Indian business day, or the reverse.</p>
            <p><strong>Why it happens:</strong> date_trunc('day', created_at) uses the session time zone. The session is UTC and the business day is Asia/Kolkata.</p>
            <p><strong>How to confirm:</strong> SHOW TIME ZONE on the connection that built the chart.</p>
            <p><strong>How to fix:</strong> Convert to the business zone before you truncate. Set the role time zone so ad-hoc sessions do not drift.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day,
       sum(total)
FROM orders
GROUP BY 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="AGE and a hand-rolled month diff disagree for end-of-month subscriptions. How do you fix billing?">
            <p><strong>What you see:</strong> Users billed on 31 Jan are charged again on 2 Mar, or skipped.</p>
            <p><strong>Why it happens:</strong> Months have different lengths. Adding interval '1 month' lands on the last valid day. Counting 30-day chunks does not.</p>
            <p><strong>How to confirm:</strong> Print the period start and end for a 31 Jan start.</p>
            <p><strong>How to fix:</strong> Store the billing anchor as a date and use interval arithmetic on purpose. Document the end-of-month rule. Do not mix AGE for invoices.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT DATE '2026-01-31' + interval '1 month';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
