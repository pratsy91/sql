import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 18: Best Practices & Patterns - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL and Prisma best-practice interview questions: naming, indexing, CI migrations, pagination, denormalization, schema smells, multi-file Prisma schemas — Junior to Senior.',
};

export default function Module18BestPractices() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 18: Best Practices & Patterns</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 18 — Junior → Senior. Naming, indexing, migrations in
          CI/CD, pagination, idempotent changes, schema smells, denormalization, and Prisma schema
          organization.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What naming conventions should you use for PostgreSQL and Prisma?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                SQL: <code>snake_case</code> tables/columns (<code>order_items.created_at</code>)
              </li>
              <li>
                Prisma models: <code>PascalCase</code> models, <code>camelCase</code> fields; map to DB names
                with <code>@map</code> / <code>@@map</code>
              </li>
              <li>
                Indexes/constraints: readable names — <code>orders_user_id_idx</code>,{' '}
                <code>users_email_key</code>
              </li>
              <li>Avoid reserved words as identifiers; be consistent across the codebase</li>
            </ul>
            <CodeBlock
              title="Prisma @map for snake_case DB"
              language="typescript"
              code={`model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("order_items")
  @@index([orderId], map: "order_items_order_id_idx")
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Why is SELECT * considered a bad practice?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Pulls unused columns (TOAST/large text/JSONB) — wasted I/O and memory</li>
              <li>Breaks clients when columns are added/renamed; unclear contract</li>
              <li>Prevents covering-index optimizations (“index only scans” need exact columns)</li>
            </ul>
            <CodeBlock
              title="Prefer explicit columns / Prisma select"
              language="sql"
              code={`-- ❌
SELECT * FROM users;

-- ✅
SELECT id, email, created_at FROM users WHERE id = $1;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, createdAt: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is a sensible baseline indexing strategy?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Index primary keys (automatic) and foreign keys used in JOINs / filters</li>
              <li>Index columns in frequent <code>WHERE</code> / <code>ORDER BY</code> / unique lookups</li>
              <li>Prefer composite indexes matching left-prefix query patterns</li>
              <li>Do not index every column — write overhead + bigger WAL + slower upserts</li>
            </ul>
            <CodeBlock
              title="Common indexes"
              language="sql"
              code={`CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

-- Composite: filter by user then sort by created_at
CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Offset vs cursor pagination — which should you use?"
          >
            <p>
              <strong>Offset</strong> (<code>LIMIT/OFFSET</code> or Prisma <code>skip/take</code>) is simple
              but gets slower on deep pages and can skip/duplicate rows under concurrent inserts.{' '}
              <strong>Cursor / keyset</strong> pagination uses a stable sort key (<code>WHERE (created_at, id) &lt;
              (...)</code>) and scales better.
            </p>
            <CodeBlock
              title="Cursor pagination SQL"
              language="sql"
              code={`SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < ($1, $2)  -- last seen cursor
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="Prisma cursor"
              language="typescript"
              code={`const page = await prisma.post.findMany({
  take: 20,
  skip: 1, // skip the cursor row itself when using cursor
  cursor: { id: lastId },
  orderBy: { id: 'desc' },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="How should database migrations run in CI/CD?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Generate migrations in development (<code>prisma migrate dev</code> / reviewed SQL files)
              </li>
              <li>
                Apply in deploy pipeline with <code>prisma migrate deploy</code> (or Flyway/Liquibase
                equivalents) against production credentials
              </li>
              <li>Fail the deploy if migrations fail; do not serve new app code against old schema if incompatible</li>
              <li>
                Expand/contract for zero-downtime: add nullable column → deploy code → backfill → add
                NOT NULL / drop old
              </li>
              <li>
                Use <code>DIRECT_URL</code> for migrate when app traffic uses a pooler
              </li>
            </ul>
            <CodeBlock
              title="Pipeline sketch"
              language="bash"
              code={`# build
npm ci
npx prisma generate

# migrate job (before or as first step of release)
npx prisma migrate deploy

# then roll out app pods/functions`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What makes a migration idempotent or safe to re-run?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prefer declarative tools that track applied versions (Prisma migration history table)
              </li>
              <li>
                In raw SQL: <code>IF NOT EXISTS</code>, <code>ADD COLUMN IF NOT EXISTS</code>, guarded{' '}
                <code>DO $$ ... $$</code> blocks
              </li>
              <li>
                Avoid destructive one-shots without backups; split data backfills from schema locks
              </li>
              <li>
                Never edit already-applied migration files on shared environments — add a new migration
              </li>
            </ul>
            <CodeBlock
              title="Guarded DDL examples"
              language="sql"
              code={`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX CONCURRENTLY IF NOT EXISTS users_email_idx ON users (email);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending', 'paid', 'cancelled'));
  END IF;
END $$;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What schema design smells do interviewers expect you to name?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Missing foreign keys / “application-enforced” relations that drift</li>
              <li>
                God tables with dozens of unrelated nullable columns (entity–attribute–value smell)
              </li>
              <li>Using CSV strings or untyped JSON where relational structure is needed</li>
              <li>Polymorphic FKs without constraints (<code>parent_type</code> + <code>parent_id</code>)</li>
              <li>Indexes that do not match query patterns; unused duplicate indexes</li>
              <li>Mutable natural primary keys (email as PK) instead of stable surrogate keys</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="When is denormalization acceptable?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Read-heavy paths where joins dominate latency (e.g. cached <code>like_count</code>)</li>
              <li>Reporting/analytics tables fed by ETL from normalized OLTP</li>
              <li>Materialized views for expensive aggregates</li>
              <li>
                Always document the source of truth and update strategy (trigger, app write, async job)
              </li>
            </ul>
            <CodeBlock
              title="Denormalized counter with transactional update"
              language="typescript"
              code={`await prisma.$transaction([
  prisma.like.create({ data: { postId, userId } }),
  prisma.post.update({
    where: { id: postId },
    data: { likeCount: { increment: 1 } },
  }),
]);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you organize a large Prisma schema (multi-file)?"
          >
            <p>
              Prisma 5.15+ supports <strong>multi-file schemas</strong>: put several <code>.prisma</code>{' '}
              files in a directory (e.g. <code>prisma/schema/</code>) instead of one giant{' '}
              <code>schema.prisma</code>. Generators/datasource typically live in one file; models are split by
              domain.
            </p>
            <CodeBlock
              title="Multi-file layout"
              language="bash"
              code={`prisma/
  schema/
    base.prisma      # generator + datasource
    user.prisma      # User, Profile, Session
    billing.prisma   # Customer, Invoice
    catalog.prisma   # Product, Sku
  migrations/`}
            />
            <CodeBlock
              title="package / config pointer"
              language="typescript"
              code={`// package.json or prisma config — point schema to the folder
// "prisma": { "schema": "prisma/schema" }

// Relations still work across files as long as model names match
// Run: npx prisma format / migrate / generate against the directory`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you evolve a hot table with minimal locking (zero-downtime patterns)?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prefer <code>CREATE INDEX CONCURRENTLY</code> (and Prisma multi-step migrations when needed)
              </li>
              <li>
                Add columns as nullable first; backfill in batches; then constrain
              </li>
              <li>
                Avoid long transactions that hold AccessExclusive locks during peak traffic
              </li>
              <li>
                Large rewrites: shadow table + dual write / backfill + rename swap (with care)
              </li>
              <li>
                Watch <code>pg_stat_progress_create_index</code> / vacuum progress during maintenance windows
              </li>
            </ul>
            <CodeBlock
              title="Concurrent index"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY orders_user_created_idx
ON orders (user_id, created_at DESC);

-- Note: CONCURRENTLY cannot run inside a transaction block`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="What application patterns keep Prisma codebases maintainable at scale?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Repository / data-access layer — avoid scattering Client calls in UI components</li>
              <li>
                Explicit DTOs via <code>select</code>; do not return full Prisma entities from APIs
              </li>
              <li>
                Tenant + soft-delete enforcement in Client Extensions, not ad-hoc filters
              </li>
              <li>
                Transaction boundaries at use-case level; keep them short
              </li>
              <li>
                TypedSQL / raw SQL for the 5% of queries that need it; measure before optimizing everything
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you prevent dangerous migrations from reaching production?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>PR review of generated SQL in <code>prisma/migrations/**/migration.sql</code></li>
              <li>
                CI job: <code>prisma migrate diff</code> / schema validate; fail on unexpected drift
              </li>
              <li>
                Policy: ban <code>db push</code> outside local scratch DBs; ban dropping columns without
                expand/contract plan
              </li>
              <li>
                Staging apply with production-like data volume; measure lock time
              </li>
              <li>
                Feature flags for code paths that depend on new columns
              </li>
            </ul>
            <CodeBlock
              title="Validate schema in CI"
              language="bash"
              code={`npx prisma validate
npx prisma generate
# Optional: ensure migrations match schema
npx prisma migrate diff \\
  --from-migrations prisma/migrations \\
  --to-schema-datamodel prisma/schema.prisma \\
  --exit-code`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Describe a pragmatic indexing review process after a production incident."
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Pull top digests from <code>pg_stat_statements</code> for the incident window
              </li>
              <li>
                <code>EXPLAIN (ANALYZE, BUFFERS)</code> — look for Seq Scan on large tables, high shared
                reads
              </li>
              <li>
                Propose minimal composite index matching filter + sort; validate write impact
              </li>
              <li>
                Deploy with <code>CONCURRENTLY</code>; watch p95 and connection pool during rollout
              </li>
              <li>
                Revisit after 1–2 weeks: index scans vs size; drop unused experiments
              </li>
            </ul>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
