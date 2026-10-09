import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Functions That Kill Indexes - Production Scenarios",
  description: "How to fix queries that wrap indexed columns in functions",
};

export default function ScenarioM07L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Functions That Kill Indexes</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The index is there. The predicate cannot use it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Login by email got slow after you added lower(). How do you fix it?">
            <p><strong>What you see:</strong> WHERE lower(email) = lower($1) scans the table. A plain equality was fast.</p>
            <p><strong>Why it happens:</strong> The index is on email, not on lower(email).</p>
            <p><strong>How to confirm:</strong> EXPLAIN shows a sequential scan. The index definition has no expression.</p>
            <p><strong>How to fix:</strong> Create an expression index on lower(email), and query with the same expression. Or store a generated email_lower column and index that.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE INDEX users_email_lower_idx ON users (lower(email));`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="WHERE created_at::date = CURRENT_DATE is slow on a large table. How do you fix it?">
            <p><strong>What you see:</strong> The daily job times out. An index on created_at exists.</p>
            <p><strong>Why it happens:</strong> Casting the column to date hides it from the btree. The planner cannot turn that into a range.</p>
            <p><strong>How to confirm:</strong> EXPLAIN both the cast form and a range form.</p>
            <p><strong>How to fix:</strong> Write a range: created_at &gt;= date_trunc('day', now()) AND created_at &lt; date_trunc('day', now()) + interval '1 day'.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT count(*) FROM events
WHERE created_at >= date_trunc('day', now())
  AND created_at < date_trunc('day', now()) + interval '1 day';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You added an index on a function and Postgres refused to create it. How do you fix it?">
            <p><strong>What you see:</strong> CREATE INDEX errors because the function is not immutable.</p>
            <p><strong>Why it happens:</strong> Index expressions must be immutable. now(), and anything that depends on the session, is not.</p>
            <p><strong>How to confirm:</strong> Look at the function volatility in pg_proc.</p>
            <p><strong>How to fix:</strong> Do not mark a volatile function immutable to force the index. Change the design: store the derived value in a generated column if the expression really is immutable, or index the raw column and filter with a range.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT proname, provolatile
FROM pg_proc
WHERE proname = 'lower';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
