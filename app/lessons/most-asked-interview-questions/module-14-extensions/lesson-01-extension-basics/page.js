import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Extension Basics - Module 14 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL extension interview questions: what an extension is, CREATE EXTENSION, listing versions, managed host allowlists, install schema, pg_dump, Prisma extensions, privileges, and upgrades.',
};

export default function Module14Lesson01ExtensionBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Extension Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          An extension is an add-on that gives PostgreSQL features the core database does not ship with.
          This lesson covers how you install one, where it lives, who is allowed to install it, and how it
          survives dumps, migrations, and version upgrades.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a PostgreSQL extension?">
            <p>
              An extension is a package of database objects, such as types, functions, operators, and index
              methods, and sometimes a compiled C library, bundled under one name. Running{' '}
              <code>CREATE EXTENSION</code> installs all of it at once, and <code>DROP EXTENSION</code>{' '}
              removes all of it at once.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It is installed <strong>per database</strong>, not per cluster. Enabling it in{' '}
                <code>shop</code> does not enable it in <code>analytics</code>.
              </li>
              <li>
                The files must already exist on the server. SQL alone cannot download an extension.
              </li>
              <li>
                Familiar examples: <code>pg_trgm</code> for fuzzy text search, <code>postgis</code> for maps,{' '}
                <code>vector</code> for AI embeddings, <code>pg_stat_statements</code> for query statistics.
              </li>
              <li>
                Managed providers only allow extensions from their approved list.
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you create, list, and drop extensions?">
            <p>
              Three statements cover almost everything. Use <code>IF NOT EXISTS</code> so migrations can be
              re-run safely, and quote names that contain a hyphen.
            </p>
            <CodeBlock
              title="Extension lifecycle"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- quotes needed: it has a hyphen

-- What is installed in this database?
SELECT extname, extversion FROM pg_extension ORDER BY extname;
-- In psql the shortcut is \\dx

-- What could be installed on this server?
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
WHERE installed_version IS NULL
ORDER BY name;

DROP EXTENSION IF EXISTS pg_trgm;             -- fails if objects depend on it
DROP EXTENSION IF EXISTS pg_trgm CASCADE;     -- also drops those objects: be careful`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Are extensions available on managed hosts like RDS, Cloud SQL, or Supabase?"
          >
            <p>
              Only the ones the provider allows. You are not a full superuser on a managed instance, so you
              cannot place new C libraries on the server. You may install extensions from the
              provider&apos;s allowlist, and nothing else.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Common everywhere: <code>pg_trgm</code>, <code>pgcrypto</code>, <code>citext</code>,{' '}
                <code>hstore</code>, <code>uuid-ossp</code>, <code>postgis</code>,{' '}
                <code>pg_stat_statements</code>.
              </li>
              <li>
                Often gated or version-lagged: <code>vector</code> (pgvector), <code>pg_partman</code>,{' '}
                <code>timescaledb</code>, <code>pg_cron</code>.
              </li>
              <li>
                Anything needing <code>shared_preload_libraries</code> also needs a parameter-group change
                and a restart, which the provider controls.
              </li>
              <li>
                Check before you design: query <code>pg_available_extensions</code> on the actual target
                instance, not on your laptop.
              </li>
            </ul>
            <p>
              Good interview instinct: say &quot;I would confirm the extension is on the provider allowlist
              before making it load-bearing in the design, and have a fallback if it is not.&quot;
            </p>
            <CodeBlock
              title="Check what this specific server offers"
              language="sql"
              code={`SELECT name, default_version
FROM pg_available_extensions
WHERE name IN ('vector', 'pg_trgm', 'postgis', 'pg_cron')
ORDER BY name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you check the installed version of an extension?">
            <p>
              Version matters because features arrive in extension releases, not PostgreSQL releases. HNSW
              indexes, for example, need pgvector 0.5.0 or later. The installed version and the newest
              available version are two different numbers, so compare them.
            </p>
            <CodeBlock
              title="Installed vs available versions"
              language="sql"
              code={`-- Installed right now
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Installed and newest available side by side
SELECT name, installed_version, default_version
FROM pg_available_extensions
WHERE installed_version IS NOT NULL
  AND installed_version <> default_version;

-- Every upgrade path the server knows about
SELECT * FROM pg_available_extension_versions WHERE name = 'vector';`}
            />
            <CodeBlock
              title="Assert a minimum version in app startup"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  "SELECT extversion FROM pg_extension WHERE extname = 'vector'"
);
if (rows.length === 0) {
  throw new Error('pgvector is not installed on this database');
}
console.log('pgvector version:', rows[0].extversion);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Where should extensions be installed? What are the schema concerns?">
            <p>
              By default an extension lands in whatever schema is first on your <code>search_path</code>,
              which is usually <code>public</code>. That mixes extension functions with your own tables.
              Many teams instead create a dedicated <code>extensions</code> schema and add it to the search
              path, which keeps <code>public</code> clean and makes it safe to lock down.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A dedicated schema means you can <code>REVOKE CREATE ON SCHEMA public</code> without breaking
                extension functions.
              </li>
              <li>
                Every session that uses those functions needs the schema on its <code>search_path</code>, or
                calls must be schema-qualified.
              </li>
              <li>
                Choose the schema at install time. Some extensions, including PostGIS, cannot be relocated
                afterwards.
              </li>
              <li>
                Managed Postgres may force a specific schema, so check before standardising.
              </li>
            </ul>
            <CodeBlock
              title="Install into a dedicated schema"
              language="sql"
              code={`CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Make the functions findable for everyone in this database
ALTER DATABASE shop SET search_path TO public, extensions;

-- Relocate one that supports it
ALTER EXTENSION citext SET SCHEMA extensions;

-- Where did each extension end up?
SELECT e.extname, n.nspname AS schema
FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Do extensions survive pg_dump and Prisma migrate?">
            <p>
              <code>pg_dump</code> writes a <code>CREATE EXTENSION</code> statement, not the extension&apos;s
              contents. That is deliberate: the dump records &quot;this database uses pg_trgm&quot;, and the
              target server must already have the pg_trgm files installed. Restore onto a server without
              them and the restore fails.
            </p>
            <p>
              For Prisma, the rule is: if your schema depends on an extension, a migration must create it.
              Otherwise a fresh database in CI or a new developer machine breaks, because the extension was
              only ever enabled by hand in staging.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Put <code>CREATE EXTENSION IF NOT EXISTS ...</code> at the top of your first migration.
              </li>
              <li>Keep it idempotent so re-running is harmless.</li>
              <li>
                The migration role needs privilege to create extensions, which the runtime app role should
                not have.
              </li>
              <li>
                Test it the real way: drop the dev database, run <code>prisma migrate deploy</code> on an
                empty one, and see if it succeeds.
              </li>
            </ul>
            <CodeBlock
              title="Extension inside a Prisma migration"
              language="sql"
              code={`-- prisma/migrations/20260101000000_init_extensions/migration.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma declare PostgreSQL extensions in the schema?">
            <p>
              Prisma can list extensions in the <code>datasource</code> block. Declaring them documents what
              the database needs and lets <code>prisma migrate</code> emit the{' '}
              <code>CREATE EXTENSION</code> statements for you. Older Prisma versions needed the{' '}
              <code>postgresqlExtensions</code> preview feature flag, so check your version.
            </p>
            <p>
              Declaring an extension does not make the server able to provide it. The files still have to be
              there and the role still needs privileges.
            </p>
            <CodeBlock
              title="Prisma schema extensions"
              language="prisma"
              code={`datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, citext, vector]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"] // only if your Prisma version needs it
}

model Document {
  id        String                       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title     String
  embedding Unsupported("vector(1536)")?
}`}
            />
            <CodeBlock
              title="Pinning a version or schema"
              language="prisma"
              code={`datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [
    pgcrypto(schema: "extensions"),
    vector(version: "0.7.0")
  ]
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="What matters about shared_preload_libraries and extension privileges?"
          >
            <p>
              Some extensions are pure SQL and install instantly. Others load code into the PostgreSQL
              process at startup and must be named in <code>shared_preload_libraries</code>, which requires a{' '}
              <strong>restart</strong>. <code>pg_stat_statements</code>, <code>pg_cron</code>, and{' '}
              <code>auto_explain</code> are the classic examples, and forgetting the restart is a very common
              interview trap.
            </p>
            <p>
              On privileges: <code>CREATE EXTENSION</code> normally needs superuser, or a role with the right
              grants. PostgreSQL 13 added trusted extensions, which a database owner may install without
              superuser. Managed providers hand you a role with just enough power for their allowlist.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Never let the application runtime role create extensions. Installing an extension can mean
                loading native code, which is effectively full server access.
              </li>
              <li>
                Split roles: a migration role that may create extensions, and an app role that may only use
                them.
              </li>
              <li>
                Plan the restart. Adding to <code>shared_preload_libraries</code> is a maintenance window,
                not a hot change.
              </li>
              <li>
                Some extensions also expose sensitive data, so grant <code>EXECUTE</code> on their functions
                deliberately.
              </li>
            </ul>
            <CodeBlock
              title="Preload settings and role separation"
              language="sql"
              code={`-- Requires a restart to take effect
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain';
-- then: systemctl restart postgresql

SHOW shared_preload_libraries;

-- Only after the restart does this succeed
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- The runtime role reads data and nothing more
CREATE ROLE app_runtime LOGIN PASSWORD 'secret';
GRANT USAGE ON SCHEMA public, extensions TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
-- Deliberately not granted: superuser, CREATE on schemas, extension creation`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you upgrade extensions safely across PostgreSQL 15 to 16 to 17?"
          >
            <p>
              A major version upgrade moves the server binaries. It does not upgrade your extensions. The old
              extension SQL definitions come across unchanged, so you must update them explicitly afterwards
              or you can end up with functions that no longer match the installed library.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Before</strong>: confirm every extension you use has a build for the new major
                version. One unsupported extension can block the whole upgrade, and this is the step teams
                skip.
              </li>
              <li>
                <strong>Install both</strong>: the new extension files must be present before you start the
                server on the new version.
              </li>
              <li>
                <strong>After</strong>: run <code>ALTER EXTENSION ... UPDATE</code> in every database, not
                just the main one. Do not forget <code>template1</code>.
              </li>
              <li>
                <strong>Reindex when told to</strong>: PostGIS and pgvector release notes sometimes require
                rebuilding indexes because the on-disk format or operator classes changed. Use{' '}
                <code>REINDEX ... CONCURRENTLY</code> to avoid downtime.
              </li>
              <li>
                <strong>Record versions in code</strong>: pin extension versions in your infrastructure as
                code and runbooks so staging and production cannot drift.
              </li>
              <li>
                <strong>Rehearse</strong>: restore a production-sized copy, upgrade it, and run your test
                suite before touching production.
              </li>
            </ul>
            <CodeBlock
              title="Post-upgrade extension update"
              language="sql"
              code={`-- Anything left behind on the old definition?
SELECT name, installed_version, default_version
FROM pg_available_extensions
WHERE installed_version IS NOT NULL
  AND installed_version <> default_version;

ALTER EXTENSION vector UPDATE;
ALTER EXTENSION pg_trgm UPDATE;
ALTER EXTENSION postgis UPDATE;

-- Or target a specific version
ALTER EXTENSION vector UPDATE TO '0.7.0';

SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- If the release notes require it, rebuild without blocking writes
REINDEX INDEX CONCURRENTLY docs_embedding_hnsw;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
