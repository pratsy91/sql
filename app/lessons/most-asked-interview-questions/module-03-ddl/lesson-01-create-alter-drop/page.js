import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: CREATE, ALTER, DROP - Module 3 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL DDL basics — CREATE/ALTER/DROP a table, IF EXISTS, renaming, adding columns with defaults, DELETE vs TRUNCATE vs DROP, and CASCADE',
};

export default function MaiqM03L01CreateAlterDrop() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: CREATE, ALTER, DROP</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The everyday commands that change the shape of your database, and the ones that quietly destroy data if you get them wrong.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DDL? Give examples.">
            <p>DDL means the SQL that changes the shape of the database: tables, columns, and indexes. It does not insert customer rows.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The commands are <code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>, and often <code>TRUNCATE</code></li>
              <li>They apply to tables, indexes, views, schemas, and sequences</li>
              <li>DML is <code>INSERT/UPDATE/DELETE</code>. DCL is <code>GRANT/REVOKE</code> (who is allowed to do what)</li>
              <li>TCL is <code>BEGIN/COMMIT/ROLLBACK</code>, and DQL is just <code>SELECT</code>. Interviewers sometimes ask you to name all five groups</li>
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
            <p>
              A few <code>ALTER TABLE</code> clauses worth memorising: <code>SET NOT NULL</code>, <code>DROP NOT NULL</code>,
              <code> SET DEFAULT</code>, <code>DROP DEFAULT</code>, <code>ADD CONSTRAINT</code>, and <code>ALTER COLUMN ... TYPE</code>.
              You can also put several changes in one statement, which is faster because the table is scanned once.
            </p>
            <CodeBlock
              title="Several changes in one statement"
              language="sql"
              code={`ALTER TABLE employees
  ADD COLUMN manager_id BIGINT,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN hired_at SET DEFAULT now(),
  ADD CONSTRAINT employees_manager_fk
    FOREIGN KEY (manager_id) REFERENCES employees (id);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What do IF EXISTS and IF NOT EXISTS do?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CREATE ... IF NOT EXISTS</code> skips the create if the object already exists, with no error</li>
              <li><code>DROP ... IF EXISTS</code> skips the drop if the object is missing, which keeps scripts and migrations re-runnable</li>
              <li>It does not mean &quot;make it match my definition&quot;. An existing object with the wrong shape is left alone, which can hide a real problem</li>
              <li>It only checks the name, so a table created in a different schema still counts as missing</li>
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

          <InterviewQACard level="Junior" question="How do you rename a table or a column?">
            <p>
              Use <code>ALTER TABLE ... RENAME</code>. In Postgres this is a catalog-only change, so it is instant no matter how big the table is.
              The risk is not the database, it is the running application that still uses the old name.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Renaming a table keeps its data, indexes, constraints, and permissions. Nothing is copied</li>
              <li>Views, functions, and foreign keys follow the rename automatically, because Postgres stores them by internal id, not by name</li>
              <li>But strings do not follow. A query inside application code, a dashboard, or a dynamic SQL string still says the old name and breaks</li>
              <li>The rename takes an ACCESS EXCLUSIVE lock for a moment, so it waits behind any long-running query on that table. Set a short <code>lock_timeout</code> so you fail fast instead of queueing</li>
              <li>Auto-generated names such as <code>employees_pkey</code> do not change with the table, so rename indexes and constraints separately if you care about tidy names</li>
            </ul>
            <CodeBlock
              title="Renames"
              language="sql"
              code={`ALTER TABLE employees RENAME TO staff;
ALTER TABLE staff RENAME COLUMN name TO full_name;

-- Constraints, indexes, sequences, and schemas can be renamed too
ALTER INDEX employees_pkey RENAME TO staff_pkey;
ALTER TABLE staff RENAME CONSTRAINT employees_manager_fk TO staff_manager_fk;
ALTER SEQUENCE employees_id_seq RENAME TO staff_id_seq;

-- Move a table to another schema
ALTER TABLE staff SET SCHEMA hr;

-- Fail fast rather than blocking the whole table
SET lock_timeout = '3s';
ALTER TABLE staff RENAME COLUMN full_name TO name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between DELETE, TRUNCATE, and DROP?">
            <p>
              <code>DELETE</code> removes chosen rows, <code>TRUNCATE</code> empties the whole table quickly, and <code>DROP</code> removes the table itself.
              This is one of the most frequently asked DDL questions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DELETE:</strong> DML, so it takes a <code>WHERE</code> clause, fires row triggers, and marks each row dead. Space is reclaimed later by VACUUM, so the table does not shrink right away</li>
              <li><strong>TRUNCATE:</strong> DDL. It removes every row at once by discarding the underlying files, so it is dramatically faster on a big table and does return space immediately</li>
              <li><strong>DROP:</strong> the table, its indexes, and its data are gone. Only the definition in your migration files remains</li>
              <li>All three are transactional in Postgres, which surprises people coming from MySQL. You really can <code>BEGIN; TRUNCATE ...; ROLLBACK;</code> and get your rows back</li>
              <li>TRUNCATE takes an ACCESS EXCLUSIVE lock, so it waits for every reader. DELETE only locks the rows it touches</li>
              <li>TRUNCATE does not fire per-row triggers, so audit triggers will not see it. It does fire statement-level triggers</li>
              <li>If another table has a foreign key pointing at yours, TRUNCATE fails unless you add <code>CASCADE</code> or truncate both together</li>
              <li><code>RESTART IDENTITY</code> resets the id sequence as well; the default <code>CONTINUE IDENTITY</code> leaves it alone</li>
            </ul>
            <CodeBlock
              title="Three different jobs"
              language="sql"
              code={`-- Remove some rows, keep the table
DELETE FROM sessions WHERE created_at < now() - INTERVAL '30 days';

-- Empty the table fast and reset the ids
TRUNCATE TABLE sessions RESTART IDENTITY;

-- Empty several related tables together
TRUNCATE TABLE order_items, orders;

-- Remove the table completely
DROP TABLE sessions;

-- Yes, even this can be rolled back
BEGIN;
TRUNCATE TABLE audit_log;
ROLLBACK;  -- rows are still there`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What happens when you add a column with a default value?">
            <p>
              Since Postgres 11, adding a column with a constant default is a fast catalog change. Postgres records the default and shows it for old rows
              without touching them. Before 11, the same statement rewrote the entire table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Fast:</strong> <code>ADD COLUMN status TEXT DEFAULT &apos;active&apos;</code>, because the default is a constant</li>
              <li><strong>Fast:</strong> <code>ADD COLUMN ... NOT NULL DEFAULT ...</code> too, on 11 and later. The NOT NULL is satisfied by the recorded default</li>
              <li><strong>Slow:</strong> a volatile default such as <code>DEFAULT gen_random_uuid()</code> or <code>DEFAULT now()</code>, because every existing row needs its own distinct value. That rewrites the table and holds an ACCESS EXCLUSIVE lock</li>
              <li>For a volatile default on a big table, split it up: add the column nullable, backfill in batches, then set the default and the NOT NULL</li>
              <li><code>ADD COLUMN ... NOT NULL</code> with no default fails outright if the table has any rows</li>
              <li>Setting NOT NULL later still needs a full scan to verify. On Postgres 12+ you can avoid the long lock by adding a matching CHECK constraint as <code>NOT VALID</code>, validating it, then setting NOT NULL, which reuses the proof</li>
            </ul>
            <CodeBlock
              title="Fast versus rewriting"
              language="sql"
              code={`-- Fast on PG 11+: constant default
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Slow: every row needs a unique value, so the table is rewritten
-- ALTER TABLE orders ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Safe version of the same change
ALTER TABLE orders ADD COLUMN public_id UUID;
ALTER TABLE orders ALTER COLUMN public_id SET DEFAULT gen_random_uuid();
-- backfill in batches from a job:
UPDATE orders SET public_id = gen_random_uuid()
WHERE public_id IS NULL
  AND id IN (SELECT id FROM orders WHERE public_id IS NULL LIMIT 5000);
ALTER TABLE orders ALTER COLUMN public_id SET NOT NULL;`}
            />
            <CodeBlock
              title="Cheap NOT NULL on a huge table"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_public_id_not_null
  CHECK (public_id IS NOT NULL) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_public_id_not_null; -- scans without blocking writes

ALTER TABLE orders ALTER COLUMN public_id SET NOT NULL;           -- PG 12+ reuses the proof
ALTER TABLE orders DROP CONSTRAINT orders_public_id_not_null;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you copy a table's structure, with or without its data?">
            <p>
              Postgres gives you three different tools, and interviewers like to hear that you know which one keeps the constraints.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>CREATE TABLE ... (LIKE original INCLUDING ALL):</strong> copies the column definitions, defaults, constraints, indexes, comments, and identity. No rows. This is the real &quot;copy the structure&quot; answer</li>
              <li><strong>CREATE TABLE ... AS SELECT:</strong> copies the columns and the rows, but drops constraints, indexes, and defaults. Good for a quick working copy or a backup before a risky change</li>
              <li><strong>CREATE TABLE ... AS SELECT ... WHERE false:</strong> the column shapes only, still with no constraints</li>
              <li><strong>SELECT INTO:</strong> the old form of CREATE TABLE AS. Avoid it in new code, and note it means something completely different inside PL/pgSQL</li>
              <li>Foreign keys are never copied by <code>LIKE</code>, even with <code>INCLUDING ALL</code>. Add them again yourself</li>
              <li>With <code>INCLUDING ALL</code> you can subtract parts, for example <code>EXCLUDING INDEXES</code>, which is handy when you plan to bulk load first and index after</li>
            </ul>
            <CodeBlock
              title="Copying structure and data"
              language="sql"
              code={`-- Structure only, with defaults, constraints, and indexes
CREATE TABLE orders_archive (LIKE orders INCLUDING ALL);

-- Structure without indexes, for a fast bulk load
CREATE TABLE orders_staging (LIKE orders INCLUDING ALL EXCLUDING INDEXES);

-- Structure plus data, no constraints or indexes
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Empty shell with just the column types
CREATE TABLE orders_shape AS SELECT * FROM orders WITH NO DATA;

-- Move old rows into the archive
WITH moved AS (
  DELETE FROM orders
  WHERE created_at < now() - INTERVAL '2 years'
  RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does DROP ... CASCADE do? When is it dangerous?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CASCADE</code> drops dependent objects (foreign keys, views, and so on) automatically</li>
              <li><code>RESTRICT</code> is the default and fails if dependents exist</li>
              <li>Dangerous in production, because it can silently remove far more than you intended. Dropping one table can take out several views and other tables&apos; foreign keys</li>
              <li>Prefer inspecting dependents first with <code>pg_depend</code> or schema tools, rather than a blind CASCADE</li>
              <li>Do the drop inside a transaction and read the NOTICE messages that list what went with it before you commit</li>
              <li>Note that <code>DROP COLUMN ... CASCADE</code> has the same risk, and that a dropped column is not immediately reclaimed on disk</li>
            </ul>
            <CodeBlock
              title="CASCADE example"
              language="sql"
              code={`-- Drops table and objects that depend on it
DROP TABLE old_users CASCADE;

-- Safer default
DROP TABLE old_users RESTRICT;`}
            />
            <CodeBlock
              title="Look before you cascade"
              language="sql"
              code={`-- What depends on this table?
SELECT DISTINCT dependent.relname AS dependent_object, dependent.relkind
FROM pg_depend d
JOIN pg_rewrite r  ON r.oid = d.objid
JOIN pg_class dependent ON dependent.oid = r.ev_class
WHERE d.refobjid = 'old_users'::regclass;

-- Which foreign keys point at it?
SELECT conrelid::regclass AS child_table, conname
FROM pg_constraint
WHERE confrelid = 'old_users'::regclass;

-- Safest rehearsal: do it in a transaction and read the notices
BEGIN;
DROP TABLE old_users CASCADE;
ROLLBACK;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
