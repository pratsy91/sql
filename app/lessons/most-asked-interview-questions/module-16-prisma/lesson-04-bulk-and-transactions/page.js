import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Bulk Writes and Transactions - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma interview questions on createMany, updateMany, deleteMany, skipDuplicates, createManyAndReturn, sequential vs interactive $transaction, nested write atomicity, and long transaction risk',
};

export default function MaiqM16L04BulkAndTransactions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Bulk Writes and Transactions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Writing many rows at once, and making several writes succeed or fail as one unit.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you insert many rows at once in Prisma?">
            <p>
              Use <code>createMany</code>. It sends one INSERT statement with many value rows, instead of one
              round trip per row. For a few thousand rows this is the difference between seconds and
              milliseconds.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It takes a <code>data</code> array and returns{' '}
                <code>{'{ count: 5 }'}</code>, not the inserted rows
              </li>
              <li>
                Batch very large imports yourself, for example one thousand rows at a time, so you do not
                build a giant statement or blow past parameter limits
              </li>
              <li>
                If any row violates a constraint the whole statement fails, since one statement is already
                atomic
              </li>
            </ul>
            <CodeBlock
              title="createMany basics"
              language="typescript"
              code={`const result = await prisma.user.createMany({
  data: [
    { email: 'a@b.com', name: 'A' },
    { email: 'c@d.com', name: 'C' },
  ],
});
console.log(result.count); // 2

// batching a large import
const CHUNK = 1000;
for (let i = 0; i < rows.length; i += CHUNK) {
  await prisma.user.createMany({ data: rows.slice(i, i + CHUNK) });
}`}
            />
            <CodeBlock
              title="The SQL it sends"
              language="sql"
              code={`INSERT INTO "User" (email, name)
VALUES ('a@b.com', 'A'), ('c@d.com', 'C');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What are the limitations of createMany, updateMany, and deleteMany?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>createMany</code>, <code>updateMany</code>, and <code>deleteMany</code> return a{' '}
                <strong>count</strong>, not the full rows. There is no automatic RETURNING of every field the
                way <code>create</code> gives you
              </li>
              <li>
                <code>createMany</code> does not support nested relation writes. You cannot create a user and
                their posts in the same call
              </li>
              <li>
                <code>updateMany</code> cannot do per row values. Every matched row gets the same{' '}
                <code>data</code>, so a real per row update needs a loop, a transaction, or raw SQL
              </li>
              <li>
                <code>updateMany</code> and <code>deleteMany</code> do not throw when nothing matches. They
                return <code>{'{ count: 0 }'}</code>, which is useful when you do not want the P2025 error
              </li>
              <li>
                <code>skipDuplicates: true</code> on <code>createMany</code> skips unique conflicts, which
                maps to the PostgreSQL clause ON CONFLICT DO NOTHING
              </li>
              <li>
                For insert many and get rows back, use <code>createManyAndReturn</code>, a transaction of{' '}
                <code>create</code> calls, or <code>$queryRawUnsafe</code> with RETURNING
              </li>
            </ul>
            <CodeBlock
              title="Bulk update and delete"
              language="typescript"
              code={`await prisma.post.updateMany({
  where: { published: false, authorId: id },
  data: { published: true },
});

const removed = await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});
console.log(removed.count);

// per row values need a transaction of updates
await prisma.$transaction(
  changes.map((c) =>
    prisma.post.update({ where: { id: c.id }, data: { views: c.views } })
  )
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What does skipDuplicates do, and what is createManyAndReturn?"
          >
            <p>
              <code>skipDuplicates</code> makes a bulk insert tolerant of rows that already exist.{' '}
              <code>createManyAndReturn</code> is the newer call that gives you the inserted rows back instead
              of only a count.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                With <code>skipDuplicates: true</code>, rows that would break a unique constraint are silently
                ignored and the rest still land. Without it, one bad row fails the whole insert
              </li>
              <li>
                The returned count tells you how many rows actually went in, so count less than input length
                means some were skipped
              </li>
              <li>
                It only skips unique conflicts. A foreign key error or a NOT NULL error still fails the
                statement
              </li>
              <li>
                It is not an upsert. Existing rows are left exactly as they are, nothing is updated
              </li>
              <li>
                <code>createManyAndReturn</code> arrived in Prisma 5.14 and works on PostgreSQL because
                Postgres supports RETURNING. It accepts <code>select</code>, so you can pull back just the
                generated ids
              </li>
              <li>
                <code>createManyAndReturn</code> still has the createMany limits: no nested writes, and
                relation loading is not supported in the same call
              </li>
            </ul>
            <CodeBlock
              title="Idempotent import"
              language="typescript"
              code={`const result = await prisma.user.createMany({
  data: [
    { email: 'a@b.com', name: 'A' },
    { email: 'a@b.com', name: 'Duplicate' },
    { email: 'c@d.com', name: 'C' },
  ],
  skipDuplicates: true,
});
// result.count === 2`}
            />
            <CodeBlock
              title="Getting the new rows back"
              language="typescript"
              code={`const created = await prisma.user.createManyAndReturn({
  data: batch,
  skipDuplicates: true,
  select: { id: true, email: true },
});

// then use the ids for a follow up write
await prisma.auditLog.createMany({
  data: created.map((u) => ({ userId: u.id, action: 'IMPORTED' })),
});`}
            />
            <CodeBlock
              title="The SQL behind both"
              language="sql"
              code={`INSERT INTO "User" (email, name)
VALUES ('a@b.com', 'A'), ('c@d.com', 'C')
ON CONFLICT DO NOTHING
RETURNING id, email;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do Prisma transactions work ($transaction)?">
            <p>
              A transaction groups several writes so they all succeed or all roll back. Prisma wraps them in
              BEGIN and COMMIT for you.
            </p>
            <CodeBlock
              title="Array form vs interactive transaction"
              language="typescript"
              code={`// Sequential batch - all or nothing
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@b.com' } }),
  prisma.post.create({ data: { title: 'Hello', authorId: knownId } }),
]);

// Interactive - read then write with a shared tx client
await prisma.$transaction(async (tx) => {
  const from = await tx.account.update({
    where: { id: fromId },
    data: { balance: { decrement: 100 } },
  });
  if (from.balance < 0) throw new Error('Insufficient funds');

  await tx.account.update({
    where: { id: toId },
    data: { balance: { increment: 100 } },
  });
}, {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: 'Serializable', // optional
});`}
            />
            <CodeBlock
              title="SQL equivalent mindset"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = $1;
UPDATE accounts SET balance = balance + 100 WHERE id = $2;
COMMIT; -- or ROLLBACK on error`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Throwing anything inside the callback rolls the whole thing back. You never call ROLLBACK
                yourself
              </li>
              <li>
                Always use the <code>tx</code> client inside the callback. Using the outer{' '}
                <code>prisma</code> object opens a second connection outside the transaction, which is a
                classic bug
              </li>
              <li>
                <code>maxWait</code> is how long Prisma waits for a connection, and <code>timeout</code> is
                how long the transaction may run before it is aborted
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Sequential array transaction or interactive callback — which do you pick?"
          >
            <p>
              Pick the array form when the writes do not depend on each other. Pick the callback form when a
              later write needs the result of an earlier read.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Array form:</strong> you hand Prisma a list of queries. They run in order in one
                transaction and you get an array of results back
              </li>
              <li>
                Its limit is that you build all the queries up front. You cannot use the id created by query
                one inside query two
              </li>
              <li>
                <strong>Callback form:</strong> you get a <code>tx</code> client and write normal code with
                conditions, loops, and early exits
              </li>
              <li>
                Its cost is that the connection is held open for the whole callback, including any slow logic
                you run inside it
              </li>
              <li>
                Rule of thumb: try the array form first. Reach for the callback only when you genuinely need
                read then decide then write
              </li>
              <li>
                Nested writes handle many parent and child cases with no transaction at all, so check that
                option before either
              </li>
            </ul>
            <CodeBlock
              title="Array form when writes are independent"
              language="typescript"
              code={`const [postCount, userCount, recent] = await prisma.$transaction([
  prisma.post.count(),
  prisma.user.count(),
  prisma.post.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
]);`}
            />
            <CodeBlock
              title="Callback form when the second write needs the first result"
              language="typescript"
              code={`const order = await prisma.$transaction(async (tx) => {
  const stock = await tx.product.findUnique({ where: { id: productId } });
  if (!stock || stock.quantity < qty) {
    throw new Error('Out of stock');
  }

  await tx.product.update({
    where: { id: productId },
    data: { quantity: { decrement: qty } },
  });

  return tx.order.create({ data: { productId, qty, userId } });
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Are nested writes already atomic?">
            <p>
              Yes. When you create or update a parent and its children in one Prisma call, Prisma wraps the
              whole thing in a transaction itself. Adding your own <code>$transaction</code> around a single
              nested write buys you nothing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                One Prisma call equals one transaction. If the child insert fails, the parent insert is rolled
                back too
              </li>
              <li>
                This covers <code>create</code>, <code>update</code>, and <code>upsert</code> with nested{' '}
                <code>create</code>, <code>connect</code>, <code>connectOrCreate</code>,{' '}
                <code>disconnect</code>, and <code>set</code>
              </li>
              <li>
                You only need an explicit transaction when two separate Prisma calls must succeed together
              </li>
              <li>
                Practical benefit: fewer round trips, and no half written parent row sitting in the table
              </li>
            </ul>
            <CodeBlock
              title="One call, already all or nothing"
              language="typescript"
              code={`// If any post fails, the user is not created either
const user = await prisma.user.create({
  data: {
    email: 'a@b.com',
    profile: { create: { bio: 'Hello' } },
    posts: {
      create: [
        { title: 'First' },
        { title: 'Second' },
      ],
    },
  },
  include: { posts: true, profile: true },
});

// Only this shape needs an explicit transaction
await prisma.$transaction(async (tx) => {
  await tx.invoice.update({ where: { id }, data: { status: 'PAID' } });
  await tx.ledgerEntry.create({ data: { invoiceId: id, amount } });
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why is a long interactive transaction risky in production?">
            <p>
              An interactive transaction holds a database connection and an open PostgreSQL transaction for
              the entire callback. Anything slow inside it is paid for by the whole system, not just that one
              request.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Connection starvation:</strong> the connection is out of the pool the whole time. A
                few slow transactions under load and every other request waits, then times out with P2024
              </li>
              <li>
                <strong>Locks are held to commit:</strong> every row you update stays locked until COMMIT.
                Other writers on those rows block behind you
              </li>
              <li>
                <strong>Vacuum is held back:</strong> an old open transaction keeps a snapshot alive, so
                autovacuum cannot clean up dead rows anywhere in the database. This is how one slow endpoint
                causes table bloat
              </li>
              <li>
                <strong>Idle in transaction:</strong> if you call an external API inside the callback, the
                session sits idle in transaction while waiting on the network. That is the worst version of
                all of the above
              </li>
              <li>
                <strong>Higher conflict and timeout risk:</strong> longer windows mean more deadlocks, more
                serialisation failures with P2034, and a bigger chance of hitting the transaction timeout
              </li>
              <li>
                Fixes: do all HTTP calls, file work, and heavy computation before BEGIN. Keep the callback to
                pure database writes. Set a short <code>timeout</code>. Move long running work to a background
                job, and use the outbox pattern when a write must trigger an external side effect
              </li>
            </ul>
            <CodeBlock
              title="Bad: external call inside the transaction"
              language="typescript"
              code={`// Connection and locks held while a third party API responds
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data });
  const charge = await stripe.charges.create({ amount });  // seconds of network wait
  await tx.order.update({ where: { id: order.id }, data: { chargeId: charge.id } });
});`}
            />
            <CodeBlock
              title="Better: slow work outside, short transaction inside"
              language="typescript"
              code={`const charge = await stripe.charges.create({ amount, idempotencyKey });

await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { ...data, chargeId: charge.id } });
  await tx.ledgerEntry.create({ data: { orderId: order.id, amount } });
}, { timeout: 5000 });`}
            />
            <CodeBlock
              title="Catching the long transactions that already exist"
              language="sql"
              code={`SELECT pid, state, now() - xact_start AS xact_age, left(query, 100)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - xact_start > interval '30 seconds'
ORDER BY xact_start;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
