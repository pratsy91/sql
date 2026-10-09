import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Transaction Basics - Module 9 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL transaction interview questions: BEGIN, COMMIT and ROLLBACK, ACID explained, autocommit and single-statement atomicity, what happens after an error, SAVEPOINTs, and how to tell if you are inside a transaction.',
};

export default function M9L1TransactionBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Transaction Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A transaction is a group of statements that either all succeed or all get undone. This lesson covers how
          to start and finish one, what guarantees you get, what happens when a statement inside fails, and how to
          undo only part of the work.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are BEGIN, COMMIT, and ROLLBACK?">
            <p>
              <code>BEGIN</code> starts a transaction. <code>COMMIT</code> saves every change made inside it.
              <code>ROLLBACK</code> throws them all away.
            </p>
            <p>
              One SQL statement is already all-or-nothing on its own. You reach for <code>BEGIN</code> when
              several statements must succeed together, like moving money between two accounts.
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
            <p>
              <code>START TRANSACTION</code> is the standard SQL spelling and does the same thing.
              <code>END</code> is an alias for <code>COMMIT</code>. If your connection drops before you commit,
              PostgreSQL rolls the transaction back for you, so an interrupted transfer never leaves half the
              money moved.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ACID.">
            <p>
              ACID is four guarantees a transactional database gives you. The letters stand for Atomicity,
              Consistency, Isolation and Durability.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Atomicity</strong>: all steps save, or none do. There is no half-finished transaction.
              </li>
              <li>
                <strong>Consistency</strong>: rules such as &quot;balance cannot be negative&quot; still hold
                after the transaction. Constraints are checked, so the database never moves from a valid state to
                an invalid one.
              </li>
              <li>
                <strong>Isolation</strong>: two transactions running at the same time do not see each
                other&apos;s half-done work.
              </li>
              <li>
                <strong>Durability</strong>: once <code>COMMIT</code> returns, a crash or power loss does not lose
                the data.
              </li>
            </ul>
            <p>
              Durability in PostgreSQL comes from the write-ahead log, usually shortened to WAL. Every change is
              written to that sequential log and flushed to disk before <code>COMMIT</code> returns. After a
              crash, PostgreSQL replays the log to rebuild anything that had not reached the data files yet.
            </p>
            <p>
              Consistency in the ACID sense is narrower than people expect: it means the database enforces the
              constraints you declared. It does not mean your business rules are correct. If you never added a
              <code>CHECK</code> constraint, nothing stops a negative balance.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is autocommit, and why is a single statement already atomic?">
            <p>
              If you run a statement without writing <code>BEGIN</code>, PostgreSQL wraps it in its own
              transaction, runs it, and commits it. That behaviour is called autocommit, and it is on by default
              in psql, in drivers, and in Prisma.
            </p>
            <p>
              So there is no such thing as a statement running outside a transaction. Every statement is in one;
              the only question is whether you opened it or the server did.
            </p>
            <CodeBlock
              title="Implicit and explicit are the same thing"
              language="sql"
              code={`-- Autocommit: the server wraps this for you
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- Exactly equivalent
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;`}
            />
            <p>
              This is why a single statement is already all-or-nothing. An <code>UPDATE</code> that matches a
              million rows and fails on the last one leaves none of them changed. You never see a partially
              applied statement.
            </p>
            <CodeBlock
              title="One statement, many rows, still atomic"
              language="sql"
              code={`-- If row 999,999 violates the CHECK constraint,
-- none of the earlier rows are updated either.
UPDATE accounts SET balance = balance - 100;`}
            />
            <p>
              The practical consequence: you only need an explicit transaction when two or more statements must
              agree. A common mistake is doing in three statements what one statement can do atomically, then
              wrapping it in a transaction to fix the race.
            </p>
            <CodeBlock
              title="Prefer one atomic statement"
              language="sql"
              code={`-- Needs a transaction and a lock to be safe
SELECT balance FROM accounts WHERE id = 1;
-- application checks the value
UPDATE accounts SET balance = 400 WHERE id = 1;

-- Atomic on its own: reads and writes in one step
UPDATE accounts
SET balance = balance - 100
WHERE id = 1 AND balance >= 100;`}
            />
            <p>
              A related note: DDL such as <code>CREATE TABLE</code> and <code>ALTER TABLE</code> is transactional
              in PostgreSQL, which many other databases do not allow. You can roll back a schema change, which is
              why migrations can be made all-or-nothing.
            </p>
            <CodeBlock
              title="Prisma and autocommit"
              language="typescript"
              code={`// Each call is its own transaction
await prisma.account.update({
  where: { id: 1 },
  data: { balance: { decrement: 100 } },
});

// decrement is compiled to "balance = balance - 100",
// so it is atomic without an explicit transaction.

// Two calls need one transaction to agree
await prisma.$transaction([
  prisma.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
  prisma.account.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),
]);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What happens to the rest of a transaction after a statement fails?">
            <p>
              The whole transaction is marked as aborted. Every following statement fails immediately with
              &quot;current transaction is aborted, commands ignored until end of transaction block&quot;. The
              only things PostgreSQL will accept are <code>ROLLBACK</code>, or a
              <code>ROLLBACK TO SAVEPOINT</code>.
            </p>
            <p>
              This surprises people coming from MySQL, where a failed statement leaves the transaction usable. In
              PostgreSQL there is no continuing after an error.
            </p>
            <CodeBlock
              title="One error poisons the transaction"
              language="sql"
              code={`BEGIN;
INSERT INTO users (email) VALUES ('ada@example.com');
INSERT INTO users (email) VALUES ('ada@example.com');  -- unique violation

SELECT 1;    -- ERROR: current transaction is aborted
COMMIT;      -- behaves as ROLLBACK: nothing is saved`}
            />
            <p>
              Note the last line. Issuing <code>COMMIT</code> on an aborted transaction does not commit anything.
              PostgreSQL rolls back and tells you it did, so the first insert is lost too.
            </p>
            <p>
              There are two ways to survive an expected error. The first is a savepoint, which lets you undo only
              the failed part. The second, and usually better, is to write the statement so the error never
              happens.
            </p>
            <CodeBlock
              title="Recover with a savepoint"
              language="sql"
              code={`BEGIN;
INSERT INTO users (email) VALUES ('ada@example.com');

SAVEPOINT sp_maybe;
INSERT INTO users (email) VALUES ('ada@example.com');  -- fails
ROLLBACK TO SAVEPOINT sp_maybe;   -- transaction is usable again

INSERT INTO audit_log (msg) VALUES ('duplicate skipped');
COMMIT;   -- the first insert and the audit row are saved`}
            />
            <CodeBlock
              title="Avoid the error instead"
              language="sql"
              code={`BEGIN;
INSERT INTO users (email) VALUES ('ada@example.com')
ON CONFLICT (email) DO NOTHING;   -- no error to recover from
COMMIT;`}
            />
            <p>
              Inside PL/pgSQL an <code>EXCEPTION</code> block does the savepoint work for you, which is why
              catching <code>unique_violation</code> there lets the rest of the function continue.
            </p>
            <p>
              In application code this is the source of a classic bug: catching the error in JavaScript, logging
              it, and carrying on with the next query inside the same transaction. Every later query fails, and
              the error message points at innocent code. Prisma avoids this by aborting the whole
              <code>$transaction</code> when the callback throws, so let the error propagate rather than swallowing
              it.
            </p>
            <CodeBlock
              title="Do not swallow errors inside a transaction"
              language="typescript"
              code={`// BROKEN: the transaction is already aborted,
// so every later query in the callback fails too
await prisma.$transaction(async (tx) => {
  try {
    await tx.user.create({ data: { email } });
  } catch (e) {
    console.error(e);   // swallowed
  }
  await tx.auditLog.create({ data: { msg: 'created' } }); // fails
});

// CORRECT: check first, or let it throw and retry outside
await prisma.$transaction(async (tx) => {
  await tx.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  await tx.auditLog.create({ data: { msg: 'created' } });
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do SAVEPOINTs work?">
            <p>
              A <code>SAVEPOINT</code> is a named marker inside a transaction. You can
              <code>ROLLBACK TO SAVEPOINT</code> to undo everything after that marker without losing the earlier
              work or ending the transaction. It is useful for optional steps.
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
            <p>
              Rolling back to a savepoint does not remove it, so you can retry the same block repeatedly.
              <code>RELEASE SAVEPOINT</code> discards the marker while keeping its work, which frees the resources
              it was holding.
            </p>
            <CodeBlock
              title="Retry loop against one savepoint"
              language="sql"
              code={`BEGIN;
SAVEPOINT sp_try;
-- attempt 1 fails
ROLLBACK TO SAVEPOINT sp_try;
-- attempt 2 succeeds
RELEASE SAVEPOINT sp_try;
COMMIT;`}
            />
            <p>
              Savepoints nest, and rolling back to an outer one discards every savepoint created after it. They
              are also what PL/pgSQL <code>EXCEPTION</code> blocks and JDBC or Prisma nested transactions are built
              on underneath.
            </p>
            <p>
              The cost is worth knowing for senior conversations. Each savepoint creates a subtransaction with its
              own transaction id. Thousands of them in one transaction cause real performance problems, because
              once a transaction exceeds 64 subtransactions PostgreSQL spills the list to disk and every other
              backend checking row visibility pays for the lookups. So savepoints are for a handful of optional
              steps, not for a loop over a million rows.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How can you tell whether you are inside a transaction?">
            <p>
              There are several ways, and which one you use depends on whether you are at a prompt, inside SQL, or
              debugging a connection pool from outside.
            </p>
            <p>
              In psql, turn on the prompt indicator. It shows <code>=</code> when idle,
              <code>*</code> inside a transaction, and <code>!</code> when the transaction is aborted. This is the
              fastest feedback there is.
            </p>
            <CodeBlock
              title="psql prompt"
              language="sql"
              code={`\\set PROMPT1 '%/%R%x%# '
-- postgres=#   idle
-- postgres=*#  in a transaction
-- postgres=!#  transaction aborted`}
            />
            <p>
              From SQL, compare <code>txid_current_if_assigned()</code> with
              <code>pg_current_xact_id_if_assigned()</code> on newer versions. The useful trick is comparing
              transaction-scoped and statement-scoped clocks: <code>now()</code> is fixed for the whole
              transaction while <code>statement_timestamp()</code> moves with each statement. If they differ, more
              than one statement has run, so you are in an explicit transaction.
            </p>
            <CodeBlock
              title="Detecting it from SQL"
              language="sql"
              code={`SELECT now() <> statement_timestamp() AS probably_in_transaction;

-- A write transaction has a real id assigned
SELECT pg_current_xact_id_if_assigned() IS NOT NULL AS has_written;`}
            />
            <p>
              The authoritative source is <code>pg_stat_activity</code>. Its <code>state</code> column is what you
              actually check in production, and it distinguishes the three cases that matter.
            </p>
            <CodeBlock
              title="What every connection is doing"
              language="sql"
              code={`SELECT
  pid,
  state,
  xact_start,
  NOW() - xact_start AS xact_age,
  NOW() - state_change AS idle_for,
  left(query, 60) AS query
FROM pg_stat_activity
WHERE backend_type = 'client backend'
  AND state IS DISTINCT FROM 'idle'
ORDER BY xact_start NULLS LAST;`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>active</code>: running a statement right now.
              </li>
              <li>
                <code>idle</code>: connected, no transaction open. This one is harmless.
              </li>
              <li>
                <code>idle in transaction</code>: inside <code>BEGIN</code>, waiting for the client. This is the
                dangerous one, covered in Lesson 4.
              </li>
              <li>
                <code>idle in transaction (aborted)</code>: inside a transaction that hit an error and has not
                been rolled back.
              </li>
            </ul>
            <p>
              A non-null <code>xact_start</code> means a transaction is open, and
              <code>NOW() - xact_start</code> tells you for how long. That query is the standard first step when
              something is mysteriously blocked or when vacuum has stopped reclaiming space.
            </p>
            <p>
              In application code with an ORM the question is usually &quot;am I inside the transaction I think I
              am?&quot;. With Prisma, the answer is structural rather than something you query: the
              <code>tx</code> client passed to the callback is inside the transaction and the outer
              <code>prisma</code> client is not. Using the outer client inside a
              <code>$transaction</code> callback silently runs on a different connection, outside the
              transaction, and is a very common bug.
            </p>
            <CodeBlock
              title="The Prisma version of this bug"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.order.update({ where: { id }, data: { status: 'paid' } });

  // WRONG: outer client, separate connection, not in the transaction.
  // This commits immediately and survives a rollback.
  await prisma.auditLog.create({ data: { msg: 'paid' } });

  // RIGHT
  await tx.auditLog.create({ data: { msg: 'paid' } });
});`}
            />
            <p>
              A good habit: set a <code>statement_timeout</code> and an
              <code>idle_in_transaction_session_timeout</code> on the application role, so a forgotten open
              transaction is killed automatically instead of being discovered days later.
            </p>
            <CodeBlock
              title="Guardrails"
              language="sql"
              code={`ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '60s';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
