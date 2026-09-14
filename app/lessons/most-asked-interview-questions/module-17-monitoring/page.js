import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 17: Monitoring & Maintenance - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL monitoring and maintenance interview questions: pg_stat_activity, pg_stat_statements, vacuum, sizes, connections, health checks, and Prisma pool exhaustion — Junior to Senior.',
};

export default function Module17Monitoring() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 17: Monitoring & Maintenance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 17 — Junior → Senior. Activity views, slow queries,
          vacuum, sizes, connection limits, health checks, and what to watch in Prisma production apps.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What is pg_stat_activity and what can you learn from it?"
          >
            <p>
              <code>pg_stat_activity</code> is a system view showing one row per server process / backend
              connection: who is connected, what query is running, wait events, and transaction state.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Spot long-running queries and idle-in-transaction sessions</li>
              <li>See <code>wait_event_type</code> / <code>wait_event</code> for locks or I/O waits</li>
              <li>Count connections by application / user / state</li>
            </ul>
            <CodeBlock
              title="Active and stuck sessions"
              language="sql"
              code={`SELECT pid, usename, application_name, client_addr, state,
       now() - query_start AS runtime, left(query, 120) AS query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start NULLS LAST;

-- Dangerous: idle in transaction holds locks / prevents vacuum
SELECT pid, usename, state, now() - xact_start AS xact_age, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you check table and index sizes in PostgreSQL?"
          >
            <CodeBlock
              title="Relation sizes"
              language="sql"
              code={`SELECT relname AS name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
       pg_size_pretty(pg_relation_size(c.oid)) AS table_only,
       pg_size_pretty(pg_indexes_size(c.oid)) AS indexes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- Single object
SELECT pg_size_pretty(pg_total_relation_size('public.orders'));`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>pg_relation_size</code> — main heap; <code>pg_total_relation_size</code> — heap +
                TOAST + indexes
              </li>
              <li>Sudden growth often means bloat, missing cleanup, or unexpected write volume</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What are connection limits, and why do they matter?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>max_connections</code> caps backends (default often 100). Each connection costs memory.
              </li>
              <li>
                Hitting the limit causes <code>FATAL: remaining connection slots are reserved</code> / too
                many clients
              </li>
              <li>
                Prefer a pooler (PgBouncer) over raising <code>max_connections</code> blindly
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

          <InterviewQACard
            level="Junior"
            question="What is a database health check for an application?"
          >
            <p>
              A health check verifies the app can reach Postgres with a cheap, safe query — used by
              load balancers, Kubernetes probes, and uptime monitors.
            </p>
            <CodeBlock
              title="SQL + Prisma health check"
              language="sql"
              code={`SELECT 1;
SELECT now(), current_database(), current_user;`}
            />
            <CodeBlock
              title="Prisma / Next.js style"
              language="typescript"
              code={`export async function checkDb() {
  await prisma.$queryRaw\`SELECT 1\`;
  return { ok: true };
}

// Avoid running heavy analytics in /health — keep it < ~100ms`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is pg_stat_statements and how do you use it to find slow queries?"
          >
            <p>
              <code>pg_stat_statements</code> is an extension that aggregates query statistics (calls, total
              / mean time, rows) by normalized query fingerprint — the #1 tool for finding expensive SQL in
              interviews and production.
            </p>
            <CodeBlock
              title="Enable and query top offenders"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT calls,
       round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows,
       left(query, 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Reset after investigating a window
-- SELECT pg_stat_statements_reset();`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>Sort by <code>total_exec_time</code> for overall load; by <code>mean_exec_time</code> for outliers</li>
              <li>Pair with <code>EXPLAIN (ANALYZE, BUFFERS)</code> on the worst fingerprints</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you enable and use the slow query log?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>log_min_duration_statement</code> logs any statement taking longer than N ms
              </li>
              <li>
                <code>log_statement = 'all'|'ddl'|'mod'</code> logs by category (noisy if <code>all</code>)
              </li>
              <li>Cloud providers often expose this via parameter groups / logging dashboards</li>
            </ul>
            <CodeBlock
              title="postgresql.conf / ALTER SYSTEM"
              language="sql"
              code={`-- Log queries slower than 500ms
ALTER SYSTEM SET log_min_duration_statement = 500;
SELECT pg_reload_conf();

SHOW log_min_duration_statement;
SHOW logging_collector;
SHOW log_directory;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What should you monitor about VACUUM / autovacuum?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Autovacuum reclaims dead tuples and updates planner stats — critical under MVCC
              </li>
              <li>
                Watch tables with high dead tuple counts, long time since vacuum/analyze, and wraparound risk
              </li>
              <li>
                Symptoms of vacuum problems: table bloat, unexpected seq scans, transaction ID wraparound
                alerts
              </li>
            </ul>
            <CodeBlock
              title="Vacuum health queries"
              language="sql"
              code={`SELECT relname,
       n_live_tup,
       n_dead_tup,
       last_vacuum,
       last_autovacuum,
       last_analyze,
       last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- Wraparound safety (age of oldest xmin)
SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you find blocking locks and cancel a runaway query?"
          >
            <CodeBlock
              title="Blockers and cancellation"
              language="sql"
              code={`SELECT blocked.pid AS blocked_pid,
       blocking.pid AS blocking_pid,
       blocked.query AS blocked_query,
       blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks kl ON kl.locktype = bl.locktype
  AND kl.database IS NOT DISTINCT FROM bl.database
  AND kl.relation IS NOT DISTINCT FROM bl.relation
  AND kl.page IS NOT DISTINCT FROM bl.page
  AND kl.tuple IS NOT DISTINCT FROM bl.tuple
  AND kl.virtualxid IS NOT DISTINCT FROM bl.virtualxid
  AND kl.transactionid IS NOT DISTINCT FROM bl.transactionid
  AND kl.classid IS NOT DISTINCT FROM bl.classid
  AND kl.objid IS NOT DISTINCT FROM bl.objid
  AND kl.objsubid IS NOT DISTINCT FROM bl.objsubid
  AND kl.granted
JOIN pg_stat_activity blocking ON blocking.pid = kl.pid;

-- Ask backend to stop; stronger: pg_terminate_backend(pid)
SELECT pg_cancel_backend(12345);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What index usage stats should you check before dropping an index?"
          >
            <CodeBlock
              title="Unused / low-use indexes"
              language="sql"
              code={`SELECT s.relname AS table,
       i.relname AS index,
       pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes ui
JOIN pg_class i ON i.oid = ui.indexrelid
JOIN pg_class s ON s.oid = ui.relid
ORDER BY idx_scan ASC, pg_relation_size(i.oid) DESC
LIMIT 30;`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>idx_scan = 0</code> after a long period may mean unused — but confirm stats were not
                reset and the index is not for a rare critical path / unique constraint
              </li>
              <li>Unique / PK indexes protect integrity even with low scans</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="What should you monitor in production for Prisma / Node apps specifically?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Pool exhaustion:</strong> rising connection counts per app instance, timeouts,{' '}
                <code>P1001</code>/<code>P2024</code> (timed out fetching a connection from pool)
              </li>
              <li>
                Idle-in-transaction from abandoned interactive <code>$transaction</code>s
              </li>
              <li>
                Query latency percentiles (p50/p95/p99) at the app and DB layers
              </li>
              <li>
                Migration job success before traffic cutover; schema drift alerts
              </li>
              <li>
                Too many Prisma Clients (missing singleton) after deploy — connection spikes
              </li>
            </ul>
            <CodeBlock
              title="Correlate app name with Postgres"
              language="sql"
              code={`-- Set application_name in DATABASE_URL:
-- ?application_name=api-web
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;`}
            />
            <CodeBlock
              title="Prisma logging / metrics hook"
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
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you diagnose Prisma connection pool exhaustion end-to-end?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Symptoms: intermittent timeouts under load, works locally with one process, fails on many
                serverless instances
              </li>
              <li>
                Check: instance count × <code>connection_limit</code> vs PgBouncer /{' '}
                <code>max_connections</code>
              </li>
              <li>
                Fix: external pooler + low per-instance limit, Accelerate, reuse singleton, avoid opening
                Client per request, shorten transactions
              </li>
              <li>
                Confirm with <code>pg_stat_activity</code> counts and pooler admin stats
              </li>
            </ul>
            <CodeBlock
              title="URL tuning sketch"
              language="bash"
              code={`# Each serverless instance gets 1 connection through transaction pooler
DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1&pool_timeout=10"
DIRECT_URL="postgresql://user:pass@primary:5432/db"`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Design a minimal production monitoring checklist for PostgreSQL."
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Availability:</strong> primary up, replica lag, failover health
              </li>
              <li>
                <strong>Capacity:</strong> CPU, memory, disk, connections vs limits
              </li>
              <li>
                <strong>Performance:</strong> top queries via <code>pg_stat_statements</code>, cache hit
                ratio, lock waits
              </li>
              <li>
                <strong>Maintenance:</strong> autovacuum lag, bloat, replication slots, WAL disk
              </li>
              <li>
                <strong>Data safety:</strong> backup age, restore test success, PITR WAL retention
              </li>
              <li>
                Alert on: connection saturation, replica lag, disk &gt; 80%, long transactions, checkpoint
                spikes
              </li>
            </ul>
            <CodeBlock
              title="Cache hit ratio (rough)"
              language="sql"
              code={`SELECT
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS hit_ratio
FROM pg_statio_user_tables;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do EXPLAIN plans fit into an ongoing monitoring practice?"
          >
            <p>
              Monitoring finds <em>which</em> queries hurt; <code>EXPLAIN (ANALYZE, BUFFERS)</code> explains{' '}
              <em>why</em>. Capture plans for regressions after deploys or schema changes; store slow-query
              samples with plan digests in APM when possible.
            </p>
            <CodeBlock
              title="Explain for a hot query"
              language="sql"
              code={`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.email, count(*)
FROM "User" u
JOIN "Post" p ON p."authorId" = u.id
WHERE p.published = true
GROUP BY u.email;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
