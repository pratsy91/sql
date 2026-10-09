import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 9: Transactions - Most Asked Query Interview Questions',
  description: 'Most asked transaction, locking, SKIP LOCKED, and Prisma $transaction query patterns',
};

export default function Module09TransactionQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 9: Transactions &amp; Concurrency</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked transaction/locking query problems. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a BEGIN / COMMIT transfer between two accounts.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.$transaction([
  prisma.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } },
  }),
  prisma.account.update({
    where: { id: 2 },
    data: { balance: { increment: 100 } },
  }),
]);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write SELECT FOR UPDATE to serialize a debit.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write a job-queue claim query using FOR UPDATE SKIP LOCKED (very common senior-mid)."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`UPDATE jobs
SET status = 'running', locked_at = NOW()
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'queued'
  ORDER BY id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write SET TRANSACTION isolation level.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM seats WHERE concert_id = 9;
COMMIT;`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.$transaction(
  async (tx) => {
    return tx.seat.findMany({ where: { concertId: 9 } });
  },
  { isolationLevel: 'RepeatableRead' }
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Write an atomic check-and-update that returns whether the row was claimed."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`UPDATE products
SET stock = stock - 1
WHERE id = 42 AND stock >= 1
RETURNING id, stock;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a query to see who is blocked (lock waits).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT
  a.pid AS blocked_pid,
  a.query AS blocked_query,
  b.pid AS blocking_pid,
  b.query AS blocking_query
FROM pg_stat_activity a
JOIN pg_locks la ON la.pid = a.pid AND NOT la.granted
JOIN pg_locks lb ON lb.locktype = la.locktype
  AND lb.database IS NOT DISTINCT FROM la.database
  AND lb.relation IS NOT DISTINCT FROM la.relation
  AND lb.pid <> la.pid
  AND lb.granted
JOIN pg_stat_activity b ON b.pid = lb.pid;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
