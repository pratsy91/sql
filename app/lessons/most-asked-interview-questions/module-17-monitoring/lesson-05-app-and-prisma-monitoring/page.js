import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Application and Prisma Monitoring - Module 17 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on monitoring a Node and Prisma application against PostgreSQL: connection limits, health checks, pool error codes, tracing a slow request to SQL, diagnosing pool exhaustion, alerts that matter, and a production checklist',
};

export default function MaiqM17L05AppAndPrismaMonitoring() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Application and Prisma Monitoring</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Monitoring from the application side: connections, health checks, Prisma error codes, and how you
          follow one slow API request all the way down to the SQL that caused it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are connection limits, and why do they matter?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>max_connections</code> caps how many backends the server allows, often 100 by default.
                Each connection is a separate process with its own memory
              </li>
              <li>
                Hitting the limit gives you the fatal error saying remaining connection slots are reserved, or
                simply too many clients already. New requests fail, including your admin session
              </li>
              <li>
                A few slots are held back by <code>superuser_reserved_connections</code> so an administrator
                can still get in when the application has used everything else
              </li>
              <li>
                Prefer a pooler such as PgBouncer over raising <code>max_connections</code> blindly. Hundreds
                of mostly idle connections cost memory and make the server slower, not faster
              </li>
              <li>
                The arithmetic to remember: application instances multiplied by pool size per instance must
                stay comfortably below the limit, with headroom for migrations and monitoring
              </li>
            </ul>
            <CodeBlock
              title="Inspect connections"
              language="sql"
              code={`SHOW max_connections;

SELECT count(*) AS total,
       count(*) FILTER (WHERE state = 'active') AS active,
       count(*) FILTER (WHERE state = 'idle') AS idle
FROM pg_stat_activity;

SELECT usename, application_name, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does a database health check for an application look like?">
            <p>
              A health check proves the application can reach PostgreSQL using one cheap, safe query. Load
              balancers, Kubernetes probes, and uptime monitors all call it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Keep it fast, well under a hundred milliseconds, and never run analytics or count a big table
                inside it
              </li>
              <li>
                Separate liveness from readiness. Liveness asks is the process alive, and should not touch the
                database, or a brief database blip restarts every container. Readiness asks can this instance
                serve traffic, and that one does check the database
              </li>
              <li>
                Give it its own short timeout. A health check that hangs for thirty seconds is worse than one
                that fails fast
              </li>
              <li>
                Health checks run constantly, so use the shared client. Opening a new connection per check is
                its own outage waiting to happen
              </li>
            </ul>
            <CodeBlock
              title="SQL health check"
              language="sql"
              code={`SELECT 1;
SELECT now(), current_database(), current_user;`}
            />
            <CodeBlock
              title="Prisma and Next.js style"
              language="typescript"
              code={`import { prisma } from '@/lib/prisma';

export async function checkDb() {
  await prisma.$queryRawUnsafe('SELECT 1');
  return { ok: true };
}

// app/api/health/route.ts
export async function GET() {
  const started = Date.now();
  try {
    await checkDb();
    return Response.json({ ok: true, dbMs: Date.now() - started });
  } catch (e) {
    return Response.json({ ok: false }, { status: 503 });
  }
}

// Keep it under about 100ms and never run heavy analytics here`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Which Prisma error codes signal connection pool problems?">
            <p>
              Three codes point at capacity rather than at your query. When you see these, the SQL is
              innocent and the problem is connections.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>P2024</strong> — timed out fetching a new connection from the pool. This is the
                headline pool error. Either every connection is busy, or something is holding connections and
                not giving them back
              </li>
              <li>
                <strong>P1001</strong> — cannot reach the database server. Under load this often means the
                database refused the connection because it is at <code>max_connections</code>, not that the
                network is down
              </li>
              <li>
                <strong>P1002</strong> — the server was reached but the connection timed out. Usually an
                overloaded database or a pooler queue
              </li>
              <li>
                <strong>P1008</strong> — operations timed out. It shows up alongside pool pressure because
                queries queue behind contention
              </li>
              <li>
                <strong>P2028 and transaction timeouts</strong> — an interactive transaction could not get a
                connection within <code>maxWait</code>, or exceeded its <code>timeout</code>. Long
                transactions are a very common root cause of P2024 for everyone else
              </li>
              <li>
                How to tell apart the two shapes of P2024: if the database connection count is at its ceiling,
                you are oversubscribed and need a pooler or a lower per instance limit. If the count is low
                but your pool is exhausted, something in the application is holding connections, which usually
                means long transactions or missing awaits
              </li>
              <li>
                The message itself is useful. It names the current pool size and the timeout, which tells you
                exactly which dial to turn
              </li>
            </ul>
            <CodeBlock
              title="Count them by code so the graph is actionable"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

const POOL_CODES = new Set(['P2024', 'P1001', 'P1002', 'P1008']);

export function recordPrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    metrics.increment('prisma_error', { code: e.code });
    if (POOL_CODES.has(e.code)) {
      metrics.increment('prisma_pool_pressure', { code: e.code });
    }
  }
}`}
            />
            <CodeBlock
              title="Confirm from the database which shape it is"
              language="sql"
              code={`SELECT count(*) AS total,
       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_conn,
       count(*) FILTER (WHERE state = 'active') AS active,
       count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_txn
FROM pg_stat_activity;
-- total near max_conn means oversubscribed
-- total low but idle_in_txn high means the app is holding connections`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="What should you monitor in production for Prisma and Node apps specifically?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Pool exhaustion:</strong> connection counts per application instance, timeouts, and
                the codes <code>P1001</code> and <code>P2024</code>
              </li>
              <li>
                Sessions left idle in transaction by abandoned interactive <code>$transaction</code> calls
              </li>
              <li>Query latency percentiles at both the application layer and the database layer</li>
              <li>Migration job success before traffic is cut over, and alerts on schema drift</li>
              <li>
                Too many Prisma Clients after a deploy, caused by a missing singleton, which shows up as a
                connection spike
              </li>
              <li>
                Event loop lag in Node. A blocked event loop looks exactly like a slow database from the
                outside, and the fix is completely different
              </li>
              <li>
                Set <code>application_name</code> in the connection URL so every Postgres side view can tell
                your services apart
              </li>
            </ul>
            <CodeBlock
              title="Correlate the app name with Postgres"
              language="sql"
              code={`-- Set application_name in DATABASE_URL:
-- ?application_name=api-web
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;`}
            />
            <CodeBlock
              title="Prisma logging and metrics hook"
              language="typescript"
              code={`const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 500) {
    console.warn('slow_query', { durationMs: e.duration, query: e.query });
  }
});`}
            />
            <CodeBlock
              title="Prisma metrics, including pool wait time"
              language="typescript"
              code={`// generator client { previewFeatures = ["metrics"] }
const metrics = await prisma.$metrics.json();

// useful gauges and histograms:
// prisma_pool_connections_busy
// prisma_pool_connections_idle
// prisma_pool_connections_open
// prisma_client_queries_wait        - requests waiting for a connection
// prisma_client_queries_wait_histogram_ms

// Prometheus format for a scrape endpoint
const text = await prisma.$metrics.prometheus();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you diagnose Prisma connection pool exhaustion end-to-end?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Symptoms: intermittent timeouts under load, everything fine locally with one process, failures
                once many serverless instances are running
              </li>
              <li>
                Check the arithmetic first: instance count multiplied by <code>connection_limit</code>,
                compared with the PgBouncer pool size and <code>max_connections</code>
              </li>
              <li>
                Then check whether connections are held rather than oversubscribed. Count sessions that are
                idle in transaction, and look for long running interactive transactions
              </li>
              <li>
                Fixes: an external pooler with a low per instance limit, or Accelerate, reuse of the
                singleton client, never constructing a client per request, and shortening transactions
              </li>
              <li>
                Confirm with <code>pg_stat_activity</code> counts and the pooler admin statistics, so you are
                fixing the layer that is actually saturated
              </li>
              <li>
                Watch out for two hidden causes: a missing await, which leaks a connection until it times out,
                and a slow external API call inside a transaction, which holds a connection for the length of
                the network round trip
              </li>
            </ul>
            <CodeBlock
              title="URL tuning sketch"
              language="bash"
              code={`# Each serverless instance gets 1 connection through the transaction pooler
DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1&pool_timeout=10"
DIRECT_URL="postgresql://user:pass@primary:5432/db"`}
            />
            <CodeBlock
              title="Pooler side statistics"
              language="sql"
              code={`-- connect to the PgBouncer admin database
SHOW POOLS;    -- cl_waiting above zero means clients are queueing
SHOW CLIENTS;
SHOW SERVERS;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you trace a slow API request down to the SQL that caused it?">
            <p>
              The goal is one continuous thread from the user request to the statement in the database. Each
              layer has to carry the same identifier, otherwise you are guessing at correlation by timestamp.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Start at the edge:</strong> the request gets a trace id. Log it on the response and
                attach it to every log line, so a user complaint becomes a searchable id
              </li>
              <li>
                <strong>Instrument Prisma:</strong> the tracing preview feature emits OpenTelemetry spans for
                every query, including the serialisation and engine time. That alone tells you whether the
                slow part was the database or your own code
              </li>
              <li>
                <strong>Or use a query extension:</strong> wrap <code>$allOperations</code>, time it, and log
                the model, the operation, and the duration with the trace id. Cheaper than full tracing and
                enough for most teams
              </li>
              <li>
                <strong>Push context into the SQL:</strong> add a comment containing the route and the trace
                id to the statement. The comment travels into <code>pg_stat_activity</code> and the slow query
                log, which is how you connect a database side statement back to an endpoint. This is the
                sqlcommenter idea
              </li>
              <li>
                <strong>Count the queries per request:</strong> a request that is slow because of thirty small
                queries is an N plus 1 problem, and a request that is slow because of one query is an index
                problem. The count is what tells you which one you have
              </li>
              <li>
                <strong>Then go to the plan:</strong> find the shape in <code>pg_stat_statements</code>, put
                real values back in, and run EXPLAIN ANALYZE with BUFFERS
              </li>
              <li>
                <strong>Rule out the wrong layer:</strong> if the database says the query took four
                milliseconds but the application measured four hundred, the time went to connection wait,
                event loop lag, or serialising a huge result. Prisma metrics on pool wait separate those
              </li>
            </ul>
            <CodeBlock
              title="Timing and counting every query with a trace id"
              language="typescript"
              code={`const traced = (traceId: string) =>
  prisma.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now();
        try {
          return await query(args);
        } finally {
          const ms = performance.now() - start;
          logger.info('db_call', { traceId, model, operation, ms });
        }
      },
    },
  });`}
            />
            <CodeBlock
              title="Turning on Prisma tracing"
              language="typescript"
              code={`// generator client { previewFeatures = ["tracing"] }
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

registerInstrumentations({
  instrumentations: [new PrismaInstrumentation()],
});
// spans now show connect, serialize, engine query, and the SQL itself`}
            />
            <CodeBlock
              title="Carry the route into the database with a SQL comment"
              language="sql"
              code={`/* route=/api/orders traceId=8f2c1a controller=listOrders */
SELECT id, total FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50;

-- the comment is visible here during the incident
SELECT pid, now() - query_start AS runtime, left(query, 200)
FROM pg_stat_activity
WHERE state = 'active' AND query LIKE '%traceId%';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Design a minimal production monitoring checklist for PostgreSQL.">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Availability:</strong> the primary is up, replica lag is bounded, failover is healthy
              </li>
              <li>
                <strong>Capacity:</strong> CPU, memory, disk, and connections measured against their limits
              </li>
              <li>
                <strong>Performance:</strong> top queries from <code>pg_stat_statements</code>, cache hit
                ratio, and lock waits
              </li>
              <li>
                <strong>Maintenance:</strong> autovacuum lag, bloat, replication slots, and WAL disk usage
              </li>
              <li>
                <strong>Data safety:</strong> backup age, a restore test that actually succeeded, and WAL
                retention for point in time recovery
              </li>
              <li>
                Alert on: connection saturation, replica lag, disk above 80 percent, long transactions, and
                checkpoint spikes
              </li>
              <li>
                Keep the list short on purpose. A checklist nobody reads during an incident is the same as no
                checklist
              </li>
            </ul>
            <CodeBlock
              title="One query that covers most of the checklist"
              language="sql"
              code={`SELECT
  (SELECT count(*) FROM pg_stat_activity)                                  AS connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')    AS max_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') AS idle_in_txn,
  (SELECT count(*) FROM pg_stat_activity
     WHERE state = 'active' AND now() - query_start > interval '1 minute') AS long_running,
  (SELECT max(age(datfrozenxid)) FROM pg_database)                         AS max_xid_age,
  (SELECT pg_size_pretty(pg_database_size(current_database())))            AS db_size,
  (SELECT count(*) FROM pg_replication_slots WHERE NOT active)             AS inactive_slots;`}
            />
            <CodeBlock
              title="Replication lag and backup age"
              language="sql"
              code={`-- on the primary
SELECT client_addr, state,
       pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag_bytes
FROM pg_stat_replication;

-- on a replica
SELECT now() - pg_last_xact_replay_timestamp() AS replica_lag;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Which alerts actually matter, and which are just noise?">
            <p>
              A good alert is urgent, actionable, and about something a user can feel. Everything else belongs
              on a dashboard or in a weekly review, not on a pager at three in the morning.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Page immediately:</strong> the database is unreachable, connection usage is above
                ninety percent of the limit, disk will be full within a few hours, replication is broken or
                lag is growing without bound, and transaction ID age is approaching the wraparound danger
                zone. All of these end in an outage if ignored
              </li>
              <li>
                <strong>Page on symptoms, not causes:</strong> alert on request error rate and on the p99
                latency of your key endpoints. Those catch problems you never thought to write a rule for
              </li>
              <li>
                <strong>Ticket, do not page:</strong> a table crossing a bloat threshold, an index that has
                gone unused for a month, a query whose mean time doubled, a backup that is slower than usual
              </li>
              <li>
                <strong>Noise to delete:</strong> alerts on CPU percentage alone, on cache hit ratio alone, on
                any single slow query, and on a connection count that is merely higher than yesterday. None of
                these tell you whether anything is broken
              </li>
              <li>
                <strong>Make every alert actionable:</strong> the message should name the likely cause and
                link the runbook. If the only possible response is to look at a dashboard and shrug, delete
                the alert
              </li>
              <li>
                <strong>Use duration, not instants:</strong> fire on a condition sustained for several
                minutes. A one second connection spike during a deploy is normal
              </li>
              <li>
                <strong>Review what actually fired.</strong> Any alert that has been acknowledged without
                action three times in a row is noise, and noise is what makes people ignore the real one
              </li>
            </ul>
            <CodeBlock
              title="The handful of conditions worth paging on"
              language="sql"
              code={`-- connection saturation
SELECT count(*)::float /
       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS usage
FROM pg_stat_activity;   -- page above 0.9 sustained

-- transactions open far too long
SELECT count(*) FROM pg_stat_activity
WHERE xact_start < now() - interval '5 minutes';   -- page above 0

-- wraparound danger
SELECT max(age(datfrozenxid)) FROM pg_database;    -- page above 1.5 billion

-- replication broken
SELECT count(*) FROM pg_stat_replication WHERE state <> 'streaming';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
