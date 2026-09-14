import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 9: Transactions & Concurrency - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL transaction interview questions: ACID, isolation levels, locks, deadlocks, MVCC, and Prisma $transaction — Junior to Senior.',
};

export default function Module9Transactions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 9: Transactions & Concurrency</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 9 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are BEGIN, COMMIT, and ROLLBACK?">
            <p>
              <code>BEGIN</code> starts a transaction, <code>COMMIT</code> persists all changes atomically, and
              <code>ROLLBACK</code> undoes everything since <code>BEGIN</code>. In PostgreSQL, a single statement
              is already atomic; multi-statement workflows need an explicit transaction.
            </p>
            <CodeBlock
              title="Basic transaction"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- On error: ROLLBACK;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ACID.">
            <p>
              <strong>Atomicity</strong>: all-or-nothing. <strong>Consistency</strong>: constraints/invariants hold
              after commit. <strong>Isolation</strong>: concurrent transactions do not incorrectly interfere.
              <strong>Durability</strong>: committed data survives crashes (WAL + fsync).
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the default isolation level in PostgreSQL?">
            <p>
              <code>READ COMMITTED</code>. Each statement sees only data committed before that statement began.
              Within one transaction, two <code>SELECT</code>s can see different committed data if another
              transaction commits between them.
            </p>
            <CodeBlock
              title="Set isolation"
              language="sql"
              code={`BEGIN ISOLATION LEVEL REPEATABLE READ;
-- or
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What are dirty reads, non-repeatable reads, and phantom reads?">
            <p>
              <strong>Dirty read</strong>: see uncommitted data from another transaction (PostgreSQL never allows
              this). <strong>Non-repeatable read</strong>: re-reading a row shows a different committed value.
              <strong>Phantom read</strong>: re-running a range query finds new/missing rows due to concurrent
              inserts/deletes.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you run a transaction with Prisma?">
            <p>
              Use sequential <code>$transaction([...])</code> for a fixed list of operations, or an interactive
              callback transaction when later queries depend on earlier results.
            </p>
            <CodeBlock
              title="Prisma $transaction"
              language="typescript"
              code={`// Sequential
await prisma.$transaction([
  prisma.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } },
  }),
  prisma.account.update({
    where: { id: 2 },
    data: { balance: { increment: 100 } },
  }),
]);

// Interactive
await prisma.$transaction(async (tx) => {
  const from = await tx.account.findUniqueOrThrow({ where: { id: 1 } });
  if (from.balance < 100) throw new Error('insufficient funds');
  await tx.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } },
  });
  await tx.account.update({
    where: { id: 2 },
    data: { balance: { increment: 100 } },
  });
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Compare READ COMMITTED, REPEATABLE READ, and SERIALIZABLE in PostgreSQL.">
            <p>
              <code>READ COMMITTED</code>: per-statement snapshots; allows non-repeatable/phantoms.
              <code>REPEATABLE READ</code>: transaction-wide snapshot; no non-repeatable/phantoms from concurrent
              commits, but write conflicts can raise serialization errors on update of rows changed since snapshot.
              <code>SERIALIZABLE</code> (SSI): strongest; detects more anomalies and may abort with
              <code>40001 serialization_failure</code> — retry the transaction.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is MVCC and why does PostgreSQL use it?">
            <p>
              Multi-Version Concurrency Control keeps multiple row versions so readers do not block writers (and
              vice versa) for normal SELECTs. Each transaction sees a snapshot consistent with its isolation
              rules. Old versions remain until VACUUM removes them.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain row locks vs table locks and SELECT FOR UPDATE.">
            <p>
              Row locks protect specific tuples; table locks protect DDL/heavy operations.
              <code>SELECT ... FOR UPDATE</code> locks matched rows so other transactions cannot modify them until
              commit/rollback — classic for “check balance then debit” patterns. <code>FOR SHARE</code> allows
              concurrent share locks but blocks updates.
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
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a deadlock, and how does PostgreSQL handle it?">
            <p>
              A deadlock occurs when transactions wait on each other&apos;s locks in a cycle. PostgreSQL detects
              deadlocks and aborts one transaction with an error so the others can proceed. Application code
              should retry the aborted transaction.
            </p>
            <CodeBlock
              title="Classic deadlock pattern"
              language="sql"
              code={`-- T1: lock row 1 then row 2
-- T2: lock row 2 then row 1
-- Prevent by locking resources in a consistent order.`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What problems do long-running transactions cause?">
            <p>
              They hold locks longer (blocking others), delay VACUUM (table bloat / wraparound risk), hold
              snapshots that keep dead tuples visible to the xmin horizon, and increase conflict probability
              under SERIALIZABLE. Keep transactions short; do not wait on external HTTP calls inside a DB
              transaction.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do SAVEPOINTs work?">
            <p>
              <code>SAVEPOINT</code> creates a nested rollback point inside a transaction. You can
              <code>ROLLBACK TO SAVEPOINT</code> without aborting the entire transaction — useful for optional
              steps.
            </p>
            <CodeBlock
              title="SAVEPOINT"
              language="sql"
              code={`BEGIN;
INSERT INTO orders (user_id) VALUES (1);
SAVEPOINT sp1;
INSERT INTO order_items (order_id, sku) VALUES (currval('orders_id_seq'), 'BAD');
-- if that fails or you choose to undo:
ROLLBACK TO SAVEPOINT sp1;
COMMIT;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How does Prisma set isolationLevel (Prisma 5+)?">
            <p>
              Pass <code>isolationLevel</code> in the transaction options. Interactive transactions also support
              <code>maxWait</code>, <code>timeout</code>. On serialization failures, catch and retry.
            </p>
            <CodeBlock
              title="Prisma isolationLevel"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

await prisma.$transaction(
  async (tx) => {
    const item = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    if (item.stock < 1) throw new Error('out of stock');
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } },
    });
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000,
    timeout: 10000,
  },
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you implement idempotent transfers under concurrency?">
            <p>
              Combine a unique idempotency key, row locks or serializable transactions, and constraint-backed
              invariants (e.g., <code>CHECK (balance &gt;= 0)</code>). Retry on deadlock/serialization failure.
              Never rely on read-then-write without locking or atomic updates.
            </p>
            <CodeBlock
              title="Atomic update + idempotency"
              language="sql"
              code={`BEGIN;
INSERT INTO transfer_requests (idempotency_key, from_id, to_id, amount)
VALUES ($1, $2, $3, $4)
ON CONFLICT (idempotency_key) DO NOTHING;

-- if inserted, apply balances atomically
UPDATE accounts SET balance = balance - $4
WHERE id = $2 AND balance >= $4;
-- check rowcount = 1, else ROLLBACK
UPDATE accounts SET balance = balance + $4 WHERE id = $3;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is SKIP LOCKED and when is it useful?">
            <p>
              <code>FOR UPDATE SKIP LOCKED</code> skips already-locked rows instead of waiting — ideal for job
              queues where multiple workers claim work without blocking each other.
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do advisory locks differ from row locks?">
            <p>
              Advisory locks are application-defined locks (<code>pg_advisory_lock</code> /
              <code>pg_try_advisory_xact_lock</code>) not tied to a table row. Useful for coordinating “only one
              migrator/cron” style work. Prefer transaction-scoped advisory locks so they release on commit.
            </p>
            <CodeBlock
              title="Transaction advisory lock"
              language="sql"
              code={`BEGIN;
SELECT pg_advisory_xact_lock(42);
-- critical section
COMMIT; -- lock released`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does READ COMMITTED evaluate UPDATE visibility in PostgreSQL?">
            <p>
              If a concurrent transaction updates a row you are about to update, PostgreSQL waits, then re-evaluates
              the <code>WHERE</code> clause on the latest committed version under READ COMMITTED. This surprises
              candidates: an update can “skip” a row if the predicate no longer matches after waiting. Use
              <code>REPEATABLE READ</code>/<code>SERIALIZABLE</code> or explicit <code>FOR UPDATE</code> when you
              need stricter behavior.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
