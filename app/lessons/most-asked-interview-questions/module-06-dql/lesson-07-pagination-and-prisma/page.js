import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 7: Pagination and Prisma - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on pagination: why deep OFFSET is slow, keyset (cursor) pagination, stable sort order, Prisma cursor pagination, how findMany maps to SQL, and the logical processing order of a SELECT.',
};

export default function M6L7PaginationAndPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 7: Pagination and Prisma</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Page 1 is fast with any approach. Page 5000 is where the design shows. This lesson also ties the
          SQL back to what Prisma actually sends to the database.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Why is a large OFFSET slow?">
            <p>
              Because <code>OFFSET</code> does not skip work, it only skips output. The database still has to
              find, sort, and then throw away every row you offset past.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>LIMIT 20 OFFSET 100000</code> produces 100020 rows internally and discards 100000 of them</li>
              <li>So the cost grows with the page number. Page 1 is instant and page 5000 can take seconds, on the same query</li>
              <li>Scraping every page in a loop is therefore quadratic overall — a common cause of a background job that gets slower and slower</li>
              <li>There is a correctness problem too. If a row is inserted or deleted between requests, the window shifts, so a user can see the same row twice or miss one entirely</li>
              <li>Counting the total for “page 37 of 4821” also forces a full scan. Consider an approximate count, or a “load more” interface with no total</li>
              <li>OFFSET is fine for small, bounded result sets and for an admin screen nobody pages deeply through. The fix for large data is keyset pagination</li>
            </ul>
            <CodeBlock
              title="Compare the plans"
              language="sql"
              code={`-- Reads 100020 rows to return 20
EXPLAIN ANALYZE
SELECT id, title FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100000;

-- Reads about 20 rows, at any depth
EXPLAIN ANALYZE
SELECT id, title FROM posts
WHERE (created_at, id) < ('2026-01-05 10:00:00+00', 90210)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why does pagination need a stable sort order?">
            <p>
              Without a unique tiebreaker in <code>ORDER BY</code>, rows with equal sort values can come back in
              any order, and that order can change between two requests. Rows then jump between pages.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>SQL guarantees nothing about the order of tied rows. The same query can return them differently after a plan change, a vacuum, or a parallel scan</li>
              <li>So <code>ORDER BY created_at DESC</code> alone is not a stable sort if several rows share a timestamp — which is extremely common</li>
              <li>The fix is one line: append a unique column, almost always the primary key. <code>ORDER BY created_at DESC, id DESC</code></li>
              <li>Keyset pagination <em>requires</em> this, because the cursor must identify one exact row to continue after</li>
              <li>Keep the sort direction consistent across all the columns in your key, and match your index to it, for example an index on <code>(created_at DESC, id DESC)</code></li>
              <li>Sorting by a value that changes, like a like count, will always shuffle pages. For those, sort by a snapshot or a stable score</li>
            </ul>
            <CodeBlock
              title="Unstable vs stable"
              language="sql"
              code={`-- Unstable: rows sharing created_at can swap between requests
SELECT id, title FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;

-- Stable: the primary key breaks every tie deterministically
SELECT id, title FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 20;

-- Matching index
CREATE INDEX posts_created_id_idx ON posts (created_at DESC, id DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do Prisma findMany options map to SQL: where, include, select, orderBy, take, skip?">
            <p>
              <code>where</code> becomes <code>WHERE</code>. <code>orderBy</code> becomes <code>ORDER BY</code>.
              <code>take</code> is <code>LIMIT</code> and <code>skip</code> is <code>OFFSET</code>.
              <code>include</code> also loads related tables. <code>select</code> returns only the fields you list,
              which is better when you do not want the whole row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Relation filters map to subqueries: <code>some</code> is <code>EXISTS</code>, <code>none</code> is <code>NOT EXISTS</code>, and <code>every</code> is “no related row that fails the condition”</li>
              <li><code>include</code> and nested <code>select</code> normally run a second query per relation and stitch the results in memory, rather than emitting one big join. That avoids row fan-out, at the cost of extra round trips</li>
              <li><code>take</code> with a negative number takes from the end of the ordered result</li>
              <li>Turn on query logging to see the real SQL: <code>new PrismaClient({'{ log: ["query"] }'})</code></li>
              <li>When you need a window function, a recursive CTE, or a <code>LATERAL</code> join, drop to <code>$queryRawUnsafe</code>. Those are not expressible in the query API</li>
            </ul>
            <CodeBlock
              title="Prisma findMany"
              language="typescript"
              code={`const users = await prisma.user.findMany({
  where: {
    isActive: true,
    orders: { some: { status: 'paid' } }, // EXISTS-style filter
  },
  select: {
    id: true,
    email: true,
    orders: {
      select: { id: true, totalCents: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  skip: 0,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you implement keyset (cursor) pagination instead of OFFSET?">
            <p>
              A large <code>OFFSET</code> still reads and throws away the skipped rows, so page 500 is slow.
              Keyset pagination says “give me rows after this last id/time” with a <code>WHERE</code>.
              It stays fast on deep pages and does not skip or repeat rows when new data arrives.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The cursor is the sort key of the last row you showed. Send it back with the next request</li>
              <li>Compare the columns as a row value — <code>(created_at, id) &lt; ($1, $2)</code> — which is both correct and index-friendly. Writing it as <code>OR</code> conditions by hand is easy to get subtly wrong</li>
              <li>The <code>WHERE</code>, the <code>ORDER BY</code>, and the index must all use the same columns in the same directions</li>
              <li>Fetch one extra row (<code>LIMIT 21</code> for a page of 20) to know whether there is a next page without a count</li>
              <li>Trade-off: no jumping to an arbitrary page number, and going backwards needs a reversed query. That is why it suits infinite scroll, feeds, exports, and APIs rather than a numbered page list</li>
              <li>Encode the cursor as an opaque string so clients do not build their own, and so you can change the sort key later</li>
            </ul>
            <CodeBlock
              title="Keyset pagination"
              language="sql"
              code={`SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < ($1::timestamptz, $2::bigint)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="First page, and the index to support it"
              language="sql"
              code={`-- First page has no cursor yet
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 21;                -- 21st row means "there is a next page"

CREATE INDEX posts_created_id_idx ON posts (created_at DESC, id DESC);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does cursor pagination work in Prisma?">
            <p>
              Prisma supports it directly with <code>cursor</code> plus <code>skip: 1</code>. The cursor is a
              unique field value, and <code>skip: 1</code> means “start after that row, not at it”.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The <code>cursor</code> must be a unique field, so <code>id</code> is the usual choice</li>
              <li><code>skip: 1</code> is what makes it exclusive. Leave it out and you get the cursor row again as the first result</li>
              <li><code>orderBy</code> must include that unique field so the order is stable, otherwise pages can repeat rows</li>
              <li>Take one extra row and pop it, which tells you whether a next page exists without running a <code>count</code></li>
              <li>Limitation: Prisma&apos;s cursor works on a single field. For a composite key like <code>(createdAt, id)</code>, write the row-value comparison in raw SQL</li>
            </ul>
            <CodeBlock
              title="Prisma cursor pagination"
              language="typescript"
              code={`const PAGE_SIZE = 20;

async function getPage(cursorId) {
  const rows = await prisma.post.findMany({
    take: PAGE_SIZE + 1,               // one extra to detect a next page
    ...(cursorId
      ? { cursor: { id: cursorId }, skip: 1 } // skip the cursor row itself
      : {}),
    orderBy: { id: 'desc' },           // unique field keeps it stable
    select: { id: true, title: true, createdAt: true },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}`}
            />
            <CodeBlock
              title="Composite cursor needs raw SQL"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT id, title, created_at FROM posts ' +
  'WHERE (created_at, id) < ($1, $2) ' +
  'ORDER BY created_at DESC, id DESC LIMIT $3',
  lastCreatedAt,
  lastId,
  PAGE_SIZE
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is the logical processing order of a SELECT query?">
            <p>
              The database reads a SELECT in this order: <code>FROM</code> and <code>JOIN</code>, then
              <code>WHERE</code>, then <code>GROUP BY</code>, then <code>HAVING</code>, then <code>SELECT</code>,
              then <code>DISTINCT</code>, then <code>ORDER BY</code>, then <code>LIMIT</code>.
              Window functions run after grouping. That is why you cannot filter <code>ROW_NUMBER</code> in the
              same <code>WHERE</code>. Put the window in a CTE, then filter it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>This order explains almost every “why is that not allowed?” error in SQL</li>
              <li>A <code>SELECT</code> alias cannot be used in <code>WHERE</code> (it does not exist yet) but can be used in <code>ORDER BY</code> (it does by then)</li>
              <li>An aggregate cannot go in <code>WHERE</code>, only in <code>HAVING</code>, because grouping has not happened yet</li>
              <li>A window function cannot go in <code>WHERE</code>, <code>GROUP BY</code>, or <code>HAVING</code>, because it is evaluated after all three</li>
              <li><code>LIMIT</code> is last, so it cannot make an unsorted query deterministic — the sort happens first</li>
              <li>This is the <em>logical</em> order, not the physical plan. The planner reorders freely as long as the result matches, which is why it can push a filter down into a join</li>
            </ul>
            <CodeBlock
              title="Filter on window result via CTE"
              language="sql"
              code={`WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY created_at DESC
    ) AS rn
  FROM sessions
)
SELECT * FROM ranked WHERE rn = 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
