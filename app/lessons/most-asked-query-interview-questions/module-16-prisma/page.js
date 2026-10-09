import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 16: Prisma ORM - Most Asked Query Interview Questions',
  description:
    'Most asked Prisma Client query interview problems: CRUD, relations, groupBy, transactions, pagination, JSON',
};

export default function Module16PrismaQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 16: Prisma ORM</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Densest Prisma module — write the Client query (and SQL equivalent). Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write findUnique, findFirst, and findMany with filters.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({ where: { email: 'a@x.com' } });
await prisma.user.findFirst({ where: { name: { startsWith: 'A' } } });
await prisma.user.findMany({
  where: { isActive: true, role: 'admin' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});`}
            />
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT * FROM users WHERE email = 'a@x.com';
SELECT * FROM users WHERE is_active = TRUE AND role = 'admin'
ORDER BY created_at DESC LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write create, update, upsert, delete.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.post.create({
  data: { title: 'Hello', authorId: 1 },
});
await prisma.post.update({
  where: { id: 1 },
  data: { published: true },
});
await prisma.post.upsert({
  where: { slug: 'hello' },
  create: { slug: 'hello', title: 'Hello', authorId: 1 },
  update: { title: 'Hello' },
});
await prisma.post.delete({ where: { id: 1 } });`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write include vs select for a user with posts.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});
await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true } },
  },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Write nested create (user + profile + first post) and M:N connect."
          >
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.create({
  data: {
    email: 'a@x.com',
    profile: { create: { bio: 'hi' } },
    posts: { create: [{ title: 'First' }] },
  },
});

await prisma.post.update({
  where: { id: 1 },
  data: { tags: { connect: [{ id: 2 }, { id: 3 }] } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Write relation filters: users with some / none / every published posts."
          >
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.user.findMany({
  where: { posts: { some: { published: true } } },
});
await prisma.user.findMany({
  where: { posts: { none: {} } },
});
await prisma.user.findMany({
  where: { posts: { every: { published: true } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write groupBy, aggregate, and orderBy post count.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.order.aggregate({
  _sum: { total: true },
  _avg: { total: true },
  _count: true,
});

await prisma.order.groupBy({
  by: ['status'],
  _count: { _all: true },
  _sum: { total: true },
});

await prisma.user.findMany({
  orderBy: { posts: { _count: 'desc' } },
  take: 10,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write skip/take vs cursor pagination.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.post.findMany({ skip: 40, take: 20, orderBy: { id: 'asc' } });

await prisma.post.findMany({
  take: 20,
  skip: 1,
  cursor: { id: 100 },
  orderBy: { id: 'asc' },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write createMany / updateMany / deleteMany.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.tag.createMany({
  data: [{ name: 'sql' }, { name: 'prisma' }],
  skipDuplicates: true,
});
await prisma.post.updateMany({
  where: { published: false, authorId: 1 },
  data: { published: true },
});
await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write an interactive transaction that creates an order + decrements stock.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const product = await tx.product.update({
    where: { id: 9 },
    data: { stock: { decrement: 1 } },
  });
  if (product.stock < 0) {
    throw new Error('out of stock');
  }
  return tx.order.create({
    data: { userId: 1, total: product.price },
  });
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write a JSON path filter and a raw parameterized query.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.event.findMany({
  where: {
    meta: { path: ['source'], equals: 'web' },
  },
});

await prisma.$queryRawUnsafe(
  'SELECT * FROM "Event" WHERE meta @> $1::jsonb',
  JSON.stringify({ source: 'web' })
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you handle unique conflicts (P2002) after a racing create?"
          >
            <p>
              Catch Prisma <code>P2002</code>, then <code>findUnique</code> / retry <code>upsert</code>. Interviewers
              want the code pattern, not just the error name.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e.code === 'P2002') {
    return prisma.user.findUnique({ where: { email } });
  }
  throw e;
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
