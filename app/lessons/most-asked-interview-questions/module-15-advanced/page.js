import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 15: Advanced Features - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL advanced-feature interview questions: FDW, partitioning, JSONB indexes, full-text search, LISTEN/NOTIFY, advisory locks, generated columns, and Prisma escape hatches.',
};

export default function Module15() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 15: Advanced Features</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 15 — Junior → Senior. Covers FDW, declarative
          partitioning, advanced JSONB indexing, full-text search, LISTEN/NOTIFY, advisory locks,
          generated columns, and Prisma limitations with <code>$queryRaw</code> (PostgreSQL 15/16/17).
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            Junior Level
          </h2>

          <InterviewQACard level="Junior" question="What is a Foreign Data Wrapper (FDW)?">
            <p>
              FDW lets PostgreSQL query external data sources as if they were local tables (other Postgres
              DBs via <code>postgres_fdw</code>, files, etc.). You create an extension, server, user
              mapping, and foreign tables. Useful for federation—not a substitute for proper ETL when
              latency/consistency matter.
            </p>
            <CodeBlock
              title="postgres_fdw sketch"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS postgres_fdw;
CREATE SERVER remote_shop
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'remote', dbname 'shop');
CREATE USER MAPPING FOR CURRENT_USER
  SERVER remote_shop OPTIONS (user 'reader', password '...');
IMPORT FOREIGN SCHEMA public LIMIT TO (orders)
  FROM SERVER remote_shop INTO remote;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is table partitioning and why use it?">
            <p>
              Partitioning splits one logical table into child segments (by date, tenant, hash, etc.) so
              queries can prune irrelevant chunks, and maintenance (VACUUM, detach/drop old data) becomes
              easier. Best for large time-series or multi-tenant facts—not for small tables.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What are generated columns?">
            <p>
              A generated column is computed from other columns. In PostgreSQL 15/16/17, generated columns
              are <strong>STORED</strong> (persisted on write). Useful for derived fields you want indexed
              without application duplication.
            </p>
            <CodeBlock
              title="STORED generated column"
              language="sql"
              code={`CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_cents INT NOT NULL,
  tax_cents INT NOT NULL,
  total_cents INT GENERATED ALWAYS AS (price_cents + tax_cents) STORED
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What are LISTEN and NOTIFY?">
            <p>
              PostgreSQL’s lightweight pub/sub: a session <code>LISTEN</code>s on a channel; others{' '}
              <code>NOTIFY</code> with an optional payload. Delivered at transaction commit. Great for
              cache invalidation or waking workers—not for reliable multi-consumer job queues (use a table
              or broker for that).
            </p>
            <CodeBlock
              title="LISTEN / NOTIFY"
              language="sql"
              code={`LISTEN order_events;
NOTIFY order_events, 'order_id=123';
-- Payload max ~8KB; no persistence if no listener`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is full-text search in PostgreSQL at a high level?">
            <p>
              Convert documents to <code>tsvector</code>, queries to <code>tsquery</code>, rank with{' '}
              <code>ts_rank</code>, and index with <strong>GIN</strong>. Built-in FTS handles stemming and
              ranking for many apps without Elasticsearch—though ES still wins for some heavy search UX.
            </p>
            <CodeBlock
              title="Basic FTS"
              language="sql"
              code={`SELECT title
FROM articles
WHERE to_tsvector('english', body) @@ plainto_tsquery('english', 'postgres indexing');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">
            Mid Level
          </h2>

          <InterviewQACard level="Mid" question="Explain RANGE, LIST, and HASH partitioning.">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>RANGE</strong>: continuous ranges (dates, IDs)—most common for time-series
              </li>
              <li>
                <strong>LIST</strong>: discrete values (region, tenant tier)
              </li>
              <li>
                <strong>HASH</strong>: even spread by hash of key—good for write distribution without
                natural ranges
              </li>
            </ul>
            <CodeBlock
              title="RANGE partitioning example"
              language="sql"
              code={`CREATE TABLE events (
  id BIGSERIAL,
  created_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_09 PARTITION OF events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you index JSONB effectively?">
            <p>
              Use GIN for containment (<code>@&gt;</code>) queries. <code>jsonb_path_ops</code> is smaller/
              faster for containment-only workloads; default GIN ops support more operators. For specific
              hot keys, expression B-tree indexes beat GIN.
            </p>
            <CodeBlock
              title="JSONB indexes"
              language="sql"
              code={`-- Containment searches
CREATE INDEX idx_orders_data_gin ON orders USING GIN (data);
CREATE INDEX idx_orders_data_path ON orders USING GIN (data jsonb_path_ops);

-- Hot key
CREATE INDEX idx_orders_customer
  ON orders ((data->>'customer_id'));

SELECT * FROM orders WHERE data @> '{"status":"paid"}';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you set up production-grade full-text search with tsvector + GIN?">
            <p>
              Store a generated/stored <code>tsvector</code> column (or maintain via trigger), GIN-index it,
              and query with <code>@@</code>. Weight fields (title vs body) for better ranking.
            </p>
            <CodeBlock
              title="Stored tsvector + GIN"
              language="sql"
              code={`ALTER TABLE articles
  ADD COLUMN document tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;

CREATE INDEX articles_document_idx ON articles USING GIN (document);

SELECT title, ts_rank(document, q) AS rank
FROM articles, plainto_tsquery('english', 'replication lag') q
WHERE document @@ q
ORDER BY rank DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are advisory locks?">
            <p>
              Session- or transaction-level locks identified by bigint keys—app-defined concurrency
              control (e.g., “only one worker migrates tenant X”). They do not lock table rows; you must
              agree on key encoding. Prefer transaction-scoped locks to avoid leaks.
            </p>
            <CodeBlock
              title="Advisory locks"
              language="sql"
              code={`SELECT pg_advisory_xact_lock(42);           -- held until COMMIT/ROLLBACK
SELECT pg_try_advisory_xact_lock(hashtext('tenant:abc'));`}
            />
            <CodeBlock
              title="Prisma usage"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const locked = await tx.$queryRaw\`
    SELECT pg_try_advisory_xact_lock(hashtext(\${lockKey})) AS ok
  \`;
  if (!locked[0].ok) throw new Error('busy');
  // critical section
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What advanced PostgreSQL features does Prisma not model well—and what is the escape hatch?">
            <p>
              Prisma schema does not fully express partitioning, RLS policies, FDW, LISTEN/NOTIFY,
              advisory locks, custom operators, or many extension types. Use SQL migrations for DDL and{' '}
              <code>$queryRaw</code> / <code>$executeRaw</code> (parameterized) for runtime features.
              Map exotic types with <code>Unsupported("...")</code> when needed.
            </p>
            <CodeBlock
              title="Unsupported + raw escape hatch"
              language="prisma"
              code={`model Article {
  id       String                       @id @default(cuid())
  title    String
  document Unsupported("tsvector")?
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Partition pruning—what should candidates know?">
            <p>
              The planner skips partitions that cannot match the WHERE clause when constraints are simple
              and immutable (e.g., <code>created_at &gt;= ...</code>). Avoid wrapping partition keys in
              functions that hide ranges. Verify with <code>EXPLAIN</code> that only expected partitions
              are scanned.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-400">
            Senior Level
          </h2>

          <InterviewQACard level="Senior" question="How do you manage partitions over time in PostgreSQL 15–17?">
            <p>
              Create future partitions ahead of time (or use cron/pg_partman), detach/drop old partitions
              for cheap retention, and optionally attach archived partitions read-only. PG 10+ declarative
              partitioning; newer versions improved UNIQUE/FK behavior but composite keys including the
              partition key are still a design constraint. Automate creation before the window arrives to
              avoid insert failures.
            </p>
            <CodeBlock
              title="Detach old data"
              language="sql"
              code={`ALTER TABLE events DETACH PARTITION events_2025_01;
-- Archive / dump events_2025_01, then DROP TABLE when retention expires`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Advanced JSONB: containment, paths, and expression indexes in practice">
            <p>
              Prefer narrow expression indexes for known access paths; use GIN for flexible ad-hoc
              containment. <code>jsonb_path_query</code> / SQL/JSON path (PG 12+) helps complex extraction.
              Avoid unbounded JSON growth without constraints; validate shape in app or with CHECK/
              triggers. For Prisma, store as <code>Json</code> and push heavy operators to{' '}
              <code>$queryRaw</code>.
            </p>
            <CodeBlock
              title="Path + expression index"
              language="sql"
              code={`CREATE INDEX idx_evt_type ON events ((payload #>> '{meta,type}'));
SELECT * FROM events
WHERE payload @@ '$.items[*].sku == "ABC"';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="FDW performance and consistency considerations">
            <p>
              Remote scans can pull large row sets if predicates are not pushed down; joins between local
              and foreign tables may ship data inefficiently. Transactions spanning local + foreign tables
              are not full distributed ACID in the general case. Use FDW for operational convenience and
              light federation; use replication/ETL for analytics scale.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="When do you choose LISTEN/NOTIFY vs a queue table vs Kafka?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>LISTEN/NOTIFY</strong>: same-cluster, low-volume signals, cache busting, wakeups
              </li>
              <li>
                <strong>Queue table + SKIP LOCKED</strong>: reliable jobs, retry, visibility inside PG
              </li>
              <li>
                <strong>Kafka/SQS</strong>: cross-service fan-out, retention, very high throughput
              </li>
            </ul>
            <p>Saying “NOTIFY is a message bus” is a red flag without caveats about persistence and payload size.</p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Put it together: advanced PG features in a Prisma app architecture">
            <p>
              Use Prisma for CRUD models and migrations; put partitioning, FTS columns/indexes, RLS, and
              extensions in SQL migration files; use parameterized <code>$queryRaw</code> for FTS,
              advisory locks, and vector search; keep LISTEN clients outside the serverless request path
              when connections are ephemeral; document that some features need a long-lived worker. Strong
              interview answers show judgment about what belongs in ORM vs SQL.
            </p>
            <CodeBlock
              title="FTS via Prisma raw"
              language="typescript"
              code={`const q = 'streaming replication';
const hits = await prisma.$queryRaw\`
  SELECT id, title, ts_rank(document, plainto_tsquery('english', \${q})) AS rank
  FROM articles
  WHERE document @@ plainto_tsquery('english', \${q})
  ORDER BY rank DESC
  LIMIT 20
\`;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
