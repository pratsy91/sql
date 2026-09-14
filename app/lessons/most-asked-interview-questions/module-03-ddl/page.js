import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 3: DDL - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL DDL covering junior to senior — CREATE/ALTER/DROP, indexes, views, sequences, CASCADE, and Prisma migrate vs db push',
};

export default function Module3DDL() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 3: DDL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 3 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DDL? Give examples.">
            <p>DDL (Data Definition Language) defines and changes schema objects — structure, not row data.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Common statements: <code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>, <code>TRUNCATE</code> (often grouped with DDL)</li>
              <li>Objects: tables, indexes, views, schemas, sequences, types</li>
              <li>Contrast with DML (<code>INSERT/UPDATE/DELETE</code>) and DCL (<code>GRANT/REVOKE</code>)</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you CREATE, ALTER, and DROP a table?">
            <CodeBlock
              title="Basic DDL lifecycle"
              language="sql"
              code={`CREATE TABLE employees (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT,
  hired_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employees ADD COLUMN email TEXT;
ALTER TABLE employees RENAME COLUMN department TO dept;
ALTER TABLE employees DROP COLUMN dept;

DROP TABLE employees;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What do IF EXISTS and IF NOT EXISTS do?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CREATE ... IF NOT EXISTS</code> — skip create if object already exists (no error)</li>
              <li><code>DROP ... IF EXISTS</code> — skip drop if missing (idempotent scripts/migrations)</li>
              <li>Does not mean “make it match my definition” — existing wrong shape is left alone</li>
            </ul>
            <CodeBlock
              title="Idempotent DDL"
              language="sql"
              code={`CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  payload JSONB NOT NULL
);

DROP TABLE IF EXISTS temp_import;
DROP INDEX IF EXISTS idx_users_email;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between SERIAL and IDENTITY?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>SERIAL / BIGSERIAL:</strong> Convenience shorthand creating a sequence + default — older Postgres style</li>
              <li><strong>GENERATED ... AS IDENTITY:</strong> SQL-standard identity columns (preferred in modern PG)</li>
              <li><code>BY DEFAULT</code> allows override; <code>ALWAYS</code> blocks insert of explicit values unless <code>OVERRIDING SYSTEM VALUE</code></li>
            </ul>
            <CodeBlock
              title="SERIAL vs IDENTITY"
              language="sql"
              code={`-- Legacy style
CREATE TABLE t1 (id SERIAL PRIMARY KEY);

-- Modern style (preferred)
CREATE TABLE t2 (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a sequence?">
            <ul className="list-disc pl-6 space-y-1">
              <li>A sequence is a database object that generates unique integers</li>
              <li>Used by SERIAL/IDENTITY defaults behind the scenes</li>
              <li><code>nextval</code>, <code>currval</code>, <code>setval</code> control it</li>
              <li>Gaps are normal after rollbacks — do not assume contiguous IDs</li>
            </ul>
            <CodeBlock
              title="Sequence basics"
              language="sql"
              code={`CREATE SEQUENCE order_number_seq START 1000;
SELECT nextval('order_number_seq');
SELECT setval('order_number_seq', 5000);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What index types does PostgreSQL provide? (overview)">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>B-tree:</strong> Default — equality and range (<code>=</code>, <code>&lt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code>)</li>
              <li><strong>Hash:</strong> Equality only — rarely needed vs B-tree</li>
              <li><strong>GIN:</strong> Arrays, JSONB, full-text — inverted indexes</li>
              <li><strong>GiST:</strong> Geometric, range, some FTS / similarity</li>
              <li><strong>BRIN:</strong> Huge append-only tables with natural order (time-series)</li>
              <li><strong>SP-GiST:</strong> Non-balanced structures (IPs, text, points)</li>
            </ul>
            <CodeBlock
              title="Create indexes"
              language="sql"
              code={`CREATE INDEX idx_orders_created ON orders (created_at);
CREATE UNIQUE INDEX idx_users_email ON users (lower(email));
CREATE INDEX idx_docs_fts ON documents USING GIN (to_tsvector('english', body));
CREATE INDEX idx_events_brin ON events USING BRIN (occurred_at);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Views vs materialized views — what is the difference?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>VIEW:</strong> Stored query; runs against live tables every time — always fresh</li>
              <li><strong>MATERIALIZED VIEW:</strong> Stored result set on disk — fast reads, must <code>REFRESH</code></li>
              <li><code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code> needs a unique index; allows reads during refresh</li>
              <li>Use MV for expensive aggregations that tolerate staleness</li>
            </ul>
            <CodeBlock
              title="View and materialized view"
              language="sql"
              code={`CREATE VIEW active_users AS
SELECT id, email FROM users WHERE is_active;

CREATE MATERIALIZED VIEW daily_revenue AS
SELECT date_trunc('day', created_at) AS day, sum(total) AS revenue
FROM orders
GROUP BY 1;

CREATE UNIQUE INDEX daily_revenue_day_uidx ON daily_revenue (day);
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does DROP ... CASCADE do? When is it dangerous?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CASCADE</code> drops dependent objects (FKs, views, etc.) automatically</li>
              <li><code>RESTRICT</code> (default) fails if dependents exist</li>
              <li>Dangerous in production: can silently remove more than intended</li>
              <li>Prefer inspecting dependents first (<code>pg_depend</code>, schema tools) over blind CASCADE</li>
            </ul>
            <CodeBlock
              title="CASCADE example"
              language="sql"
              code={`-- Drops table and objects that depend on it
DROP TABLE old_users CASCADE;

-- Safer default
DROP TABLE old_users RESTRICT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a migrations mindset for schema changes?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Schema changes are versioned, reviewable, and repeatable across environments</li>
              <li>Prefer expand/contract: add new column → backfill → switch reads/writes → drop old</li>
              <li>Avoid long locks: add indexes with <code>CONCURRENTLY</code> outside a transaction when needed</li>
              <li>Never hand-edit production schema without a recorded migration</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Prisma migrate vs db push — which do you use?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong><code>prisma migrate dev/deploy</code>:</strong> Creates/applies versioned SQL migrations — use for teams and production</li>
              <li><strong><code>prisma db push</code>:</strong> Syncs schema without migration history — prototyping only</li>
              <li><code>migrate deploy</code> in CI/CD against production; never rely on <code>db push</code> there</li>
            </ul>
            <CodeBlock
              title="Prisma workflow"
              language="bash"
              code={`# Local development — creates migration files
npx prisma migrate dev --name add_users_table

# Production / CI — apply existing migrations
npx prisma migrate deploy

# Prototype only (no migration history)
npx prisma db push`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you add a column or index safely on a large production table?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Adding a nullable column without a heavy default is usually fast (PG catalogs update)</li>
              <li>Avoid <code>ADD COLUMN ... DEFAULT &lt;volatile&gt;</code> patterns that rewrite the whole table on older workflows; PG 11+ optimized constant defaults</li>
              <li>Create indexes with <code>CREATE INDEX CONCURRENTLY</code> to avoid long ACCESS EXCLUSIVE locks</li>
              <li><code>CONCURRENTLY</code> cannot run inside a transaction block — plan migration tooling accordingly</li>
            </ul>
            <CodeBlock
              title="Online index creation"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do zero-downtime renames and type changes typically work?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Rename: dual-write or view shim; update app; then drop old name</li>
              <li>Type change: add new column → backfill in batches → flip app → drop old</li>
              <li><code>ALTER COLUMN ... TYPE</code> may rewrite and lock; validate with <code>USING</code> expression</li>
              <li>Always test lock duration on a staging copy of production size</li>
            </ul>
            <CodeBlock
              title="Controlled type change"
              language="sql"
              code={`ALTER TABLE products
  ADD COLUMN price_cents BIGINT;

-- backfill in batches in app/job
UPDATE products SET price_cents = (price * 100)::bigint WHERE price_cents IS NULL;

-- later: drop price, rename price_cents`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What should you know about transactional DDL in PostgreSQL?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Most DDL in Postgres is transactional — can <code>BEGIN</code> … <code>ROLLBACK</code> a migration (huge advantage vs MySQL historically)</li>
              <li>Exceptions: e.g. <code>CREATE INDEX CONCURRENTLY</code>, some reindex / vacuum operations</li>
              <li>Long migrations still hold locks — transactional ≠ non-blocking</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do schemas help multi-tenant or modular designs?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Schemas namespace objects inside one database without multiple clusters</li>
              <li>Useful for isolating extensions, reporting, or tenant schemas (with trade-offs)</li>
              <li>Prisma typically maps to one schema via <code>?schema=</code> / <code>schemas</code> multi-schema preview features</li>
              <li>Cross-schema FKs work; permissions via <code>GRANT USAGE ON SCHEMA</code></li>
            </ul>
            <CodeBlock
              title="Schema organization"
              language="sql"
              code={`CREATE SCHEMA app;
CREATE SCHEMA analytics;

CREATE TABLE app.users (...);
CREATE TABLE analytics.user_daily_stats (...);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What DDL-related Prisma interview points do seniors expect?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Source of truth: <code>schema.prisma</code> + migration SQL in <code>prisma/migrations</code></li>
              <li>Review generated SQL before applying — especially drops and type changes</li>
              <li>Use <code>directUrl</code> when a pooler cannot run migrations</li>
              <li>Custom SQL migrations for CONCURRENTLY indexes, extensions, partial indexes Prisma cannot express fully</li>
            </ul>
            <CodeBlock
              title="Partial index via raw migration SQL"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_email_idx
  ON users (email)
  WHERE deleted_at IS NULL;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
