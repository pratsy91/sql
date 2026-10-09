import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: SQL Injection Incidents - Production Scenarios",
  description: "How to find and fix SQL injection in SQL and Prisma",
};

export default function ScenarioM11L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: SQL Injection Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The symptom is often a weird error or a sudden empty table, not a movie-style hacker screen.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A search for a name returned a database error that includes your SQL. How do you fix it?">
            <p><strong>What you see:</strong> The user typed a quote. The error shows WHERE name = 'O'Brian' or similar.</p>
            <p><strong>Why it happens:</strong> The app concatenated input into SQL.</p>
            <p><strong>How to confirm:</strong> Find the string build in the app. If the user text appears inside the SQL string, it is injectable.</p>
            <p><strong>How to fix:</strong> Use a parameter. In Prisma use the query API or $queryRaw with a parameter placeholder, not string concatenation. Rotate any secret that was exposed in the error page.</p>
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT id FROM users WHERE name = $1',
  name
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="An order export endpoint dumped every customer because of a filter. How do you fix it?">
            <p><strong>What you see:</strong> One request returned far more rows than that user owns. The SQL error log may show a tautology in the WHERE.</p>
            <p><strong>Why it happens:</strong> Dynamic SQL or an ORM raw filter trusted client JSON as part of the query.</p>
            <p><strong>How to confirm:</strong> Read the access log query string and the SQL text.</p>
            <p><strong>How to fix:</strong> Ignore client-supplied SQL fragments. Filter by the server-side user id. Add row level security as a backstop. Review the data that left and notify if it was personal data.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_owner ON orders
  USING (user_id = current_setting('app.user_id')::bigint);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You found SELECT statements in the log that your app never wrote, from the app role. How do you respond?">
            <p><strong>What you see:</strong> pg_stat_statements or the log shows catalog reads and selects on tables the product does not use.</p>
            <p><strong>Why it happens:</strong> The application database user can run any SQL, and a leaked URL or an injection let someone in.</p>
            <p><strong>How to confirm:</strong> List recent client addresses for that role. Compare to known app subnets.</p>
            <p><strong>How to fix:</strong> Rotate the password. Kill unknown sessions. Restrict pg_hba to the app network. Reduce grants to only the tables the app needs. Turn on enough logging to see statements from that role. Assume data was read and follow your incident process.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, client_addr, usename, query, backend_start
FROM pg_stat_activity
WHERE usename = 'app_user';

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'app_user'
  AND client_addr <> '10.0.0.5';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
