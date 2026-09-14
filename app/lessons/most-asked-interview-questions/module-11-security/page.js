import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 11: Security - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL security interview questions: roles, GRANT/REVOKE, SUPERUSER, RLS, column privileges, SQL injection, and Prisma parameterized queries.',
};

export default function Module11() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 11: Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 11 — Junior → Senior. Covers roles vs users,
          GRANT/REVOKE, SUPERUSER risks, RLS, column privileges, SQL injection, connection secrets,
          and Prisma&apos;s parameterization model (PostgreSQL 15/16/17).
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            Junior Level
          </h2>

          <InterviewQACard level="Junior" question="What is the difference between a role and a user in PostgreSQL?">
            <p>
              In modern PostgreSQL, <strong>users are roles</strong>. <code>CREATE USER alice</code> is
              equivalent to <code>CREATE ROLE alice LOGIN</code>. Roles can own objects, hold privileges,
              and be members of other roles. A “group” is typically a role without <code>LOGIN</code>.
            </p>
            <CodeBlock
              title="Roles and membership"
              language="sql"
              code={`CREATE ROLE app_readonly NOLOGIN;
CREATE ROLE alice LOGIN PASSWORD '***';
GRANT app_readonly TO alice;

-- Check current role / membership
SELECT current_user, session_user;
SELECT r.rolname AS member, g.rolname AS "group"
FROM pg_auth_members m
JOIN pg_roles r ON r.oid = m.member
JOIN pg_roles g ON g.oid = m.roleid;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do GRANT and REVOKE work?">
            <p>
              <code>GRANT</code> gives privileges on database objects; <code>REVOKE</code> removes them.
              Common privileges: <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>,{' '}
              <code>DELETE</code>, <code>TRUNCATE</code>, <code>REFERENCES</code>, <code>TRIGGER</code>,
              and for schemas <code>USAGE</code> / <code>CREATE</code>.
            </p>
            <CodeBlock
              title="GRANT / REVOKE examples"
              language="sql"
              code={`GRANT CONNECT ON DATABASE shop TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_readonly;

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM app_readonly;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why is SUPERUSER dangerous?">
            <p>
              A <code>SUPERUSER</code> bypasses nearly all permission checks (including RLS unless you
              carefully force it), can read/write any table, alter roles, load arbitrary extensions, and
              run as other users. Application connection pools should <strong>never</strong> use a
              superuser. Prefer a limited owner role for migrations and a least-privilege role for the app.
            </p>
            <CodeBlock
              title="Avoid SUPERUSER for apps"
              language="sql"
              code={`-- Bad: app connects as postgres / SUPERUSER
-- Good: separate roles
CREATE ROLE migrator LOGIN PASSWORD '...';  -- owns schema, runs migrations
CREATE ROLE app_user LOGIN PASSWORD '...';   -- DML only on needed tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE orders TO app_user;
-- No BYPASSRLS, no CREATEDB, no SUPERUSER`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is SQL injection and how do you prevent it in PostgreSQL?">
            <p>
              SQL injection happens when untrusted input is concatenated into SQL text, letting attackers
              change query structure. Prevention: always use <strong>parameterized queries</strong> (bound
              parameters), never string-build SQL from user input, and validate types/lengths at the app
              layer.
            </p>
            <CodeBlock
              title="Unsafe vs parameterized SQL"
              language="sql"
              code={`-- UNSAFE: concatenating user input into SQL text
-- SELECT * FROM users WHERE email = '' || user_input || '';

-- SAFE: $1 is a bound parameter, not interpolated SQL
PREPARE find_user(text) AS
  SELECT id, email FROM users WHERE email = $1;
EXECUTE find_user('alice@example.com');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How should database secrets be handled in connection strings?">
            <p>
              Store credentials in environment variables or a secret manager—never commit them to git.
              Prefer URL-encoded passwords, TLS (<code>sslmode=require</code> / <code>verify-full</code>),
              and rotate passwords regularly. Use different credentials per environment and per service.
            </p>
            <CodeBlock
              title="Prisma / Node env pattern"
              language="typescript"
              code={`// .env (not committed)
DATABASE_URL="postgresql://app_user:SECRET@db.example.com:5432/shop?sslmode=require"

// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Never log DATABASE_URL; redact connection strings in error reporters`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">
            Mid Level
          </h2>

          <InterviewQACard level="Mid" question="What are column-level privileges and when would you use them?">
            <p>
              PostgreSQL can grant privileges on specific columns so a role can read or update only certain
              fields (e.g., allow updates to <code>display_name</code> but not <code>salary</code>). This
              complements table-level grants and is useful for multi-tenant or shared-admin tooling.
            </p>
            <CodeBlock
              title="Column privileges"
              language="sql"
              code={`GRANT SELECT (id, email, display_name) ON employees TO hr_readonly;
GRANT UPDATE (display_name, phone) ON employees TO hr_editor;
-- hr_editor cannot UPDATE salary without an explicit grant

REVOKE SELECT (ssn) ON employees FROM PUBLIC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma help prevent SQL injection by default?">
            <p>
              Prisma Client APIs (<code>findMany</code>, <code>create</code>, <code>update</code>, etc.)
              always send values as bound parameters. You only reopen injection risk with raw SQL helpers—
              especially <code>$queryRawUnsafe</code> / <code>$executeRawUnsafe</code>.
            </p>
            <CodeBlock
              title="Safe Prisma Client vs unsafe raw"
              language="typescript"
              code={`// Safe: parameterized by Prisma
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// Safe raw: tagged template binds parameters
const rows = await prisma.$queryRaw\`
  SELECT id, email FROM users WHERE email = \${userInput}
\`;

// Dangerous: string concatenation
const bad = await prisma.$queryRawUnsafe(
  \`SELECT * FROM users WHERE email = '\${userInput}'\`
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between $queryRaw and $queryRawUnsafe?">
            <p>
              <code>$queryRaw</code> (tagged template) parameterizes interpolated values.
              <code>$queryRawUnsafe</code> accepts a raw SQL string and does <em>not</em> protect
              concatenations—you must pass parameters as extra arguments yourself, or avoid dynamic SQL.
            </p>
            <CodeBlock
              title="$queryRaw vs $queryRawUnsafe"
              language="typescript"
              code={`const email = req.query.email as string;

// Preferred
await prisma.$queryRaw\`SELECT * FROM users WHERE email = \${email}\`;

// OK only with placeholders + args
await prisma.$queryRawUnsafe(
  'SELECT * FROM users WHERE email = $1',
  email
);

// NEVER concatenate user input into the SQL string`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is Row Level Security (RLS) and how do you enable it?">
            <p>
              RLS attaches policies that filter which rows a role can see or modify. After{' '}
              <code>ENABLE ROW LEVEL SECURITY</code>, table owners and superusers may still bypass policies
              unless you also <code>FORCE ROW LEVEL SECURITY</code>.
            </p>
            <CodeBlock
              title="Enable RLS and create a policy"
              language="sql"
              code={`ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  FOR ALL
  TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- App sets GUC per request / transaction
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';`}
            />
            <CodeBlock
              title="Set tenant context with Prisma"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.$executeRaw\`SELECT set_config('app.tenant_id', \${tenantId}, true)\`;
  return tx.document.findMany();
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain USING vs WITH CHECK in RLS policies.">
            <p>
              <code>USING</code> filters existing rows for <code>SELECT</code>/<code>UPDATE</code>/
              <code>DELETE</code>. <code>WITH CHECK</code> validates new/updated row values for{' '}
              <code>INSERT</code>/<code>UPDATE</code>. For <code>FOR ALL</code>, set both so tenants cannot
              read foreign rows or write rows into another tenant.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the principle of least privilege for database access?">
            <p>
              Grant only the minimum privileges needed for a job: separate migrator vs runtime roles; no
              DDL for the app; no <code>SUPERUSER</code>/<code>BYPASSRLS</code>; prefer schema-scoped
              grants; revoke <code>PUBLIC</code> defaults when hardening; use read-only roles for reporting
              and analytics.
            </p>
            <CodeBlock
              title="Least-privilege sketch"
              language="sql"
              code={`REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;
-- No CREATE, no DROP, no ALTER ROLE`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-400">
            Senior Level
          </h2>

          <InterviewQACard level="Senior" question="How would you design multi-tenant security with RLS in PostgreSQL 15–17?">
            <p>
              Use a shared schema with <code>tenant_id</code> on every tenant-owned table, enable + force
              RLS, set a transaction-local GUC (or use JWT claims via a trusted middleware), and ensure
              policies cover <code>SELECT/INSERT/UPDATE/DELETE</code>. Index <code>tenant_id</code> (often
              as leading column in composite indexes). Never rely on the table owner role for app traffic
              because owners bypass RLS unless <code>FORCE</code> is set.
            </p>
            <CodeBlock
              title="Policy patterns"
              language="sql"
              code={`CREATE POLICY docs_select ON documents
  FOR SELECT TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY docs_write ON documents
  FOR INSERT TO app_user
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Optional: admin role with BYPASSRLS for support tooling only
CREATE ROLE support_admin LOGIN BYPASSRLS;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do SECURITY DEFINER functions interact with privileges and RLS?">
            <p>
              A <code>SECURITY DEFINER</code> function runs with the privileges of the owner, which can
              intentionally elevate access—or accidentally create a privilege escalation path. Lock search
              path, validate inputs, grant <code>EXECUTE</code> narrowly, and remember definer functions
              may bypass caller-limited grants. Prefer <code>SECURITY INVOKER</code> (default) unless you
              need a controlled elevation pattern.
            </p>
            <CodeBlock
              title="Hardened SECURITY DEFINER"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION app.current_tenant_docs()
RETURNS SETOF documents
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, app
AS $$
  SELECT * FROM app.documents
  WHERE tenant_id = current_setting('app.tenant_id')::uuid;
$$;

REVOKE ALL ON FUNCTION app.current_tenant_docs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_tenant_docs() TO app_user;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you combine Prisma migrations with a least-privilege runtime role?">
            <p>
              Run <code>prisma migrate</code> as a privileged migrator that owns tables. Point the app at a
              different <code>DATABASE_URL</code> with DML-only grants. After migrations, re-apply grants /
              default privileges (or manage them in SQL migration files). RLS policies must be created in
              migrations as raw SQL because Prisma schema does not model policies natively.
            </p>
            <CodeBlock
              title="Migration SQL for grants + RLS"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql (excerpt)
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Document"
  FOR ALL TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON "Document" TO app_user;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What authentication / connection hardening topics are commonly asked for PostgreSQL?">
            <p>
              Interviewers often expect awareness of <code>pg_hba.conf</code> (which hosts/users/databases
              and auth methods like <code>scram-sha-256</code>), TLS for clients, rejecting password auth
              from the public internet, connection pooling with fixed app roles, and auditing sensitive
              grants. Prefer SCRAM over MD5; restrict superuser remote login; separate admin networks.
            </p>
            <CodeBlock
              title="Illustrative pg_hba.conf lines"
              language="sql"
              code={`-- TYPE  DATABASE  USER       ADDRESS         METHOD
-- hostssl  shop   app_user   10.0.0.0/8      scram-sha-256
-- host     all    postgres   0.0.0.0/0       reject
-- local    all    migrator                   scram-sha-256`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you answer: 'Our API still has SQL injection despite using Prisma'—what do you check?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Any use of <code>$queryRawUnsafe</code> / <code>$executeRawUnsafe</code> with concatenation</li>
              <li>Dynamic ORDER BY / column names built from strings (identifiers cannot be bound—use allowlists)</li>
              <li>Raw SQL in migrations or scripts that interpolate env/user data</li>
              <li>Other clients (admin tools, reporting jobs, hand-rolled <code>pg</code> queries)</li>
              <li>Whether attackers can influence <code>search_path</code> or call elevated functions</li>
            </ul>
            <CodeBlock
              title="Safe dynamic ordering via allowlist"
              language="typescript"
              code={`const sortMap = { createdAt: 'created_at', email: 'email' } as const;
const col = sortMap[sortKey];
if (!col) throw new Error('Invalid sort');

// Identifier from allowlist only; value still parameterized
const rows = await prisma.$queryRawUnsafe(
  \`SELECT id, email FROM users ORDER BY \${col} DESC LIMIT $1\`,
  limit
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
