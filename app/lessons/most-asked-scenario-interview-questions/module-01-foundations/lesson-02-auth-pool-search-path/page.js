import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Auth, Pool, and search_path - Production Scenarios",
  description: "Production incidents for authentication, connection limits, SSL, and search_path, with fixes",
};

export default function ScenarioM01L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Auth, Pool, and search_path</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The server is reachable. Login, the pool, or the schema search path is what breaks the request.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The error is &quot;password authentication failed&quot;. The password in the app looks right. How do you fix it?">
            <p><strong>What you see:</strong> TCP works. Postgres rejects the password. A recent deploy or a secret rotation is the usual timing.</p>
            <p><strong>Why it happens:</strong> The secret in the app does not match the role password. Extra quotes, a trailing newline in the secret, or an old pod still using the previous secret are common.</p>
            <p><strong>How to confirm:</strong> Try the same URL with psql from the app host. Check which secret version the running process actually has. Look at the log for the user name, not only the app message.</p>
            <p><strong>How to fix:</strong> Set the role password to the secret you intend to use, or fix the secret. Roll the app so every replica picks up the new value. Do not log the URL.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER ROLE app_user PASSWORD 'new-secret';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="The table exists, but the app says &quot;relation users does not exist&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The table is in the database. A query in psql as the owner works. The app role fails.</p>
            <p><strong>Why it happens:</strong> The table is not on the app role search_path, usually because it lives in a schema other than public, or public was removed from the path.</p>
            <p><strong>How to confirm:</strong> Run SHOW search_path as the app user. Check the table schema in pg_tables.</p>
            <p><strong>How to fix:</strong> Either schema-qualify the table (app.users) or set the role search_path. In Prisma, set the schema in the datasource or model map. Do not move production tables by guessing.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SHOW search_path;
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'users';

ALTER ROLE app_user SET search_path TO app, public;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Production starts returning &quot;remaining connection slots are reserved&quot; or &quot;too many connections&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The site works until traffic rises, then new requests fail to get a connection. Existing requests may still finish.</p>
            <p><strong>Why it happens:</strong> max_connections is exhausted. Each app process opens its own pool. Several replicas times a large pool is more than Postgres allows. Leaked connections and idle-in-transaction sessions count too.</p>
            <p><strong>How to confirm:</strong> Count sessions by user and state. Compare to max_connections. Check pool size times replica count.</p>
            <p><strong>How to fix:</strong> Put PgBouncer or a managed pooler in front. Lower the per-process pool. Fix leaks. Raise max_connections only after you know the memory cost. Superuser slots are reserved on purpose so you can still log in and kill sessions.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SHOW max_connections;
SELECT usename, state, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND usename = 'app_user'
  AND state_change < now() - interval '10 minutes';`}
            />
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`// Prisma: keep the pool small per process
// connection_limit=5 in the URL when you run many replicas
// postgresql://app:pw@db:5432/app?connection_limit=5`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="The server log says &quot;SSL off&quot; or the app says the server does not support SSL. How do you fix it?">
            <p><strong>What you see:</strong> Local connections work. Remote connections fail with an SSL mismatch.</p>
            <p><strong>Why it happens:</strong> The server requires hostssl, but the client URL says sslmode=disable. Or the client demands verify-full and the certificate name does not match the host.</p>
            <p><strong>How to confirm:</strong> Read the URL sslmode and the pg_hba line that matched. Check the certificate subject against the hostname.</p>
            <p><strong>How to fix:</strong> Use sslmode=require for a start, and verify-full once the cert name matches. Install the CA on the app. Do not turn SSL off on a public network.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SHOW ssl;
SELECT * FROM pg_stat_ssl JOIN pg_stat_activity USING (pid)
WHERE usename = 'app_user';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A deploy added a schema, and suddenly unqualified queries hit the wrong table. How do you fix it?">
            <p><strong>What you see:</strong> Reports change after a release even though the SQL text did not change. Some rows look like an old copy of the data.</p>
            <p><strong>Why it happens:</strong> search_path lists more than one schema, and both contain a table with the same name. Postgres uses the first match. A new schema earlier in the path shadows public.</p>
            <p><strong>How to confirm:</strong> SELECT current_schemas(true). Check pg_tables for duplicate table names.</p>
            <p><strong>How to fix:</strong> Schema-qualify every production query, or set a single-schema search_path on the role. Drop or rename the shadow table after you prove nothing should read it.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT current_schemas(true);
SELECT n.nspname, c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'orders' AND c.relkind = 'r';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
