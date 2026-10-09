import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Index Basics - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL index basics interview questions: what an index is, clustered vs non-clustered, B-tree, composite index column order, ORDER BY, and when Postgres ignores an index.',
};

export default function MaiqPerfLesson01IndexBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Index Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          An index is a shortcut that helps the database find rows fast. This lesson covers the index
          questions that come up in almost every SQL interview, from the simple definition to the
          reasons PostgreSQL sometimes refuses to use the index you created.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is an index, in simple words?">
            <p>
              An index is a shortcut the database keeps so it can find rows without reading the whole
              table. It is like the index at the back of a book. It makes reads faster and writes a bit
              slower, because the shortcut must be updated too.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Put indexes on columns you filter, join, or sort by (user id, email, created date)</li>
              <li>Do not index every column. Extra indexes slow INSERT and UPDATE</li>
              <li>A primary key already has an index</li>
            </ul>
            <CodeBlock
              title="Create a simple index"
              language="sql"
              code={`CREATE INDEX users_email_idx ON users (email);

-- Now this query can jump straight to the row
SELECT id, email FROM users WHERE email = 'alice@example.com';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a clustered index vs a non-clustered index?">
            <p>
              This question is very common, even in Postgres interviews, because it comes from SQL Server
              and MySQL.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Clustered:</strong> the table rows themselves are stored in the order of the key
                (SQL Server / InnoDB primary key)
              </li>
              <li>
                <strong>Non-clustered:</strong> a separate structure that points at the rows
              </li>
              <li>
                <strong>PostgreSQL:</strong> tables are a heap (rows are not kept in primary-key order).
                Every index, including the primary key, is like a non-clustered index
              </li>
              <li>
                You can use <code>CLUSTER</code> to rewrite a table once in index order, but new rows do
                not stay in that order
              </li>
            </ul>
            <CodeBlock
              title="One-time physical reorder in PostgreSQL"
              language="sql"
              code={`-- Rewrites the table in index order. Takes an exclusive lock.
CLUSTER orders USING orders_created_at_idx;

-- Remembers the index for the next CLUSTER run
ALTER TABLE orders CLUSTER ON orders_created_at_idx;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a B-tree index and when do you use it?">
            <p>
              A B-tree is the normal index. Use it for equals, ranges, and sorting (<code>=</code>,{' '}
              <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code>). Primary
              keys and foreign keys use a B-tree.
            </p>
            <CodeBlock
              title="B-tree index"
              language="sql"
              code={`CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="In a composite index, does column order matter? What is the leftmost rule?">
            <p>
              A composite index is an index on more than one column. The order matters a lot. The index is
              sorted by the first column, then by the second inside the first, and so on. So PostgreSQL can
              use the index only if your query filters on the columns from the left side, with no gap. That
              is the leftmost rule (also called the leftmost prefix rule).
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Index on <code>(tenant_id, status, created_at)</code> helps filters on{' '}
                <code>tenant_id</code>, or <code>tenant_id + status</code>, or all three
              </li>
              <li>
                It does not help a query that filters only on <code>status</code>, because the first column
                is missing
              </li>
              <li>Put the column you always filter by first, usually the equality column</li>
              <li>Put the range or sort column last</li>
            </ul>
            <CodeBlock
              title="Leftmost rule in practice"
              language="sql"
              code={`CREATE INDEX orders_tenant_status_created_idx
ON orders (tenant_id, status, created_at DESC);

-- Uses the index (leftmost columns present)
SELECT * FROM orders WHERE tenant_id = 7 AND status = 'paid';

-- Uses the index for tenant_id, then sorts cheaply
SELECT * FROM orders
WHERE tenant_id = 7 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;

-- Cannot use it well: tenant_id is missing
SELECT * FROM orders WHERE status = 'paid';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Does an index help ORDER BY?">
            <p>
              Yes. A B-tree index stores values already sorted, so PostgreSQL can walk the index and return
              rows in order instead of loading everything and sorting it. This matters most with{' '}
              <code>LIMIT</code>, because the database can stop after the first few rows instead of sorting
              the whole table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The index direction must match the query. An index on <code>(created_at DESC)</code> serves{' '}
                <code>ORDER BY created_at DESC</code> directly
              </li>
              <li>
                PostgreSQL can also read a B-tree backwards, so one index often serves both directions
              </li>
              <li>
                For <code>WHERE</code> plus <code>ORDER BY</code>, build one composite index: filter columns
                first, sort column last
              </li>
              <li>
                If you see <code>Sort</code> with <code>external merge Disk</code> in the plan, the sort is
                spilling to disk and an index will help
              </li>
            </ul>
            <CodeBlock
              title="Index that serves filter and sort together"
              language="sql"
              code={`CREATE INDEX posts_author_published_idx
ON posts (author_id, published_at DESC);

-- No separate sort step needed
SELECT id, title FROM posts
WHERE author_id = 12
ORDER BY published_at DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How many indexes are too many?">
            <p>
              There is no magic number, but every index costs you something. Each one must be updated on
              INSERT, UPDATE, and DELETE, takes disk space, and adds work for autovacuum and for the planner.
              A common practical answer: keep the indexes your real queries use, and drop the rest.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Index foreign keys and the columns in your top queries first</li>
              <li>
                Prefer one good composite index over three single-column indexes that cover the same query
              </li>
              <li>
                A write-heavy table with 15 indexes is usually a problem. A read-heavy reporting table can
                carry more
              </li>
              <li>
                Measure instead of guessing: check <code>pg_stat_user_indexes</code> for indexes with zero
                scans
              </li>
            </ul>
            <CodeBlock
              title="Index size and usage"
              language="sql"
              code={`SELECT
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'orders'
ORDER BY idx_scan;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When does PostgreSQL ignore an index even though one exists?">
            <p>
              The planner picks the cheapest plan it can estimate, so sometimes a full table read really is
              cheaper. But there are also cases where the index simply cannot be used. Interviewers like this
              question because it separates people who only create indexes from people who debug them.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Low selectivity:</strong> the filter matches most rows, so reading the table
                sequentially is cheaper than jumping around
              </li>
              <li>
                <strong>Small table:</strong> everything fits in a few pages and a scan wins
              </li>
              <li>
                <strong>Function or cast on the column:</strong>{' '}
                <code>WHERE lower(email) = ...</code> cannot use a plain index on <code>email</code>. Use an
                expression index instead
              </li>
              <li>
                <strong>Type mismatch:</strong> comparing a <code>bigint</code> column to a text value forces
                a cast on the column side
              </li>
              <li>
                <strong>Leading wildcard:</strong> <code>LIKE &apos;%abc&apos;</code> cannot use a B-tree.{' '}
                <code>LIKE &apos;abc%&apos;</code> can, if the index uses the right collation or{' '}
                <code>text_pattern_ops</code>
              </li>
              <li>
                <strong>Stale statistics:</strong> after a big data load the planner still thinks the table is
                tiny. Run <code>ANALYZE</code>
              </li>
              <li>
                <strong>Wrong index type for the operator:</strong> JSONB containment or full-text search
                needs GIN, not B-tree
              </li>
              <li>
                <strong>Wrong column order:</strong> the leading column of a composite index is not in the
                query
              </li>
            </ul>
            <CodeBlock
              title="Fixing two common cases"
              language="sql"
              code={`-- Problem: function on the column blocks the index
SELECT * FROM users WHERE lower(email) = 'alice@example.com';

-- Fix: index the same expression
CREATE INDEX users_lower_email_idx ON users (lower(email));

-- Problem: planner thinks the table is small after a bulk load
ANALYZE orders;

-- Debug only, never a permanent fix: prove the index would be cheaper
SET enable_seqscan = off;
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;
RESET enable_seqscan;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
