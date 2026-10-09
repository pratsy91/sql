import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Activity and Locks - Module 17 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL monitoring interview questions on pg_stat_activity, finding the longest running query, idle in transaction, blocking locks, and pg_cancel_backend vs pg_terminate_backend',
};

export default function MaiqM17L01ActivityAndLocks() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Activity and Locks</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The first place you look when the database feels slow right now: who is connected, what they are
          running, and who is stuck waiting for whom.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is pg_stat_activity and what can you learn from it?">
            <p>
              <code>pg_stat_activity</code> is a system view with one row per connection. It shows who is
              connected, what query they are running right now, how long it has been running, and whether they
              are waiting on something.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Spot long running queries and sessions stuck idle inside a transaction</li>
              <li>
                Read <code>wait_event_type</code> and <code>wait_event</code> to see whether a session is
                waiting on a lock, on disk, or on the client
              </li>
              <li>Count connections by application, user, or state to see who is using your capacity</li>
              <li>
                The useful state values are <code>active</code> for running a query,{' '}
                <code>idle</code> for connected but doing nothing, and{' '}
                <code>idle in transaction</code> for the dangerous one
              </li>
              <li>
                It is a live snapshot, not history. Nothing here is kept after the session ends, which is why
                you also need <code>pg_stat_statements</code>
              </li>
            </ul>
            <CodeBlock
              title="Active and stuck sessions"
              language="sql"
              code={`SELECT pid, usename, application_name, client_addr, state,
       now() - query_start AS runtime, left(query, 120) AS query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start NULLS LAST;

-- Dangerous: idle in transaction holds locks and prevents vacuum
SELECT pid, usename, state, now() - xact_start AS xact_age, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start;`}
            />
            <CodeBlock
              title="Who is using the connections"
              language="sql"
              code={`SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY 1, 2
ORDER BY 3 DESC;

-- exclude yourself and background workers
SELECT count(*) FROM pg_stat_activity
WHERE pid <> pg_backend_pid() AND backend_type = 'client backend';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you find the longest running query right now?">
            <p>
              Sort <code>pg_stat_activity</code> by how long each query has been running. The key detail is
              which timestamp you subtract, because there are three and they answer different questions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>query_start</code> is when the current statement began. Use it for the longest single
                query
              </li>
              <li>
                <code>xact_start</code> is when the transaction began. Use it to find the oldest open
                transaction, which is what blocks vacuum
              </li>
              <li>
                <code>state_change</code> is when the state last changed. Use it to see how long a session has
                sat idle in transaction
              </li>
              <li>
                Always filter to <code>state = &apos;active&apos;</code> when hunting slow queries, otherwise
                an idle connection with an old <code>query_start</code> looks like a ten hour query
              </li>
              <li>
                Exclude autovacuum and other background work with{' '}
                <code>backend_type = &apos;client backend&apos;</code> unless you are specifically looking at
                maintenance
              </li>
            </ul>
            <CodeBlock
              title="Longest running statements"
              language="sql"
              code={`SELECT pid,
       usename,
       application_name,
       now() - query_start AS runtime,
       wait_event_type,
       wait_event,
       left(query, 200) AS query
FROM pg_stat_activity
WHERE state = 'active'
  AND backend_type = 'client backend'
  AND pid <> pg_backend_pid()
ORDER BY query_start ASC
LIMIT 10;`}
            />
            <CodeBlock
              title="Anything running longer than a threshold"
              language="sql"
              code={`SELECT pid, now() - query_start AS runtime, left(query, 120)
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes'
ORDER BY runtime DESC;

-- oldest open transaction, which is what holds vacuum back
SELECT pid, state, now() - xact_start AS xact_age, left(query, 120)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start ASC
LIMIT 5;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What does idle in transaction mean, and why is it dangerous?">
            <p>
              It means a client ran BEGIN, did some work, and then stopped sending statements without ever
              committing or rolling back. The transaction is still open, the connection is still held, but
              nothing is happening.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>It holds every lock it took.</strong> Any row it updated stays locked, so other
                writers queue behind a session that is doing nothing at all
              </li>
              <li>
                <strong>It blocks vacuum everywhere.</strong> An open transaction keeps an old snapshot alive,
                and autovacuum cannot remove dead rows newer than the oldest snapshot. One forgotten
                transaction can bloat tables it never touched
              </li>
              <li>
                <strong>It wastes a connection.</strong> On a hundred slot database, a handful of these plus
                normal traffic is enough to hit the limit
              </li>
              <li>
                <strong>Long term it risks transaction ID wraparound</strong>, because the oldest transaction
                pins how far the freeze horizon can advance
              </li>
              <li>
                Usual causes: an application that opens a transaction then calls an external API, an ORM
                transaction wrapped around slow business logic, a developer with an open psql session, or an
                error path that never rolls back
              </li>
              <li>
                The fix in the database is <code>idle_in_transaction_session_timeout</code>, which kills such
                sessions automatically. The fix in the application is to keep transactions short and to put
                rollback in a finally block
              </li>
            </ul>
            <CodeBlock
              title="Find and measure them"
              language="sql"
              code={`SELECT pid,
       usename,
       application_name,
       now() - state_change AS idle_for,
       now() - xact_start   AS xact_age,
       left(query, 120)     AS last_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start ASC;`}
            />
            <CodeBlock
              title="Automatic safety net"
              language="sql"
              code={`-- abort any session idle inside a transaction for 60 seconds
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
SELECT pg_reload_conf();

-- per role, which is safer than a global change
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '30s';

SHOW idle_in_transaction_session_timeout;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you find blocking locks and cancel a runaway query?">
            <p>
              Postgres tells you directly which session is waiting and which one is holding it up. The modern
              short answer is <code>pg_blocking_pids</code>.
            </p>
            <CodeBlock
              title="The quick version"
              language="sql"
              code={`SELECT pid,
       pg_blocking_pids(pid) AS blocked_by,
       now() - query_start   AS waiting_for,
       left(query, 120)      AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;`}
            />
            <CodeBlock
              title="The full join against pg_locks"
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

-- Ask the backend to stop the current query
SELECT pg_cancel_backend(12345);`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Follow the chain to the root. The session at the end of the blocking list is the real culprit,
                and it is often not running anything at all
              </li>
              <li>
                Cancel the blocker, not the victims. Killing the waiting queries just means new ones queue up
                behind the same blocker
              </li>
              <li>
                Prevent repeats with <code>lock_timeout</code>, so a statement that cannot get its lock fails
                quickly instead of freezing a table behind it
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is the difference between pg_cancel_backend and pg_terminate_backend?"
          >
            <p>
              <code>pg_cancel_backend</code> stops the running query but keeps the connection.{' '}
              <code>pg_terminate_backend</code> kills the whole connection. Always try cancel first.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Cancel:</strong> the query ends with a query cancelled error, the transaction is
                rolled back, and the client stays connected and can carry on. This is the polite option
              </li>
              <li>
                <strong>Terminate:</strong> the session is closed, the transaction is rolled back, and the
                client sees a dropped connection. Connection pools handle this fine, but a naive client may
                throw an unexpected error
              </li>
              <li>
                Cancel does nothing to a session that is <code>idle in transaction</code>, because there is no
                query to cancel. That case needs terminate
              </li>
              <li>
                Both return true if the signal was delivered, not if the query actually stopped. Check{' '}
                <code>pg_stat_activity</code> again to confirm
              </li>
              <li>
                Rolling back a huge write can take a long time after either call, since the work has to be
                undone. Terminate is not instant relief
              </li>
              <li>
                You need to be a superuser, or a member of <code>pg_signal_backend</code>, or the owner of
                that session
              </li>
            </ul>
            <CodeBlock
              title="Escalate in order"
              language="sql"
              code={`-- 1. Ask nicely
SELECT pg_cancel_backend(12345);

-- 2. Still there after a few seconds? Close the connection
SELECT pg_terminate_backend(12345);

-- Clear every session idle in transaction for over 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > interval '10 minutes'
  AND pid <> pg_backend_pid();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="A schema migration is stuck and the whole table is frozen. Walk through what happened."
          >
            <p>
              This is the classic production incident. An ALTER TABLE needs an exclusive lock. It cannot get
              one because an older query is still reading the table, so it waits. While it waits, every new
              query on that table queues behind it, because lock requests are granted in order.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The damage is not caused by the ALTER itself, which may take milliseconds. It is caused by the
                queue that forms behind it
              </li>
              <li>
                <strong>Diagnose:</strong> find the waiting ALTER in <code>pg_stat_activity</code>, then use{' '}
                <code>pg_blocking_pids</code> to walk back to the root session. It is usually a long analytics
                query, a forgotten open transaction, or an idle psql window
              </li>
              <li>
                <strong>Resolve:</strong> cancel the root blocker, or cancel the migration itself. Which one
                depends on whether the blocker is business critical
              </li>
              <li>
                <strong>Prevent:</strong> set <code>lock_timeout</code> before DDL so the migration gives up
                after a few seconds instead of parking in the queue. Retry it in a loop if needed
              </li>
              <li>
                <strong>Prevent:</strong> build indexes with CONCURRENTLY, add columns as nullable with no
                default rewrite, and validate constraints in a second step with NOT VALID then VALIDATE
              </li>
              <li>
                <strong>Prevent:</strong> run migrations in a quiet window, and keep a{' '}
                <code>statement_timeout</code> on analytics roles so no report can run for an hour
              </li>
              <li>
                Alerting angle: page on the number of sessions where{' '}
                <code>pg_blocking_pids</code> is not empty, and on the age of the oldest transaction. Both
                catch this before users do
              </li>
            </ul>
            <CodeBlock
              title="Trace the queue to its root"
              language="sql"
              code={`SELECT a.pid,
       a.state,
       now() - a.query_start AS waiting,
       pg_blocking_pids(a.pid) AS blocked_by,
       left(a.query, 100) AS query
FROM pg_stat_activity a
WHERE a.wait_event_type = 'Lock'
ORDER BY a.query_start;

-- then look at the root pid returned above
SELECT pid, state, now() - xact_start AS xact_age, left(query, 200)
FROM pg_stat_activity
WHERE pid = 12345;`}
            />
            <CodeBlock
              title="Make DDL fail fast instead of blocking everything"
              language="sql"
              code={`BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE orders ADD COLUMN note text;
COMMIT;
-- if it cannot get the lock in 3 seconds it errors out and the queue never forms`}
            />
            <CodeBlock
              title="Safer shapes for common changes"
              language="sql"
              code={`-- index without blocking writes (cannot run in a transaction block)
CREATE INDEX CONCURRENTLY orders_customer_idx ON orders (customer_id);

-- constraint in two cheap steps instead of one long table scan
ALTER TABLE orders ADD CONSTRAINT orders_total_positive
  CHECK (total >= 0) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_total_positive;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
