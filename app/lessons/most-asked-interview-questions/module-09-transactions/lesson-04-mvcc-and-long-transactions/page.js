import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: MVCC and Long Transactions - Module 9 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL MVCC interview questions: what MVCC is, whether readers block writers, how dead tuples create table bloat, why VACUUM is needed, the problems long-running transactions cause, and why idle in transaction is dangerous.',
};

export default function M9L4MvccAndLongTransactions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: MVCC and Long Transactions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          MVCC is the design that lets PostgreSQL run readers and writers side by side without blocking. It also
          explains why old row versions pile up, why VACUUM exists, and why one forgotten open transaction can
          degrade a whole database.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is MVCC and why does PostgreSQL use it?">
            <p>
              MVCC stands for Multi-Version Concurrency Control. Instead of changing a row in place, PostgreSQL
              writes a new version of the row and leaves the old one there. Each version records which transaction
              created it and which transaction removed it.
            </p>
            <p>
              When a statement reads a table, it uses its snapshot to decide which version of each row it is
              allowed to see. So readers do not block writers and writers do not block readers, and every
              transaction gets a view of the data that is consistent with its isolation level.
            </p>
            <p>
              The old versions stay behind until nobody can still need them. Removing them is the job of VACUUM.
            </p>
            <CodeBlock
              title="Seeing the versions"
              language="sql"
              code={`-- Every row carries hidden system columns
SELECT ctid, xmin, xmax, * FROM accounts WHERE id = 1;

-- ctid  = physical location (block, offset)
-- xmin  = transaction that created this version
-- xmax  = transaction that deleted or replaced it, 0 if still live`}
            />
            <p>
              An <code>UPDATE</code> in PostgreSQL is really a delete plus an insert: the old version gets an
              <code>xmax</code> and a new version is written elsewhere. That single fact explains most of the rest
              of this lesson.
            </p>
            <CodeBlock
              title="An UPDATE moves the row"
              language="sql"
              code={`SELECT ctid FROM accounts WHERE id = 1;   -- (0,1)
UPDATE accounts SET balance = balance - 1 WHERE id = 1;
SELECT ctid FROM accounts WHERE id = 1;   -- (0,2): a new version`}
            />
            <p>
              The alternative design, used by some other databases, is to overwrite the row and keep the old value
              in a separate undo area. That keeps tables compact but makes rollback and long reads more expensive.
              PostgreSQL&apos;s choice makes rollback almost free, at the cost of needing to clean up afterwards.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Does a reader block a writer in PostgreSQL?">
            <p>
              No. A plain <code>SELECT</code> never blocks an <code>INSERT</code>,
              <code>UPDATE</code> or <code>DELETE</code>, and those never block a plain
              <code>SELECT</code>. This is the headline benefit of MVCC and it is the answer interviewers want.
            </p>
            <p>
              It works because the writer creates a new version rather than modifying the one the reader is
              looking at. Both versions exist at the same time, so there is nothing to wait for.
            </p>
            <CodeBlock
              title="They run side by side"
              language="sql"
              code={`-- Session A
BEGIN;
UPDATE accounts SET balance = 400 WHERE id = 1;
-- deliberately not committing

-- Session B, at the same time
SELECT balance FROM accounts WHERE id = 1;  -- returns 500 immediately
-- No waiting. B sees the last committed version.`}
            />
            <p>What does block, so the answer is complete:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Writer against writer on the same row. Two <code>UPDATE</code>s to one row queue up, because only
                one version can be the successor.
              </li>
              <li>
                A locking read such as <code>SELECT ... FOR UPDATE</code>. That is no longer a plain read; it
                takes a row lock and will wait.
              </li>
              <li>
                DDL. <code>ALTER TABLE</code> takes an <code>ACCESS EXCLUSIVE</code> lock, which blocks readers
                too. This is the one big exception to the rule, and it is why migrations need care.
              </li>
              <li>
                <code>CREATE INDEX</code> without <code>CONCURRENTLY</code> blocks writes, though not reads.
              </li>
            </ul>
            <p>
              So the accurate one-line version is: readers and writers do not block each other, but DDL blocks
              everything and writers still block each other on the same row.
            </p>
            <p>
              The trade-off, which is the natural follow-up: because a reader never blocks a writer, a
              long-running read does not stop anyone working, but it does stop the old row versions being cleaned
              up. That is where the cost shows up instead, and it is the subject of the next three questions.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does MVCC create table bloat?">
            <p>
              Because an update writes a new version and leaves the old one behind, every update and delete leaves
              a dead tuple. A dead tuple is a row version that no transaction can see any more, still occupying
              space in the table.
            </p>
            <p>
              Bloat is the accumulated space taken by dead tuples and by the gaps they leave. A table that holds
              a million live rows can occupy the space of five million if it has been heavily updated and not
              cleaned up.
            </p>
            <CodeBlock
              title="Watching dead tuples appear"
              language="sql"
              code={`SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;`}
            />
            <p>Bloat is not just wasted disk. It costs performance in several ways:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A sequential scan reads the dead tuples too, because they are physically in the table. Twice the
                pages means twice the I/O for the same rows.
              </li>
              <li>
                Cache efficiency drops. Shared buffers and the operating system page cache fill with pages that
                are mostly dead, so useful data gets evicted.
              </li>
              <li>
                Indexes bloat as well. Each new row version needs new index entries, and the old ones linger.
              </li>
              <li>
                The space is usually not returned to the operating system. VACUUM marks it reusable inside the
                table, so the file stays large.
              </li>
            </ul>
            <p>
              Two things make bloat much worse than it needs to be. The first is a long-running transaction,
              because a dead tuple can only be removed once no snapshot could still need it; one old transaction
              pins the whole cleanup horizon. The second is updating rows repeatedly in a pattern that defeats
              HOT updates.
            </p>
            <p>
              HOT stands for Heap Only Tuple. If an update changes no indexed column and the new version fits on
              the same page, PostgreSQL can write it without touching any index, and the dead version can be
              cleaned up cheaply during normal page access. That is why an index on a frequently updated column is
              more expensive than it looks, and why leaving some free space per page with
              <code>fillfactor</code> helps a hot table.
            </p>
            <CodeBlock
              title="Helping HOT updates"
              language="sql"
              code={`-- Leave 20% of each page free so new versions fit alongside the old
ALTER TABLE sessions SET (fillfactor = 80);

-- How many updates avoided touching indexes
SELECT relname, n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables
WHERE relname = 'sessions';`}
            />
            <p>
              A design point worth raising: a table used as a counter or a queue, where the same few rows are
              updated constantly, is the worst case for MVCC. Appending rows and aggregating, or moving the hot
              counter to a separate narrow table, produces far less bloat than hammering one row.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is VACUUM needed?">
            <p>
              VACUUM is the cleanup process that makes MVCC sustainable. It scans a table, finds row versions no
              snapshot can see any more, and marks that space reusable. Without it a database that receives
              updates would grow forever and eventually stop accepting writes.
            </p>
            <p>It does four distinct jobs, and knowing all four is what separates answers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Reclaims space.</strong> Dead tuples become free space inside the table, available for new
                rows.
              </li>
              <li>
                <strong>Prevents transaction id wraparound.</strong> Transaction ids are a finite 32-bit counter.
                VACUUM freezes old rows, marking them as visible to everyone so their original id no longer
                matters. If this falls too far behind, PostgreSQL refuses all new writes to protect your data.
                That is the single scariest outage in PostgreSQL operations.
              </li>
              <li>
                <strong>Updates the visibility map.</strong> Pages known to contain only visible rows can be
                skipped by future vacuums and can serve index-only scans, which are much faster.
              </li>
              <li>
                <strong>Refreshes planner statistics</strong>, when run as <code>VACUUM ANALYZE</code>. Stale
                statistics produce bad plans.
              </li>
            </ul>
            <p>
              Autovacuum runs this for you in the background, triggered per table when the dead tuple count
              exceeds a threshold based on the table size. It is usually fine; on very large or very busy tables
              the defaults are too lazy and it falls behind.
            </p>
            <CodeBlock
              title="Running and tuning it"
              language="sql"
              code={`-- Manual, non-blocking: reclaims space for reuse
VACUUM ANALYZE orders;

-- More aggressive autovacuum on a hot table
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.02,   -- default 0.2
  autovacuum_vacuum_cost_delay   = 0
);`}
            />
            <p>
              The distinction people get wrong: plain <code>VACUUM</code> does not shrink the file. It frees space
              inside the table for future rows. <code>VACUUM FULL</code> does rewrite the table and return space
              to the operating system, but it takes an <code>ACCESS EXCLUSIVE</code> lock for the whole rewrite,
              so the table is unusable meanwhile. Never run it casually on production.
            </p>
            <CodeBlock
              title="Shrinking without locking everyone out"
              language="sql"
              code={`-- Blocks all access for the duration. Avoid on a live table.
VACUUM FULL orders;

-- pg_repack does the same job with only a brief lock
-- pg_repack --table orders mydb`}
            />
            <p>
              Watch two numbers in production. The dead tuple percentage per table tells you whether autovacuum is
              keeping up. The age of the oldest unfrozen transaction tells you how close you are to wraparound
              trouble.
            </p>
            <CodeBlock
              title="Wraparound headroom"
              language="sql"
              code={`SELECT
  relname,
  age(relfrozenxid) AS xid_age,
  ROUND(100.0 * age(relfrozenxid) / 2000000000, 1) AS pct_to_wraparound
FROM pg_class
WHERE relkind = 'r'
ORDER BY age(relfrozenxid) DESC
LIMIT 10;`}
            />
            <p>
              Finally, the link back to transactions: VACUUM can only remove a tuple if no open snapshot might
              still need it. One long-running transaction holds that line still, so autovacuum runs, does almost
              nothing useful, and bloat grows anyway. Fixing vacuum problems often means fixing transaction
              length.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What problems do long-running transactions cause?">
            <p>
              They hold locks for longer, which blocks other writers. They hold a snapshot, which keeps dead
              tuples alive and delays VACUUM, causing table bloat and eventually wraparound risk. Under
              <code>SERIALIZABLE</code> they also increase the chance of a conflict and an abort.
            </p>
            <p>
              Keep transactions short. Never wait on an external HTTP call inside a database transaction.
            </p>
            <p>
              The chain of consequences is worth spelling out, because this is where the previous questions
              connect:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An open transaction pins the xmin horizon, the oldest snapshot anyone could still be using.
              </li>
              <li>
                VACUUM cannot remove any row version newer than that horizon, anywhere in the database, even in
                tables the transaction never touched.
              </li>
              <li>
                Dead tuples accumulate, tables and indexes bloat, scans get slower, and the cache fills with dead
                pages.
              </li>
              <li>
                Freezing also stalls, so transaction id age keeps climbing towards the wraparound limit.
              </li>
              <li>
                Meanwhile any lock the transaction took is still held, so unrelated requests queue behind it.
              </li>
            </ul>
            <CodeBlock
              title="Find the oldest transaction right now"
              language="sql"
              code={`SELECT
  pid,
  state,
  NOW() - xact_start AS xact_age,
  left(query, 80) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 5;`}
            />
            <p>
              The most common cause in application code is doing slow non-database work between two queries. The
              transaction stays open for the whole round trip.
            </p>
            <CodeBlock
              title="The mistake, and the fix"
              language="typescript"
              code={`// BAD: the payment API call happens inside the transaction.
// A 10 second provider delay means a 10 second lock hold.
await prisma.$transaction(async (tx) => {
  const order = await tx.order.findUniqueOrThrow({ where: { id } });
  const charge = await paymentProvider.charge(order.totalCents); // slow
  await tx.order.update({ where: { id }, data: { chargeId: charge.id } });
});

// GOOD: external work outside, two short transactions around it
const order = await prisma.order.findUniqueOrThrow({ where: { id } });
const charge = await paymentProvider.charge(order.totalCents);
await prisma.order.update({
  where: { id },
  data: { chargeId: charge.id },
});`}
            />
            <p>
              Other frequent causes: an interactive transaction that also does template rendering or logging, a
              batch job that processes a million rows in one transaction instead of chunks, a reporting query that
              runs for an hour, and a replica with <code>hot_standby_feedback</code> on, where a long query on the
              replica holds the horizon on the primary.
            </p>
            <p>
              The fixes are consistent: do all reads and validation first, keep the write window as small as
              possible, batch large jobs with a commit per chunk, run heavy reports on a replica, and set
              timeouts so nothing can stay open indefinitely.
            </p>
            <CodeBlock
              title="Batching a big job"
              language="sql"
              code={`-- One transaction per chunk, not one for the whole job
DELETE FROM events
WHERE id IN (
  SELECT id FROM events
  WHERE created_at < NOW() - INTERVAL '1 year'
  LIMIT 10000
);
-- Repeat until zero rows are affected.`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What does idle in transaction mean, and why is it dangerous?">
            <p>
              <code>idle in transaction</code> is a connection state in <code>pg_stat_activity</code>. It means a
              transaction is open but no statement is running. The client sent
              <code>BEGIN</code>, ran something, and then went away without committing or rolling back.
            </p>
            <p>
              It is dangerous precisely because it looks harmless. There is no slow query to find in a monitoring
              dashboard. CPU is idle. Yet the transaction holds every lock it took and pins the snapshot horizon
              for the entire database, so it causes all the damage of a long transaction with none of the visible
              symptoms.
            </p>
            <CodeBlock
              title="Finding them"
              language="sql"
              code={`SELECT
  pid,
  usename,
  application_name,
  state,
  NOW() - xact_start   AS xact_age,
  NOW() - state_change AS idle_for,
  left(query, 80)      AS last_statement
FROM pg_stat_activity
WHERE state IN ('idle in transaction', 'idle in transaction (aborted)')
ORDER BY xact_start;`}
            />
            <p>
              Note that <code>query</code> shows the last statement that ran, not a running one. That is the clue
              people misread: the query text looks like an active query but nothing is executing.
            </p>
            <p>
              Distinguish it clearly from plain <code>idle</code>, which is a pooled connection sitting available
              with no transaction open. That one is completely fine and is exactly what you want from a pool.
            </p>
            <p>How connections end up in this state:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An application opened a transaction and then did slow external work: an HTTP call, a file upload,
                writing a report, waiting on a queue.
              </li>
              <li>
                An exception was thrown and the error path never issued a rollback, so the connection went back to
                the pool still inside a transaction.
              </li>
              <li>
                A developer ran <code>BEGIN</code> in psql and went to lunch. This is the classic one.
              </li>
              <li>
                A framework with implicit transaction-per-request that holds the transaction across the whole
                request, including template rendering.
              </li>
              <li>
                A client crashed or lost its network without the TCP connection being detected as dead, so the
                server still thinks it is there.
              </li>
            </ul>
            <p>
              The <code>(aborted)</code> variant is worse in one way and better in another: it hit an error, so it
              can no longer do anything useful, but it still holds its locks and its snapshot until someone rolls
              it back.
            </p>
            <p>
              The fix is a server-side timeout, and it should be set on every production database. Do not rely on
              application discipline, because the failure mode is precisely the path where the application code
              did not run.
            </p>
            <CodeBlock
              title="Set this on every production database"
              language="sql"
              code={`-- Kill any session that sits inside a transaction doing nothing
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '60s';

-- Cap any single statement too
ALTER ROLE app_user SET statement_timeout = '30s';

-- TCP keepalives so dead clients are noticed
-- (postgresql.conf) tcp_keepalives_idle = 60`}
            />
            <p>
              A subtlety with connection pooling. With a server-side pooler such as PgBouncer in transaction
              pooling mode, a client that holds a transaction open also holds its server connection, so a handful
              of idle-in-transaction clients can consume the whole pool and every other request starts failing to
              connect. The symptom then looks like a connection leak rather than a locking problem.
            </p>
            <CodeBlock
              title="Terminating a stuck session"
              language="sql"
              code={`-- Cancel only stops a running statement; there is none here,
-- so this state needs terminate
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%'
  AND state_change < NOW() - INTERVAL '10 minutes';`}
            />
            <p>
              On the application side, make sure every path closes the transaction. Prisma handles this for you:
              <code>$transaction</code> commits when the callback resolves and rolls back when it throws, and its
              <code>timeout</code> option aborts a callback that takes too long. The danger returns as soon as you
              issue <code>BEGIN</code> yourself with <code>$executeRaw</code>.
            </p>
            <CodeBlock
              title="Bounding an interactive transaction in Prisma"
              language="typescript"
              code={`await prisma.$transaction(
  async (tx) => {
    await tx.order.update({ where: { id }, data: { status: 'paid' } });
  },
  {
    maxWait: 2000,  // give up waiting for a connection after 2s
    timeout: 5000,  // roll back if the callback exceeds 5s
  },
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
