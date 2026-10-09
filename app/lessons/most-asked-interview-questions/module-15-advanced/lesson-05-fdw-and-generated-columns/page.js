import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: FDW and Generated Columns - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on Foreign Data Wrappers, postgres_fdw vs ETL, predicate pushdown and consistency, generated columns, STORED vs VIRTUAL, and indexing a generated column.',
};

export default function Module15Lesson05FdwAndGeneratedColumns() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: FDW and Generated Columns</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two unrelated features that often share an interview slot. A Foreign Data Wrapper lets PostgreSQL read
          tables that live in another system. A generated column is a column PostgreSQL computes for you from
          other columns in the same row.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a Foreign Data Wrapper?">
            <p>
              An FDW lets PostgreSQL query data stored somewhere else as if it were a local table. You write a
              normal <code>SELECT</code> and PostgreSQL fetches the rows from the remote system.{' '}
              <code>postgres_fdw</code> connects to another PostgreSQL database, <code>file_fdw</code> reads CSV
              files on disk, and third-party wrappers exist for MySQL, MongoDB, and others.
            </p>
            <p>Setting one up has four steps, and interviewers like you to list them in order:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>CREATE EXTENSION</code> for the wrapper
              </li>
              <li>
                <code>CREATE SERVER</code> to describe where the remote system is
              </li>
              <li>
                <code>CREATE USER MAPPING</code> to say which credentials a local role uses
              </li>
              <li>
                <code>CREATE FOREIGN TABLE</code>, or <code>IMPORT FOREIGN SCHEMA</code> to generate them
                automatically
              </li>
            </ul>
            <p>
              Use it for convenient federation, such as a reporting query that needs one lookup table from
              another service. It is not a replacement for proper data pipelines when latency or consistency
              matter.
            </p>
            <CodeBlock
              title="postgres_fdw setup"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER remote_shop
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'remote', port '5432', dbname 'shop');

CREATE USER MAPPING FOR CURRENT_USER
  SERVER remote_shop
  OPTIONS (user 'reader', password 'secret');

CREATE SCHEMA IF NOT EXISTS remote;

IMPORT FOREIGN SCHEMA public LIMIT TO (orders, customers)
  FROM SERVER remote_shop INTO remote;

-- Query it like any other table
SELECT count(*) FROM remote.orders WHERE created_at > now() - interval '1 day';

-- What foreign tables do we have?
SELECT foreign_table_schema, foreign_table_name FROM information_schema.foreign_tables;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What are generated columns?">
            <p>
              A generated column is defined by an expression instead of being written by your application.
              PostgreSQL computes it from other columns in the same row and keeps it correct automatically. You
              cannot insert or update it directly, which is the point: the value can never drift out of sync the
              way a duplicated application-maintained field does.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The expression must be <strong>immutable</strong> and may only reference columns in the same row.
                So no <code>now()</code>, no subqueries, no other tables.
              </li>
              <li>
                It can be indexed, constrained, and selected exactly like a normal column.
              </li>
              <li>
                Common uses: a total from price plus tax, a normalised lowercase email, a <code>tsvector</code>{' '}
                for search, or a value lifted out of a JSONB document.
              </li>
            </ul>
            <CodeBlock
              title="STORED generated column"
              language="sql"
              code={`CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_cents INT NOT NULL,
  tax_cents   INT NOT NULL,
  total_cents INT GENERATED ALWAYS AS (price_cents + tax_cents) STORED
);

INSERT INTO products (price_cents, tax_cents) VALUES (1000, 190);
SELECT total_cents FROM products;   -- 1190, computed for you

-- Writing to it directly is rejected
-- UPDATE products SET total_cents = 5;
-- ERROR: column "total_cents" can only be updated to DEFAULT

-- Add one to an existing table (this rewrites the table)
ALTER TABLE users
  ADD COLUMN email_normalised TEXT
  GENERATED ALWAYS AS (lower(trim(email))) STORED;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="STORED or VIRTUAL generated columns in PostgreSQL?"
          >
            <p>
              The distinction is when the value is computed. <strong>STORED</strong> computes it on every insert
              and update and saves it on disk. <strong>VIRTUAL</strong> does not store anything and computes the
              value each time you read it.
            </p>
            <p>
              The answer interviewers are checking for: through{' '}
              <strong>PostgreSQL 15, 16, and 17, only STORED is supported</strong>. The keyword{' '}
              <code>VIRTUAL</code> is reserved in the syntax but rejected, so you must write{' '}
              <code>STORED</code> explicitly. Virtual generated columns arrived in{' '}
              <strong>PostgreSQL 18</strong>, where they became the default if you omit the keyword. If you have
              used MySQL or SQL Server you will have met virtual columns there, which is where the confusion
              usually comes from.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>STORED</strong>: costs disk space and write time, but reads are free and it{' '}
                <strong>can be indexed</strong>.
              </li>
              <li>
                <strong>VIRTUAL</strong>: costs nothing to write and no space, but the expression runs on every
                read, and in PostgreSQL 18 a virtual column cannot be indexed.
              </li>
              <li>
                Before PostgreSQL 18, the way to get virtual behaviour is simply a <strong>view</strong> with
                the expression in it, or an expression index if you need the speed.
              </li>
            </ul>
            <CodeBlock
              title="What works on which version"
              language="sql"
              code={`-- PostgreSQL 12 through 17: STORED is required and must be written out
ALTER TABLE products
  ADD COLUMN total_cents INT
  GENERATED ALWAYS AS (price_cents + tax_cents) STORED;

-- On PG 15/16/17 this fails
-- ALTER TABLE products ADD COLUMN t INT GENERATED ALWAYS AS (price_cents * 2) VIRTUAL;
-- ERROR: unrecognized parameter "virtual"

-- The pre-18 way to get read-time computation: a view
CREATE VIEW products_with_total AS
SELECT p.*, p.price_cents + p.tax_cents AS total_cents
FROM products p;

-- Which columns in this database are generated?
SELECT table_name, column_name, is_generated, generation_expression
FROM information_schema.columns
WHERE is_generated = 'ALWAYS';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you index a generated column?">
            <p>
              Exactly like a normal column, because a <code>STORED</code> generated column really is stored. That
              is the main practical reason to create one.
            </p>
            <p>
              The interesting part is when to prefer this over an <strong>expression index</strong>, which
              indexes the same formula without adding a column. Both make the query fast, but they behave
              differently:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Expression index</strong>: no extra column and no table rewrite, so it is cheaper to add.
                But it only helps queries that repeat the expression exactly, and the planner&apos;s row
                estimates for expressions are weaker than for real columns.
              </li>
              <li>
                <strong>Generated column plus a plain index</strong>: the value is visible in{' '}
                <code>SELECT</code>, PostgreSQL gathers proper statistics on it, other queries and ORMs can use
                it without knowing the formula, and you can attach a <code>CHECK</code> or unique constraint.
              </li>
            </ul>
            <p>
              Use a generated column when the derived value is part of your data model and other code reads it.
              Use an expression index when you only need one specific query to be fast and do not want to touch
              the table.
            </p>
            <p>
              Two practical notes: adding a generated column to a large table rewrites it and takes a strong lock,
              so plan it like any other rewriting migration. And a generated column cannot be used as a partition
              key, so partition on the underlying column instead.
            </p>
            <CodeBlock
              title="Generated column vs expression index"
              language="sql"
              code={`-- Option A: generated column, indexed and visible
ALTER TABLE users
  ADD COLUMN email_lower TEXT GENERATED ALWAYS AS (lower(email)) STORED;

CREATE UNIQUE INDEX users_email_lower_key ON users (email_lower);

SELECT id, email_lower FROM users WHERE email_lower = 'alice@x.com';

-- Option B: expression index only, no new column
CREATE UNIQUE INDEX users_email_expr_key ON users (lower(email));

-- Only this exact form uses Option B's index
SELECT id FROM users WHERE lower(email) = 'alice@x.com';

-- Useful combination: a generated tsvector, indexed with GIN
ALTER TABLE articles
  ADD COLUMN document tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;

CREATE INDEX CONCURRENTLY articles_document_idx ON articles USING GIN (document);`}
            />
            <CodeBlock
              title="Generated columns in Prisma"
              language="prisma"
              code={`// Prisma cannot declare GENERATED ALWAYS, so create the column in a raw
// SQL migration and then describe it here as an optional read-only field.
model User {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email       String
  emailLower  String? @map("email_lower")

  @@unique([emailLower])
  @@map("users")
}

// Never include emailLower in create or update data: PostgreSQL rejects it.`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="postgres_fdw or ETL: how do you decide?">
            <p>
              FDW reads the data <em>live</em> at query time. ETL (extract, transform, load) copies it on a
              schedule into your own tables. The choice is about freshness against reliability and speed.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Choose FDW</strong> when the data must be current to the second, the volume per query is
                small, the query is occasional, and you would rather avoid running a pipeline. Good example: an
                admin screen joining local orders against a small remote product catalog.
              </li>
              <li>
                <strong>Choose ETL or replication</strong> when queries are frequent or analytical, when the
                remote system must not be loaded by your reporting, when you need the data to stay queryable if
                the remote side is down, or when you want indexes tuned for your access patterns. Good example:
                a nightly dashboard over millions of rows.
              </li>
            </ul>
            <p>
              The arguments that decide it in practice, and which a strong candidate raises unprompted:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Availability coupling.</strong> With FDW, if the remote database is down or slow, your
                query fails or hangs. You have made their outage your outage. A local copy keeps working.
              </li>
              <li>
                <strong>No local indexes.</strong> You cannot index a foreign table. Every access depends on the
                remote side having the right index.
              </li>
              <li>
                <strong>Bad statistics.</strong> The planner knows little about remote tables unless you run{' '}
                <code>ANALYZE</code> on them, which leads to poor join plans.
              </li>
              <li>
                <strong>No caching.</strong> Every execution goes over the network again.
              </li>
            </ul>
            <p>
              A good middle answer: use FDW as the <em>transport</em> and materialise the result locally. That
              gives you one mechanism instead of a separate pipeline, while queries still hit local indexed
              data.
            </p>
            <CodeBlock
              title="FDW as transport, local table as the cache"
              language="sql"
              code={`-- Refreshed on a schedule, queried locally with local indexes
CREATE MATERIALIZED VIEW product_catalog AS
SELECT id, sku, name, price_cents, updated_at
FROM remote.products;

CREATE UNIQUE INDEX product_catalog_id_key ON product_catalog (id);
CREATE INDEX product_catalog_sku_idx ON product_catalog (sku);

-- Refresh without blocking readers (needs the unique index above)
REFRESH MATERIALIZED VIEW CONCURRENTLY product_catalog;

-- Incremental pull instead of a full refresh, for large tables
INSERT INTO product_cache (id, sku, name, price_cents, updated_at)
SELECT id, sku, name, price_cents, updated_at
FROM remote.products
WHERE updated_at > (SELECT COALESCE(max(updated_at), '-infinity') FROM product_cache)
ON CONFLICT (id) DO UPDATE
SET sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    updated_at = EXCLUDED.updated_at;

-- Give the planner some idea of the remote table's size
ANALYZE remote.products;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="FDW performance and consistency considerations">
            <p>
              The single concept that matters here is <strong>pushdown</strong>: how much of your query
              PostgreSQL manages to send to the remote server instead of doing locally. When pushdown works, the
              remote side filters and aggregates and returns a few rows. When it fails, PostgreSQL pulls the
              whole table across the network and filters it at home. Same SQL, wildly different cost.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>What pushes down</strong>: simple <code>WHERE</code> clauses, and with{' '}
                <code>postgres_fdw</code> also joins between two foreign tables on the same server, aggregates,{' '}
                <code>ORDER BY</code>, and <code>LIMIT</code>.
              </li>
              <li>
                <strong>What does not</strong>: anything using a local function or a local user-defined
                operator, non-immutable expressions, and joins between a local and a foreign table. That last one
                is the usual disaster, because the entire foreign table gets shipped over.
              </li>
              <li>
                <strong>Always read the plan.</strong> <code>EXPLAIN (VERBOSE)</code> shows the actual
                &quot;Remote SQL&quot; that will be sent. If your filter is missing from it, it is not being
                pushed down.
              </li>
              <li>
                <strong>Tune fetch size.</strong> The default <code>fetch_size</code> of 100 rows means many
                round trips for large results. Raise it per server or per table.
              </li>
              <li>
                <code>use_remote_estimate = true</code> makes the planner ask the remote server for cost
                estimates, which produces much better plans at the cost of extra round trips during planning.
              </li>
            </ul>
            <p>On consistency, be precise, because this is where candidates overclaim:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A transaction spanning local and foreign tables is <strong>not fully atomic</strong>.
                PostgreSQL opens a transaction on the remote server and commits it as part of your commit, but
                there is no two-phase commit by default. A failure in the window between the two commits leaves
                them inconsistent.
              </li>
              <li>
                Each remote query sees the remote server&apos;s snapshot at the time it runs, so two foreign
                scans in one local transaction can see different states. You do not get a single consistent
                snapshot across servers.
              </li>
              <li>
                Writes through FDW work but multiply the failure modes. Prefer reading through FDW and writing
                through the owning service&apos;s API.
              </li>
              <li>
                Security matters too: the user mapping holds credentials, so grant access to foreign tables
                narrowly and never map a superuser.
              </li>
            </ul>
            <p>
              Summary line for an interview: FDW is excellent for operational convenience and light federation.
              For analytics at scale, or anything needing strong consistency, use replication or a real pipeline
              and query local data.
            </p>
            <CodeBlock
              title="Check pushdown and tune the server"
              language="sql"
              code={`-- Shows the exact SQL sent to the remote server
EXPLAIN (VERBOSE, COSTS OFF)
SELECT count(*) FROM remote.orders WHERE created_at > now() - interval '1 day';
-- Look for: Remote SQL: SELECT ... WHERE created_at > ...

-- Pushdown killed by a local function: the whole table comes across
EXPLAIN (VERBOSE, COSTS OFF)
SELECT * FROM remote.orders WHERE my_local_fn(status) = 'paid';

-- Local-to-foreign join: no pushdown, so filter and reduce first
EXPLAIN (VERBOSE, COSTS OFF)
SELECT l.id, r.total
FROM local_customers l
JOIN remote.orders r ON r.customer_id = l.id;

-- Fewer round trips for big result sets
ALTER SERVER remote_shop OPTIONS (ADD fetch_size '10000');

-- Better plans, at the cost of planning-time round trips
ALTER SERVER remote_shop OPTIONS (ADD use_remote_estimate 'true');
ANALYZE remote.orders;

-- Timeouts so a remote stall cannot hang your query forever (PG 17+)
ALTER SERVER remote_shop OPTIONS (ADD connect_timeout '5');`}
            />
            <CodeBlock
              title="Do not span writes across servers without care"
              language="typescript"
              code={`// Risky: a local write and a foreign write in one transaction are not
// atomic across the two servers.
await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe('INSERT INTO local_audit (msg) VALUES ($1)', 'sync');
  await tx.$executeRawUnsafe('UPDATE remote.orders SET status = $1 WHERE id = $2', 'paid', id);
});

// Safer: write locally, then let an idempotent worker push the remote change
// from an outbox table so a partial failure can be retried.
await prisma.$transaction(async (tx) => {
  await tx.auditLog.create({ data: { msg: 'sync' } });
  await tx.outbox.create({ data: { kind: 'remote_order_paid', payload: { id } } });
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
