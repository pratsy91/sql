import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Migrations and Production DDL - Module 3 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on safe PostgreSQL migrations — Prisma migrate vs db push, CREATE INDEX CONCURRENTLY, heavy ALTER locks, expand-contract, and transactional DDL',
};

export default function MaiqM03L04MigrationsAndProductionDdl() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Migrations and Production DDL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Changing the schema of a live database without taking the app down. This is the part of DDL that senior interviews really dig into.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is a migrations mindset for schema changes?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Schema changes are versioned, reviewable, and repeatable across environments</li>
              <li>Prefer expand and contract: add the new column, backfill, switch reads and writes, then drop the old one</li>
              <li>Avoid long locks. Add indexes with <code>CONCURRENTLY</code> outside a transaction when needed</li>
              <li>Never hand-edit a production schema without a recorded migration</li>
              <li>Every migration should be backward compatible with the version of the app that is currently running, because during a rolling deploy both versions run at once</li>
              <li>Test migrations against a copy of production sized data, not an empty development database. Lock duration only shows up at scale</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Prisma migrate vs db push — which do you use?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong><code>prisma migrate dev</code> and <code>migrate deploy</code>:</strong> create and apply versioned SQL migrations. Use these for teams and production</li>
              <li><strong><code>prisma db push</code>:</strong> syncs the schema with no migration history. Prototyping only</li>
              <li>Run <code>migrate deploy</code> in CI/CD against production, and never rely on <code>db push</code> there</li>
              <li><code>migrate dev</code> can reset and reseed your local database, which is why it must never be pointed at production</li>
              <li>Use <code>migrate diff</code> to generate SQL you can review or hand-edit, and <code>migrate resolve</code> to mark a migration as applied when you ran the SQL yourself</li>
            </ul>
            <CodeBlock
              title="Prisma workflow"
              language="bash"
              code={`# Local development — creates migration files
npx prisma migrate dev --name add_users_table

# Production / CI — apply existing migrations
npx prisma migrate deploy

# Prototype only (no migration history)
npx prisma db push

# Generate SQL for review without applying it
npx prisma migrate diff \\
  --from-schema-datasource prisma/schema.prisma \\
  --to-schema-datamodel prisma/schema.prisma \\
  --script > migration.sql`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is CREATE INDEX CONCURRENTLY and what are its rules?">
            <p>
              A normal <code>CREATE INDEX</code> takes a SHARE lock, which blocks every INSERT, UPDATE, and DELETE on the table until it finishes.
              <code> CONCURRENTLY</code> builds the index in extra passes so writes keep working the whole time. On any real production table this is the
              default choice.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>It cannot run inside a transaction block.</strong> That is the rule interviewers are listening for, and it is why migration tools need a special escape hatch</li>
              <li>It is slower and does more total work, because it scans the table twice and waits for existing transactions to finish</li>
              <li>If it fails, it leaves behind an <strong>invalid index</strong> that still costs write overhead but is never used for queries. You must drop it and try again</li>
              <li>Drop the failed one with <code>DROP INDEX CONCURRENTLY</code> so the drop does not block either</li>
              <li>It waits for all open transactions that could see the table, so one long-running query can stall the build for a long time</li>
              <li>Adding <code>IF NOT EXISTS</code> makes the migration safe to re-run, but note that an invalid index counts as existing</li>
              <li>In Prisma you write this in a hand-edited migration file and add the <code>Prisma.skipTransaction</code> marker comment, or run it as a separate deploy step</li>
            </ul>
            <CodeBlock
              title="Online index creation and cleanup"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- Find builds that failed and left an invalid index behind
SELECT c.relname AS index_name, i.indisvalid
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
WHERE NOT i.indisvalid;

DROP INDEX CONCURRENTLY idx_orders_user_id;`}
            />
            <CodeBlock
              title="Hand-written Prisma migration for a concurrent index"
              language="sql"
              code={`-- prisma/migrations/20260315120000_orders_user_idx/migration.sql
-- CreateIndex
-- Prisma.skipTransaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON "orders" ("user_id");`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you add a column or index safely on a large production table?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Adding a nullable column without a heavy default is usually fast, because only the catalog is updated</li>
              <li>Avoid <code>ADD COLUMN ... DEFAULT</code> with a volatile expression, which rewrites the whole table. Postgres 11+ handles constant defaults without a rewrite</li>
              <li>Create indexes with <code>CREATE INDEX CONCURRENTLY</code> to avoid long ACCESS EXCLUSIVE locks</li>
              <li><code>CONCURRENTLY</code> cannot run inside a transaction block, so plan your migration tooling accordingly</li>
              <li>Always set <code>lock_timeout</code> before a DDL statement. Without it, a blocked ALTER queues behind a slow query and then blocks every new query behind itself, which is how a one-second change becomes a full outage</li>
              <li>Retry the statement in a loop rather than waiting. A short timeout plus a retry is far safer than a long wait</li>
              <li>Backfill in small batches with a pause between them, so autovacuum keeps up and replicas do not lag</li>
            </ul>
            <CodeBlock
              title="Online index creation"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);`}
            />
            <CodeBlock
              title="Always bound the lock wait"
              language="sql"
              code={`SET lock_timeout = '3s';
SET statement_timeout = '30s';

ALTER TABLE orders ADD COLUMN notes TEXT;  -- fails fast instead of piling up

-- Who is holding the lock you are waiting for?
SELECT blocked.pid AS blocked_pid,
       blocking.pid AS blocking_pid,
       left(blocked.query, 60)  AS blocked_query,
       left(blocking.query, 60) AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY (pg_blocking_pids(blocked.pid));`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Which ALTER TABLE statements take a heavy lock, and which are cheap?">
            <p>
              Almost all <code>ALTER TABLE</code> forms take an ACCESS EXCLUSIVE lock, which blocks even plain SELECTs. What actually matters is how long they
              hold it: a catalog-only change holds it for a millisecond, while a table rewrite holds it for the whole rewrite.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cheap, catalog only:</strong> <code>RENAME</code> anything, <code>DROP COLUMN</code>, <code>ADD COLUMN</code> nullable, <code>ADD COLUMN</code> with a constant default on PG 11+, <code>SET DEFAULT</code>, <code>DROP DEFAULT</code>, <code>DROP NOT NULL</code>, <code>SET STATISTICS</code>, and widening <code>VARCHAR(50)</code> to <code>VARCHAR(100)</code> or to TEXT</li>
              <li><strong>Needs a full scan but no rewrite:</strong> <code>SET NOT NULL</code>, <code>VALIDATE CONSTRAINT</code>, and adding a foreign key. These hold a weaker lock in the validate step, which is why you split them</li>
              <li><strong>Full table rewrite, the expensive ones:</strong> <code>ALTER COLUMN ... TYPE</code> when the types are not binary compatible, <code>ADD COLUMN</code> with a volatile default, adding a PRIMARY KEY, <code>SET LOGGED</code> or <code>UNLOGGED</code>, and anything that changes the row layout</li>
              <li><strong>Type changes that are free:</strong> a few pairs are binary coercible, such as <code>VARCHAR(n)</code> to TEXT and <code>NUMERIC</code> to a wider NUMERIC. Going from INT to BIGINT is not free</li>
              <li><strong>Constraints, done in two steps:</strong> add the CHECK or FOREIGN KEY as <code>NOT VALID</code> to take a brief lock, then <code>VALIDATE CONSTRAINT</code> separately, which only takes a SHARE UPDATE EXCLUSIVE lock and lets reads and writes continue</li>
              <li><strong>Truly non-blocking DDL:</strong> <code>CREATE INDEX CONCURRENTLY</code>, <code>DROP INDEX CONCURRENTLY</code>, <code>REINDEX CONCURRENTLY</code>, and <code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code></li>
              <li>The killer detail: an ACCESS EXCLUSIVE lock request queues in front of every later query. So a blocked ALTER makes the table unreadable even though the ALTER itself is doing nothing. Always use <code>lock_timeout</code></li>
            </ul>
            <CodeBlock
              title="Add a foreign key without blocking writes"
              language="sql"
              code={`-- Step 1: brief lock, existing rows are not checked
ALTER TABLE orders
  ADD CONSTRAINT orders_user_fk
  FOREIGN KEY (user_id) REFERENCES users (id)
  NOT VALID;

-- Step 2: scan and verify under a weaker lock
ALTER TABLE orders VALIDATE CONSTRAINT orders_user_fk;`}
            />
            <CodeBlock
              title="See which lock a statement is holding"
              language="sql"
              code={`SELECT l.locktype, l.relation::regclass AS table_name, l.mode, l.granted, a.pid,
       left(a.query, 60) AS query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation IS NOT NULL
ORDER BY l.granted, a.pid;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Explain the expand-contract migration pattern.">
            <p>
              Expand and contract, sometimes called parallel change, is how you make a breaking schema change without a maintenance window. Instead of one
              risky step, you go through a phase where both the old and the new shape exist and work. Each phase is individually safe to deploy and to roll back.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>1. Expand:</strong> add the new column, table, or index. Do not touch the old one. This deploy is compatible with the currently running app, so it is safe on its own</li>
              <li><strong>2. Dual write:</strong> deploy app code that writes both the old and the new shape, but still reads the old one. A database trigger can do this instead if you cannot change every writer</li>
              <li><strong>3. Backfill:</strong> copy the historical rows in small batches, with a pause between batches. Keep going until nothing is left, and verify the counts match</li>
              <li><strong>4. Switch reads:</strong> deploy app code that reads the new shape. This is the moment of truth, and rolling back is just reverting this one deploy, because the old column is still being written</li>
              <li><strong>5. Stop writing the old shape:</strong> another deploy. Wait long enough that you are confident, often days</li>
              <li><strong>6. Contract:</strong> drop the old column, trigger, and index. This is the only irreversible step, so it goes last and alone</li>
              <li><strong>Why it works:</strong> during a rolling deploy two app versions run at the same time. Every phase is readable and writable by both versions, so there is never a moment where one of them breaks</li>
              <li>The same pattern covers renames, type widening, splitting one table into two, and moving a column to another table</li>
              <li>Budget for the fact that this is six deploys, not one. Interviewers want to hear that you accept that cost deliberately for a large table</li>
            </ul>
            <CodeBlock
              title="Renaming a column with expand-contract"
              language="sql"
              code={`-- Phase 1: expand
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Phase 2: keep both in sync for new writes
CREATE FUNCTION users_sync_name() RETURNS trigger AS $fn$
BEGIN
  IF NEW.full_name IS NULL THEN NEW.full_name := NEW.name; END IF;
  IF NEW.name IS NULL      THEN NEW.name      := NEW.full_name; END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER users_sync_name_trg
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION users_sync_name();

-- Phase 3: backfill in batches, repeat until zero rows updated
UPDATE users SET full_name = name
WHERE full_name IS NULL
  AND id IN (SELECT id FROM users WHERE full_name IS NULL LIMIT 5000);

-- Verify before switching reads
SELECT count(*) AS still_missing FROM users WHERE full_name IS NULL;

-- Phase 6: contract, days later
DROP TRIGGER users_sync_name_trg ON users;
DROP FUNCTION users_sync_name();
ALTER TABLE users DROP COLUMN name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do zero-downtime renames and type changes typically work?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Rename: dual-write, or put a view in front as a shim, update the app, then drop the old name</li>
              <li>Type change: add a new column, backfill in batches, flip the app over, then drop the old column</li>
              <li><code>ALTER COLUMN ... TYPE</code> may rewrite the table and hold a heavy lock. Validate the conversion with a <code>USING</code> expression</li>
              <li>Always test lock duration on a staging copy the size of production</li>
              <li>Remember that every index on a rewritten column is rebuilt too, which is often the slowest part</li>
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
              <li>Most DDL in Postgres is transactional, so you can <code>BEGIN</code> a migration and <code>ROLLBACK</code> it. This is a big advantage over MySQL historically</li>
              <li>Exceptions include <code>CREATE INDEX CONCURRENTLY</code>, <code>DROP INDEX CONCURRENTLY</code>, <code>REINDEX CONCURRENTLY</code>, <code>VACUUM</code>, <code>CREATE DATABASE</code>, and <code>ALTER SYSTEM</code></li>
              <li>A long migration still holds locks, so transactional does not mean non-blocking</li>
              <li>You can mix DDL and DML in one transaction, which is how you add a column and backfill it atomically on a small table</li>
              <li>Sequence values are the exception to atomicity. A rolled-back migration does not give back the ids it consumed</li>
              <li>Because DDL is transactional, wrapping several ALTERs in one transaction is usually good practice, but it also means every lock is held until the final COMMIT. Keep migration transactions short</li>
            </ul>
            <CodeBlock
              title="A migration you can roll back"
              language="sql"
              code={`BEGIN;
SET lock_timeout = '3s';

ALTER TABLE orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR';
UPDATE orders SET currency = 'USD' WHERE region = 'us';
ALTER TABLE orders ADD CONSTRAINT orders_currency_check
  CHECK (currency IN ('INR', 'USD', 'EUR'));

COMMIT;  -- or ROLLBACK and nothing above happened`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do schemas help multi-tenant or modular designs?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Schemas namespace objects inside one database without needing multiple clusters</li>
              <li>Useful for isolating extensions, reporting, or per-tenant schemas, with trade-offs</li>
              <li>Prisma typically maps to one schema via <code>?schema=</code>, with multi-schema support for more</li>
              <li>Cross-schema foreign keys work, and permissions come from <code>GRANT USAGE ON SCHEMA</code></li>
              <li>The honest trade-off with schema-per-tenant: it gives clean isolation and easy per-tenant restore, but a migration must now run once per schema, and a few thousand tenants means a huge catalog that slows down planning and backups</li>
              <li>The usual alternative is a shared table with a <code>tenant_id</code> column plus row-level security, which scales to many more tenants at the cost of weaker isolation</li>
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
              <li>The source of truth is <code>schema.prisma</code> plus the migration SQL in <code>prisma/migrations</code></li>
              <li>Review the generated SQL before applying it, especially drops and type changes</li>
              <li>Use <code>directUrl</code> when a connection pooler cannot run migrations</li>
              <li>Write custom SQL migrations for CONCURRENTLY indexes, extensions, and partial indexes that Prisma cannot express</li>
              <li>Prisma is happy to generate a destructive migration that drops a column and its data. Anything destructive should be a separate, deliberate deploy</li>
              <li>Keep migrations forward-only in production. Roll forward with a new migration rather than trying to undo an applied one</li>
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
