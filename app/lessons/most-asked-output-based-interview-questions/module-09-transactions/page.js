import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 9: Transactions - Output-Based Interview Questions',
  description: 'Predict isolation-level visibility, rollback output, SKIP LOCKED, Prisma transaction failures',
};

export default function OutputModule09() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 9: Transactions &amp; Concurrency</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What does session B see? What is rolled back? What does Prisma throw?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="A: BEGIN; UPDATE t SET x=2 WHERE id=1; (no commit). B: SELECT x FROM t WHERE id=1; Default isolation. B output?"
          >
            <p>
              B still sees the <strong>old committed</strong> value (e.g. 1). Dirty reads are not allowed in Postgres.
              After A COMMIT, B&apos;s next statement sees 2 (READ COMMITTED).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="BEGIN; INSERT ...; ROLLBACK; SELECT COUNT(*). Output vs COMMIT?"
          >
            <p>
              After ROLLBACK the insert is gone. After COMMIT it remains. Prisma: throw inside{' '}
              <code>$transaction</code> → entire array/callback rolls back.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Two jobs queued. Session A holds FOR UPDATE on id=1. Session B: SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1. Output?"
          >
            <p>
              B gets job <strong>2</strong> (skips locked 1). Without SKIP LOCKED, B waits.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="This Prisma transaction is wrong. What is the output/error?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@x.com' } }),
]);
await prisma.order.create({ data: { userId: 1 } });`}
            />
            <p>
              The order is <strong>not</strong> in the same transaction. If create order fails, the user still exists.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const u = await tx.user.create({ data: { email: 'a@x.com' } });
  await tx.order.create({ data: { userId: u.id } });
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="REPEATABLE READ: A reads count=5. B inserts a row and commits. A reads count again in the same txn. Output?"
          >
            <p>
              Still <strong>5</strong> (snapshot). In READ COMMITTED the second statement can see 6 (phantom).
              SERIALIZABLE may abort A with <code>40001</code> on commit/conflict.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
