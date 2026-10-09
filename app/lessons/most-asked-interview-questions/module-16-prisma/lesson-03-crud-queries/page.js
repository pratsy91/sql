import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: CRUD and Queries - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma query interview questions: findUnique vs findFirst, findMany, create, update, upsert, delete, filter operators, include vs select, _count, offset vs cursor pagination, and ordering by relation count',
};

export default function MaiqM16L03CrudQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: CRUD and Queries</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The Prisma calls you use every day: reading one row, reading many, filtering, shaping the result,
          counting, and paging through a long list.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Show findUnique, findFirst, findMany, create, update, upsert, and delete."
          >
            <CodeBlock
              title="Prisma CRUD patterns"
              language="typescript"
              code={`// Unique lookup (needs @id / @unique / @@unique)
const user = await prisma.user.findUnique({ where: { email: 'a@b.com' } });

// First match (any filter; order matters)
const draft = await prisma.post.findFirst({
  where: { published: false },
  orderBy: { createdAt: 'desc' },
});

const posts = await prisma.post.findMany({
  where: { authorId: user.id },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

const created = await prisma.user.create({
  data: { email: 'a@b.com', name: 'Ada' },
});

const updated = await prisma.user.update({
  where: { id: created.id },
  data: { name: 'Ada Lovelace' },
});

// Insert or update on unique conflict
const upserted = await prisma.user.upsert({
  where: { email: 'a@b.com' },
  create: { email: 'a@b.com', name: 'Ada' },
  update: { name: 'Ada Lovelace' },
});

await prisma.post.delete({ where: { id: 1 } });`}
            />
            <CodeBlock
              title="Equivalent SQL mindset"
              language="sql"
              code={`SELECT * FROM "User" WHERE email = 'a@b.com'; -- findUnique
SELECT * FROM "Post" WHERE published = false ORDER BY "createdAt" DESC LIMIT 1;
INSERT INTO "User" (email, name) VALUES (...);
UPDATE "User" SET name = 'Ada Lovelace' WHERE id = ...;
INSERT ... ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
DELETE FROM "Post" WHERE id = 1;`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>findUnique</code> and <code>findFirst</code> return the row or <code>null</code>
              </li>
              <li>
                <code>update</code> and <code>delete</code> throw error P2025 when the row is missing, so wrap
                them or use the <code>updateMany</code> form
              </li>
              <li>
                The strict variants <code>findUniqueOrThrow</code> and <code>findFirstOrThrow</code> save you
                writing a null check
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What filter operators does Prisma give you (contains, in, gt, not)?"
          >
            <p>
              Inside <code>where</code>, a plain value means equals. To do anything else you pass a small
              object with an operator key.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Text: <code>contains</code>, <code>startsWith</code>, <code>endsWith</code>, plus{' '}
                <code>mode: &apos;insensitive&apos;</code> for case insensitive search on PostgreSQL
              </li>
              <li>
                Numbers and dates: <code>gt</code> greater than, <code>gte</code> greater or equal,{' '}
                <code>lt</code> less than, <code>lte</code> less or equal
              </li>
              <li>
                Lists: <code>in</code> and <code>notIn</code>
              </li>
              <li>
                Negation: <code>not</code>. Combining: <code>AND</code>, <code>OR</code>, <code>NOT</code>
              </li>
              <li>
                Nulls: <code>null</code> means IS NULL, and{' '}
                <code>{'{ not: null }'}</code> means IS NOT NULL
              </li>
            </ul>
            <CodeBlock
              title="Common filters"
              language="typescript"
              code={`await prisma.post.findMany({
  where: {
    title: { contains: 'postgres', mode: 'insensitive' },
    views: { gte: 100, lt: 10000 },
    status: { in: ['PUBLISHED', 'FEATURED'] },
    deletedAt: null,
    authorId: { not: 5 },
    createdAt: { gte: new Date('2026-01-01') },
    OR: [
      { featured: true },
      { author: { role: 'ADMIN' } },
    ],
  },
});`}
            />
            <CodeBlock
              title="Roughly the SQL produced"
              language="sql"
              code={`SELECT * FROM "Post"
WHERE title ILIKE '%postgres%'
  AND views >= 100 AND views < 10000
  AND status IN ('PUBLISHED', 'FEATURED')
  AND "deletedAt" IS NULL
  AND "authorId" <> 5;`}
            />
            <p>
              A leading wildcard search like <code>contains</code> cannot use a normal B-tree index. For real
              search traffic use a trigram index or full text search instead.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is the difference between findUnique and findFirst, and when does findUnique refuse to work?"
          >
            <p>
              <code>findUnique</code> only accepts fields the database guarantees are unique.{' '}
              <code>findFirst</code> accepts any filter and simply returns the first row it finds.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>findUnique</code> works on <code>@id</code>, <code>@unique</code>, and{' '}
                <code>@@unique</code> fields only. Ask it for a non unique field and TypeScript rejects the
                call before it ever runs
              </li>
              <li>
                <code>findFirst</code> adds LIMIT 1. Without an <code>orderBy</code> the row you get back is
                not guaranteed to be stable, so always order when it matters
              </li>
              <li>
                <code>findUnique</code> is batched. Several concurrent calls inside the same tick are folded
                into one IN query, which quietly fixes a lot of N plus 1 problems. <code>findFirst</code> is
                not batched
              </li>
              <li>
                For a composite unique key you pass a named object, for example{' '}
                <code>{'{ where: { userId_postId: { userId: 1, postId: 2 } } }'}</code>
              </li>
              <li>
                Use <code>findFirst</code> when you want a unique lookup plus an extra condition, such as an
                email that is also not soft deleted
              </li>
            </ul>
            <CodeBlock
              title="Which one to reach for"
              language="typescript"
              code={`// unique field - fine
await prisma.user.findUnique({ where: { email: 'a@b.com' } });

// composite unique key
await prisma.enrollment.findUnique({
  where: { studentId_courseId: { studentId: 1, courseId: 2 } },
});

// not unique, or unique plus an extra condition - use findFirst
await prisma.user.findFirst({
  where: { email: 'a@b.com', deletedAt: null },
});

await prisma.post.findFirst({
  where: { authorId: 1 },
  orderBy: { createdAt: 'desc' },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is the difference between include and select? Why does it matter for performance?"
          >
            <p>
              Both shape the returned object. <code>include</code> keeps all scalar fields and adds relations.{' '}
              <code>select</code> returns only the fields you list, scalars and nested selects. You cannot mix
              a top level <code>include</code> and <code>select</code> on the same query.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prefer <code>select</code> when you need a slim payload for APIs and lists, since less data
                travels over the wire
              </li>
              <li>
                Prefer <code>include</code> for convenience when you want the full row plus its relations
              </li>
              <li>
                Over including deep trees pulls huge result sets and is a common production smell
              </li>
              <li>
                <code>select</code> also protects you from leaking new columns. Add a passwordHash field later
                and an <code>include</code> endpoint starts returning it, while a <code>select</code> endpoint
                does not
              </li>
            </ul>
            <CodeBlock
              title="include vs select"
              language="typescript"
              code={`// Full user + all posts (can be large)
await prisma.user.findUnique({
  where: { id },
  include: { posts: true },
});

// Only what the UI needs
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true }, take: 5 },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you count rows in Prisma, including _count on relations?">
            <p>
              There are three counting tools: <code>count</code> for a table, <code>_count</code> inside{' '}
              <code>select</code> or <code>include</code> for related rows, and <code>groupBy</code> for
              counts per group.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>prisma.post.count(...)</code> takes the same <code>where</code> as{' '}
                <code>findMany</code>
              </li>
              <li>
                <code>_count</code> on a relation gives each parent the number of children without loading
                them, which is much cheaper than fetching the list and calling length
              </li>
              <li>
                You can filter the count itself by passing a <code>where</code> inside{' '}
                <code>{'_count: { select: { posts: { where: ... } } }'}</code>
              </li>
              <li>
                <code>groupBy</code> plus <code>_count</code> is the GROUP BY equivalent, and{' '}
                <code>having</code> filters the groups
              </li>
              <li>
                Counting a very large table is slow in PostgreSQL because it scans. For a page footer an
                estimate from the statistics tables is often good enough
              </li>
            </ul>
            <CodeBlock
              title="Three ways to count"
              language="typescript"
              code={`// whole table with a filter
const total = await prisma.post.count({ where: { published: true } });

// children per parent, without loading the children
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    _count: { select: { posts: true, comments: true } },
  },
});
// users[0]._count.posts

// count only published posts per user
const authors = await prisma.user.findMany({
  include: {
    _count: { select: { posts: { where: { published: true } } } },
  },
});

// group by
const perAuthor = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { _all: true },
  having: { authorId: { _count: { gt: 5 } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is the difference between take/skip pagination and cursor pagination?"
          >
            <p>
              <code>skip</code> plus <code>take</code> is offset paging: jump N rows then read the next page.
              Cursor paging remembers the last row you saw and continues from there.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Offset is simple and lets you jump to page 50, but the database must still walk and discard
                all the skipped rows. Page 1000 is slow no matter what index you have
              </li>
              <li>
                Offset also drifts. If a row is inserted while the user is reading, page 2 repeats an item
                from page 1
              </li>
              <li>
                Cursor paging stays fast at any depth because it becomes a simple range scan on an indexed
                column, and it never skips or repeats rows
              </li>
              <li>
                Cursor paging cannot jump to an arbitrary page number, so it fits infinite scroll and feeds
                rather than numbered pages
              </li>
              <li>
                Always order by something unique, or by a timestamp plus the id as a tiebreaker. Prisma uses{' '}
                <code>skip: 1</code> with a cursor to step past the row you already have
              </li>
            </ul>
            <CodeBlock
              title="Offset vs cursor in Prisma"
              language="typescript"
              code={`// Offset paging - fine for small, shallow lists
const page3 = await prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  skip: 40,
  take: 20,
});

// Cursor paging - stays fast at any depth
const firstPage = await prisma.post.findMany({
  orderBy: { id: 'asc' },
  take: 20,
});
const lastId = firstPage[firstPage.length - 1].id;

const nextPage = await prisma.post.findMany({
  orderBy: { id: 'asc' },
  cursor: { id: lastId },
  skip: 1,        // step past the cursor row itself
  take: 20,
});`}
            />
            <CodeBlock
              title="Why cursor paging wins in SQL terms"
              language="sql"
              code={`-- Offset: reads and throws away 100000 rows
SELECT * FROM "Post" ORDER BY id LIMIT 20 OFFSET 100000;

-- Cursor: an index range scan straight to the right place
SELECT * FROM "Post" WHERE id > 100000 ORDER BY id LIMIT 20;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you order results by a relation count, for example the most commented posts?"
          >
            <p>
              Prisma supports <code>orderBy</code> on <code>_count</code> of a relation. It is the one sort
              that people usually assume needs raw SQL.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The shape is <code>{'orderBy: { comments: { _count: "desc" } }'}</code>
              </li>
              <li>
                Under the hood it becomes a LEFT JOIN with a GROUP BY, so it touches every child row in scope.
                On a big table that is a real cost
              </li>
              <li>
                You cannot currently order by a filtered count. If you need only approved comments in the
                ranking, use <code>groupBy</code> or raw SQL
              </li>
              <li>
                For a hot leaderboard, the production answer is a denormalised counter column kept up to date
                with <code>increment</code>, or a materialised view refreshed on a schedule. Then the sort is
                a plain indexed column
              </li>
              <li>
                Prisma also supports ordering by a field on a single relation, such as{' '}
                <code>{'orderBy: { author: { name: "asc" } }'}</code>
              </li>
            </ul>
            <CodeBlock
              title="Order by relation count"
              language="typescript"
              code={`const mostDiscussed = await prisma.post.findMany({
  where: { published: true },
  orderBy: { comments: { _count: 'desc' } },
  take: 10,
  select: {
    id: true,
    title: true,
    _count: { select: { comments: true } },
  },
});

// order by a field on the parent
await prisma.post.findMany({
  orderBy: [{ author: { name: 'asc' } }, { createdAt: 'desc' }],
});`}
            />
            <CodeBlock
              title="Denormalised counter for hot ranking paths"
              language="typescript"
              code={`// schema: commentCount Int @default(0) with @@index([commentCount])
await prisma.$transaction([
  prisma.comment.create({ data: { postId, body } }),
  prisma.post.update({
    where: { id: postId },
    data: { commentCount: { increment: 1 } },
  }),
]);

// now the ranking sort is a plain index scan
await prisma.post.findMany({ orderBy: { commentCount: 'desc' }, take: 10 });`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
