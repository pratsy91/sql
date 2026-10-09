import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: Advanced PostgreSQL with Prisma - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on Prisma limits with advanced PostgreSQL: the raw query escape hatch, Unsupported() types, extension SQL inside migrations, testing raw SQL, and putting it all together.',
};

export default function Module15Lesson06AdvancedWithPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: Advanced PostgreSQL with Prisma</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Prisma models tables, columns, and relations very well. It does not model partitioning, extensions,
          triggers, or exotic types. This lesson is about knowing where that line sits and how to work past it
          cleanly, which is exactly what interviewers probe.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Which advanced PostgreSQL features does Prisma not model well, and what is the escape hatch?"
          >
            <p>
              Prisma&apos;s schema language describes a relational model. Anything that is a database{' '}
              <em>capability</em> rather than a table shape falls outside it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Not in the schema</strong>: table partitioning, row level security policies, triggers and
                functions, materialised views, foreign data wrappers, custom operators and operator classes, most
                index types beyond the basics, and <code>GENERATED ALWAYS</code> columns.
              </li>
              <li>
                <strong>Not in the client</strong>: LISTEN and NOTIFY, advisory locks, full-text search
                operators, vector similarity operators, and <code>FOR UPDATE SKIP LOCKED</code>.
              </li>
            </ul>
            <p>Two escape hatches, and you need both:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>For schema</strong>: write the DDL in a Prisma migration file. Prisma runs plain SQL
                migrations happily, so anything PostgreSQL can do, your migration can do.
              </li>
              <li>
                <strong>For runtime</strong>: <code>$queryRaw</code> and <code>$executeRaw</code>, or their{' '}
                <code>Unsafe</code> variants when the SQL text must be built dynamically. Always pass values as
                parameters, never by string concatenation, or you have written a SQL injection.
              </li>
              <li>
                Map exotic column types with <code>Unsupported(&quot;...&quot;)</code> so Prisma knows the column
                exists without needing to understand it.
              </li>
            </ul>
            <p>
              The judgement interviewers listen for: use the ORM for the 90 percent of ordinary CRUD where it
              makes code safe and readable, and drop to SQL deliberately for the 10 percent where PostgreSQL has
              something the ORM cannot express. Fighting the ORM into doing advanced SQL is the wrong instinct,
              and so is abandoning it.
            </p>
            <CodeBlock
              title="Unsupported plus the raw escape hatch"
              language="prisma"
              code={`model Article {
  id       String                   @id @default(cuid())
  title    String
  body     String
  // Maintained by PostgreSQL as a generated column
  document Unsupported("tsvector")?

  @@map("articles")
}`}
            />
            <CodeBlock
              title="Parameterised raw queries"
              language="typescript"
              code={`// Simple case: one statement, values passed as parameters
const one = await prisma.$queryRawUnsafe(
  'SELECT id, title FROM articles WHERE title = $1',
  title
);

// Longer SQL: build the text from an array, values still separate
const sql = [
  'SELECT id, title, ts_rank_cd(document, q) AS rank',
  "FROM articles, websearch_to_tsquery('english', $1) q",
  'WHERE document @@ q',
  'ORDER BY rank DESC LIMIT $2',
].join(' ');

const hits = await prisma.$queryRawUnsafe(sql, userQuery, 20);

// Never do this: the value is concatenated into the SQL text
// await prisma.$queryRawUnsafe('SELECT * FROM articles WHERE title = ' + userQuery);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is Unsupported() in schema.prisma, and what are the rules?"
          >
            <p>
              <code>Unsupported(&quot;type&quot;)</code> tells Prisma &quot;this column exists, its type is this
              PostgreSQL type, and you do not need to understand it&quot;. It exists so a single unusual column
              does not force you to stop using Prisma for the whole table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Migrations still work.</strong> Prisma can create the column with the correct type, so
                your migration history stays complete.
              </li>
              <li>
                <strong>The field is not readable through the client.</strong> It is excluded from{' '}
                <code>findMany</code> results, so reading it means raw SQL.
              </li>
              <li>
                <strong>It must be optional or have a database default.</strong> Otherwise Prisma cannot generate
                a valid <code>create</code>, because it has no way to supply a value. This is the rule people hit
                first.
              </li>
              <li>
                <strong>Introspection adds it automatically.</strong> Running <code>prisma db pull</code> on a
                database with a <code>tsvector</code> or <code>vector</code> column produces{' '}
                <code>Unsupported</code> fields for them.
              </li>
              <li>
                <strong>Write to it with raw SQL</strong>, or better, let the database maintain it with a
                generated column or trigger so nothing in application code has to.
              </li>
              <li>
                Add an index on it with <code>@@index</code> only for simple cases. GIN, GiST, and HNSW indexes
                belong in a raw migration.
              </li>
            </ul>
            <CodeBlock
              title="Typical Unsupported columns"
              language="prisma"
              code={`model Document {
  id      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content String

  // Optional: Prisma has no value to supply on create
  embedding Unsupported("vector(1536)")?

  // Maintained by the database, so the client never writes it
  document  Unsupported("tsvector")?

  @@map("documents")
}

model Shop {
  id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name String

  // Not optional, but it has a database default, which is also allowed
  loc Unsupported("geography(Point, 4326)") @default(dbgenerated("ST_MakePoint(0,0)::geography"))

  @@map("shops")
}`}
            />
            <CodeBlock
              title="Create with Prisma, populate the odd column with raw SQL"
              language="typescript"
              code={`// 1. Normal create for the modelled fields
const doc = await prisma.document.create({
  data: { content },
  select: { id: true },
});

// 2. Raw update for the Unsupported column
await prisma.$executeRawUnsafe(
  'UPDATE documents SET embedding = $1::vector WHERE id = $2::uuid',
  '[' + embedding.join(',') + ']',
  doc.id
);

// 3. Reading it back also needs raw SQL
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, content FROM documents ORDER BY embedding <=> $1::vector LIMIT 5',
  '[' + embedding.join(',') + ']'
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you run extension SQL inside a Prisma migration file?"
          >
            <p>
              A Prisma migration is just a <code>migration.sql</code> file that Prisma applies in order. So you
              can put any SQL in it, including <code>CREATE EXTENSION</code>, triggers, partitioned tables, and
              policies. The important part is <em>how</em> you produce that file, because hand-editing a migration
              Prisma already applied elsewhere causes checksum failures.
            </p>
            <p>The safe workflow:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Generate an empty migration with{' '}
                <code>prisma migrate dev --create-only</code>, which writes the file but does not apply it.
              </li>
              <li>
                Edit that new file and add your SQL.
              </li>
              <li>
                Apply it with <code>prisma migrate dev</code> locally, and{' '}
                <code>prisma migrate deploy</code> in CI and production.
              </li>
              <li>
                Never edit a migration that has already been applied anywhere. Write a new one instead.
              </li>
            </ul>
            <p>Practical rules that come up as follow-up questions:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Make it idempotent.</strong> Use <code>IF NOT EXISTS</code> and{' '}
                <code>CREATE OR REPLACE</code> so a retried deploy is harmless.
              </li>
              <li>
                <strong>Extensions first.</strong> Put <code>CREATE EXTENSION</code> in the earliest migration, so
                a fresh database in CI bootstraps itself and nobody relies on manual setup.
              </li>
              <li>
                <strong>Privileges.</strong> The migration role needs rights to create extensions; the runtime
                role must not have them. That means two different connection strings.
              </li>
              <li>
                <strong>CONCURRENTLY does not fit.</strong> Prisma wraps a migration in a transaction, and{' '}
                <code>CREATE INDEX CONCURRENTLY</code> cannot run inside one. Put such an index in its own
                migration file containing nothing else, or apply it outside Prisma during a controlled rollout.
              </li>
              <li>
                <strong>Keep the schema file honest.</strong> After adding columns or tables in raw SQL, reflect
                them in <code>schema.prisma</code> so <code>prisma migrate dev</code> does not try to
                &quot;fix&quot; the drift on the next run.
              </li>
            </ul>
            <CodeBlock
              title="Creating the migration"
              language="typescript"
              code={`// 1. Create an empty migration without applying it
//    npx prisma migrate dev --name add_search --create-only
//
// 2. Edit prisma/migrations/<timestamp>_add_search/migration.sql
//
// 3. Apply
//    npx prisma migrate dev          // local
//    npx prisma migrate deploy       // CI and production
//
// 4. Verify a fresh database bootstraps from zero
//    npx prisma migrate reset --force`}
            />
            <CodeBlock
              title="migration.sql with extensions and advanced DDL"
              language="sql"
              code={`-- prisma/migrations/20260101000000_add_search/migration.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Generated tsvector column Prisma cannot declare
ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "document" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("body", '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS "articles_document_idx"
  ON "articles" USING GIN ("document");

CREATE INDEX IF NOT EXISTS "articles_title_trgm_idx"
  ON "articles" USING GIN ("title" gin_trgm_ops);

-- Row level security, also outside Prisma's schema language
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_tenant_isolation" ON "articles";
CREATE POLICY "articles_tenant_isolation" ON "articles"
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid);`}
            />
            <CodeBlock
              title="An index built CONCURRENTLY needs its own migration"
              language="sql"
              code={`-- prisma/migrations/20260102000000_concurrent_index/migration.sql
-- This file must contain nothing else, because CONCURRENTLY cannot run
-- inside the transaction Prisma would otherwise wrap around several statements.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_status_idx" ON "orders" ("status");`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you keep raw SQL testable?">
            <p>
              This is the honest cost of the escape hatch: raw SQL strings are not type checked, so a renamed
              column compiles fine and fails in production. The answer is to treat raw SQL like any other code
              that needs tests.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Put every raw query in one place.</strong> A <code>lib/queries/</code> module of small
                exported functions, not SQL scattered through route handlers. Now there is a single list of
                everything that could break when the schema changes.
              </li>
              <li>
                <strong>Give each one a typed signature.</strong> Declare the parameter and result types on the
                function, so callers are type safe even though the SQL itself is not. Prisma&apos;s{' '}
                <code>$queryRaw</code> accepts a generic for the row type.
              </li>
              <li>
                <strong>Test against a real PostgreSQL.</strong> Not a mock, and not SQLite. These queries use
                extensions, GIN indexes, and vector operators, so only the real engine proves anything. A Docker
                container or Testcontainers instance is the standard approach.
              </li>
              <li>
                <strong>Build the test database from migrations.</strong> Run{' '}
                <code>prisma migrate deploy</code> against the empty test database. That way the tests also
                verify that your migrations, extensions included, work from scratch.
              </li>
              <li>
                <strong>Isolate with transactions.</strong> Run each test inside a transaction and roll it back,
                so tests are independent and fast without truncating tables.
              </li>
              <li>
                <strong>Assert on plans, not just results.</strong> For a query that exists specifically to use an
                index, run <code>EXPLAIN</code> in the test and assert the index appears. That catches the day
                someone drops the index.
              </li>
              <li>
                <strong>Test the edge cases raw SQL gets wrong</strong>: empty input, NULLs, quotes and unicode in
                search terms, and very large parameter lists.
              </li>
            </ul>
            <CodeBlock
              title="Raw queries centralised behind typed functions"
              language="typescript"
              code={`// lib/queries/search.ts
import { prisma } from '../db';

export type SearchHit = { id: string; title: string; rank: number };

const SEARCH_SQL = [
  'SELECT a.id, a.title, ts_rank_cd(a.document, q.tsq) AS rank',
  "FROM articles a, websearch_to_tsquery('english', $1) AS q(tsq)",
  'WHERE a.document @@ q.tsq',
  'ORDER BY rank DESC',
  'LIMIT $2',
].join(' ');

export async function searchArticles(term: string, limit = 20): Promise<SearchHit[]> {
  if (!term.trim()) return [];
  return prisma.$queryRawUnsafe<SearchHit[]>(SEARCH_SQL, term, limit);
}

// Exported for the plan assertion test
export const SEARCH_SQL_FOR_TEST = SEARCH_SQL;`}
            />
            <CodeBlock
              title="Integration test against real PostgreSQL"
              language="typescript"
              code={`// tests/search.test.ts
import { prisma } from '../lib/db';
import { searchArticles, SEARCH_SQL_FOR_TEST } from '../lib/queries/search';

// Test database is created by: prisma migrate deploy
// against DATABASE_URL pointing at the throwaway container.

afterEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE articles');
});

test('finds an article by a stemmed word', async () => {
  await prisma.article.create({
    data: { title: 'Replication basics', body: 'Streaming replicas explained' },
  });

  const hits = await searchArticles('replicating');
  expect(hits.map((h) => h.title)).toContain('Replication basics');
});

test('handles empty and hostile input without throwing', async () => {
  expect(await searchArticles('   ')).toEqual([]);
  expect(await searchArticles('"unclosed quote AND -')).toEqual([]);
  expect(await searchArticles("o'brien & ; --")).toEqual([]);
});

test('still uses the GIN index', async () => {
  const plan = await prisma.$queryRawUnsafe(
    'EXPLAIN (FORMAT JSON) ' + SEARCH_SQL_FOR_TEST,
    'replication',
    20
  );
  expect(JSON.stringify(plan)).toContain('articles_document_idx');
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Put it together: advanced PostgreSQL features in a Prisma app architecture"
          >
            <p>
              Answer this as a set of deliberate boundaries. What lives in the ORM, what lives in SQL, and what
              lives outside the request path.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Prisma owns the domain model.</strong> Tables, relations, ordinary indexes, and all normal
                CRUD. This is where type safety earns its keep, so do not undermine it with raw SQL for things
                Prisma does well.
              </li>
              <li>
                <strong>SQL migrations own database capabilities.</strong> Extensions, partitioned tables,
                generated <code>tsvector</code> columns, GIN and HNSW indexes, row level security policies,
                triggers, and functions. All checked into version control alongside the schema.
              </li>
              <li>
                <strong>Raw queries own the operators Prisma lacks.</strong> Full-text search with ranking, vector
                similarity, advisory locks, <code>FOR UPDATE SKIP LOCKED</code> job claiming. Centralised in one
                module, parameterised, and integration tested.
              </li>
              <li>
                <strong>Long-lived workers own anything with a persistent connection.</strong>{' '}
                <code>LISTEN</code> cannot work through transaction-mode pooling or in a serverless function, so
                listeners and queue workers run as real processes. Say this explicitly, because it is the
                architectural constraint candidates most often miss.
              </li>
              <li>
                <strong>Connection strings encode the boundaries.</strong> A pooled URL for request traffic, a
                direct URL for listeners and migrations, and separate roles so the runtime role cannot create
                extensions or bypass row level security.
              </li>
              <li>
                <strong>Operational ownership is part of the design.</strong> Somebody must create next
                month&apos;s partition, refresh the materialised view, drain the outbox, and clean up finished
                jobs. Name the scheduler.
              </li>
            </ul>
            <p>
              The closing judgement, which is what the question is really scoring: an ORM is for modelling your
              domain, not for hiding the database. Use PostgreSQL&apos;s advanced features deliberately, keep them
              in migrations and a thin SQL layer, and keep the rest of the application in Prisma where it is safe
              and readable.
            </p>
            <CodeBlock
              title="Full-text search through the raw layer"
              language="typescript"
              code={`// lib/queries/articles.ts
const FTS_SQL = [
  'SELECT a.id, a.title,',
  '       ts_rank_cd(a.document, q.tsq) AS rank,',
  "       ts_headline('english', a.body, q.tsq, 'MaxWords=30') AS snippet",
  "FROM articles a, websearch_to_tsquery('english', $1) AS q(tsq)",
  'WHERE a.document @@ q.tsq AND a.tenant_id = $2::uuid',
  'ORDER BY rank DESC',
  'LIMIT $3',
].join(' ');

export function searchArticles(term: string, tenantId: string, limit = 20) {
  return prisma.$queryRawUnsafe(FTS_SQL, term, tenantId, limit);
}`}
            />
            <CodeBlock
              title="Vector search and an advisory-locked job in the same layer"
              language="typescript"
              code={`const NEAREST_SQL = [
  'SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity',
  'FROM documents',
  'WHERE tenant_id = $2::uuid AND deleted_at IS NULL',
  'ORDER BY embedding <=> $1::vector',
  'LIMIT $3',
].join(' ');

export function nearestDocuments(embedding: number[], tenantId: string, k = 10) {
  return prisma.$queryRawUnsafe(
    NEAREST_SQL,
    '[' + embedding.join(',') + ']',
    tenantId,
    k
  );
}

// Only one worker per tenant, enforced by PostgreSQL
export function withTenantLock<T>(tenantId: string, work: () => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe(
      'SELECT pg_try_advisory_xact_lock(1, hashtext($1)) AS ok',
      'tenant:' + tenantId
    );
    if (!rows[0].ok) return null;
    return work();
  });
}`}
            />
            <CodeBlock
              title="Roles and URLs that match the boundaries"
              language="sql"
              code={`-- Migration role: may create extensions and change schema
CREATE ROLE app_migrate LOGIN PASSWORD 'secret-1';
GRANT ALL ON DATABASE saas TO app_migrate;

-- Runtime role: reads and writes data only
CREATE ROLE app_runtime LOGIN PASSWORD 'secret-2';
GRANT USAGE ON SCHEMA public, extensions TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;

-- Row level security applies to the runtime role, not the owner
ALTER TABLE articles FORCE ROW LEVEL SECURITY;

-- .env
--   DATABASE_URL=postgresql://app_runtime@pgbouncer:6432/saas   (pooled requests)
--   DIRECT_URL=postgresql://app_runtime@db:5432/saas            (LISTEN, workers)
--   MIGRATE_URL=postgresql://app_migrate@db:5432/saas           (CI only)`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
