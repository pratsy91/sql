import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 1: Foundations & Setup - Most Asked Query Interview Questions',
  description:
    'Most asked catalog and session SQL queries for PostgreSQL foundations — junior to senior, with Prisma notes',
};

export default function Module01FoundationsQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 1: Foundations &amp; Setup</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked <strong>query</strong> problems for Phase 1 — session, catalog, and connection inspection.
          Junior → Senior. Prisma Client is not a replacement for these catalog queries; use SQL or{' '}
          <code>$queryRawUnsafe</code>.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a query to show the PostgreSQL version and current database/user.">
            <p>Interviewers want you to know built-in session functions, not GUIs.</p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT version();
SELECT current_database(), current_user, session_user, inet_server_addr(), inet_server_port();`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT current_database(), current_user, version()'
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to list all databases on the server.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT datname, pg_encoding_to_char(encoding) AS encoding, datcollate
FROM pg_database
WHERE datistemplate = false
ORDER BY datname;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to list schemas in the current database.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT schema_name
FROM information_schema.schemata
ORDER BY schema_name;

-- Catalog equivalent
SELECT nspname FROM pg_namespace ORDER BY nspname;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to list tables in the public schema.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a query to show the current timezone and other session settings.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SHOW timezone;
SHOW search_path;
SELECT current_setting('TimeZone'), current_setting('max_connections');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write a query to list columns, types, and nullability for a table.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to list indexes on a table.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'users';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to show who you are connected as and whether you are a superuser.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  current_user,
  session_user,
  usesuper,
  usecreatedb
FROM pg_user
WHERE usename = current_user;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query to list active connections (who is connected).">
            <p>Very common ops/interview hybrid question.</p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pid, usename, datname, client_addr, state, query_start, left(query, 80) AS query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write a query to inspect pg_hba-relevant connection auth at runtime (cannot read the file from SQL) — what CAN you query?"
          >
            <p>
              You cannot <code>SELECT</code> <code>pg_hba.conf</code> from SQL on stock Postgres. Interview answer:
              inspect live sessions, roles, and SSL status instead.
            </p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT pid, usename, ssl, client_addr, application_name
FROM pg_stat_ssl
JOIN pg_stat_activity USING (pid);

SELECT rolname, rolsuper, rolcanlogin, rolconnlimit
FROM pg_roles
ORDER BY rolname;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a query to estimate table sizes (useful before choosing pooling / disk).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total,
  pg_size_pretty(pg_relation_size(relid)) AS heap
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write a Prisma-safe way to run a catalog query without SQL injection."
          >
            <p>
              Catalog names should be identifiers you control, not user strings concatenated into SQL. Prefer
              information_schema with bound parameters if you must filter.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const schema = 'public';
const tables = await prisma.$queryRawUnsafe(
  'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = $2',
  schema,
  'BASE TABLE'
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
