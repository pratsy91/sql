import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: Functions with Indexes and Prisma - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked questions on expression indexes, why a function on an indexed column blocks the index, GIN indexes for JSONB, pg_trgm for ILIKE with a leading wildcard, Prisma aggregates, and Prisma vs raw SQL.',
};

export default function M7L6FunctionsWithIndexesAndPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: Functions with Indexes and Prisma</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Functions are where queries quietly stop using indexes. This lesson explains why that happens, how to
          index an expression instead, which index type fits JSONB and text search, and where the line sits
          between Prisma and raw SQL.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Why does putting a function on an indexed column stop the index being used?">
            <p>
              An index stores the column&apos;s values in sorted order. The planner can only use it when it can
              look up the exact thing stored in the index. Once you wrap the column in a function, the value you
              are comparing is no longer what the index holds, so the index cannot help and PostgreSQL reads the
              whole table. That full read is called a sequential scan.
            </p>
            <p>
              When a condition can use an index it is called sargable. The rule for making a condition sargable is
              simple: leave the indexed column alone on one side of the comparison, and move every function and
              calculation to the other side.
            </p>
            <CodeBlock
              title="The same filter, written two ways"
              language="sql"
              code={`CREATE INDEX users_created_at_idx ON users (created_at);

-- Sequential scan: the column is inside a function
SELECT * FROM users
WHERE date_trunc('day', created_at) = DATE '2026-03-17';

-- Index scan: the column stands alone, maths moved to the right
SELECT * FROM users
WHERE created_at >= DATE '2026-03-17'
  AND created_at <  DATE '2026-03-18';`}
            />
            <p>Other very common versions of the same mistake:</p>
            <CodeBlock
              title="More non-sargable patterns"
              language="sql"
              code={`-- Function on the column
WHERE LOWER(email) = 'ada@example.com'
WHERE EXTRACT(YEAR FROM created_at) = 2026
WHERE AGE(NOW(), created_at) > INTERVAL '1 year'
WHERE id::text = '42'

-- Sargable rewrites
WHERE email = 'ada@example.com'                -- if stored lowercase
WHERE created_at >= '2026-01-01'
  AND created_at <  '2027-01-01'
WHERE created_at < NOW() - INTERVAL '1 year'
WHERE id = 42`}
            />
            <p>
              A cast counts as a function too. Comparing an <code>integer</code> column to a text value forces a
              conversion and can lose the index, which is why implicit casts are worth checking in a slow query.
            </p>
            <p>
              Sometimes you genuinely need the function, for example case-insensitive email lookup. In that case
              you do not rewrite the query, you index the expression instead. That is the next question.
            </p>
            <p>
              Always confirm with <code>EXPLAIN ANALYZE</code> rather than guessing. Look for
              <code>Seq Scan</code> versus <code>Index Scan</code> in the output.
            </p>
            <CodeBlock
              title="Check, do not guess"
              language="sql"
              code={`EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'ada@example.com';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain functional indexes and expression indexes with functions.">
            <p>
              An expression index stores the result of an expression rather than the raw column value. So you can
              index <code>LOWER(email)</code> and then case-insensitive lookups use an index normally.
            </p>
            <p>
              The catch: the query must use the same expression as the index. Writing
              <code>LOWER(email)</code> in the index but <code>UPPER(email)</code> in the query gains you nothing.
            </p>
            <CodeBlock
              title="Expression index"
              language="sql"
              code={`CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email));

SELECT * FROM users WHERE LOWER(email) = LOWER('Ada@Example.com');`}
            />
            <p>
              Making it <code>UNIQUE</code> does something useful beyond speed: it prevents
              <code>ada@example.com</code> and <code>Ada@Example.com</code> both being registered. That is a
              correctness guarantee a plain unique index on <code>email</code> would not give you.
            </p>
            <p>
              The function in an expression index must be <code>IMMUTABLE</code>, meaning the same input always
              gives the same output. PostgreSQL rejects anything else, because a changing result would make the
              stored index wrong. <code>NOW()</code> cannot be indexed for that reason.
            </p>
            <CodeBlock
              title="More expression index examples"
              language="sql"
              code={`-- JSON key extracted for fast equality lookups
CREATE INDEX events_type_idx ON events ((payload ->> 'type'));

-- Computed value
CREATE INDEX orders_total_idx ON orders ((unit_price_cents * quantity));

-- Partial index: only the rows you actually query
CREATE INDEX orders_pending_idx ON orders (created_at)
  WHERE status = 'pending';`}
            />
            <p>
              That last one is a partial index. It indexes only the matching rows, so it is much smaller and
              cheaper to maintain. It is the right tool for a job queue where you only ever query pending work.
            </p>
            <p>
              A modern alternative to an expression index is a generated column: a real column whose value
              PostgreSQL computes for you. You then index it like any other column, and queries can reference it
              by name instead of repeating the expression.
            </p>
            <CodeBlock
              title="Generated column instead of an expression"
              language="sql"
              code={`ALTER TABLE users
  ADD COLUMN email_lower text GENERATED ALWAYS AS (LOWER(email)) STORED;

CREATE UNIQUE INDEX users_email_lower2_uq ON users (email_lower);

SELECT * FROM users WHERE email_lower = 'ada@example.com';`}
            />
            <p>
              Prisma cannot declare an expression index in <code>schema.prisma</code>, so these live in a raw SQL
              migration. Prisma does support a generated column if you mark the field as read-only in your code.
            </p>
            <CodeBlock
              title="Prisma migration for an expression index"
              language="sql"
              code={`-- migrations/20260301000000_email_lower_index/migration.sql
CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email));`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you make ILIKE with a leading wildcard fast using pg_trgm?">
            <p>
              A B-tree index works like a dictionary: it finds words by their beginning. So
              <code>name LIKE &apos;Pro%&apos;</code> can use one, because the start of the value is known. But
              <code>name ILIKE &apos;%phone%&apos;</code> has no known beginning, so a B-tree is useless and you
              get a full table scan.
            </p>
            <p>
              The fix is the <code>pg_trgm</code> extension. A trigram is a three-character slice of a string.
              The extension breaks every value into trigrams and indexes those, so a search for a substring
              becomes a search for the trigrams it contains. Position no longer matters.
            </p>
            <CodeBlock
              title="Trigram index for substring search"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Now this can use the index
SELECT * FROM products WHERE name ILIKE '%phone%';`}
            />
            <p>
              Use <code>gin_trgm_ops</code> for the common case. A GIN index is larger and slower to write but
              much faster to search. <code>gist_trgm_ops</code> with a GiST index is smaller and better when
              writes are heavy or when you need nearest-neighbour ordering by similarity.
            </p>
            <p>
              The same index also powers fuzzy matching. <code>similarity()</code> scores how alike two strings
              are, and the <code>%</code> operator is true when that score passes a threshold. This is how you
              build a typo-tolerant search box.
            </p>
            <CodeBlock
              title="Fuzzy search and typo tolerance"
              language="sql"
              code={`-- Rank by closeness, tolerating a misspelling
SELECT name, similarity(name, 'iphon') AS score
FROM products
WHERE name % 'iphon'
ORDER BY score DESC
LIMIT 10;

-- Tune the cut-off for the session
SET pg_trgm.similarity_threshold = 0.3;`}
            />
            <p>
              Two limits to mention so the answer sounds experienced. Search terms shorter than three characters
              cannot form a trigram, so they fall back to a scan. And trigrams match characters, not words, so for
              real language search with stemming and ranking you want full-text search with
              <code>tsvector</code> and a GIN index instead.
            </p>
            <CodeBlock
              title="Full-text search as the alternative"
              language="sql"
              code={`ALTER TABLE products
  ADD COLUMN search_vec tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(description, ''))) STORED;

CREATE INDEX products_search_idx ON products USING GIN (search_vec);

SELECT id, name
FROM products
WHERE search_vec @@ websearch_to_tsquery('english', 'wireless headphones');`}
            />
            <p>
              Rule of thumb: trigrams for &quot;contains this fragment&quot; and typo tolerance, full-text search
              for &quot;matches these words&quot;.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you index JSONB and text search patterns efficiently?">
            <p>
              For containment with <code>@&gt;</code>, use a GIN index on the JSONB column. The default operator
              class supports every JSONB operator. <code>jsonb_path_ops</code> is smaller and faster but only
              supports <code>@&gt;</code> and the path operators, not key existence.
            </p>
            <p>
              For <code>ILIKE &apos;%term%&apos;</code>, a B-tree cannot help a leading wildcard, so use a
              <code>pg_trgm</code> GIN or GiST index. And when one JSON key is queried constantly, pull it into a
              generated column with a normal B-tree index.
            </p>
            <CodeBlock
              title="Indexing patterns"
              language="sql"
              code={`CREATE INDEX events_payload_gin ON events USING GIN (payload jsonb_path_ops);
CREATE INDEX products_name_trgm ON products USING GIN (name gin_trgm_ops);

ALTER TABLE events
  ADD COLUMN email text GENERATED ALWAYS AS (payload ->> 'email') STORED;
CREATE INDEX events_email_idx ON events (email);`}
            />
            <p>
              Choosing between the three JSONB options comes down to the shape of your queries:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Many different unpredictable keys, and you need <code>?</code> key existence too: GIN with the
                default operator class.
              </li>
              <li>
                Only containment and path queries: GIN with <code>jsonb_path_ops</code>, for a smaller index.
              </li>
              <li>
                One or two hot keys with equality or range filters: a generated column plus a B-tree. This is the
                fastest option and it also gives you real types and statistics, which helps the planner estimate
                row counts.
              </li>
            </ul>
            <p>
              An important detail: a GIN index on the whole column supports <code>@&gt;</code> containment, but
              not <code>payload -&gt;&gt; &apos;score&apos; &gt; &apos;80&apos;</code>. Range comparisons on an
              extracted value need an expression index or a generated column.
            </p>
            <CodeBlock
              title="Matching the index to the operator"
              language="sql"
              code={`-- Uses the GIN index
SELECT * FROM events WHERE payload @> '{"type":"signup"}'::jsonb;

-- Does NOT use the GIN index: needs an expression index
CREATE INDEX events_score_idx ON events (((payload ->> 'score')::int));
SELECT * FROM events WHERE (payload ->> 'score')::int >= 80;`}
            />
            <p>
              Finally, GIN indexes are expensive to update. PostgreSQL buffers new entries in a pending list and
              flushes them later, which keeps inserts fast but can make the first query after a bulk load slow.
              Build GIN indexes with <code>CONCURRENTLY</code> on a live table so writes are not blocked.
            </p>
            <CodeBlock
              title="Building without downtime"
              language="sql"
              code={`CREATE INDEX CONCURRENTLY events_payload_gin
  ON events USING GIN (payload jsonb_path_ops);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does Prisma express aggregates and groupBy compared to SQL?">
            <p>
              Use <code>aggregate</code> for whole-table statistics and <code>groupBy</code> for grouped
              statistics. Both are type-safe and both compile down to a single SQL query.
            </p>
            <p>
              Anything the Prisma query API has no syntax for goes through <code>$queryRaw</code>. That includes
              <code>FILTER</code> aggregates, <code>DISTINCT ON</code>, <code>date_trunc</code> grouping, JSONB
              path expressions, and window functions.
            </p>
            <CodeBlock
              title="Prisma aggregate / groupBy / raw"
              language="typescript"
              code={`const totals = await prisma.order.aggregate({
  _count: true,
  _sum: { totalCents: true },
  _avg: { totalCents: true },
  where: { status: 'paid' },
});

const byStatus = await prisma.order.groupBy({
  by: ['status'],
  _count: { _all: true },
  _sum: { totalCents: true },
});

const latest = await prisma.$queryRawUnsafe(
  'SELECT DISTINCT ON (user_id) user_id, id FROM orders ORDER BY user_id, created_at DESC',
);`}
            />
            <p>Three details that catch people out on real projects:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>_count: true</code> means <code>COUNT(*)</code>, while
                <code>_count: {"{ phone: true }"}</code> means <code>COUNT(phone)</code> and therefore skips
                NULLs. Exactly the same distinction as in SQL.
              </li>
              <li>
                <code>groupBy</code> filters after grouping with <code>having</code>, which maps to SQL
                <code>HAVING</code>. Filtering before grouping still uses <code>where</code>.
              </li>
              <li>
                A <code>SUM</code> over a <code>bigint</code> column comes back as a JavaScript BigInt, which
                <code>JSON.stringify</code> refuses to serialise. Convert it before returning it from an API.
              </li>
            </ul>
            <CodeBlock
              title="having, and the BigInt gotcha"
              language="typescript"
              code={`const busyUsers = await prisma.order.groupBy({
  by: ['userId'],
  where: { status: 'paid' },
  _count: { _all: true },
  having: { userId: { _count: { gt: 5 } } },
  orderBy: { _count: { userId: 'desc' } },
});

const rows = await prisma.$queryRawUnsafe(
  'SELECT SUM(total_cents) AS revenue FROM orders',
);
const revenue = Number(rows[0].revenue);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="When should application code use Prisma vs raw SQL for functions and operators?">
            <p>
              Use Prisma for CRUD, simple filters, relations and ordinary aggregates. You get type safety, a
              single place for the schema, and migrations that travel with the code.
            </p>
            <p>
              Drop to <code>$queryRaw</code> or <code>$executeRaw</code> for <code>DISTINCT ON</code>,
              <code>FILTER</code> aggregates, JSONB path expressions, window functions, recursive queries, and any
              vendor-specific operator. Fighting the query builder to express these usually produces slower SQL
              than writing it directly.
            </p>
            <p>
              The rule that matters most: always parameterise. A tagged template passes values as bound
              parameters, so user input can never change the shape of the statement. If you build the SQL string
              yourself, the <code>Unsafe</code> variants still bind positional parameters, so pass values as
              arguments rather than concatenating them in.
            </p>
            <CodeBlock
              title="Parameterised raw query"
              language="typescript"
              code={`const minScore = 80;

// Values are bound as parameters, never pasted into the SQL text
const rows = await prisma.$queryRawUnsafe(
  "SELECT id, payload FROM events WHERE (payload ->> 'score')::int >= $1",
  minScore,
);

// Never do this: user input becomes part of the statement
// await prisma.$queryRawUnsafe('SELECT * FROM users WHERE email = ' + input);`}
            />
            <p>
              Identifiers such as table and column names cannot be bound as parameters. If a sort column comes
              from the client, validate it against an allow-list in your own code first.
            </p>
            <CodeBlock
              title="Allow-list for dynamic identifiers"
              language="typescript"
              code={`const SORTABLE = { created: 'created_at', total: 'total_cents' } as const;

function ordersSortedBy(key: keyof typeof SORTABLE) {
  const column = SORTABLE[key]; // never the raw client string
  return prisma.$queryRawUnsafe(
    'SELECT id, total_cents FROM orders ORDER BY ' + column + ' DESC LIMIT 50',
  );
}`}
            />
            <p>
              Two practical habits keep raw SQL maintainable. First, keep every raw query in a small number of
              repository files rather than scattered through route handlers, so they are easy to audit. Second,
              remember that <code>$queryRaw</code> returns plain objects with database column names and no Prisma
              type checking, so declare a return type and keep it beside the query.
            </p>
            <p>
              A good middle path for read-heavy reporting is a database view. You write the complex SQL once, then
              map the view into <code>schema.prisma</code> so the client gives you typed access to it.
            </p>
            <CodeBlock
              title="Wrap complex SQL in a view"
              language="sql"
              code={`CREATE VIEW monthly_revenue AS
SELECT
  date_trunc('month', created_at) AS month,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders,
  SUM(total_cents) FILTER (WHERE status = 'paid') AS revenue_cents
FROM orders
GROUP BY 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
