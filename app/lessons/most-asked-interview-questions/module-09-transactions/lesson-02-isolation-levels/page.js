import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Isolation Levels - Module 9 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL isolation level interview questions: the default READ COMMITTED, dirty reads, non-repeatable reads, phantom reads, comparing the three supported levels, when to use SERIALIZABLE, and retrying on serialization failure 40001.',
};

export default function M9L2IsolationLevels() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Isolation Levels</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Isolation decides how much of other transactions&apos; work yours can see while it runs. This lesson
          covers the anomalies the levels are named after, the three levels PostgreSQL supports, and how to write
          code that survives the strictest one.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the default isolation level in PostgreSQL?">
            <p>
              <code>READ COMMITTED</code>. Each statement sees only data that was committed before that statement
              began.
            </p>
            <p>
              The important consequence: within one transaction, two <code>SELECT</code>s can return different
              data, because each one takes a fresh snapshot. A snapshot is the point-in-time view of the database
              a statement reads from.
            </p>
            <CodeBlock
              title="Set isolation"
              language="sql"
              code={`BEGIN ISOLATION LEVEL REPEATABLE READ;
-- or
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
COMMIT;`}
            />
            <p>
              You must set the level at the start, before any query has run. Changing it mid-transaction raises an
              error. You can also change the default for a role or the whole server, though changing the server
              default is rarely a good idea.
            </p>
            <CodeBlock
              title="Checking and changing the default"
              language="sql"
              code={`SHOW transaction_isolation;
SHOW default_transaction_isolation;

ALTER ROLE app_user SET default_transaction_isolation = 'repeatable read';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What are dirty reads, non-repeatable reads, and phantom reads?">
            <p>These are the three classic anomalies the SQL standard names. An anomaly is a way concurrency can give you a result you did not expect.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Dirty read</strong>: you see data another transaction has written but not committed. If it
                rolls back, you acted on data that never existed. PostgreSQL never allows this.
              </li>
              <li>
                <strong>Non-repeatable read</strong>: you read a row twice in one transaction and get different
                committed values, because someone else changed and committed it in between.
              </li>
              <li>
                <strong>Phantom read</strong>: you run the same range query twice and get a different set of rows,
                because someone else inserted or deleted rows that match your condition.
              </li>
            </ul>
            <p>
              The difference between the last two is worth being precise about, because interviewers probe it. A
              non-repeatable read is about a row you already saw changing. A phantom read is about new rows
              appearing or disappearing from a set.
            </p>
            <CodeBlock
              title="Non-repeatable read under READ COMMITTED"
              language="sql"
              code={`-- T1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;   -- 500

--      T2 (separate session)
--      UPDATE accounts SET balance = 400 WHERE id = 1;
--      COMMIT;

SELECT balance FROM accounts WHERE id = 1;   -- 400, changed
COMMIT;`}
            />
            <CodeBlock
              title="Phantom read under READ COMMITTED"
              language="sql"
              code={`-- T1
BEGIN;
SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- 12

--      T2
--      INSERT INTO orders (status) VALUES ('pending');
--      COMMIT;

SELECT COUNT(*) FROM orders WHERE status = 'pending';  -- 13, a phantom
COMMIT;`}
            />
            <p>
              There is a fourth anomaly the standard does not name, and it is the one that actually causes bugs:
              lost update. Two transactions read the same value, each computes a new one from it, and the second
              write overwrites the first. Neither level below <code>SERIALIZABLE</code> stops this on its own.
            </p>
            <CodeBlock
              title="Lost update, and the two fixes"
              language="sql"
              code={`-- The bug: both read 10, both write 9, one sale disappears
SELECT stock FROM products WHERE id = 1;     -- 10
UPDATE products SET stock = 9 WHERE id = 1;

-- Fix 1: one atomic statement, no read-then-write
UPDATE products SET stock = stock - 1
WHERE id = 1 AND stock > 0;

-- Fix 2: lock the row before reading it
BEGIN;
SELECT stock FROM products WHERE id = 1 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Does PostgreSQL allow dirty reads?">
            <p>
              No. PostgreSQL never allows a dirty read at any isolation level, and that is the whole answer to the
              question as asked. The interesting part is why.
            </p>
            <p>
              The SQL standard defines a fourth level, <code>READ UNCOMMITTED</code>, which permits dirty reads.
              PostgreSQL accepts the syntax so that standard-compliant code runs, but it silently treats it as
              <code>READ COMMITTED</code>. So asking for it changes nothing.
            </p>
            <CodeBlock
              title="Asking for it does nothing"
              language="sql"
              code={`BEGIN ISOLATION LEVEL READ UNCOMMITTED;
SHOW transaction_isolation;   -- read committed
COMMIT;`}
            />
            <p>
              The reason is MVCC, which stands for Multi-Version Concurrency Control. Instead of overwriting a
              row, PostgreSQL writes a new version of it and stamps both versions with the transaction that
              created and ended them. When your statement reads a row, it picks the version that was committed as
              of its snapshot. An uncommitted version simply is not visible, because the visibility check is what
              selects the version in the first place.
            </p>
            <p>
              In other words, PostgreSQL does not forbid dirty reads with a rule. Its storage design makes them
              unrepresentable. There is no code path that returns an uncommitted row version to a normal query.
            </p>
            <p>
              So PostgreSQL effectively has three isolation levels, not four:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>READ UNCOMMITTED</code>: accepted, behaves as <code>READ COMMITTED</code>.
              </li>
              <li>
                <code>READ COMMITTED</code>: the default.
              </li>
              <li>
                <code>REPEATABLE READ</code>: also prevents phantom reads, which the standard permits at this
                level. PostgreSQL is stricter than required.
              </li>
              <li>
                <code>SERIALIZABLE</code>: prevents all anomalies, including ones the standard does not name.
              </li>
            </ul>
            <p>
              One nuance worth having ready, because it sounds like a contradiction. A
              <code>VOLATILE</code> function or a trigger can observe changes made by earlier statements in its
              own transaction, and an <code>UPDATE</code> under <code>READ COMMITTED</code> will re-read a row
              another transaction is modifying once that transaction commits. Neither of those is a dirty read:
              in the first case the data is yours, and in the second it is committed by the time you see it.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Compare READ COMMITTED, REPEATABLE READ, and SERIALIZABLE in PostgreSQL.">
            <p>The difference comes down to when the snapshot is taken and how conflicts are detected.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>READ COMMITTED</code>: a new snapshot per statement. Allows non-repeatable reads and
                phantoms. Never raises a serialization error for a plain read.
              </li>
              <li>
                <code>REPEATABLE READ</code>: one snapshot for the whole transaction, taken at the first query.
                No non-repeatable reads and no phantoms. But if you update a row that changed since your
                snapshot, PostgreSQL cannot silently merge that, so it aborts you with a serialization error.
              </li>
              <li>
                <code>SERIALIZABLE</code>: everything <code>REPEATABLE READ</code> gives, plus detection of
                conflicts that involve only reads. The guarantee is that the outcome matches some order of running
                the transactions one after another. It may abort with
                <code>40001 serialization_failure</code>, so you must retry.
              </li>
            </ul>
            <CodeBlock
              title="The same pair of reads at two levels"
              language="sql"
              code={`-- READ COMMITTED: the second read sees T2's commit
BEGIN;                                   -- default
SELECT SUM(balance) FROM accounts;       -- 1000
--   T2 commits a change here
SELECT SUM(balance) FROM accounts;       -- 900
COMMIT;

-- REPEATABLE READ: both reads use the same snapshot
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT SUM(balance) FROM accounts;       -- 1000
--   T2 commits a change here
SELECT SUM(balance) FROM accounts;       -- still 1000
COMMIT;`}
            />
            <p>
              Under <code>REPEATABLE READ</code> a write conflict is reported rather than resolved. This is the
              behaviour that surprises people most when they raise the level.
            </p>
            <CodeBlock
              title="REPEATABLE READ aborts a conflicting write"
              language="sql"
              code={`BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;   -- 500

--   T2: UPDATE accounts SET balance = 400 WHERE id = 1; COMMIT;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- ERROR: could not serialize access due to concurrent update
ROLLBACK;`}
            />
            <p>
              A useful way to remember the trade-off: <code>READ COMMITTED</code> gives you the freshest data and
              the fewest errors but the weakest guarantees. <code>SERIALIZABLE</code> gives you the strongest
              guarantees and the most errors to handle. <code>REPEATABLE READ</code> sits between them and is a
              natural fit for a report that must be internally consistent.
            </p>
            <p>
              One PostgreSQL specific: at <code>REPEATABLE READ</code> and <code>SERIALIZABLE</code>, the snapshot
              is taken at the first statement, not at <code>BEGIN</code>. To pin it earlier, or to share one
              snapshot across several sessions for a consistent backup, use
              <code>pg_export_snapshot</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When should you actually use SERIALIZABLE?">
            <p>
              Use it when correctness depends on a rule spanning rows your transaction only read, not the rows it
              wrote. Row locks cannot protect data that does not exist yet, and that is exactly the gap
              <code>SERIALIZABLE</code> closes.
            </p>
            <p>
              The textbook case is a write skew. Write skew means two transactions each read a set, each decide
              their write is fine, and together they break a rule neither could break alone.
            </p>
            <CodeBlock
              title="Write skew: the on-call rule"
              language="sql"
              code={`-- Rule: at least one engineer must stay on call.
-- Two are on call. Both want to leave, at the same moment.

-- T1                                    -- T2
BEGIN;                                   BEGIN;
SELECT COUNT(*) FROM oncall              SELECT COUNT(*) FROM oncall
WHERE active;        -- 2                WHERE active;        -- 2

UPDATE oncall SET active = false         UPDATE oncall SET active = false
WHERE id = 1;                            WHERE id = 2;

COMMIT;                                  COMMIT;
-- Under READ COMMITTED both succeed: nobody is on call.
-- Under SERIALIZABLE one is aborted with 40001.`}
            />
            <p>
              Notice that <code>FOR UPDATE</code> would not have saved you here, because the two transactions lock
              different rows. Neither would a unique constraint, because the rule is about a count across rows.
              You would otherwise have to lock the whole table, which serialises everything.
            </p>
            <p>Situations where <code>SERIALIZABLE</code> is the right choice:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Rules over an aggregate: a minimum staffing level, a budget cap, a maximum number of bookings per
                room.
              </li>
              <li>
                Check-then-insert where a unique constraint cannot express the rule, such as &quot;no overlapping
                reservations&quot;.
              </li>
              <li>
                Double-entry accounting, where a batch of rows must always sum to zero.
              </li>
              <li>
                Complex multi-table invariants that would otherwise need several carefully ordered locks.
              </li>
            </ul>
            <p>Situations where it is the wrong choice:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Ordinary CRUD. Most operations are already safe with an atomic
                <code>UPDATE</code>, a unique constraint, or a <code>CHECK</code>.
              </li>
              <li>
                Long-running or high-contention transactions. The abort rate climbs and you spend more time
                retrying than working.
              </li>
              <li>
                Anything without retry logic. Without a retry loop, <code>SERIALIZABLE</code> converts a silent
                data bug into a user-visible error, which is better but still an outage.
              </li>
            </ul>
            <p>
              The costs to state in an interview. PostgreSQL implements it with Serializable Snapshot Isolation,
              which tracks predicate locks on the rows and index ranges you read. That bookkeeping uses memory
              capped by <code>max_pred_locks_per_transaction</code>, and when it overflows PostgreSQL coarsens the
              tracking to whole pages or tables, which causes more false aborts. It also needs every participating
              transaction to be <code>SERIALIZABLE</code>: mixing levels means the guarantee does not hold, and
              read-only transactions should be declared
              <code>READ ONLY DEFERRABLE</code> so they can never be aborted.
            </p>
            <CodeBlock
              title="Declaring a safe read-only snapshot"
              language="sql"
              code={`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;
-- Waits until it can get a snapshot that cannot cause a conflict,
-- then never aborts. Ideal for a long consistent report.
SELECT SUM(balance) FROM accounts;
COMMIT;`}
            />
            <p>
              A sensible default policy: keep <code>READ COMMITTED</code> everywhere, express what you can as
              constraints and atomic statements, and raise the level to <code>SERIALIZABLE</code> for the specific
              operations that have a cross-row invariant. Always with a retry loop.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you retry on serialization failure 40001?">
            <p>
              A <code>40001</code> error is not a bug report. It means PostgreSQL detected that letting your
              transaction commit would break the serializable guarantee, so it aborted you. The transaction did
              nothing, and running it again will usually succeed. The contract you accept when you use
              <code>REPEATABLE READ</code> or <code>SERIALIZABLE</code> is that you will retry.
            </p>
            <p>The rules for a correct retry:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Retry the <strong>whole transaction</strong> from the beginning, not the statement that failed.
                The snapshot is gone, so every read must happen again.
              </li>
              <li>
                Retry <code>40001 serialization_failure</code> and <code>40P01 deadlock_detected</code>. Both are
                transient. Do not retry a unique violation or a constraint error, because those will fail
                identically forever.
              </li>
              <li>
                Cap the attempts, and back off with a small randomised delay so competing transactions do not
                collide again in lockstep.
              </li>
              <li>
                Keep all side effects outside the transaction. If the body sends an email or charges a card, a
                retry does it twice.
              </li>
              <li>
                Make the operation idempotent where possible, so a retry after an ambiguous failure is still safe.
              </li>
            </ul>
            <CodeBlock
              title="Retry helper in application code"
              language="typescript"
              code={`const RETRYABLE = new Set(['40001', '40P01']);

function dbCode(e: unknown): string | undefined {
  const meta = (e as { meta?: { code?: string } }).meta;
  return meta?.code;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!RETRYABLE.has(dbCode(e) ?? '')) throw e;
      lastError = e;

      // Exponential backoff with jitter: 25ms, 50ms, 100ms, ...
      const delay = 25 * 2 ** i * (0.5 + Math.random());
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}`}
            />
            <CodeBlock
              title="Using it with a serializable transaction"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

const result = await withRetry(() =>
  prisma.$transaction(
    async (tx) => {
      const active = await tx.oncall.count({ where: { active: true } });
      if (active <= 1) throw new Error('someone must stay on call');

      return tx.oncall.update({
        where: { id: engineerId },
        data: { active: false },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  ),
);

// Side effects go outside, so a retry cannot duplicate them
await notifyRotaChanged(result.id);`}
            />
            <p>
              Notice the business error thrown inside the callback is not retryable, and the helper correctly lets
              it through because it has no database error code. That separation is the part people get wrong:
              a retry loop that catches everything will hammer the database five times over a validation failure.
            </p>
            <p>
              In PL/pgSQL you cannot retry the current transaction from inside itself, because the whole
              transaction is aborted. A loop with an <code>EXCEPTION</code> block only works for a nested
              savepoint-level conflict, so the retry genuinely belongs in the client or in a procedure that
              controls its own transactions.
            </p>
            <CodeBlock
              title="Where PL/pgSQL retry does and does not work"
              language="sql"
              code={`-- A procedure can commit, so it can retry a unit of work
CREATE OR REPLACE PROCEDURE do_transfer(p_from int, p_to int, p_amount bigint)
LANGUAGE plpgsql
AS $$
DECLARE
  attempts int := 0;
BEGIN
  LOOP
    BEGIN
      UPDATE accounts SET balance = balance - p_amount WHERE id = p_from;
      UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
      COMMIT;
      EXIT;
    EXCEPTION
      WHEN serialization_failure OR deadlock_detected THEN
        attempts := attempts + 1;
        IF attempts >= 5 THEN
          RAISE;
        END IF;
        ROLLBACK;
        PERFORM pg_sleep(0.05 * attempts);
    END;
  END LOOP;
END;
$$;`}
            />
            <p>
              Finally, measure the abort rate. A few percent is normal and healthy. A high rate means the
              transactions are too long or too contended, and the answer is to shorten them, narrow what they
              read, or move the hot row into a design with less contention, rather than to raise the retry count.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does READ COMMITTED evaluate UPDATE visibility in PostgreSQL?">
            <p>
              This one catches strong candidates out. Under <code>READ COMMITTED</code>, if your
              <code>UPDATE</code> reaches a row that another transaction has modified but not yet committed,
              PostgreSQL blocks and waits for that transaction to finish.
            </p>
            <p>
              What happens next is the surprising part. If the other transaction commits, PostgreSQL does not use
              your original snapshot. It re-reads the row&apos;s latest committed version and re-evaluates your
              <code>WHERE</code> clause against it. If the predicate no longer matches, your update simply skips
              that row. No error, and the affected row count is lower than you expected.
            </p>
            <CodeBlock
              title="An UPDATE that skips a row"
              language="sql"
              code={`-- Starting state: orders row 1 has status = 'pending'

-- T1
BEGIN;
UPDATE orders SET status = 'cancelled' WHERE id = 1;
-- not committed yet

--      T2
--      BEGIN;
--      UPDATE orders SET status = 'paid'
--      WHERE id = 1 AND status = 'pending';   -- blocks here

-- T1
COMMIT;

--      T2 wakes up, re-reads the row: status is now 'cancelled',
--      so "status = 'pending'" is false. UPDATE 0 rows.
--      No error is raised.`}
            />
            <p>
              So a conditional update is safe from a lost update, but it can silently do nothing. That is fine if
              you check the affected row count and treat zero as &quot;someone got there first&quot;. It is a bug
              if you assume it worked.
            </p>
            <CodeBlock
              title="Check the row count, always"
              language="sql"
              code={`UPDATE accounts
SET balance = balance - 100
WHERE id = 1 AND balance >= 100;

-- In PL/pgSQL
GET DIAGNOSTICS affected = ROW_COUNT;
IF affected = 0 THEN
  RAISE EXCEPTION 'insufficient funds or account changed'
    USING ERRCODE = 'check_violation';
END IF;`}
            />
            <CodeBlock
              title="The same check in Prisma"
              language="typescript"
              code={`const result = await prisma.account.updateMany({
  where: { id: 1, balance: { gte: 100 } },
  data: { balance: { decrement: 100 } },
});

if (result.count === 0) {
  throw new Error('insufficient funds or account changed');
}
// updateMany returns a count, so you can detect the skip.
// update() would throw P2025 instead, which is also fine,
// but do not assume a silent success.`}
            />
            <p>
              Two further consequences that make good follow-up answers. First, a plain
              <code>SELECT</code> in the same transaction still uses the statement snapshot, so you can read one
              value and then update based on a newer one within a single transaction. The read and the write
              disagree. Second, if the other transaction rolls back rather than commits, your update proceeds
              against the original row exactly as you intended.
            </p>
            <p>
              For the stricter behaviour, you have three options. Use
              <code>SELECT ... FOR UPDATE</code> to lock the row before you read it, so nobody can change it
              between your read and your write. Use <code>REPEATABLE READ</code>, where this situation raises
              <code>40001</code> instead of silently skipping, so a retry re-reads everything. Or express the
              whole decision in one atomic statement and check the row count, which is usually the simplest and
              fastest of the three.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
