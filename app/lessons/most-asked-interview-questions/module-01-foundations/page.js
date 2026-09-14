import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 1: Foundations & Setup - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL foundations and setup covering junior to senior — RDBMS, ACID, connections, auth, SSL, pooling, and Prisma',
};

export default function Module1Foundations() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 1: Foundations & Setup</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 1 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is PostgreSQL?">
            <p>
              PostgreSQL (often called Postgres) is an open-source, object-relational database management system (ORDBMS).
              It implements SQL standards well, supports advanced types (JSONB, arrays, ranges), full-text search, and extensions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>ACID-compliant transactions and strong data integrity</li>
              <li>Extensible (e.g. PostGIS, pg_trgm, uuid-ossp / pgcrypto)</li>
              <li>Used widely for web apps, analytics, and multi-tenant SaaS</li>
              <li>Current major versions commonly discussed in interviews: PG 15, 16, 17</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between RDBMS and NoSQL?">
            <p>RDBMS stores structured data in tables with a fixed schema and relationships. NoSQL covers document, key-value, column, and graph stores with flexible or schema-less models.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>RDBMS (PostgreSQL, MySQL):</strong> SQL, joins, strong consistency, normalized design</li>
              <li><strong>NoSQL (MongoDB, Redis, Cassandra):</strong> flexible documents/keys, horizontal scale patterns, eventual consistency options</li>
              <li>Choose RDBMS for complex relations and integrity; NoSQL for flexible documents, caching, or massive write scale</li>
              <li>PostgreSQL blurs the line with JSONB — many teams use it as a hybrid</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ACID properties.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Atomicity:</strong> All statements in a transaction succeed or none do (rollback on failure)</li>
              <li><strong>Consistency:</strong> Constraints, types, and rules keep the DB in a valid state</li>
              <li><strong>Isolation:</strong> Concurrent transactions do not see each other’s incomplete work (isolation levels control this)</li>
              <li><strong>Durability:</strong> Committed data survives crashes (WAL / fsync)</li>
            </ul>
            <CodeBlock
              title="Simple ACID transaction"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- both updates stick together, or neither does on ROLLBACK`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain the PostgreSQL hierarchy: cluster, database, schema, table.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cluster / instance:</strong> One running Postgres server process (data directory)</li>
              <li><strong>Database:</strong> Named catalog inside the cluster (e.g. <code>app_prod</code>)</li>
              <li><strong>Schema:</strong> Namespace inside a database (default is <code>public</code>)</li>
              <li><strong>Table / view / function:</strong> Objects living inside a schema</li>
            </ul>
            <CodeBlock
              title="Qualified object names"
              language="sql"
              code={`-- Fully qualified: database is selected by connection; schema.table
SELECT * FROM public.users;

CREATE SCHEMA reporting;
CREATE TABLE reporting.daily_stats (...);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a connection string, and how do you connect with psql?">
            <p>A connection URI (or libpq keyword string) tells the client host, port, database, user, and password.</p>
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
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does PostgreSQL client/server architecture work?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>postmaster</strong> listens on a port (default 5432) and forks a backend process per connection</li>
              <li>Clients speak the Postgres wire protocol (libpq, JDBC, node-postgres, Prisma engines)</li>
              <li>Shared buffers, WAL writer, checkpointer, autovacuum run as background processes</li>
              <li>Each connection is relatively heavy — hence connection pooling in production</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are roles and how does authentication work with pg_hba.conf?">
            <p>
              Roles are users/groups. Login roles authenticate; membership grants privileges.
              <code>pg_hba.conf</code> decides <em>who</em> can connect from <em>where</em> using which method.
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
              <li>Encrypts data in transit (passwords, PII, query results)</li>
              <li>Required by most cloud providers and compliance (PCI, HIPAA-style policies)</li>
              <li>Client sets <code>sslmode</code>: <code>require</code>, <code>verify-ca</code>, <code>verify-full</code></li>
              <li><code>verify-full</code> also checks hostname against the certificate — strongest option</li>
            </ul>
            <CodeBlock
              title="SSL in connection URI"
              language="bash"
              code={`postgresql://user:pass@db.example.com:5432/app?sslmode=verify-full`}
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
              <li><code>search_path</code> is the ordered list of schemas Postgres checks for unqualified names</li>
              <li>Default usually includes <code>"$user"</code>, then <code>public</code></li>
              <li>Wrong <code>search_path</code> can hide tables or pick the wrong object — common multi-schema gotcha</li>
            </ul>
            <CodeBlock
              title="Inspect and set search_path"
              language="sql"
              code={`SHOW search_path;
SET search_path TO reporting, public;
SELECT * FROM daily_stats; -- resolves to reporting.daily_stats if it exists`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why is connection pooling required, and how does PgBouncer help?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Each Postgres backend uses RAM and process overhead; hundreds of app connections exhaust the server</li>
              <li><strong>PgBouncer</strong> multiplexes many client connections onto fewer server connections</li>
              <li>Modes: <code>session</code> (simplest), <code>transaction</code> (recommended for most apps), <code>statement</code> (rare)</li>
              <li>Transaction pooling breaks session features: prepared statements, temp tables, <code>SET</code> lasting across requests — configure clients accordingly</li>
              <li>Serverless / Prisma often use a pooler URL + direct URL for migrations</li>
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
              <li>Disable <code>trust</code> / <code>password</code> (cleartext); use <code>scram-sha-256</code></li>
              <li>Separate roles: migrator (DDL), app (DML), readonly (analytics)</li>
              <li>Network: private VPC, security groups, SSL required (<code>hostssl</code>)</li>
              <li>Rotate credentials; prefer IAM / cloud-native auth when available</li>
              <li>Principle of least privilege; revoke <code>CREATE</code> on <code>public</code> for app roles (PG 15+ defaults changed)</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What happens when max_connections is hit, and how do you diagnose it?">
            <ul className="list-disc pl-6 space-y-1">
              <li>New clients get “FATAL: too many connections” / remaining slots reserved for superuser</li>
              <li>Check <code>pg_stat_activity</code> for idle-in-transaction and connection storms</li>
              <li>Fix with pooling, shorter idle timeouts, and right-sizing <code>max_connections</code> vs RAM</li>
              <li>Raising <code>max_connections</code> without pooling is usually the wrong fix</li>
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you choose between a managed Postgres service and self-hosting?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Managed (RDS, Cloud SQL, Neon, Supabase, Azure PG):</strong> backups, patching, HA, less ops — less OS-level control</li>
              <li><strong>Self-host:</strong> full control of extensions, configs, hardware — you own HA, PITR, upgrades</li>
              <li>Interview answer: default to managed unless you need custom extensions, cost at large scale, or strict data residency DIY</li>
              <li>Always clarify backup/PITR, failover RPO/RTO, and connection pooling in the architecture discussion</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Explain MVCC at a high level and why readers don’t block writers in PostgreSQL.">
            <ul className="list-disc pl-6 space-y-1">
              <li>PostgreSQL uses Multi-Version Concurrency Control: updates create new row versions instead of overwriting in place</li>
              <li>Readers see a snapshot; writers create new versions — classic reader/writer blocking is minimized</li>
              <li>Old versions are cleaned by VACUUM; long transactions delay cleanup (bloat risk)</li>
              <li>Isolation levels (READ COMMITTED default, REPEATABLE READ, SERIALIZABLE) change snapshot behavior</li>
            </ul>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
