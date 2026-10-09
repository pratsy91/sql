import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Transactions with Prisma - Module 9 - Most Asked Interview Questions',
  description:
    'Most asked Prisma transaction interview questions: $transaction with an array vs an interactive callback, setting isolationLevel in Prisma 5+, why long interactive transactions exhaust the connection pool, retrying in application code, and idempotent transfers.',
};

export default function M9L5TransactionsWithPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Transactions with Prisma</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Everything from the earlier lessons still applies when an ORM is in the way. This lesson covers the two
          shapes of a Prisma transaction, how to set the isolation level, the connection pool trap, and how to
          retry safely.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you run a transaction with Prisma?">
            <p>
              Use <code>$transaction</code>. Pass an array of operations for a fixed list, or pass a callback
              function when a later query depends on the result of an earlier one.
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
            <p>
              The rule inside a callback: use the <code>tx</code> client for every query. The outer
              <code>prisma</code> client runs on a different connection and is not part of the transaction, so its
              writes commit immediately and survive a rollback. This is the most common Prisma transaction bug.
            </p>
            <p>
              Also note the built-in operations that are already atomic on their own.
              <code>upsert</code>, <code>createMany</code>, <code>updateMany</code> and
              <code>deleteMany</code> are each a single statement, and nested writes on a relation are wrapped in
              a transaction automatically. If one of those covers your case, you do not need
              <code>$transaction</code> at all.
            </p>
            <CodeBlock
              title="Already atomic without $transaction"
              language="typescript"
              code={`// One statement: INSERT ... ON CONFLICT DO UPDATE
await prisma.user.upsert({
  where: { email },
  create: { email, name },
  update: { name },
});

// A nested write is wrapped in a transaction for you
await prisma.order.create({
  data: {
    userId: 1,
    items: { create: [{ sku: 'A1', quantity: 2 }] },
  },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between a sequential array $transaction and an interactive callback?">
            <p>
              They produce the same all-or-nothing guarantee but work quite differently, and choosing wrongly is
              either a performance problem or a correctness problem.
            </p>
            <p>
              The <strong>array form</strong> takes promises you have already built. Prisma sends them in order on
              one connection inside one transaction. Your code cannot look at any result until the whole thing has
              finished, so there is no decision-making in the middle.
            </p>
            <p>
              The <strong>callback form</strong> hands you a <code>tx</code> client and keeps the transaction open
              while your function runs. That lets you read a value, branch on it, and write accordingly. The cost
              is that the transaction stays open for as long as your JavaScript takes.
            </p>
            <CodeBlock
              title="Side by side"
              language="typescript"
              code={`// Array: fixed list, no branching, one round trip batch
const [order, item] = await prisma.$transaction([
  prisma.order.create({ data: { userId: 1 } }),
  prisma.orderItem.create({ data: { orderId: 99, sku: 'A1' } }),
]);
// Note: you cannot use order.id above, because nothing has run yet.

// Callback: needed as soon as one step depends on another
const created = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { userId: 1 } });
  await tx.orderItem.create({ data: { orderId: order.id, sku: 'A1' } });
  return order;
});`}
            />
            <p>How to choose:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use the array form when the operations are independent and the values are all known up front. It
                is faster and cannot be held open by application code.
              </li>
              <li>
                Use the callback form when you need an id from an earlier insert, a conditional branch, a
                <code>FOR UPDATE</code> lock before a write, or a raw query mixed with model calls.
              </li>
              <li>
                Prefer the array form when both would work. Fewer things can go wrong.
              </li>
            </ul>
            <p>Three practical differences that come up as follow-up questions:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The array form returns an array of results in the same order as the input, fully typed. The
                callback form returns whatever you return.
              </li>
              <li>
                Only the callback form accepts <code>maxWait</code> and <code>timeout</code>, because only it can
                be held open by your own code.
              </li>
              <li>
                A nested <code>$transaction</code> inside a callback does not open a second transaction. Prisma
                reuses the existing one, so plan for the whole thing to roll back together.
              </li>
            </ul>
            <p>
              One more thing the array form cannot do: it is a list of Prisma operations, not arbitrary code, so
              there is no place to put a <code>SELECT ... FOR UPDATE</code> before deciding. Any
              check-then-act logic needs the callback.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why do long interactive transactions exhaust the connection pool?">
            <p>
              A Prisma interactive transaction holds one connection from the pool for its entire duration, from the
              first query to the commit. Nothing else can use that connection during that time, including the
              parts where your code is doing no database work at all.
            </p>
            <p>
              The pool is small by default. Prisma sizes it at roughly twice the number of CPU cores plus one, so
              a typical container has about nine connections. Nine concurrent interactive transactions is all it
              takes for the tenth request to start waiting.
            </p>
            <CodeBlock
              title="How the pool is configured"
              language="typescript"
              code={`// connection_limit and pool_timeout are query parameters on the URL
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"

// Default connection_limit is about (num_cpus * 2) + 1`}
            />
            <p>
              When the pool is empty, requests queue for <code>pool_timeout</code> seconds and then fail with
              Prisma error <code>P2024</code>, &quot;Timed out fetching a new connection from the connection
              pool&quot;. The symptom is a wave of timeouts across endpoints that have nothing to do with the slow
              transaction, which makes it hard to diagnose.
            </p>
            <CodeBlock
              title="The pattern that causes it"
              language="typescript"
              code={`// BAD: the connection is held across a slow external call
await prisma.$transaction(async (tx) => {
  const order = await tx.order.findUniqueOrThrow({ where: { id } });

  const charge = await paymentProvider.charge(order.totalCents); // 2-10s
  await sendReceiptEmail(order.userId);                          // 1s

  await tx.order.update({
    where: { id },
    data: { status: 'paid', chargeId: charge.id },
  });
});
// Under load: every connection is parked on an HTTP call, not on SQL.`}
            />
            <p>
              The fix is to move everything that is not a database operation outside the transaction. Read and
              validate first, do the slow work with no transaction open, then reopen a short transaction for the
              writes.
            </p>
            <CodeBlock
              title="Short write window"
              language="typescript"
              code={`// 1. Read outside a transaction
const order = await prisma.order.findUniqueOrThrow({ where: { id } });

// 2. Slow external work, no connection held
const charge = await paymentProvider.charge(order.totalCents);

// 3. A short transaction for the writes only
await prisma.$transaction(async (tx) => {
  const updated = await tx.order.updateMany({
    where: { id, status: 'pending' },   // guard against a concurrent change
    data: { status: 'paid', chargeId: charge.id },
  });

  if (updated.count === 0) throw new Error('order already processed');

  await tx.payment.create({ data: { orderId: id, chargeId: charge.id } });
});

// 4. Notifications after the commit, so a rollback cannot send a false receipt
await sendReceiptEmail(order.userId);`}
            />
            <p>
              Always set <code>timeout</code> and <code>maxWait</code> as a safety net.
              <code>maxWait</code> caps how long you wait for a connection, and <code>timeout</code> caps how long
              the callback may run before Prisma rolls it back. The defaults are 2 seconds and 5 seconds, and a
              transaction that exceeds the timeout fails rather than holding the connection forever.
            </p>
            <CodeBlock
              title="Bounding it"
              language="typescript"
              code={`await prisma.$transaction(
  async (tx) => {
    // only fast database work belongs here
  },
  { maxWait: 2000, timeout: 5000 },
);`}
            />
            <p>
              Two deployment notes worth raising. In a serverless environment each instance has its own pool, so
              many instances can exceed the database&apos;s own
              <code>max_connections</code> even though each pool looks small; that is what a pooler such as
              PgBouncer or Prisma Accelerate is for. And with PgBouncer in transaction pooling mode, an
              interactive transaction occupies a server connection for its whole duration too, so the problem
              moves rather than disappears.
            </p>
            <p>
              The summary answer for an interview: an interactive transaction is a lock on a connection as well as
              on rows, so its duration is a capacity cost, not just a latency cost.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma set isolationLevel (Prisma 5+)?">
            <p>
              Pass <code>isolationLevel</code> in the transaction options. Interactive transactions also accept
              <code>maxWait</code> and <code>timeout</code>. If the level can produce serialization failures, you
              must catch and retry.
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
            <p>
              The enum covers the four names PostgreSQL accepts:
              <code>ReadUncommitted</code>, <code>ReadCommitted</code>, <code>RepeatableRead</code> and
              <code>Serializable</code>. Remember from Lesson 2 that PostgreSQL treats
              <code>ReadUncommitted</code> as <code>ReadCommitted</code>, so it changes nothing.
            </p>
            <p>
              The option works on both forms of <code>$transaction</code>, including the array form, which is
              useful when you want a stronger level without an interactive callback.
            </p>
            <CodeBlock
              title="Isolation level on the array form"
              language="typescript"
              code={`await prisma.$transaction(
  [
    prisma.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
    prisma.account.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),
  ],
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
);`}
            />
            <p>
              Note the example above still has a real flaw, and interviewers like to point at it. Reading
              <code>stock</code> and then decrementing it is a check-then-act. Under
              <code>Serializable</code> it is safe but will abort under contention, and without a retry loop those
              aborts become user-facing errors. A single atomic statement is both safer and cheaper.
            </p>
            <CodeBlock
              title="Avoid needing the strong level at all"
              language="typescript"
              code={`// One statement, no read-then-write, no isolation level needed
const result = await prisma.product.updateMany({
  where: { id: productId, stock: { gte: 1 } },
  data: { stock: { decrement: 1 } },
});

if (result.count === 0) throw new Error('out of stock');`}
            />
            <p>
              Pair that with a database constraint so the rule holds even if another writer bypasses the
              application. Prisma has no <code>CHECK</code> syntax, so it lives in a raw SQL migration.
            </p>
            <CodeBlock
              title="The backstop constraint"
              language="sql"
              code={`ALTER TABLE products
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you retry a failed transaction in application code?">
            <p>
              Prisma does not retry for you. A transaction aborted by a serialization failure or a deadlock throws
              and the work is gone, so the retry loop is your responsibility. The rules from Lesson 2 apply: retry
              the whole transaction, only for transient error codes, with a bounded number of attempts and
              randomised backoff.
            </p>
            <p>
              Finding the code takes one extra step in Prisma. A raw PostgreSQL error arrives as
              <code>P2010</code> with the real <code>SQLSTATE</code> in <code>meta.code</code>. Model operations
              surface their own codes such as <code>P2002</code> for a unique violation. A helper that checks both
              places keeps the call sites clean.
            </p>
            <CodeBlock
              title="A reusable retry wrapper"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

// 40001 serialization_failure, 40P01 deadlock_detected
const RETRYABLE_SQLSTATE = new Set(['40001', '40P01']);

function isRetryable(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;

  const meta = e.meta as { code?: string } | undefined;
  if (meta?.code && RETRYABLE_SQLSTATE.has(meta.code)) return true;

  // P2034: Prisma's own "transaction failed due to a write conflict
  // or a deadlock" code
  return e.code === 'P2034';
}

export async function withRetry<T>(
  work: () => Promise<T>,
  attempts = 5,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await work();
    } catch (e) {
      if (!isRetryable(e)) throw e;   // business errors must not retry
      lastError = e;

      const base = 25 * 2 ** attempt;              // 25, 50, 100, 200, 400 ms
      const delay = base * (0.5 + Math.random());  // jitter
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}`}
            />
            <CodeBlock
              title="Using it"
              language="typescript"
              code={`const moved = await withRetry(() =>
  prisma.$transaction(
    async (tx) => {
      const from = await tx.account.findUniqueOrThrow({ where: { id: fromId } });
      if (from.balance < amount) {
        throw new InsufficientFundsError();  // not retryable, thrown straight out
      }

      await tx.account.update({
        where: { id: fromId },
        data: { balance: { decrement: amount } },
      });
      await tx.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } },
      });

      return { fromId, toId, amount };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 5000,
    },
  ),
);

// Side effects only after the commit succeeded
await notifyTransfer(moved);`}
            />
            <p>The details that make this correct rather than merely present:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The wrapper is <em>outside</em> <code>$transaction</code>. A retry must start a brand new
                transaction, because the old snapshot is gone and every read has to happen again.
              </li>
              <li>
                Business errors are not retried. <code>isRetryable</code> returns false for anything that is not a
                known transient database code, so a validation failure fails once.
              </li>
              <li>
                No side effects inside the callback. Emails, webhooks and payment calls go after the commit,
                otherwise a retry duplicates them.
              </li>
              <li>
                Backoff has jitter. Without randomness two conflicting transactions retry in lockstep and collide
                again.
              </li>
              <li>
                Attempts are capped, and the last error is rethrown so the caller sees a real failure rather than
                a silent success.
              </li>
              <li>
                Retries interact with the pool. Each attempt takes a connection, so a storm of retries can
                exhaust it. Keep the cap low and the transactions short.
              </li>
            </ul>
            <p>
              Log the retry rate. A small number is healthy and means the safety net is doing its job. A large
              number means the transactions are too long or too contended, and the answer is to redesign them,
              not to raise the attempt count.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you implement idempotent transfers under concurrency?">
            <p>
              Idempotent means running the same request twice has the same effect as running it once. You need it
              because a client that times out will retry, and it cannot tell whether the first attempt committed.
            </p>
            <p>
              Combine four things: a unique idempotency key so a repeat is detected, row locks or a serializable
              transaction so concurrent transfers cannot interleave, constraint-backed invariants such as
              <code>CHECK (balance &gt;= 0)</code> so a bug cannot produce impossible data, and a retry on
              deadlock or serialization failure. Never rely on read-then-write without locking or an atomic update.
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
            <p>
              The <code>ON CONFLICT DO NOTHING</code> is the heart of it. The unique index on
              <code>idempotency_key</code> means only one of two simultaneous identical requests can insert the
              row, and the loser knows it lost because no row was inserted. Adding
              <code>RETURNING</code> tells you which case you are in without a second query.
            </p>
            <CodeBlock
              title="Detecting the duplicate in one statement"
              language="sql"
              code={`INSERT INTO transfer_requests (idempotency_key, from_id, to_id, amount)
VALUES ($1, $2, $3, $4)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
-- Zero rows returned means this key was already processed.`}
            />
            <CodeBlock
              title="The same thing in Prisma"
              language="typescript"
              code={`export async function transfer(
  key: string,
  fromId: number,
  toId: number,
  amount: number,
) {
  return withRetry(() =>
    prisma.$transaction(async (tx) => {
      // 1. Claim the key. A duplicate request stops here.
      const claimed = await tx.transferRequest.createMany({
        data: [{ idempotencyKey: key, fromId, toId, amount }],
        skipDuplicates: true,
      });

      if (claimed.count === 0) {
        const existing = await tx.transferRequest.findUniqueOrThrow({
          where: { idempotencyKey: key },
        });
        return { status: 'already_applied', id: existing.id };
      }

      // 2. Lock both rows in a fixed order to avoid deadlocks
      for (const id of [fromId, toId].sort((a, b) => a - b)) {
        await tx.$queryRawUnsafe(
          'SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE',
          id,
        );
      }

      // 3. Debit conditionally, and verify it actually happened
      const debited = await tx.account.updateMany({
        where: { id: fromId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });

      if (debited.count === 0) throw new InsufficientFundsError();

      // 4. Credit
      await tx.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } },
      });

      return { status: 'applied' };
    }),
  );
}`}
            />
            <p>
              <code>createMany</code> with <code>skipDuplicates</code> compiles to
              <code>ON CONFLICT DO NOTHING</code> and returns a count, which is why it is used here instead of
              <code>create</code>. Catching <code>P2002</code> from a plain <code>create</code> would also work,
              but it aborts the transaction, so you would need a savepoint to continue.
            </p>
            <p>The parts people leave out, and that make the difference in an interview:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The key must be supplied by the client</strong>, generated once per logical request and
                reused across retries. A key generated on the server per attempt makes every retry look new.
              </li>
              <li>
                <strong>Store the result, not just the key.</strong> A duplicate request should get the original
                response back, which means recording the outcome alongside the key.
              </li>
              <li>
                <strong>Constraints are the backstop.</strong> Add
                <code>CHECK (balance &gt;= 0)</code> and a unique index on the key. Application logic can have
                bugs; the constraint cannot be bypassed.
              </li>
              <li>
                <strong>An append-only ledger beats mutable balances.</strong> Insert a row per movement and
                derive the balance, or keep a cached balance maintained by a trigger. Inserts do not conflict with
                each other the way updates to one row do.
              </li>
              <li>
                <strong>Expire old keys.</strong> The table grows forever otherwise. Delete keys older than your
                retry window, typically 24 hours.
              </li>
            </ul>
            <CodeBlock
              title="Ledger design, for comparison"
              language="sql"
              code={`CREATE TABLE ledger_entries (
  id              bigserial PRIMARY KEY,
  account_id      int         NOT NULL REFERENCES accounts(id),
  amount_cents    bigint      NOT NULL,
  transfer_key    text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, transfer_key)
);

-- Balance is derived, so there is no hot row to contend on
SELECT account_id, SUM(amount_cents) AS balance
FROM ledger_entries
GROUP BY account_id;`}
            />
            <p>
              The unique constraint on <code>(account_id, transfer_key)</code> makes each side of the transfer
              idempotent by itself, so even a partially retried operation cannot double-post. That is usually a
              better answer than any amount of locking.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
