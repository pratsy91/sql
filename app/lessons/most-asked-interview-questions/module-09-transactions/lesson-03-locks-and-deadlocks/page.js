import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Locks and Deadlocks - Module 9 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL locking interview questions: row vs table locks, SELECT FOR UPDATE vs FOR SHARE, NOWAIT and SKIP LOCKED, deadlocks and how to avoid them with consistent lock ordering, finding what blocks a query, and advisory locks.',
};

export default function M9L3LocksAndDeadlocks() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Locks and Deadlocks</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A lock stops two transactions changing the same thing at once. This lesson covers the locks you ask for
          explicitly, the options for not waiting, why deadlocks happen and how to design them away, and how to
          find out what is blocking a query right now.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain row locks vs table locks and SELECT FOR UPDATE.">
            <p>
              Row locks protect individual rows. Table locks protect the whole table and are mostly taken
              automatically by DDL and maintenance commands. Normal reads and writes only take row locks, plus a
              very weak table lock that just says &quot;this table is in use, do not drop it&quot;.
            </p>
            <p>
              <code>SELECT ... FOR UPDATE</code> locks the rows it returns as if you had updated them, so nobody
              else can change or delete them until you commit or roll back. It is the classic answer to
              &quot;check the balance, then debit it&quot;.
            </p>
            <CodeBlock
              title="FOR UPDATE"
              language="sql"
              code={`BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
-- decide based on balance
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;`}
            />
            <p>
              The key property under MVCC is that a row lock never blocks a plain reader. Another transaction can
              still <code>SELECT</code> that row and see the last committed version. Only writers and other
              lock requests wait.
            </p>
            <p>
              Row locks are stored in the row itself rather than in a shared memory table, so you can lock
              millions of rows without exhausting anything. Table-level locks are tracked in memory and are
              limited, which is one reason bulk operations prefer row locks.
            </p>
            <CodeBlock
              title="Table locks you take on purpose"
              language="sql"
              code={`BEGIN;
-- Blocks writers but still allows plain SELECTs
LOCK TABLE inventory IN SHARE MODE;

-- Blocks everything, including reads. Almost never the right answer.
LOCK TABLE inventory IN ACCESS EXCLUSIVE MODE;
COMMIT;`}
            />
            <p>
              Two things that behave like table locks in practice and cause real outages.
              <code>ALTER TABLE</code> takes an <code>ACCESS EXCLUSIVE</code> lock, so it waits for every
              in-flight transaction on that table and blocks all new ones while it waits. And
              <code>CREATE INDEX</code> without <code>CONCURRENTLY</code> blocks writes for the whole build. Both
              are the reason you set a short <code>lock_timeout</code> during migrations.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const rows = await tx.$queryRawUnsafe(
    'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',
    1,
  );

  if (rows[0].balance < 100) throw new Error('insufficient funds');

  await tx.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } },
  });
});
// Prisma has no findMany option for FOR UPDATE,
// so the locking read is a raw query on the tx client.`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between FOR UPDATE and FOR SHARE?">
            <p>
              Both lock the rows a <code>SELECT</code> returns, but they allow different things afterwards.
              PostgreSQL has four of these clauses, from strongest to weakest.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>FOR UPDATE</code>: exclusive. No other transaction may lock, update or delete the row. Use
                it when you intend to write.
              </li>
              <li>
                <code>FOR NO KEY UPDATE</code>: like <code>FOR UPDATE</code> but weaker, and it does not block
                <code>FOR KEY SHARE</code>. This is what a plain <code>UPDATE</code> takes when it does not change
                a key column.
              </li>
              <li>
                <code>FOR SHARE</code>: shared. Many transactions can hold it at once, and all of them block
                anyone trying to update or delete. Use it when you need the row to stay exactly as it is while you
                read it, without claiming the right to change it.
              </li>
              <li>
                <code>FOR KEY SHARE</code>: weakest. Only blocks changes to key columns and deletes. This is what
                a foreign key check takes on the parent row.
              </li>
            </ul>
            <CodeBlock
              title="Shared locks coexist, exclusive ones do not"
              language="sql"
              code={`-- Session A and session B can both run this at once
BEGIN;
SELECT * FROM products WHERE id = 1 FOR SHARE;
-- both hold it; neither can be updated by anyone

-- But only one session at a time gets this
BEGIN;
SELECT * FROM products WHERE id = 1 FOR UPDATE;`}
            />
            <p>
              The practical use of <code>FOR SHARE</code> is protecting a referenced row. If you are inserting a
              child row and the rule is that the parent must still exist and still be active when you commit, a
              shared lock stops anyone deactivating it in the meantime, while still letting other requests read
              the same parent concurrently.
            </p>
            <CodeBlock
              title="Guarding a parent row"
              language="sql"
              code={`BEGIN;
SELECT 1 FROM accounts WHERE id = 1 AND active FOR SHARE;
-- the account cannot be deactivated or deleted before we commit
INSERT INTO transactions (account_id, amount) VALUES (1, 100);
COMMIT;`}
            />
            <p>
              The trap with <code>FOR SHARE</code> is deadlock by upgrade. Two transactions both take a shared
              lock, then both try to upgrade to exclusive. Each waits for the other to release its share, so
              PostgreSQL kills one. If you might write the row, take <code>FOR UPDATE</code> from the start rather
              than upgrading later.
            </p>
            <CodeBlock
              title="The upgrade deadlock"
              language="sql"
              code={`-- T1                                   -- T2
BEGIN;                                 BEGIN;
SELECT ... FOR SHARE;   -- ok          SELECT ... FOR SHARE;   -- ok
UPDATE ...;             -- waits       UPDATE ...;             -- waits
-- deadlock: one is aborted with 40P01`}
            />
            <p>
              One more detail worth knowing, because it explains a lot of unexplained blocking: an ordinary
              <code>UPDATE</code> that changes a non-key column takes <code>FOR NO KEY UPDATE</code>, and a
              foreign key check on the parent takes <code>FOR KEY SHARE</code>. Those two do not conflict, which
              is why PostgreSQL 9.3 onwards no longer blocks parent updates behind child inserts. Before that,
              inserting children blocked updates to the parent.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a deadlock, and how does PostgreSQL handle it?">
            <p>
              A deadlock happens when transactions wait on each other&apos;s locks in a cycle, so none of them can
              ever proceed. PostgreSQL detects the cycle and aborts one transaction with
              <code>40P01 deadlock_detected</code> so the others can continue. Your application should retry the
              aborted one.
            </p>
            <CodeBlock
              title="Classic deadlock pattern"
              language="sql"
              code={`-- T1: lock row 1 then row 2
-- T2: lock row 2 then row 1
-- Prevent by locking resources in a consistent order.`}
            />
            <p>
              Detection is not instant. A waiting transaction only checks for a cycle after
              <code>deadlock_timeout</code>, which defaults to one second. That keeps the check cheap, since most
              waits are short and resolve on their own. It also means a deadlock costs at least a second of
              latency before anyone is aborted.
            </p>
            <CodeBlock
              title="Reproducing it in two sessions"
              language="sql"
              code={`-- Session A
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;

-- Session B
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 2;

-- Session A
UPDATE accounts SET balance = balance + 10 WHERE id = 2;  -- waits for B

-- Session B
UPDATE accounts SET balance = balance + 10 WHERE id = 1;  -- cycle
-- ERROR: deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456...`}
            />
            <p>
              Every deadlock is logged with both statements involved, so the server log tells you exactly which
              two code paths conflict. That log entry is the first thing to read, and it usually makes the fix
              obvious.
            </p>
            <CodeBlock
              title="Find them in the log"
              language="sql"
              code={`-- Lower this temporarily to see all lock waits, not just deadlocks
SET log_lock_waits = on;
SHOW deadlock_timeout;
-- Then search the server log for "deadlock detected"`}
            />
            <p>
              A deadlock is not a corruption or a failure of the database. It is the database protecting you from
              waiting forever. Treat it exactly like <code>40001</code>: retry the whole transaction with a short
              randomised backoff.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you avoid deadlocks by locking in a consistent order?">
            <p>
              A deadlock needs a cycle. If every transaction takes its locks in the same order, no cycle can form,
              because a transaction can only ever wait on one that is further along the same sequence. Consistent
              ordering is the single most effective fix.
            </p>
            <p>
              For a transfer between two accounts, order by primary key. Both directions of the transfer then lock
              the lower id first, so they queue instead of deadlocking.
            </p>
            <CodeBlock
              title="Lock both rows in id order"
              language="sql"
              code={`BEGIN;
-- One statement, ordered: always locks the smaller id first
SELECT id, balance
FROM accounts
WHERE id IN (1, 2)
ORDER BY id
FOR UPDATE;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`}
            />
            <p>
              Be careful: <code>ORDER BY</code> with <code>FOR UPDATE</code> is not a guarantee in every plan,
              because rows are locked as they are produced and the planner may reorder. The robust version locks
              each row explicitly in a known order, or sorts the ids in the application before locking.
            </p>
            <CodeBlock
              title="Explicit ordering in PL/pgSQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION transfer(p_a int, p_b int, p_amount bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  first_id  int := LEAST(p_a, p_b);
  second_id int := GREATEST(p_a, p_b);
BEGIN
  PERFORM 1 FROM accounts WHERE id = first_id  FOR UPDATE;
  PERFORM 1 FROM accounts WHERE id = second_id FOR UPDATE;

  UPDATE accounts SET balance = balance - p_amount WHERE id = p_a;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_b;
END;
$$;`}
            />
            <CodeBlock
              title="Sorting ids in application code"
              language="typescript"
              code={`async function transfer(fromId: number, toId: number, amount: number) {
  const ordered = [fromId, toId].sort((a, b) => a - b);

  return prisma.$transaction(async (tx) => {
    for (const id of ordered) {
      await tx.$queryRawUnsafe(
        'SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE',
        id,
      );
    }

    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}`}
            />
            <p>The other habits that remove deadlocks, in rough order of usefulness:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Order tables consistently too</strong>, not just rows. If one code path writes
                <code>orders</code> then <code>inventory</code> and another does the reverse, you have a deadlock
                across tables. Agree on one order and document it.
              </li>
              <li>
                <strong>Take all the locks up front</strong> in one statement, rather than acquiring more as the
                transaction progresses.
              </li>
              <li>
                <strong>Keep transactions short.</strong> A shorter hold time reduces the chance of overlap
                enormously, even without changing the order.
              </li>
              <li>
                <strong>Use a single atomic statement</strong> where you can, so there is nothing to interleave.
              </li>
              <li>
                <strong>Batch updates in a sorted order.</strong> A bulk <code>UPDATE ... WHERE id = ANY($1)</code>
                with an unsorted array is a common source of deadlocks between two jobs touching overlapping sets.
              </li>
              <li>
                <strong>Consider an advisory lock</strong> keyed on something stable, when the rows you must
                protect are hard to enumerate up front.
              </li>
              <li>
                <strong>Still write the retry loop.</strong> Ordering removes most deadlocks, not all of them. A
                unique index or a foreign key can introduce waits you did not plan.
              </li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What do NOWAIT and SKIP LOCKED do?">
            <p>
              By default a locking <code>SELECT</code> waits until the lock is free. The two modifiers change that
              behaviour, in opposite directions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>NOWAIT</code>: if any matching row is already locked, fail immediately with error
                <code>55P03 lock_not_available</code>. Nothing is locked and nothing is done.
              </li>
              <li>
                <code>SKIP LOCKED</code>: silently leave out any row that is already locked, and return the rest.
              </li>
            </ul>
            <CodeBlock
              title="Three behaviours, one query"
              language="sql"
              code={`-- Wait for the lock (default)
SELECT * FROM jobs WHERE id = 1 FOR UPDATE;

-- Fail fast rather than queue behind someone else
SELECT * FROM jobs WHERE id = 1 FOR UPDATE NOWAIT;

-- Take whatever is free, ignore the rest
SELECT * FROM jobs WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;`}
            />
            <p>
              <code>NOWAIT</code> is for interactive and latency-sensitive work. If a user clicks &quot;edit&quot;
              and someone else already holds the row, telling them straight away is far better than a request that
              hangs for thirty seconds and then times out. A related tool is
              <code>lock_timeout</code>, which waits but only for a bounded time.
            </p>
            <CodeBlock
              title="Fail fast, or wait a little"
              language="sql"
              code={`BEGIN;
-- Immediate error if taken
SELECT * FROM documents WHERE id = $1 FOR UPDATE NOWAIT;
COMMIT;

BEGIN;
-- Or wait at most 2 seconds, then error
SET LOCAL lock_timeout = '2s';
SELECT * FROM documents WHERE id = $1 FOR UPDATE;
COMMIT;`}
            />
            <p>
              <code>SKIP LOCKED</code> exists for queues. Several workers run the same query at the same time, and
              each one claims a different row without blocking, because the rows their colleagues hold are simply
              invisible to them.
            </p>
            <CodeBlock
              title="Queue claim"
              language="sql"
              code={`BEGIN;
SELECT id
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;

UPDATE jobs SET status = 'processing', worker_id = $1
WHERE id = $job_id;
COMMIT;`}
            />
            <p>
              The tidier form does the claim in one statement with a subquery and
              <code>RETURNING</code>, so there is no window between selecting and updating, and the worker gets
              the row data back immediately.
            </p>
            <CodeBlock
              title="Atomic claim in one statement"
              language="sql"
              code={`UPDATE jobs
SET status = 'processing', worker_id = $1, started_at = NOW()
WHERE id = (
  SELECT id
  FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;`}
            />
            <CodeBlock
              title="Prisma worker loop"
              language="typescript"
              code={`const CLAIM_SQL = [
  "UPDATE jobs",
  "SET status = 'processing', worker_id = $1, started_at = NOW()",
  "WHERE id = (",
  "  SELECT id FROM jobs",
  "  WHERE status = 'pending'",
  "  ORDER BY created_at",
  "  FOR UPDATE SKIP LOCKED",
  "  LIMIT 1",
  ")",
  "RETURNING id, payload",
].join(' ');

async function claimJob(workerId: string) {
  const rows = await prisma.$queryRawUnsafe(CLAIM_SQL, workerId);
  return rows[0] ?? null; // null means the queue is empty
}`}
            />
            <p>
              Two cautions. <code>SKIP LOCKED</code> gives up any guarantee about which rows you see, so never use
              it for a count, a report or anything that must be complete. And it does not make the work
              idempotent: if a worker crashes after claiming a job, the row stays
              <code>processing</code> forever, so you still need a heartbeat or a reaper that resets stale claims.
            </p>
            <CodeBlock
              title="Reclaiming abandoned jobs"
              language="sql"
              code={`UPDATE jobs
SET status = 'pending', worker_id = NULL
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '5 minutes';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you find out what is blocking a query?">
            <p>
              Start with <code>pg_stat_activity</code>. The <code>wait_event_type</code> and
              <code>wait_event</code> columns say what a backend is waiting on, and
              <code>pg_blocking_pids()</code> names the process holding whatever it wants. That function is the
              shortcut that replaced a page of manual joins.
            </p>
            <CodeBlock
              title="Who is blocking whom"
              language="sql"
              code={`SELECT
  pid,
  pg_blocking_pids(pid) AS blocked_by,
  state,
  wait_event_type,
  wait_event,
  NOW() - query_start AS waiting_for,
  left(query, 80) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0
ORDER BY waiting_for DESC;`}
            />
            <p>
              Then look up the blocker to see what it is actually doing. The common and frustrating answer is that
              its state is <code>idle in transaction</code>, meaning it is not running anything at all. It opened
              a transaction, took a lock, and the application then went off to do something else.
            </p>
            <CodeBlock
              title="Inspect the blocker"
              language="sql"
              code={`SELECT
  pid,
  usename,
  application_name,
  state,
  NOW() - xact_start   AS xact_age,
  NOW() - state_change AS in_state_for,
  left(query, 120)     AS last_query
FROM pg_stat_activity
WHERE pid = 12345;`}
            />
            <p>
              For the full picture, <code>pg_locks</code> shows every lock held and requested. Joining it to
              <code>pg_stat_activity</code> and to the relation name tells you which object is contended and at
              what level.
            </p>
            <CodeBlock
              title="Locks on a specific table"
              language="sql"
              code={`SELECT
  l.pid,
  l.mode,
  l.granted,
  a.state,
  left(a.query, 60) AS query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation = 'orders'::regclass
ORDER BY l.granted, l.pid;`}
            />
            <p>
              A <code>granted</code> value of false is a queued request. The <code>mode</code> column tells you
              whether it is a gentle <code>RowExclusiveLock</code> from a normal write or an
              <code>AccessExclusiveLock</code> from a migration, which is the usual culprit when everything stops
              at once.
            </p>
            <p>
              Once you know the offender, you can end it. <code>pg_cancel_backend</code> cancels the current
              statement and is the polite option. <code>pg_terminate_backend</code> closes the whole connection
              and is what you need for an idle transaction, since there is no statement to cancel.
            </p>
            <CodeBlock
              title="Cancel or terminate"
              language="sql"
              code={`SELECT pg_cancel_backend(12345);     -- stop the running query
SELECT pg_terminate_backend(12345);  -- close the connection`}
            />
            <p>
              Two more sources are worth naming. <code>SET log_lock_waits = on</code> writes a log line whenever a
              wait exceeds <code>deadlock_timeout</code>, which catches intermittent blocking you were not
              watching for. And the <code>pg_stat_statements</code> extension shows which statements consume the
              most total time, which is how you find the long transaction causing the problem rather than the
              victim reporting it.
            </p>
            <p>
              Preventing the situation beats diagnosing it. Set
              <code>idle_in_transaction_session_timeout</code> so a forgotten transaction cannot hold locks
              indefinitely, set <code>statement_timeout</code> so no single query runs away, and set a short
              <code>lock_timeout</code> in migrations so schema changes fail fast instead of queueing and blocking
              every request behind them.
            </p>
            <CodeBlock
              title="Guardrails"
              language="sql"
              code={`ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE app_user SET lock_timeout = '5s';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do advisory locks differ from row locks?">
            <p>
              An advisory lock is a lock on a number you choose, not on any row or table. PostgreSQL tracks it and
              enforces mutual exclusion, but the meaning is entirely yours. That is why they are called advisory:
              the database is holding a token on your behalf.
            </p>
            <p>
              They are the answer when the thing you need to protect is not a row. &quot;Only one instance of this
              cron job at a time&quot; or &quot;only one migration runner&quot; has no row to lock, and creating a
              table just to hold a lock row is what advisory locks replace.
            </p>
            <CodeBlock
              title="Transaction advisory lock"
              language="sql"
              code={`BEGIN;
SELECT pg_advisory_xact_lock(42);
-- critical section
COMMIT; -- lock released`}
            />
            <p>The differences that matter:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Scope.</strong> A row lock always ends at commit or rollback.
                <code>pg_advisory_lock</code> is held by the session and survives commit, so it lasts until you
                unlock it or disconnect. <code>pg_advisory_xact_lock</code> is transaction-scoped and releases
                automatically.
              </li>
              <li>
                <strong>No row required.</strong> You can lock a concept, or an id that does not exist yet, which
                is how you prevent two concurrent inserts of the same logical entity.
              </li>
              <li>
                <strong>They are advisory only.</strong> Nothing stops a transaction that ignores the convention
                from writing the same data. Every code path has to agree to take the lock.
              </li>
              <li>
                <strong>Shared memory, not the row.</strong> They come from the same pool as table locks, so tens
                of thousands of simultaneous advisory locks can exhaust it.
              </li>
            </ul>
            <p>
              Strongly prefer the transaction-scoped variants. A session-scoped lock leaked by an early
              <code>return</code> or an exception is held until that connection closes, and with a connection pool
              the connection is reused rather than closed, so the lock can effectively leak forever.
            </p>
            <CodeBlock
              title="Try without waiting"
              language="sql"
              code={`BEGIN;
-- Returns true or false immediately instead of blocking
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report')) AS got_it;
COMMIT;`}
            />
            <p>
              <code>hashtext</code> turns a readable name into the bigint the functions expect, which is far
              better than magic numbers scattered through a codebase. Keep the names in one constant file, because
              two unrelated features hashing to the same value would block each other for no reason. There is also
              a two-integer form, useful for &quot;lock this kind of thing, with this id&quot;.
            </p>
            <CodeBlock
              title="Two-key form"
              language="sql"
              code={`-- 1 = "user onboarding", second key = the user id
SELECT pg_try_advisory_xact_lock(1, 12345);`}
            />
            <CodeBlock
              title="A singleton job in Prisma"
              language="typescript"
              code={`const LOCKS = { nightlyReport: 918_273 } as const;

export async function runNightlyReport() {
  return prisma.$transaction(async (tx) => {
    const [{ got_it }] = await tx.$queryRawUnsafe<{ got_it: boolean }[]>(
      'SELECT pg_try_advisory_xact_lock($1) AS got_it',
      LOCKS.nightlyReport,
    );

    if (!got_it) return { skipped: true }; // another instance is running

    await buildReport(tx);
    return { skipped: false };
  });
}`}
            />
            <p>
              That pattern is how you make a scheduled job safe when several application instances all have a
              timer. Note the whole job runs inside the transaction, which is fine for a short task but conflicts
              with the advice about long transactions in Lesson 4. For a long job, hold a session-scoped lock with
              a dedicated connection instead, and release it in a <code>finally</code> block.
            </p>
            <p>
              Advisory locks are also visible in <code>pg_locks</code> with
              <code>locktype = &apos;advisory&apos;</code>, so you can see who holds one when diagnosing a stuck
              job.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
