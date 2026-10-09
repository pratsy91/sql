import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: LISTEN/NOTIFY and Advisory Locks - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on LISTEN and NOTIFY, payload limits and commit delivery, advisory locks, session vs transaction scope, queue tables with FOR UPDATE SKIP LOCKED, and choosing between NOTIFY, a queue table, and Kafka.',
};

export default function Module15Lesson04NotifyAndAdvisoryLocks() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: LISTEN/NOTIFY and Advisory Locks</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two features that let PostgreSQL coordinate your application: a small publish-and-subscribe channel
          for telling other connections something happened, and locks you define yourself for making sure only
          one worker does a job at a time.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are LISTEN and NOTIFY?">
            <p>
              PostgreSQL&apos;s built-in lightweight publish and subscribe. A connection runs{' '}
              <code>LISTEN channel_name</code> to subscribe. Any other connection runs{' '}
              <code>NOTIFY channel_name, &apos;some payload&apos;</code> and every listener on that channel
              gets the message. No extra broker required.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Good for: invalidating a cache, waking a worker, pushing a live update to connected clients.
              </li>
              <li>
                Not good for: a reliable job queue. Messages are not stored, so a listener that is not connected
                at that moment never receives them.
              </li>
              <li>
                Channel names are identifiers, so quote them if they are not plain lowercase.
              </li>
              <li>
                <code>pg_notify(channel, payload)</code> is the function form, which you need when the channel
                name is dynamic.
              </li>
            </ul>
            <CodeBlock
              title="LISTEN and NOTIFY"
              language="sql"
              code={`-- Session A
LISTEN order_events;

-- Session B
NOTIFY order_events, 'order_id=123';

-- Function form, useful for a dynamic channel or from inside a trigger
SELECT pg_notify('order_events', json_build_object('id', 123, 'op', 'paid')::text);

-- Stop listening
UNLISTEN order_events;
UNLISTEN *;

-- Who is listening on this connection?
SELECT * FROM pg_listening_channels();`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is the NOTIFY payload limit, and when is it delivered?"
          >
            <p>
              Two specifics that interviewers use to check whether you have actually used this feature.
            </p>
            <p>
              <strong>The payload limit is 8000 bytes.</strong> Exceed it and the <code>NOTIFY</code> fails
              with an error, which means your transaction fails. So never send the whole record. Send an
              identifier and let the listener fetch the current row, which is also more correct, because by the
              time the listener reads it the row may have changed again.
            </p>
            <p>
              <strong>Delivery happens at COMMIT.</strong> A <code>NOTIFY</code> inside a transaction is held
              until the transaction commits, and it is discarded entirely if you roll back. This is genuinely
              useful: the notification cannot arrive before the data is visible, so a listener that immediately
              queries for the row will find it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Duplicates are collapsed.</strong> Identical channel and payload pairs within one
                transaction are sent once.
              </li>
              <li>
                <strong>No persistence.</strong> Nothing is queued for absent listeners. Every message sent
                while a worker is restarting is gone forever.
              </li>
              <li>
                <strong>The queue is cluster-wide and finite.</strong> If a listening session stops reading its
                messages, the shared queue fills and committing transactions that call <code>NOTIFY</code> start
                to block. Monitor it with <code>pg_notification_queue_usage()</code>.
              </li>
              <li>
                <strong>Connection poolers break it.</strong> <code>LISTEN</code> belongs to a specific backend
                session, so PgBouncer in transaction pooling mode cannot support it. Listeners need a dedicated,
                long-lived direct connection, which also rules out most serverless functions.
              </li>
            </ul>
            <CodeBlock
              title="Send an ID, not the row"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION notify_order_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- Small payload: the listener reads the current row itself
  PERFORM pg_notify(
    'order_events',
    json_build_object('id', NEW.id, 'op', lower(TG_OP))::text
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER orders_notify
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_change();

-- Held until COMMIT, and dropped on ROLLBACK
BEGIN;
  INSERT INTO orders (id, total) VALUES (123, 4999);
  NOTIFY order_events, 'order_id=123';
ROLLBACK;   -- the notification is never sent

-- Watch for a filling queue (1.0 means full)
SELECT pg_notification_queue_usage();`}
            />
            <CodeBlock
              title="A listener needs a dedicated connection"
              language="typescript"
              code={`import { Client } from 'pg';

// A direct connection, not through PgBouncer transaction pooling,
// and not inside a serverless request handler.
const listener = new Client({ connectionString: process.env.DATABASE_DIRECT_URL });
await listener.connect();
await listener.query('LISTEN order_events');

listener.on('notification', async (msg) => {
  const { id } = JSON.parse(msg.payload);
  // Fetch the current state rather than trusting the payload
  const order = await prisma.order.findUnique({ where: { id } });
  if (order) await cache.set('order:' + id, order);
});

// Messages sent while this process is down are lost, so reconcile on startup
listener.on('error', () => process.exit(1));`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are advisory locks?">
            <p>
              Ordinary locks are taken by PostgreSQL on rows and tables to protect data. An{' '}
              <strong>advisory lock</strong> protects nothing on its own. It is just a named lock, identified by
              one or two integers, that you take and release to coordinate your own application. PostgreSQL
              supplies the mutual exclusion and does not care what it means.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Typical use: &quot;only one worker may run the nightly billing job for tenant X&quot;, or
                &quot;only one process may run migrations right now&quot;.
              </li>
              <li>
                The key is a <code>bigint</code>, so you map your string to one with{' '}
                <code>hashtext()</code>. Hashes can collide, so add a namespace using the two-integer form.
              </li>
              <li>
                <code>pg_advisory_lock</code> waits. <code>pg_try_advisory_lock</code> returns{' '}
                <code>false</code> immediately if it cannot get the lock, which is usually what you want so a
                worker can move on.
              </li>
              <li>
                Prefer the transaction-scoped variants, so the lock cannot be leaked by code that forgets to
                release it.
              </li>
              <li>
                They are per-database and they do not survive a failover, so treat them as best-effort
                coordination, not as a distributed consensus mechanism.
              </li>
            </ul>
            <CodeBlock
              title="Advisory locks"
              language="sql"
              code={`-- Transaction scoped: released automatically at COMMIT or ROLLBACK
SELECT pg_advisory_xact_lock(42);

-- Do not wait if someone else holds it
SELECT pg_try_advisory_xact_lock(hashtext('tenant:abc'));

-- Two-integer form gives you a namespace, reducing collision risk
-- 1 = 'billing job', second value = tenant hash
SELECT pg_try_advisory_xact_lock(1, hashtext('tenant:abc'));

-- Who holds what right now?
SELECT pid, objid, classid, granted
FROM pg_locks WHERE locktype = 'advisory';`}
            />
            <CodeBlock
              title="Advisory lock through Prisma"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const rows = await tx.$queryRawUnsafe(
    'SELECT pg_try_advisory_xact_lock(1, hashtext($1)) AS ok',
    'tenant:' + tenantId
  );
  if (!rows[0].ok) {
    // Another worker already has it: this is normal, not an error
    return { skipped: true };
  }

  await runBillingFor(tenantId, tx);
  return { skipped: false };
});
// The lock is released when the transaction ends, even if it threw`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Session advisory locks or transaction advisory locks?"
          >
            <p>
              Same locks, different lifetime, and the difference causes real production incidents.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Transaction scoped</strong> (<code>pg_advisory_xact_lock</code>): released
                automatically when the transaction ends. There is no unlock function, and there does not need
                to be. Exceptions, timeouts, and crashes all release it.
              </li>
              <li>
                <strong>Session scoped</strong> (<code>pg_advisory_lock</code>): held until you call{' '}
                <code>pg_advisory_unlock</code> or the connection closes. It survives a rollback, and it can
                outlive the code that took it.
              </li>
            </ul>
            <p>
              Default to transaction scoped. The session variant leaks: an exception thrown between lock and
              unlock leaves the lock held, and because connection pools reuse connections, that lock can now sit
              on an idle pooled connection for hours and block every other worker. That is the failure this
              question is really about.
            </p>
            <p>
              Session locks are still the right choice when the work must span multiple transactions, for
              example a long import that commits in batches but must stay exclusive throughout. If you take one,
              wrap it in <code>try</code> and <code>finally</code>, and note that session locks are re-entrant,
              so two locks need two unlocks.
            </p>
            <CodeBlock
              title="Scope comparison"
              language="sql"
              code={`-- Transaction scoped: nothing to clean up
BEGIN;
  SELECT pg_advisory_xact_lock(42);
  -- work
ROLLBACK;   -- lock released

-- Session scoped: survives the rollback
BEGIN;
  SELECT pg_advisory_lock(42);
ROLLBACK;
SELECT pg_advisory_unlock(42);   -- still required, or it stays held

-- Re-entrant: taken twice means unlocked twice
SELECT pg_advisory_lock(42);
SELECT pg_advisory_lock(42);
SELECT pg_advisory_unlock_all();   -- the blunt cleanup

-- Find leaked locks sitting on idle connections
SELECT l.pid, l.objid, a.state, a.query_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND a.state = 'idle';`}
            />
            <CodeBlock
              title="If you must use a session lock, guarantee the release"
              language="typescript"
              code={`// Multi-transaction import that must stay exclusive across batches
const conn = await pool.connect();
try {
  const { rows } = await conn.query(
    'SELECT pg_try_advisory_lock(1, hashtext($1)) AS ok',
    ['import:' + jobId]
  );
  if (!rows[0].ok) return { skipped: true };

  for (const batch of batches) {
    await conn.query('BEGIN');
    await insertBatch(conn, batch);
    await conn.query('COMMIT');   // lock survives each commit
  }
} finally {
  // Runs even on an exception, so the pooled connection is left clean
  await conn.query('SELECT pg_advisory_unlock_all()');
  conn.release();
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you build a job queue with FOR UPDATE SKIP LOCKED?"
          >
            <p>
              <code>SKIP LOCKED</code>, added in PostgreSQL 9.5, is what makes a database table a genuinely good
              job queue. Normally <code>SELECT ... FOR UPDATE</code> waits when a row is locked by someone else,
              so ten workers all queue behind the same first row. <code>SKIP LOCKED</code> tells PostgreSQL to
              ignore locked rows and return the next free ones instead, so every worker picks a different job
              with no coordination.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Claim inside a transaction, so a crashed worker&apos;s rows are released automatically by the
                rollback.
              </li>
              <li>
                Use a subquery with <code>LIMIT</code> and <code>FOR UPDATE SKIP LOCKED</code>, then update the
                selected rows and return them. That claims a batch in one round trip.
              </li>
              <li>
                Index on the columns you filter and order by, usually a partial index restricted to pending
                jobs, so the queue stays fast as completed rows accumulate.
              </li>
              <li>
                Add <code>attempts</code>, <code>run_after</code>, and <code>locked_at</code> columns for
                retries, delays, and detecting jobs stuck by a hard-killed worker.
              </li>
              <li>
                Delete or archive finished jobs. A table with millions of dead rows will bloat and slow down, so
                pair it with partitioning or a regular cleanup.
              </li>
              <li>
                Pair it with <code>LISTEN/NOTIFY</code> so workers wake instantly instead of polling, while the
                table remains the reliable source of truth.
              </li>
            </ul>
            <CodeBlock
              title="Queue table and claim query"
              language="sql"
              code={`CREATE TABLE jobs (
  id         BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,
  payload    JSONB NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  attempts   INT NOT NULL DEFAULT 0,
  run_after  TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at  TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Small index covering only the rows a worker looks at
CREATE INDEX jobs_ready_idx ON jobs (run_after, id)
  WHERE status = 'pending';

-- Claim up to 10 jobs; concurrent workers never collide
UPDATE jobs
SET status = 'running', attempts = attempts + 1, locked_at = now()
WHERE id IN (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_after <= now()
  ORDER BY run_after, id
  FOR UPDATE SKIP LOCKED
  LIMIT 10
)
RETURNING id, kind, payload;`}
            />
            <CodeBlock
              title="Completion, retry with backoff, and stuck-job recovery"
              language="sql"
              code={`-- Success
UPDATE jobs SET status = 'done' WHERE id = $1;

-- Failure: back off exponentially, give up after 5 tries
UPDATE jobs
SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
    run_after = now() + (interval '10 seconds' * power(2, attempts)),
    last_error = $2,
    locked_at = NULL
WHERE id = $1;

-- A worker was killed mid-job: reclaim anything running too long
UPDATE jobs
SET status = 'pending', locked_at = NULL
WHERE status = 'running' AND locked_at < now() - interval '15 minutes';

-- Keep the table small
DELETE FROM jobs WHERE status = 'done' AND created_at < now() - interval '7 days';`}
            />
            <CodeBlock
              title="Worker loop in Prisma"
              language="typescript"
              code={`const claimSql = [
  "UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_at = now()",
  'WHERE id IN (',
  "  SELECT id FROM jobs WHERE status = 'pending' AND run_after <= now()",
  '  ORDER BY run_after, id FOR UPDATE SKIP LOCKED LIMIT $1',
  ') RETURNING id, kind, payload',
].join(' ');

async function tick() {
  const jobs = await prisma.$queryRawUnsafe(claimSql, 10);

  for (const job of jobs) {
    try {
      await handlers[job.kind](job.payload);
      await prisma.$executeRawUnsafe(
        "UPDATE jobs SET status = 'done' WHERE id = $1",
        job.id
      );
    } catch (err) {
      await prisma.$executeRawUnsafe(
        [
          'UPDATE jobs SET',
          "  status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,",
          "  run_after = now() + (interval '10 seconds' * power(2, attempts)),",
          '  last_error = $2, locked_at = NULL',
          'WHERE id = $1',
        ].join(' '),
        job.id,
        String(err)
      );
    }
  }
  return jobs.length;
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="When do you choose LISTEN/NOTIFY vs a queue table vs Kafka?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>LISTEN/NOTIFY</strong>: same cluster, low volume signals. Cache invalidation, waking a
                worker, pushing a live UI update. Choose it when losing a message is acceptable because something
                else will reconcile.
              </li>
              <li>
                <strong>Queue table with SKIP LOCKED</strong>: reliable jobs that must not be lost. You get
                retries, visibility with plain SQL, and the crucial property that enqueueing happens in the same
                transaction as your data change, so you can never commit an order without its confirmation
                email. Choose it for almost all in-application background work.
              </li>
              <li>
                <strong>Kafka, SQS, or similar</strong>: many independent consumers, cross-service fan-out,
                message retention and replay, or throughput far beyond what one database should handle. Choose it
                when events must leave your service boundary.
              </li>
            </ul>
            <p>
              The decisive question is <strong>transactional coupling</strong>. A queue table shares your
              transaction, so enqueue and data change commit or fail together. A broker does not, so you need the
              outbox pattern: write the event to a table in the same transaction and let a separate process
              publish it. Skipping that is how teams end up with orders that were charged but never shipped.
            </p>
            <p>
              Practical combination worth proposing: a queue table as the durable record, plus{' '}
              <code>NOTIFY</code> after commit so workers react in milliseconds instead of polling every second,
              plus a slow poll as the safety net for missed notifications.
            </p>
            <p>
              Saying &quot;NOTIFY is a message bus&quot; without caveats is a red flag. The caveats that matter:
              no persistence, 8000 byte payload limit, incompatible with transaction-mode connection pooling, and
              a cluster-wide queue that can block commits if a listener stalls.
            </p>
            <CodeBlock
              title="Durable queue plus instant wakeup"
              language="sql"
              code={`-- Enqueue in the same transaction as the business change
BEGIN;
  INSERT INTO orders (id, total, status) VALUES (123, 4999, 'paid');
  INSERT INTO jobs (kind, payload) VALUES ('send_receipt', '{"order_id":123}');
  NOTIFY jobs_ready;      -- delivered only if this COMMIT succeeds
COMMIT;`}
            />
            <CodeBlock
              title="Worker: notification-driven with a polling fallback"
              language="typescript"
              code={`import { Client } from 'pg';

const listener = new Client({ connectionString: process.env.DATABASE_DIRECT_URL });
await listener.connect();
await listener.query('LISTEN jobs_ready');

let running = false;
async function drain() {
  if (running) return;
  running = true;
  try {
    // Keep claiming until the queue is empty
    while ((await tick()) > 0) {}
  } finally {
    running = false;
  }
}

// Fast path: react as soon as a job is committed
listener.on('notification', drain);

// Safety net: catches anything missed while this process was restarting
setInterval(drain, 5000);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
