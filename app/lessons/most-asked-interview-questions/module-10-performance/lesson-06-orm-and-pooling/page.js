import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: ORM Performance and Pooling - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked Prisma and PostgreSQL performance interview questions: the N+1 problem, select vs include, connection pooling, batching, query logging, and caching read-heavy endpoints.',
};

export default function MaiqPerfLesson06OrmPooling() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: ORM Performance and Pooling</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Many production slowdowns are not caused by SQL at all. They are caused by how the application
          talks to the database: too many small queries, too many columns, or too many open connections.
          This lesson covers the Prisma and pooling questions that come up in almost every Node interview.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the N+1 query problem?">
            <p>
              You fetch a list with 1 query, then query related data once per item, which is N more
              queries. It is common with ORMs when relations load lazily. Fix it by joining, batching, or
              using the Prisma <code>include</code> or <code>select</code> options so relations load in far
              fewer queries.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                50 users in a loop means 51 round trips. Each round trip has network cost even if the query
                itself is fast
              </li>
              <li>
                The symptom is an endpoint that is fine with test data and slow with real data
              </li>
              <li>Spot it by counting queries per request in the logs</li>
            </ul>
            <CodeBlock
              title="Prisma: avoid N+1"
              language="typescript"
              code={`// Bad: findMany users, then find orders per user in a loop
const users = await prisma.user.findMany({ take: 50 });
for (const u of users) {
  u.orders = await prisma.order.findMany({ where: { userId: u.id } });
}

// Better: one query graph
const usersWithOrders = await prisma.user.findMany({
  take: 50,
  include: { orders: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="select vs include in Prisma - what is the performance difference?">
            <p>
              <code>include</code> loads the full related model, every column. <code>select</code> picks only
              the fields you name and can nest selects for relations, so less data travels over the wire and
              the database does less work. Prefer <code>select</code> on hot paths, and never fetch columns
              or relations the response does not use.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You cannot use <code>select</code> and <code>include</code> at the same level. Nest a{' '}
                <code>select</code> inside the relation instead
              </li>
              <li>
                Leaving out a large <code>text</code> or <code>jsonb</code> column is often the single
                biggest win
              </li>
              <li>
                Narrow selects also make covering indexes and index-only scans possible
              </li>
            </ul>
            <CodeBlock
              title="Lean select"
              language="typescript"
              code={`const orders = await prisma.order.findMany({
  where: { status: 'paid' },
  select: {
    id: true,
    totalCents: true,
    user: { select: { email: true } },
  },
  take: 100,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Why is connection pooling important?">
            <p>
              Every PostgreSQL connection is a separate operating system process with its own memory, so
              connections are expensive. An app with many Node or serverless workers can easily exhaust{' '}
              <code>max_connections</code>. A pool keeps a small set of connections open and hands them out,
              so requests reuse them instead of paying the setup cost each time.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use PgBouncer in transaction mode, or a managed pooler, in front of PostgreSQL
              </li>
              <li>
                The rule of thumb: app pool size times number of instances must stay below the database{' '}
                <code>max_connections</code>, leaving room for admin sessions
              </li>
              <li>
                A bigger pool is not faster. Past the point where CPUs and disks are busy, more connections
                only add contention
              </li>
              <li>
                Transaction-mode pooling breaks features that rely on session state, such as prepared
                statements and <code>SET</code> without <code>LOCAL</code>. Prisma needs the{' '}
                <code>pgbouncer=true</code> flag for this reason
              </li>
              <li>
                Migrations need a direct connection, not the pooler, because they use session-level
                operations
              </li>
            </ul>
            <CodeBlock
              title="Prisma datasource note"
              language="typescript"
              code={`// Prefer a pooler URL in production (PgBouncer)
// DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=10"
// Direct URL for migrations:
// DIRECT_URL="postgresql://user:pass@primary:5432/db"

// schema.prisma
// datasource db {
//   provider  = "postgresql"
//   url       = env("DATABASE_URL")
//   directUrl = env("DIRECT_URL")
// }`}
            />
            <CodeBlock
              title="Watch connection usage"
              language="sql"
              code={`SELECT count(*) AS open_connections, current_setting('max_connections') AS max_connections
FROM pg_stat_activity;

SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Idle in transaction is the dangerous one: it holds a connection and blocks vacuum
SELECT pid, age(clock_timestamp(), xact_start) AS age, left(query, 60) AS query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you batch queries instead of sending many small ones?">
            <p>
              Batching means replacing many small round trips with one bigger statement. Each round trip
              costs network time plus query planning, so 500 single-row inserts can be many times slower
              than one insert of 500 rows, even though the work on disk is the same.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Reads: collect the ids and use one <code>WHERE id IN (...)</code> query, then group the
                results in memory
              </li>
              <li>
                Writes: use <code>createMany</code>, <code>updateMany</code>, or one multi-row{' '}
                <code>INSERT</code>
              </li>
              <li>
                Independent queries can go in one <code>$transaction</code> array, which Prisma sends
                together
              </li>
              <li>
                Keep batches bounded, for example 1000 rows at a time, so you do not build one giant
                statement or hold locks too long
              </li>
              <li>
                For very large loads, <code>COPY</code> is far faster than <code>INSERT</code>
              </li>
            </ul>
            <CodeBlock
              title="Batched reads and writes with Prisma"
              language="typescript"
              code={`// One query instead of N
const userIds = orders.map((o) => o.userId);
const users = await prisma.user.findMany({
  where: { id: { in: [...new Set(userIds)] } },
  select: { id: true, email: true },
});
const byId = new Map(users.map((u) => [u.id, u]));

// One insert instead of N
await prisma.auditLog.createMany({
  data: events.map((e) => ({ action: e.action, userId: e.userId })),
  skipDuplicates: true,
});

// Independent queries in one round trip
const [openCount, paidCount] = await prisma.$transaction([
  prisma.order.count({ where: { status: 'pending' } }),
  prisma.order.count({ where: { status: 'paid' } }),
]);`}
            />
            <CodeBlock
              title="Set-based update instead of a loop"
              language="sql"
              code={`-- Instead of one UPDATE per row from the app
UPDATE orders o
SET status = v.status
FROM (VALUES (1, 'paid'), (2, 'shipped'), (3, 'paid')) AS v(id, status)
WHERE o.id = v.id;

-- Bulk load from a file
COPY orders (user_id, total_cents, created_at) FROM '/tmp/orders.csv' CSV HEADER;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you use Prisma query logging to find slow calls?">
            <p>
              Prisma can log every SQL statement it sends, with the duration. This is the fastest way to see
              an N+1 pattern or a query that quietly got slow, because you see the real SQL rather than the
              code you think you wrote.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use the event-based logger so you can filter by duration and only report the slow ones
              </li>
              <li>
                Count queries per request. A list endpoint issuing 40 queries is an N+1 you can fix today
              </li>
              <li>
                Never log parameter values in production, because they may contain personal data
              </li>
              <li>
                Pair it with <code>pg_stat_statements</code> on the database side to see the total cost
                across all callers
              </li>
            </ul>
            <CodeBlock
              title="Log slow Prisma queries only"
              language="typescript"
              code={`import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

const SLOW_MS = 100;

prisma.$on('query', (e) => {
  if (e.duration >= SLOW_MS) {
    // Log the SQL and duration, not the params
    console.warn('[slow sql]', e.duration + 'ms', e.query);
  }
});`}
            />
            <CodeBlock
              title="Count queries per request with middleware"
              language="typescript"
              code={`prisma.$use(async (params, next) => {
  const started = Date.now();
  const result = await next(params);
  const ms = Date.now() - started;
  if (ms > 100) {
    console.warn('[slow op]', params.model + '.' + params.action, ms + 'ms');
  }
  return result;
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you diagnose and fix ORM or Prisma performance issues beyond N+1?">
            <p>
              Enable query logging; watch for over-fetching with <code>include</code>; switch to{' '}
              <code>select</code>; add composite indexes that match <code>where</code> plus{' '}
              <code>orderBy</code>; prefer <code>updateMany</code> or raw SQL for bulk work; avoid
              interactive transactions that hold a connection too long; use <code>$transaction</code> with a
              stricter isolation level only when you actually need it; and move from offset to cursor
              pagination.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Deeply nested <code>include</code> trees can explode into many queries plus a large
                in-memory join. Flatten them or split the endpoint
              </li>
              <li>
                <code>count()</code> on a huge table for every page load is a classic hidden cost. Cache it
                or show an approximate count
              </li>
              <li>
                Long interactive transactions starve the pool and block vacuum. Keep them short and never
                await external HTTP inside one
              </li>
              <li>
                Some aggregate and window queries are simply better as raw SQL. Use a parameterized raw call
                instead of fighting the query builder
              </li>
            </ul>
            <CodeBlock
              title="Composite index matching query"
              language="sql"
              code={`-- Prisma: where status + orderBy createdAt
CREATE INDEX orders_status_created_idx
ON orders (status, created_at DESC);`}
            />
            <CodeBlock
              title="Prisma cursor pagination"
              language="typescript"
              code={`const page = await prisma.order.findMany({
  where: { status: 'paid' },
  orderBy: { id: 'asc' },
  take: 50,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
});`}
            />
            <CodeBlock
              title="Raw SQL when the aggregate is the point"
              language="typescript"
              code={`// Parameterized raw query: placeholders, never string concatenation
const rows = await prisma.$queryRawUnsafe(
  'SELECT date_trunc($1, created_at) AS bucket, count(*) AS n ' +
    'FROM orders WHERE created_at >= $2 GROUP BY 1 ORDER BY 1',
  'day',
  since
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you cache read-heavy endpoints without serving stale data?">
            <p>
              Caching is the right answer when the same expensive result is requested again and again and a
              few seconds of staleness is acceptable. The hard part is not storing the value, it is deciding
              when to throw it away.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Layer 1, the database:</strong> a materialized view for a heavy report, refreshed on
                a schedule with <code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code>
              </li>
              <li>
                <strong>Layer 2, a cache store:</strong> Redis with a short time to live for list and detail
                endpoints
              </li>
              <li>
                <strong>Layer 3, HTTP and the framework:</strong> Next.js route revalidation and cache tags,
                or a CDN, for fully public data
              </li>
              <li>
                Prefer a short time to live plus explicit invalidation on write. Pure event-based
                invalidation is easy to get wrong
              </li>
              <li>
                Include the tenant id and the user role in the cache key, or you will leak one tenant&apos;s
                data to another
              </li>
              <li>
                Guard against a stampede: when a hot key expires, let one request rebuild it while others
                serve the old value
              </li>
              <li>
                Never cache a query you have not tried to fix first. Caching a missing index just hides it
              </li>
            </ul>
            <CodeBlock
              title="Materialized view for a heavy report"
              language="sql"
              code={`CREATE MATERIALIZED VIEW daily_revenue AS
SELECT date_trunc('day', created_at) AS day, sum(total_cents) AS cents
FROM orders
WHERE status = 'paid'
GROUP BY 1;

-- CONCURRENTLY needs a unique index and does not block readers
CREATE UNIQUE INDEX daily_revenue_day_uq ON daily_revenue (day);
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;`}
            />
            <CodeBlock
              title="Cache with a short TTL and tenant-scoped key"
              language="typescript"
              code={`const TTL_SECONDS = 30;

async function getTopProducts(tenantId: string) {
  const key = 'top-products:v1:' + tenantId;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const rows = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { salesCount: 'desc' },
    select: { id: true, name: true, salesCount: true },
    take: 10,
  });

  await redis.set(key, JSON.stringify(rows), 'EX', TTL_SECONDS);
  return rows;
}

// Drop the key when the underlying data changes
async function onProductSold(tenantId: string) {
  await redis.del('top-products:v1:' + tenantId);
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
