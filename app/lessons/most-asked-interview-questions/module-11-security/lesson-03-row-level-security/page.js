import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Row Level Security - Module 11 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL RLS interview questions: enabling row level security, USING vs WITH CHECK, owner bypass and FORCE ROW LEVEL SECURITY, set_config tenant context, multi-tenant design, SECURITY DEFINER, and RLS performance cost.',
};

export default function MaiqSecLesson03RowLevelSecurity() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Row Level Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Row Level Security, or RLS, lets the database itself decide which rows a connection may see or
          change. It is the strongest answer to multi-tenant isolation questions, because the rule lives
          next to the data instead of in every query your team writes.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is Row Level Security and how do you enable it?">
            <p>
              RLS attaches policies to a table that filter which rows a role can see or modify. A policy is
              just a boolean condition that PostgreSQL adds to every query on that table. After{' '}
              <code>ENABLE ROW LEVEL SECURITY</code>, table owners and superusers may still bypass the
              policies unless you also use <code>FORCE ROW LEVEL SECURITY</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Enabling RLS with no policy denies everything, which is a safe default but surprises people
              </li>
              <li>
                Policies are per role and per command, so you can allow reads broadly and writes narrowly
              </li>
              <li>
                Multiple <code>PERMISSIVE</code> policies are combined with OR; a{' '}
                <code>RESTRICTIVE</code> policy is combined with AND and can only narrow access
              </li>
            </ul>
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

-- App sets the value per request / transaction
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';

-- Inspect what exists
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'documents';
SELECT polname, polcmd, polroles::regrole[] FROM pg_policy
WHERE polrelid = 'documents'::regclass;`}
            />
            <CodeBlock
              title="Set tenant context with Prisma"
              language="typescript"
              code={`// set_config with is_local = true resets at the end of the transaction
const docs = await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe(
    'SELECT set_config($1, $2, true)',
    'app.tenant_id',
    tenantId
  );
  return tx.document.findMany();
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain USING vs WITH CHECK in RLS policies.">
            <p>
              <code>USING</code> decides which existing rows are visible, so it applies to{' '}
              <code>SELECT</code>, <code>UPDATE</code>, and <code>DELETE</code>.{' '}
              <code>WITH CHECK</code> validates the values of new or changed rows, so it applies to{' '}
              <code>INSERT</code> and <code>UPDATE</code>. With <code>FOR ALL</code> you should set both,
              otherwise a tenant could either read other rows or write rows into another tenant.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An <code>UPDATE</code> is checked twice: <code>USING</code> on the row before the change,{' '}
                <code>WITH CHECK</code> on the row after
              </li>
              <li>
                If you omit <code>WITH CHECK</code> on a policy that allows writes, PostgreSQL reuses the{' '}
                <code>USING</code> expression
              </li>
              <li>
                A failed <code>WITH CHECK</code> raises an error, while a failed <code>USING</code> simply
                makes the row invisible. That difference matters when debugging &quot;my row disappeared&quot;
              </li>
            </ul>
            <CodeBlock
              title="Read and write rules split apart"
              language="sql"
              code={`-- Read: only my tenant
CREATE POLICY docs_select ON documents
  FOR SELECT TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Insert: cannot plant a row in another tenant
CREATE POLICY docs_insert ON documents
  FOR INSERT TO app_user
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Update: must own the row before and after
CREATE POLICY docs_update ON documents
  FOR UPDATE TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Extra guard that can only narrow access
CREATE POLICY docs_not_archived ON documents
  AS RESTRICTIVE
  FOR SELECT TO app_user
  USING (archived_at IS NULL);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Does the table owner bypass RLS, and what does FORCE ROW LEVEL SECURITY do?">
            <p>
              Yes, and this is the single most common RLS mistake. By default the table owner and any
              superuser ignore the policies completely. So if your application connects as the role that
              owns the tables, which is what happens when the app also runs migrations, RLS silently does
              nothing. <code>FORCE ROW LEVEL SECURITY</code> makes the policies apply to the owner as well.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Roles with the <code>BYPASSRLS</code> attribute also skip policies, and{' '}
                <code>FORCE</code> does not stop them
              </li>
              <li>
                Best practice: the app role is never the table owner. Migrations run as the owner, traffic
                runs as a limited role
              </li>
              <li>
                Always test isolation as the real application role. Testing as <code>postgres</code> proves
                nothing
              </li>
              <li>
                Keep one support role with <code>BYPASSRLS</code> for incident work, used deliberately and
                audited
              </li>
            </ul>
            <CodeBlock
              title="Prove the isolation works"
              language="sql"
              code={`ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

-- Owner without FORCE would see everything; with FORCE the policy applies
SET ROLE app_user;
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM documents;   -- only this tenant
RESET ROLE;

-- Who can skip policies entirely?
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolbypassrls OR rolsuper;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you pass the tenant id to the database with set_config and current_setting?">
            <p>
              A policy needs to know who is asking. PostgreSQL lets you store a value in the session or the
              transaction under a custom name such as <code>app.tenant_id</code>, then read it back inside
              the policy. <code>set_config</code> writes it and <code>current_setting</code> reads it. The
              third argument of <code>set_config</code> is the important one: <code>true</code> means
              transaction-local, so the value disappears on commit or rollback.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The name must contain a dot, for example <code>app.tenant_id</code>. A plain name is
                rejected
              </li>
              <li>
                Always use transaction-local values with a connection pool. A session-level value leaks to
                the next request that reuses that connection
              </li>
              <li>
                Use <code>current_setting(&apos;app.tenant_id&apos;, true)</code> with the second argument{' '}
                <code>true</code> so a missing value returns NULL instead of raising an error
              </li>
              <li>
                Convert an empty string to NULL before casting, otherwise the cast fails. A NULL tenant then
                matches no rows, which fails closed
              </li>
              <li>
                The value must come from your trusted session or token, never from a request header the
                client controls
              </li>
            </ul>
            <CodeBlock
              title="Reading the context safely inside a policy"
              language="sql"
              code={`-- Helper keeps policies short and consistent
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog, app
AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

CREATE POLICY docs_tenant ON documents
  FOR ALL TO app_user
  USING (tenant_id = app.current_tenant())
  WITH CHECK (tenant_id = app.current_tenant());

-- Transaction-local, cleared automatically at COMMIT
BEGIN;
SELECT set_config('app.tenant_id', '1111...', true);
SELECT count(*) FROM documents;
COMMIT;`}
            />
            <CodeBlock
              title="One helper for every tenant-scoped Prisma call"
              language="typescript"
              code={`import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export function withTenant<T>(
  tenantId: string,
  work: (tx: Tx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'SELECT set_config($1, $2, true)',
      'app.tenant_id',
      tenantId
    );
    return work(tx);
  });
}

// Usage: the policy does the filtering, the query stays simple
const docs = await withTenant(session.tenantId, (tx) =>
  tx.document.findMany({ select: { id: true, title: true } })
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you design multi-tenant security with RLS in PostgreSQL 15 to 17?">
            <p>
              Use a shared schema with a <code>tenant_id</code> column on every tenant-owned table, enable
              and force RLS, set a transaction-local setting per request, and make sure policies cover{' '}
              <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code>. Index{' '}
              <code>tenant_id</code>, usually as the leading column of composite indexes. Never let
              application traffic use the table owner role, because owners bypass RLS unless{' '}
              <code>FORCE</code> is set.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Make <code>tenant_id</code> <code>NOT NULL</code> and give it a default from the session
                setting, so an insert cannot forget it
              </li>
              <li>
                Include <code>tenant_id</code> in foreign keys and unique constraints, so a child row cannot
                point at another tenant&apos;s parent
              </li>
              <li>
                Decide the model deliberately: shared tables with RLS scales to many tenants; a schema or
                database per tenant gives harder isolation but heavy operational cost and painful migrations
              </li>
              <li>
                Add a cross-tenant test to CI: set tenant A, try to read and write tenant B, expect zero rows
                and an error
              </li>
              <li>
                Log the tenant id on every request so an incident can be traced
              </li>
            </ul>
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
            <CodeBlock
              title="Schema guards that back up the policies"
              language="sql"
              code={`ALTER TABLE documents
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT nullif(current_setting('app.tenant_id', true), '')::uuid;

-- A child can only reference a parent in the same tenant
ALTER TABLE document_versions
  ADD CONSTRAINT doc_versions_same_tenant_fk
  FOREIGN KEY (tenant_id, document_id)
  REFERENCES documents (tenant_id, id);

-- Leading tenant_id keeps policy filters fast
CREATE INDEX documents_tenant_created_idx
ON documents (tenant_id, created_at DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do SECURITY DEFINER functions interact with privileges and RLS?">
            <p>
              A <code>SECURITY DEFINER</code> function runs with the privileges of its owner instead of the
              caller. That is useful for a controlled escalation, such as letting a limited role run one
              audited operation, but it is also a classic privilege escalation path. Lock the search path,
              validate inputs, grant <code>EXECUTE</code> narrowly, and remember such a function can see
              rows the caller cannot. Prefer the default <code>SECURITY INVOKER</code> unless you
              specifically need elevation.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                RLS is evaluated for the role the function runs as, so a definer function owned by the table
                owner may see every row
              </li>
              <li>
                Always add <code>SET search_path</code>, otherwise a caller can create a shadowing function
                in a schema earlier in the path and have it run with owner privileges
              </li>
              <li>
                <code>REVOKE ALL ... FROM PUBLIC</code> first, because functions are executable by everyone
                by default
              </li>
              <li>
                Never build dynamic SQL from arguments inside a definer function without{' '}
                <code>format</code> with <code>%I</code> and <code>%L</code>
              </li>
              <li>
                Keep the function tiny and single-purpose, so the elevated surface is easy to review
              </li>
            </ul>
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
GRANT EXECUTE ON FUNCTION app.current_tenant_docs() TO app_user;

-- Audit every definer function in the database
SELECT n.nspname, p.proname, pg_get_userbyid(p.proowner) AS owner, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What does RLS cost in performance, and how do you keep it cheap?">
            <p>
              A policy is added to every query as an extra condition, so the cost is the cost of that
              condition. Kept simple it is nearly free. Written carelessly it can turn a fast index lookup
              into a per-row function call or a hidden subquery on every row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Index the policy column, and put <code>tenant_id</code> first in composite indexes so the
                filter and the policy use the same index
              </li>
              <li>
                Mark helper functions <code>STABLE</code>, not <code>VOLATILE</code>, so PostgreSQL can
                evaluate them once per query instead of once per row
              </li>
              <li>
                Avoid subqueries inside policies, for example a lookup into a memberships table. If you need
                one, wrap it in a <code>STABLE</code> function or cache the membership as a column
              </li>
              <li>
                Policy conditions are not always pushed down the way you hope. Verify with{' '}
                <code>EXPLAIN ANALYZE</code> as the real application role, since running as owner hides the
                policy entirely
              </li>
              <li>
                Watch plan quality: with policies, a filter that looks selective to you may look
                unselective to the planner. Extended statistics on <code>tenant_id</code> plus the filtered
                column can help
              </li>
              <li>
                Keep the number of policies per table small. Many <code>PERMISSIVE</code> policies become a
                long OR chain that is hard to plan and hard to reason about
              </li>
            </ul>
            <CodeBlock
              title="Measure and tune RLS"
              language="sql"
              code={`-- Measure as the app role, inside the tenant context
SET ROLE app_user;
BEGIN;
SELECT set_config('app.tenant_id', '1111...', true);
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title FROM documents ORDER BY created_at DESC LIMIT 20;
COMMIT;
RESET ROLE;

-- STABLE so it runs once per query, not once per row
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = pg_catalog, app
AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Index that serves both the policy and the query
CREATE INDEX documents_tenant_created_idx
ON documents (tenant_id, created_at DESC);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
