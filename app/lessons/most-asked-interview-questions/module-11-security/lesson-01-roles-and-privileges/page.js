import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Roles and Privileges - Module 11 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL permission interview questions: role vs user, GRANT and REVOKE, SUPERUSER risk, column privileges, group roles, ALTER DEFAULT PRIVILEGES, read-only roles, and locking down the public schema.',
};

export default function MaiqSecLesson01RolesPrivileges() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Roles and Privileges</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A privilege is permission to do one thing to one object. A role is who holds those permissions.
          Almost every database security question starts here, and the follow-up is always the same: does
          your application really need that much power?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between a role and a user in PostgreSQL?">
            <p>
              In modern PostgreSQL, <strong>users are roles</strong>. <code>CREATE USER alice</code> is
              exactly the same as <code>CREATE ROLE alice LOGIN</code>. Roles can own objects, hold
              privileges, and be members of other roles. A group is simply a role without{' '}
              <code>LOGIN</code>, used to bundle privileges.
            </p>
            <CodeBlock
              title="Roles and membership"
              language="sql"
              code={`CREATE ROLE app_readonly NOLOGIN;
CREATE ROLE alice LOGIN PASSWORD '***';
GRANT app_readonly TO alice;

-- Check current role / membership
SELECT current_user, session_user;
SELECT r.rolname AS member, g.rolname AS group_role
FROM pg_auth_members m
JOIN pg_roles r ON r.oid = m.member
JOIN pg_roles g ON g.oid = m.roleid;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do GRANT and REVOKE work?">
            <p>
              <code>GRANT</code> gives privileges on database objects; <code>REVOKE</code> removes them.
              Common privileges are <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>,{' '}
              <code>DELETE</code>, <code>TRUNCATE</code>, <code>REFERENCES</code>, and{' '}
              <code>TRIGGER</code>. Schemas use <code>USAGE</code> and <code>CREATE</code>, and the database
              itself uses <code>CONNECT</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Access needs two levels: <code>USAGE</code> on the schema plus the privilege on the table
              </li>
              <li>
                <code>GRANT ... ON ALL TABLES</code> only affects tables that exist right now, not future
                ones
              </li>
              <li>
                Anything using a <code>serial</code> or identity column also needs{' '}
                <code>USAGE</code> on the sequence to insert
              </li>
              <li>
                Inspect what a role actually has with <code>\dp</code> in psql, or the{' '}
                <code>has_table_privilege</code> function
              </li>
            </ul>
            <CodeBlock
              title="GRANT / REVOKE examples"
              language="sql"
              code={`GRANT CONNECT ON DATABASE shop TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_readonly;

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM app_readonly;

-- Verify
SELECT has_table_privilege('app_readonly', 'orders', 'SELECT') AS can_read,
       has_table_privilege('app_readonly', 'orders', 'INSERT') AS can_write;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why is SUPERUSER dangerous?">
            <p>
              A <code>SUPERUSER</code> skips nearly every permission check. It can read and write any table,
              bypass Row Level Security, change roles and passwords, read files on the server through{' '}
              <code>COPY</code>, load extensions, and run code as another user. An application connection
              pool should <strong>never</strong> use a superuser, because then one SQL injection bug becomes
              full control of the server.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use a limited owner role for migrations and a least-privilege role for the app</li>
              <li>
                Most tasks people reach for superuser for have a safer predefined role, such as{' '}
                <code>pg_read_all_data</code>, <code>pg_monitor</code>, or <code>pg_signal_backend</code>
              </li>
              <li>
                Managed services such as RDS or Cloud SQL do not give you real superuser, which is a hint
                that you do not need it
              </li>
            </ul>
            <CodeBlock
              title="Avoid SUPERUSER for apps"
              language="sql"
              code={`-- Bad: app connects as postgres / SUPERUSER
-- Good: separate roles
CREATE ROLE migrator LOGIN PASSWORD '...';  -- owns schema, runs migrations
CREATE ROLE app_user LOGIN PASSWORD '...';  -- DML only on needed tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE orders TO app_user;
-- No BYPASSRLS, no CREATEDB, no SUPERUSER

-- Narrow built-in roles instead of superuser
GRANT pg_monitor TO observability;
GRANT pg_read_all_data TO auditor;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are column-level privileges and when would you use them?">
            <p>
              PostgreSQL can grant privileges on specific columns, so a role reads or updates only certain
              fields. For example a support tool may update <code>display_name</code> but must never see{' '}
              <code>salary</code>. This works together with table-level grants and is useful for internal
              tooling and shared admin screens.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A column grant is enough on its own. You do not need a table-wide <code>SELECT</code> first
              </li>
              <li>
                <code>SELECT *</code> fails for such a role, because it touches columns it cannot read. The
                query must name the allowed columns
              </li>
              <li>
                For complex rules, a view that exposes only safe columns is often easier to maintain
              </li>
            </ul>
            <CodeBlock
              title="Column privileges"
              language="sql"
              code={`GRANT SELECT (id, email, display_name) ON employees TO hr_readonly;
GRANT UPDATE (display_name, phone) ON employees TO hr_editor;
-- hr_editor cannot UPDATE salary without an explicit grant

REVOKE SELECT (ssn) ON employees FROM PUBLIC;

-- Alternative: a view as the public interface
CREATE VIEW employees_safe AS
SELECT id, email, display_name, phone FROM employees;
GRANT SELECT ON employees_safe TO hr_readonly;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are group roles and how does inheritance work?">
            <p>
              A group role is a role with no login that exists only to hold privileges. You grant privileges
              to the group once, then add people or services to the group. When a member has{' '}
              <code>INHERIT</code>, which is the default, it automatically uses the group privileges. With{' '}
              <code>NOINHERIT</code> the member must switch explicitly using <code>SET ROLE</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                This keeps permissions manageable: onboarding is one <code>GRANT</code>, not twenty
              </li>
              <li>
                <code>NOINHERIT</code> plus <code>SET ROLE</code> is a good pattern for powerful groups,
                because the extra power is used only on purpose
              </li>
              <li>
                Objects created after a <code>SET ROLE</code> are owned by the group, which keeps ownership
                stable when people leave
              </li>
              <li>
                <code>current_user</code> changes with <code>SET ROLE</code>, while{' '}
                <code>session_user</code> keeps the original login. Audit triggers should record both
              </li>
            </ul>
            <CodeBlock
              title="Group roles and SET ROLE"
              language="sql"
              code={`CREATE ROLE analytics NOLOGIN;
GRANT USAGE ON SCHEMA app TO analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO analytics;

-- Inherits automatically
CREATE ROLE bob LOGIN PASSWORD '...' INHERIT;
GRANT analytics TO bob;

-- Must opt in explicitly
CREATE ROLE deployer LOGIN PASSWORD '...' NOINHERIT;
GRANT migrator TO deployer;

SET ROLE migrator;     -- now acting with migrator privileges
SELECT current_user, session_user;
RESET ROLE;

-- What is this role allowed to be?
SELECT rolname FROM pg_roles WHERE pg_has_role('bob', oid, 'member');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does ALTER DEFAULT PRIVILEGES do, and why do teams always need it?">
            <p>
              <code>GRANT ON ALL TABLES</code> is a one-time action. It does nothing for a table created
              tomorrow, which is why an app breaks right after a migration adds a table.{' '}
              <code>ALTER DEFAULT PRIVILEGES</code> sets the rule ahead of time, so every future object gets
              the grant automatically.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Default privileges are recorded per creating role. Set them <code>FOR ROLE migrator</code>,
                matching whoever runs the migrations, or the rule will not fire
              </li>
              <li>
                Set them for tables, sequences, and functions. Forgetting sequences causes insert failures
                on identity columns
              </li>
              <li>
                They apply only to new objects, so run them together with a one-time grant on existing
                objects
              </li>
              <li>
                Inspect the current rules in <code>pg_default_acl</code> or with <code>\ddp</code> in psql
              </li>
            </ul>
            <CodeBlock
              title="Future-proof grants"
              language="sql"
              code={`-- Right now
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;

-- And for everything migrator creates from now on
ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA app
  GRANT SELECT ON TABLES TO app_readonly;

-- Review the rules
SELECT defaclrole::regrole AS for_role, defaclnamespace::regnamespace AS schema,
       defaclobjtype AS obj_type, defaclacl AS privileges
FROM pg_default_acl;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you build a safe read-only role for analysts?">
            <p>
              The goal is a role that can read data and nothing else, and that cannot take the database down
              with one giant query. Read-only means more than just skipping <code>INSERT</code>: it also
              means no schema changes, no temporary tables, and sensible resource limits.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Grant <code>CONNECT</code>, <code>USAGE</code> on the schema, and <code>SELECT</code>; then
                add default privileges so new tables are covered
              </li>
              <li>
                Make it a group role and add individual analyst logins to it
              </li>
              <li>
                Set a statement timeout and an idle-in-transaction timeout on the role, because a forgotten
                open transaction blocks vacuum
              </li>
              <li>
                Point analysts at a read replica when possible, so heavy queries never touch the primary
              </li>
              <li>
                Hide sensitive columns behind views, or use column-level grants
              </li>
              <li>
                Truly read-only can also be enforced at the transaction level with{' '}
                <code>default_transaction_read_only</code>
              </li>
            </ul>
            <CodeBlock
              title="Read-only analyst role"
              language="sql"
              code={`CREATE ROLE analyst_ro NOLOGIN;

GRANT CONNECT ON DATABASE shop TO analyst_ro;
GRANT USAGE ON SCHEMA app TO analyst_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO analyst_ro;
ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA app
  GRANT SELECT ON TABLES TO analyst_ro;

-- Safety rails
ALTER ROLE analyst_ro SET statement_timeout = '60s';
ALTER ROLE analyst_ro SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE analyst_ro SET default_transaction_read_only = on;

-- A person joins the group
CREATE ROLE dana LOGIN PASSWORD '...';
GRANT analyst_ro TO dana;

-- Shortcut for read everything, still no writes
-- GRANT pg_read_all_data TO analyst_ro;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the principle of least privilege for database access?">
            <p>
              Grant only the minimum privileges needed for the job. Separate the migrator role from the
              runtime role; give the app no DDL rights; never use <code>SUPERUSER</code> or{' '}
              <code>BYPASSRLS</code> for application traffic; scope grants to one schema; revoke the{' '}
              <code>PUBLIC</code> defaults when hardening; and give reporting and analytics their own
              read-only role.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The question to ask for every grant is: what is the worst thing that happens if this
                credential leaks?
              </li>
              <li>
                Least privilege limits the blast radius of both attacks and honest mistakes
              </li>
              <li>
                Keep grants in version control as SQL migrations, so permissions are reviewable
              </li>
            </ul>
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

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why should you revoke rights on the public schema?">
            <p>
              Historically every role could create objects in the <code>public</code> schema, and{' '}
              <code>public</code> sits early in the default <code>search_path</code>. Together that is a
              real attack path: a low-privilege user creates a function or table whose name shadows a real
              one, and other sessions call it by accident. PostgreSQL 15 fixed the default for new
              databases, but older databases and upgraded clusters still carry the loose permission.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The classic attack is search path shadowing: define <code>public.lower(text)</code> so
                someone else&apos;s query calls your function instead of the built-in one
              </li>
              <li>
                Dangerous combined with <code>SECURITY DEFINER</code> functions that do not pin their{' '}
                <code>search_path</code>, because the shadowed code then runs with the owner privileges
              </li>
              <li>
                In PostgreSQL 15 and newer, <code>CREATE</code> on <code>public</code> is no longer granted
                to <code>PUBLIC</code> by default. Verify rather than assume, especially after an upgrade
              </li>
              <li>
                Best practice: put application objects in their own schema, revoke <code>CREATE</code> on{' '}
                <code>public</code>, and set an explicit <code>search_path</code>
              </li>
              <li>
                Also revoke the default <code>CONNECT</code> and <code>EXECUTE</code> rights that{' '}
                <code>PUBLIC</code> gets, if you want a fully locked-down database
              </li>
            </ul>
            <CodeBlock
              title="Harden the public schema"
              language="sql"
              code={`-- Stop anyone from creating objects there
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Stop every role from connecting by default
REVOKE ALL ON DATABASE shop FROM PUBLIC;
GRANT CONNECT ON DATABASE shop TO app_user, analyst_ro;

-- Give the application its own schema
CREATE SCHEMA app AUTHORIZATION migrator;
ALTER ROLE app_user SET search_path = app, pg_catalog;

-- Check what PUBLIC still holds
SELECT nspname, nspacl FROM pg_namespace WHERE nspname IN ('public', 'app');
SELECT datname, datacl FROM pg_database WHERE datname = 'shop';`}
            />
            <CodeBlock
              title="Pin the search path in functions"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION app.normalize_email(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, app
AS $$
  SELECT lower(btrim(raw));
$$;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
