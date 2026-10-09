import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Missing Extensions - Production Scenarios",
  description: "How to fix missing or misplaced extensions",
};

export default function ScenarioM14L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Missing Extensions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The SQL is valid. The extension was never created in this database.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Inserts fail with &quot;function gen_random_uuid() does not exist&quot; on a new database. How do you fix it?">
            <p><strong>What you see:</strong> The same insert works in production and fails in a fresh CI database.</p>
            <p><strong>Why it happens:</strong> On PostgreSQL 12 and older the function is in pgcrypto. The extension was not created. Prisma shadow databases hit this often.</p>
            <p><strong>How to confirm:</strong> SELECT * FROM pg_extension. Check server version.</p>
            <p><strong>How to fix:</strong> CREATE EXTENSION pgcrypto, or upgrade to a version where gen_random_uuid is built in. Put that statement in the baseline migration so every new database gets it.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The extension exists, but the app still cannot see the type or function. How do you fix it?">
            <p><strong>What you see:</strong> pg_extension shows citext. CREATE TABLE with a citext column fails for the app role, or it created a different citext.</p>
            <p><strong>Why it happens:</strong> The extension was installed in a schema that is not on the search_path, or a local type shadows it.</p>
            <p><strong>How to confirm:</strong> Look at extnamespace. Show the app search_path.</p>
            <p><strong>How to fix:</strong> Install extensions in a dedicated schema and add it to the role search_path, or schema-qualify the type. Do not install them into a schema the app can create objects in.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT e.extname, n.nspname
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="After a major upgrade, an extension will not load and the database will not start cleanly. How do you fix it?">
            <p><strong>What you see:</strong> The log says the extension library is missing or the version is wrong.</p>
            <p><strong>Why it happens:</strong> The new Postgres binaries do not include that extension build, or the extension needs ALTER EXTENSION UPDATE.</p>
            <p><strong>How to confirm:</strong> Compare the library on disk with the extension version in the database.</p>
            <p><strong>How to fix:</strong> Install the matching extension package before you start the new server. Run ALTER EXTENSION ... UPDATE. For an extension you no longer need, drop it before the upgrade. Do not copy old .so files onto a new major version.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER EXTENSION postgis UPDATE;
SELECT extname, extversion FROM pg_extension;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
