import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Connections and Authentication - Module 1 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on connection strings, psql basics, port 5432, roles, pg_hba.conf, SSL, search_path, Prisma datasource URLs, pooling, and max_connections',
};

export default function MaiqM01L03ConnectionAuthentication() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Connections and Authentication</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How an app reaches Postgres, how Postgres decides who is allowed in, and what goes wrong when too many connections show up at once.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the default PostgreSQL port?">
            <p>
              5432. That is the TCP port the server listens on unless someone changed it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>It is set by <code>port</code> in <code>postgresql.conf</code>, and changing it needs a restart</li>
              <li>If you run two Postgres versions on one machine, the second one usually gets 5433</li>
              <li>PgBouncer commonly listens on 6432, and some hosted poolers use 6543. That is the pooler, not Postgres itself</li>
              <li>On Linux, a local client can also connect over a Unix socket instead of TCP, which needs no port</li>
            </ul>
            <CodeBlock
              title="Check the port"
              language="sql"
              code={`SHOW port;
SELECT inet_server_addr(), inet_server_port();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a connection string, and how do you connect with psql?">
            <p>A connection string is the address of the database: host, port, database name, user, and password. psql is the command-line tool that uses it.</p>
            <CodeBlock
              title="URI and psql"
              language="sql"
              code={`-- URI form
-- postgresql://user:password@localhost:5432/mydb?sslmode=require

-- psql interactive
\\c mydb
\\dt          -- list tables
\\dn          -- list schemas
\\du          -- list roles
\\q           -- quit`}
            />
            <CodeBlock
              title="psql from shell"
              language="bash"
              code={`psql "postgresql://appuser:secret@localhost:5432/app_db"
psql -h localhost -p 5432 -U appuser -d app_db`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you list databases, tables, and columns in psql?">
            <p>
              psql has backslash commands for this. They are shortcuts that run queries against the system catalog for you.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Add <code>+</code> to most commands for more detail, such as size and description</li>
              <li><code>{'\\?'}</code> lists all backslash commands, and <code>{'\\h SELECT'}</code> shows SQL help</li>
              <li>If a company blocks psql, you can get the same answers from the catalog views, which is a good thing to mention</li>
            </ul>
            <CodeBlock
              title="psql inspection commands"
              language="bash"
              code={`\\l          # list databases
\\dt         # list tables in the current search_path
\\dt *.*     # list tables in every schema
\\d users    # describe the users table (columns, indexes, constraints)
\\di         # list indexes
\\dv         # list views
\\df         # list functions
\\dt+        # tables with size on disk
\\x          # toggle expanded output, useful for wide rows`}
            />
            <CodeBlock
              title="The same answers in plain SQL"
              language="sql"
              code={`SELECT datname FROM pg_database WHERE NOT datistemplate;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between a role and a user in PostgreSQL?">
            <p>
              In modern Postgres there is only one thing: a role. A &quot;user&quot; is simply a role that is allowed to log in.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CREATE USER x</code> is just shorthand for <code>CREATE ROLE x LOGIN</code></li>
              <li>A role without LOGIN works like a group. You grant it privileges, then grant the group to real users</li>
              <li>Roles are shared across the whole cluster, not per database</li>
              <li>Attributes you will be asked about: <code>LOGIN</code>, <code>SUPERUSER</code>, <code>CREATEDB</code>, <code>CREATEROLE</code>, <code>REPLICATION</code></li>
            </ul>
            <CodeBlock
              title="Group role plus login roles"
              language="sql"
              code={`-- Group role: no login, just a bundle of privileges
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE app_db TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Real people log in and inherit the group
CREATE ROLE analyst_riya WITH LOGIN PASSWORD 'strong_password';
GRANT readonly TO analyst_riya;

SELECT rolname, rolcanlogin, rolsuper FROM pg_roles ORDER BY rolname;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are roles and how does authentication work with pg_hba.conf?">
            <p>
              A role is a user or a group. A login role can sign in. <code>pg_hba.conf</code> is the file that says who may connect, from which IP, and with which password method.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Common methods: <code>scram-sha-256</code> (preferred), <code>md5</code> (legacy), <code>peer</code>, <code>trust</code> (dev only)</li>
              <li>Rules match top-to-bottom; first match wins</li>
              <li>Reload with <code>SELECT pg_reload_conf();</code> or <code>pg_ctl reload</code></li>
            </ul>
            <CodeBlock
              title="pg_hba.conf examples"
              language="bash"
              code={`# TYPE  DATABASE  USER  ADDRESS         METHOD
local   all       all                   peer
host    all       all   127.0.0.1/32    scram-sha-256
hostssl all       app   10.0.0.0/8      scram-sha-256`}
            />
            <CodeBlock
              title="Create role and grant"
              language="sql"
              code={`CREATE ROLE app_user WITH LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE app_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why use SSL/TLS for PostgreSQL connections?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Encrypts passwords and query results while they travel over the network</li>
              <li>Cloud hosts and security rules usually require it</li>
              <li>Client sets <code>sslmode</code>: <code>require</code>, <code>verify-ca</code>, <code>verify-full</code></li>
              <li><code>verify-full</code> also checks hostname against the certificate — strongest option</li>
              <li>Note that <code>require</code> encrypts but does not prove you reached the right server, so it does not stop a man-in-the-middle attack</li>
            </ul>
            <CodeBlock
              title="SSL in connection URI"
              language="bash"
              code={`postgresql://user:pass@db.example.com:5432/app?sslmode=verify-full`}
            />
            <CodeBlock
              title="Confirm the session is encrypted"
              language="sql"
              code={`SELECT ssl, version, cipher
FROM pg_stat_ssl
WHERE pid = pg_backend_pid();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you configure the Prisma datasource URL for PostgreSQL?">
            <p>Prisma reads <code>DATABASE_URL</code> from the environment and maps it in <code>schema.prisma</code>.</p>
            <CodeBlock
              title="schema.prisma datasource"
              language="typescript"
              code={`// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}`}
            />
            <CodeBlock
              title=".env DATABASE_URL"
              language="bash"
              code={`# Direct connection (migrations / long-lived servers)
DATABASE_URL="postgresql://user:pass@localhost:5432/app_db?schema=public&sslmode=require"

# With connection pooler (e.g. PgBouncer / Neon / Supabase)
# DATABASE_URL="postgresql://user:pass@pooler-host:6543/app_db?pgbouncer=true&connection_limit=1"`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is search_path and why does it matter?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>search_path</code> is the list of schemas Postgres looks in when you write <code>users</code> instead of <code>public.users</code></li>
              <li>The usual order is your user schema, then <code>public</code></li>
              <li>If the path is wrong, a query can hit the wrong table or say the table does not exist</li>
              <li>Security note: a function that does not pin its own <code>search_path</code> can be tricked into calling the wrong function. That is why you often see <code>SET search_path</code> on <code>SECURITY DEFINER</code> functions</li>
            </ul>
            <CodeBlock
              title="Inspect and set search_path"
              language="sql"
              code={`SHOW search_path;
SET search_path TO reporting, public;
SELECT * FROM daily_stats; -- resolves to reporting.daily_stats if it exists

-- Make it permanent for one role
ALTER ROLE app_user SET search_path TO app, public;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What happens when an app opens too many connections?">
            <p>
              New connections are refused with the error &quot;FATAL: sorry, too many clients already&quot;. Before that point, the server is already
              getting slower, because every connection is a separate operating system process with its own memory.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The limit is <code>max_connections</code>. A few slots are reserved by <code>superuser_reserved_connections</code> so an admin can still log in and fix things</li>
              <li>Each backend uses memory for its own sort and hash work (<code>work_mem</code> is per operation, not per server), so hundreds of busy connections can exhaust RAM</li>
              <li>Common causes: no pool, a pool per container multiplied by many containers, serverless functions each opening their own connection, and connections left <code>idle in transaction</code></li>
              <li>The fix is a pool sized to your CPU count, short transactions, and a statement or idle timeout. Raising <code>max_connections</code> alone usually makes things worse</li>
            </ul>
            <CodeBlock
              title="See how close you are to the limit"
              language="sql"
              code={`SELECT
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_conn,
  count(*) AS in_use
FROM pg_stat_activity;

-- Stop connections from sitting idle inside a transaction forever
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
SELECT pg_reload_conf();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why is connection pooling required, and how does PgBouncer help?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Every open connection uses memory. Too many connections can crash or reject new ones</li>
              <li><strong>PgBouncer</strong> sits in front of Postgres and shares a small number of real connections among many app requests</li>
              <li>Modes: <code>session</code> (one app connection holds one DB connection), <code>transaction</code> (best for most apps), <code>statement</code> (rare)</li>
              <li>In transaction mode, things that last for a whole session can break: temp tables and some prepared statements. Prisma needs <code>pgbouncer=true</code></li>
              <li>Use the pooler URL for the app, and a direct URL for migrations</li>
              <li>A sane starting size is a small multiple of CPU cores, not hundreds. More concurrency than cores just adds context switching</li>
            </ul>
            <CodeBlock
              title="Prisma with pooler + direct URL"
              language="typescript"
              code={`// schema.prisma (Prisma 4.7+)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // pooled
  directUrl = env("DIRECT_URL")         // for migrate / introspection
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you harden a production PostgreSQL authentication setup?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Do not use <code>trust</code> (no password) in production. Prefer <code>scram-sha-256</code></li>
              <li>Use different logins: one that changes the schema, one for the app, one that can only read</li>
              <li>Keep the database on a private network and require SSL</li>
              <li>Change passwords on a schedule. Use the cloud&apos;s identity login when you can</li>
              <li>Give the app only the rights it needs. On Postgres 15+, do not let the app create objects in <code>public</code> unless it must</li>
              <li>Never let the app connect as a superuser or as the table owner, so a SQL injection bug cannot drop tables</li>
              <li>Log connections and failed logins, and alert on a spike of failures</li>
            </ul>
            <CodeBlock
              title="Least privilege app role"
              language="sql"
              code={`-- Migration owner creates objects
CREATE ROLE app_owner WITH LOGIN PASSWORD 'rotate_me';

-- App role can only use data, never change the schema
CREATE ROLE app_rw WITH LOGIN PASSWORD 'rotate_me_too';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;

-- Future tables created by app_owner are covered too
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What happens when max_connections is hit, and how do you diagnose it?">
            <ul className="list-disc pl-6 space-y-1">
              <li>New apps get the error &quot;too many connections&quot;. A few slots are kept for an admin so you can still log in</li>
              <li>Look at <code>pg_stat_activity</code> for connections that are idle but still inside a transaction</li>
              <li>Fix it with a connection pool, closing idle connections, and a <code>max_connections</code> that fits your RAM</li>
              <li>Just raising <code>max_connections</code> without a pool usually makes the server slower</li>
            </ul>
            <CodeBlock
              title="Inspect connections"
              language="sql"
              code={`SHOW max_connections;

SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state
ORDER BY count(*) DESC;

SELECT pid, usename, application_name, state, wait_event_type, query_start, left(query, 80)
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start;`}
            />
            <CodeBlock
              title="Last resort: end a stuck session"
              language="sql"
              code={`-- Ask the query to stop
SELECT pg_cancel_backend(12345);

-- Kill the whole connection
SELECT pg_terminate_backend(12345);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you choose between a managed Postgres service and self-hosting?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Managed (RDS, Cloud SQL, Neon, Supabase):</strong> they handle backups, updates, and failover. You have less control of the machine</li>
              <li><strong>Self-host:</strong> you control extensions and hardware, but you also own backups, failover, and upgrades</li>
              <li>A good interview answer: start with a managed database unless you need a special extension, huge scale, or must run it yourself</li>
              <li>Also mention backups, how much data you can lose, how fast you can recover, and connection pooling</li>
              <li>Watch for the missing superuser on managed services. Some extensions and some settings are simply not available</li>
            </ul>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
