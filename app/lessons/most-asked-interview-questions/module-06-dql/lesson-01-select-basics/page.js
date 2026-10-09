import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: SELECT Basics - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on SELECT basics: DISTINCT, ORDER BY with LIMIT and OFFSET, filtering NULL, aliases, LIKE vs ILIKE, BETWEEN and IN, COALESCE, and why SELECT * is discouraged.',
};

export default function M6L1SelectBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: SELECT Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Every SQL interview starts here. Reading rows, naming columns, filtering text, and handling
          NULL — the last one catches more candidates than anything else on this page.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DQL, and what does SELECT do?">
            <p>
              DQL means the SQL you use to <strong>read</strong> data. In practice that is <code>SELECT</code>:
              pick columns, filter rows, join tables, and get a result. It does not change stored rows, unless you
              add <code>FOR UPDATE</code>, which locks the rows you read.
            </p>
            <CodeBlock
              title="Basic SELECT"
              language="sql"
              code={`SELECT id, email, created_at
FROM users
WHERE is_active = true;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does SELECT DISTINCT do? When would you use it?">
            <p>
              <code>DISTINCT</code> removes duplicate rows from the answer. Use it when you want unique values,
              such as a list of cities. Do not use it to hide a bad join that multiplied rows. Fix the join instead.
            </p>
            <CodeBlock
              title="DISTINCT"
              language="sql"
              code={`SELECT DISTINCT city
FROM customers
ORDER BY city;

-- Distinct on multiple columns = unique pairs
SELECT DISTINCT department_id, job_title
FROM employees;`}
            />
            <p>
              PostgreSQL also has <code>DISTINCT ON</code>, which keeps the first row per group according to
              your <code>ORDER BY</code>. It is a short way to get “the latest row per user”.
            </p>
            <CodeBlock
              title="DISTINCT ON"
              language="sql"
              code={`SELECT DISTINCT ON (user_id)
  user_id, id, created_at
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you give a column or table a different name?">
            <p>
              That is an alias. Use <code>AS</code> for columns and a short letter for tables. It makes the
              output readable and the query shorter.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>AS</code> is optional but clearer, so write it for columns</li>
              <li>Use double quotes if the alias has a space or capital letters: <code>AS &quot;Total Revenue&quot;</code>. Without quotes, Postgres lowercases the name</li>
              <li>A column alias defined in <code>SELECT</code> cannot be used in <code>WHERE</code>, because <code>WHERE</code> runs first. It <em>can</em> be used in <code>ORDER BY</code> and <code>GROUP BY</code></li>
              <li>Table aliases become required in self joins, and are almost required in any join for readability</li>
            </ul>
            <CodeBlock
              title="Aliases"
              language="sql"
              code={`SELECT
  u.id,
  u.email                AS email_address,
  o.total_cents / 100.0  AS total_dollars
FROM users u
JOIN orders o ON o.user_id = u.id
ORDER BY total_dollars DESC;   -- alias is allowed here

-- Not allowed: WHERE total_dollars > 100
-- Repeat the expression, or wrap the query in a subquery / CTE`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do ORDER BY, LIMIT, and OFFSET work together?">
            <p>
              <code>ORDER BY</code> sorts the rows. <code>LIMIT n</code> returns at most n rows.
              <code>OFFSET m</code> skips the first m rows. Always sort by a stable column (like id).
              Without <code>ORDER BY</code>, the database can return rows in any order.
            </p>
            <CodeBlock
              title="Pagination"
              language="sql"
              code={`SELECT id, title
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 40;  -- page 3 if page size = 20`}
            />
            <CodeBlock
              title="Prisma: orderBy / take / skip"
              language="typescript"
              code={`const posts = await prisma.post.findMany({
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 20,
  skip: 40,
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you filter NULL values correctly?">
            <p>
              Use <code>IS NULL</code> or <code>IS NOT NULL</code>. Writing <code>= NULL</code> or
              <code>!= NULL</code> never matches a row. Comparing anything to NULL is unknown, not true.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>NULL means “unknown”, not zero and not an empty string</li>
              <li><code>WHERE status &lt;&gt; &apos;paid&apos;</code> silently drops rows where status is NULL. Add <code>OR status IS NULL</code> if you want them</li>
              <li><code>IS DISTINCT FROM</code> compares two values treating NULL as a normal value, which is handy in change detection</li>
            </ul>
            <CodeBlock
              title="NULL checks"
              language="sql"
              code={`SELECT *
FROM users
WHERE deleted_at IS NULL;

-- Wrong (never returns rows):
-- WHERE deleted_at = NULL

-- Include NULLs in a "not equal" filter
SELECT * FROM orders
WHERE status <> 'paid' OR status IS NULL;

-- NULL-safe comparison
SELECT * FROM orders
WHERE status IS DISTINCT FROM 'paid';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is COALESCE and where do you use it?">
            <p>
              <code>COALESCE</code> returns the first argument that is not NULL. It is how you show a fallback
              value instead of an empty cell.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>It takes any number of arguments and stops at the first non-NULL one</li>
              <li>Very common after a <code>LEFT JOIN</code>, where unmatched rows give NULL, and around <code>SUM</code>, which returns NULL for an empty group</li>
              <li>All arguments must have compatible types, so <code>COALESCE(price, 0)</code> works but <code>COALESCE(price, &apos;none&apos;)</code> does not</li>
              <li>Related: <code>NULLIF(a, b)</code> gives NULL when the two are equal, which is the classic guard against divide-by-zero</li>
              <li>Careful in a <code>WHERE</code> clause — wrapping an indexed column in <code>COALESCE</code> stops a plain index being used</li>
            </ul>
            <CodeBlock
              title="COALESCE and NULLIF"
              language="sql"
              code={`SELECT
  u.email,
  COALESCE(u.display_name, u.email, 'anonymous') AS shown_name,
  COALESCE(SUM(o.total_cents), 0)                AS lifetime_cents,
  -- avoid division by zero
  SUM(o.total_cents) / NULLIF(COUNT(o.id), 0)    AS avg_order_cents
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email, u.display_name;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between LIKE and ILIKE?">
            <p>
              <code>LIKE</code> matches a text pattern and is case sensitive. <code>ILIKE</code> is the
              PostgreSQL version that ignores letter case.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>%</code> matches any number of characters, <code>_</code> matches exactly one</li>
              <li><code>&apos;abc%&apos;</code> is a prefix search and can use a normal B-tree index. <code>&apos;%abc%&apos;</code> cannot, because the index is sorted from the left</li>
              <li><code>ILIKE</code> never uses a plain B-tree index. To index it, create an index on <code>lower(column)</code> and search with <code>lower(col) LIKE lower($1)</code>, or add a trigram index</li>
              <li>The <code>pg_trgm</code> extension with a GIN index makes contains-style searches fast, including <code>ILIKE &apos;%abc%&apos;</code></li>
              <li>For real search across words, full text search with <code>tsvector</code> is the right tool, not <code>LIKE</code></li>
              <li>Remember to escape user input containing <code>%</code> or <code>_</code>, otherwise the user changes the meaning of your pattern</li>
            </ul>
            <CodeBlock
              title="LIKE, ILIKE, and making them fast"
              language="sql"
              code={`SELECT * FROM users WHERE email LIKE 'ada%';     -- case sensitive prefix
SELECT * FROM users WHERE email ILIKE 'ADA%';    -- case insensitive
SELECT * FROM users WHERE email ~* '^ada';       -- regex, case insensitive

-- Index a case-insensitive prefix search
CREATE INDEX users_lower_email_idx ON users (lower(email));
SELECT * FROM users WHERE lower(email) LIKE lower('ADA%');

-- Index a "contains" search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
SELECT * FROM products WHERE name ILIKE '%cable%';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do BETWEEN and IN work, and what are the traps?">
            <p>
              <code>BETWEEN a AND b</code> is shorthand for <code>col &gt;= a AND col &lt;= b</code>.
              <code> IN (list)</code> is shorthand for a chain of <code>OR</code> comparisons.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>BETWEEN</code> includes both ends. That is the trap with timestamps: <code>BETWEEN &apos;2026-01-01&apos; AND &apos;2026-01-31&apos;</code> stops at midnight and loses almost all of the 31st</li>
              <li>For dates and times, use a half-open range instead: <code>&gt;= start AND &lt; next_start</code>. It is correct for any precision and still uses the index</li>
              <li><code>IN</code> with a subquery is fine; <code>NOT IN</code> with a subquery that can return NULL returns no rows at all. Use <code>NOT EXISTS</code></li>
              <li>A very long <code>IN</code> list (thousands of values) plans slowly. Pass an array and use <code>= ANY($1)</code>, or join against <code>unnest()</code></li>
              <li><code>IN</code> also works with row values, which is neat for composite keys</li>
            </ul>
            <CodeBlock
              title="BETWEEN and IN done right"
              language="sql"
              code={`-- Inclusive on both ends: fine for integers
SELECT * FROM products WHERE price BETWEEN 10 AND 20;

-- Wrong for timestamps: misses most of Jan 31
SELECT * FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31';

-- Right: half-open range
SELECT * FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <  '2026-02-01';

-- IN list, array form, and row values
SELECT * FROM orders WHERE status IN ('paid', 'shipped');
SELECT * FROM orders WHERE id = ANY($1::bigint[]);
SELECT * FROM enrollments WHERE (student_id, course_id) IN ((1, 10), (2, 11));`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why is SELECT * discouraged in application code?">
            <p>
              It works, and it is fine while exploring data by hand. In shipped code it quietly causes
              performance and correctness problems.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Wasted work:</strong> you transfer columns you never read, including big <code>TEXT</code> or <code>JSONB</code> blobs that may need to be fetched from out-of-line storage</li>
              <li><strong>Blocks index-only scans:</strong> if you had listed just the two columns in an index, Postgres could answer from the index alone and never touch the table</li>
              <li><strong>Fragile:</strong> adding, removing, or reordering a column changes your result shape. Code that reads by position breaks, and <code>INSERT INTO t SELECT * FROM s</code> breaks loudly</li>
              <li><strong>Leaks data:</strong> a new <code>password_hash</code> or <code>ssn</code> column silently starts flowing into API responses</li>
              <li><strong>Ambiguity in joins:</strong> two tables both have <code>id</code> and <code>created_at</code>, so you get duplicate column names</li>
              <li>Write the column list. It documents what the query needs, and a reviewer can see the cost at a glance</li>
            </ul>
            <CodeBlock
              title="Name your columns"
              language="sql"
              code={`-- Can be answered by an index on (user_id, created_at) alone
SELECT id, created_at
FROM orders
WHERE user_id = 7
ORDER BY created_at DESC
LIMIT 10;`}
            />
            <CodeBlock
              title="Prisma select does the same thing"
              language="typescript"
              code={`// Returns every column, like SELECT *
const all = await prisma.user.findMany();

// Returns only what you asked for
const lean = await prisma.user.findMany({
  select: { id: true, email: true },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
