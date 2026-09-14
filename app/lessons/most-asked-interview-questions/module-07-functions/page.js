import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 7: Functions & Operators - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL functions interview questions: string, numeric, datetime, aggregates, arrays, JSONB, DISTINCT ON, and Prisma aggregates — Junior to Senior.',
};

export default function Module7Functions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 7: Functions & Operators</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 7 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you concatenate and trim strings in PostgreSQL?">
            <p>
              Use <code>CONCAT</code>, the <code>||</code> operator, and <code>TRIM</code>/<code>LTRIM</code>/
              <code>RTRIM</code>. <code>CONCAT</code> ignores <code>NULL</code> arguments;
              <code>||</code> yields <code>NULL</code> if any operand is <code>NULL</code>.
            </p>
            <CodeBlock
              title="String basics"
              language="sql"
              code={`SELECT
  CONCAT(first_name, ' ', last_name) AS full_name,
  TRIM(BOTH ' ' FROM '  hello  ') AS trimmed,
  first_name || ' ' || last_name AS via_pipe
FROM users;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between LIKE and ILIKE?">
            <p>
              <code>LIKE</code> is case-sensitive pattern matching; <code>ILIKE</code> is case-insensitive
              (PostgreSQL-specific). <code>%</code> matches any sequence; <code>_</code> matches one character.
            </p>
            <CodeBlock
              title="LIKE / ILIKE"
              language="sql"
              code={`SELECT * FROM products WHERE name LIKE 'Pro%';
SELECT * FROM products WHERE name ILIKE '%iphone%';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.product.findMany({
  where: { name: { contains: 'iphone', mode: 'insensitive' } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain SUBSTRING and common numeric helpers like ROUND and COALESCE.">
            <p>
              <code>SUBSTRING</code> (or <code>SUBSTR</code>) extracts part of a string. <code>ROUND</code>
              rounds numerics. <code>COALESCE</code> returns the first non-NULL argument — essential for default
              values and NULL-safe displays.
            </p>
            <CodeBlock
              title="SUBSTRING, ROUND, COALESCE"
              language="sql"
              code={`SELECT
  SUBSTRING(email FROM 1 FOR 3) AS email_prefix,
  ROUND(price::numeric, 2) AS price_2dp,
  COALESCE(nickname, first_name, 'Anonymous') AS display_name
FROM users
JOIN products ON true
LIMIT 5;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Which datetime functions are most commonly asked?">
            <p>
              <code>NOW()</code> / <code>CURRENT_TIMESTAMP</code> for current time, <code>AGE</code> for intervals
              between timestamps, and <code>date_trunc</code> to bucket timestamps (day, month, hour).
            </p>
            <CodeBlock
              title="Datetime"
              language="sql"
              code={`SELECT
  NOW() AS now_ts,
  AGE(NOW(), created_at) AS account_age,
  date_trunc('month', created_at) AS month_bucket
FROM users;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do COUNT, SUM, and AVG behave with NULL?">
            <p>
              Aggregates ignore <code>NULL</code> inputs (except <code>COUNT(*)</code>, which counts rows).
              <code>COUNT(column)</code> counts non-NULL values. <code>AVG</code> of an empty set is
              <code>NULL</code>, not 0.
            </p>
            <CodeBlock
              title="Aggregates"
              language="sql"
              code={`SELECT
  COUNT(*) AS all_rows,
  COUNT(deleted_at) AS soft_deleted,
  SUM(total_cents) AS revenue,
  AVG(total_cents) AS avg_order
FROM orders;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the FILTER clause on aggregates?">
            <p>
              <code>FILTER (WHERE ...)</code> applies a condition to a single aggregate without needing a
              separate <code>CASE</code> or multiple queries. Cleaner for conditional counts/sums.
            </p>
            <CodeBlock
              title="FILTER"
              language="sql"
              code={`SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid,
  SUM(total_cents) FILTER (WHERE status = 'paid') AS paid_revenue
FROM orders;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do array operators and functions work in PostgreSQL?">
            <p>
              Arrays use <code>{}</code> literals. Common ops: <code>ANY</code>/<code>ALL</code>,
              <code>@&gt;</code> (contains), <code>&&</code> (overlap), <code>unnest</code>,
              <code>array_agg</code>, <code>cardinality</code>.
            </p>
            <CodeBlock
              title="Array ops"
              language="sql"
              code={`SELECT *
FROM posts
WHERE tags @> ARRAY['postgres']::text[]
   OR tags && ARRAY['sql', 'database'];

SELECT unnest(ARRAY[10, 20, 30]) AS n;

SELECT user_id, array_agg(id ORDER BY created_at) AS order_ids
FROM orders
GROUP BY user_id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain JSONB operators: ->, ->>, @>, and jsonb_path queries.">
            <p>
              <code>-&gt;</code> returns JSONB; <code>-&gt;&gt;</code> returns text. <code>@&gt;</code> checks
              containment. For richer queries, use <code>jsonb_path_exists</code> / <code>jsonb_path_query</code>
              (SQL/JSON path, PostgreSQL 12+). Prefer JSONB over JSON for indexing and operators.
            </p>
            <CodeBlock
              title="JSONB"
              language="sql"
              code={`SELECT
  payload -> 'user' AS user_obj,
  payload ->> 'email' AS email_text
FROM events
WHERE payload @> '{"type":"signup"}'::jsonb
  AND jsonb_path_exists(payload, '$.meta.score ? (@ >= 80)');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is DISTINCT ON in PostgreSQL?">
            <p>
              <code>DISTINCT ON (expr)</code> keeps the first row for each distinct expression value according to
              <code>ORDER BY</code>. Extremely common for “latest row per group” without a window function.
              The leftmost <code>ORDER BY</code> expressions must match the <code>DISTINCT ON</code> expressions.
            </p>
            <CodeBlock
              title="DISTINCT ON — latest order per user"
              language="sql"
              code={`SELECT DISTINCT ON (user_id)
  user_id, id, total_cents, created_at
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you format or extract parts of dates for reporting?">
            <p>
              Use <code>EXTRACT</code>, <code>TO_CHAR</code>, and <code>date_trunc</code>. Interviewers often ask
              for monthly revenue grouping.
            </p>
            <CodeBlock
              title="Date bucketing"
              language="sql"
              code={`SELECT
  date_trunc('month', created_at) AS month,
  TO_CHAR(created_at, 'YYYY-MM') AS month_label,
  SUM(total_cents) AS revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY 1, 2
ORDER BY 1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma express aggregates and groupBy compared to SQL?">
            <p>
              Use <code>aggregate</code> for whole-table stats and <code>groupBy</code> for grouped stats.
              Complex expressions (FILTER, JSONB path, DISTINCT ON) often need <code>$queryRaw</code>.
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

const latest = await prisma.$queryRaw<{ user_id: number; id: number }[]>\`
  SELECT DISTINCT ON (user_id) user_id, id
  FROM orders
  ORDER BY user_id, created_at DESC
\`;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you index JSONB and text search patterns efficiently?">
            <p>
              For containment (<code>@&gt;</code>), use GIN on JSONB (<code>jsonb_path_ops</code> is smaller/faster
              for <code>@&gt;</code>). For <code>ILIKE '%term%'</code>, B-tree cannot help leading wildcards —
              consider <code>pg_trgm</code> GIN/GiST trigram indexes. Generated columns can extract hot JSON keys
              into typed, B-tree-indexed columns.
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Compare string_agg / array_agg and when NULLIF / GREATEST / LEAST matter.">
            <p>
              <code>array_agg</code> builds arrays; <code>string_agg</code> builds delimited strings (great for
              CSV-like outputs). <code>NULLIF(a,b)</code> returns NULL if equal (classic divide-by-zero guards).
              <code>GREATEST</code>/<code>LEAST</code> pick max/min across arguments (NULLs ignored in PG for
              these in most cases — confirm with docs for your version).
            </p>
            <CodeBlock
              title="Advanced helpers"
              language="sql"
              code={`SELECT
  department_id,
  string_agg(name, ', ' ORDER BY name) AS names,
  array_agg(id) AS ids
FROM employees
GROUP BY department_id;

SELECT total_cents::numeric / NULLIF(quantity, 0) AS unit_price
FROM order_items;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you safely cast and handle type conversion errors in expressions?">
            <p>
              Prefer explicit casts (<code>::numeric</code>, <code>CAST(... AS ...)</code>). For untrusted text,
              validate before casting. PostgreSQL 16+ improved error handling in some contexts; still, bad casts
              abort the statement. Use <code>CASE</code>, regex checks, or <code>to_number</code> carefully.
            </p>
            <CodeBlock
              title="Safe-ish casting pattern"
              language="sql"
              code={`SELECT
  CASE
    WHEN amount_text ~ '^[0-9]+(\\.[0-9]+)?$'
      THEN amount_text::numeric
    ELSE NULL
  END AS amount
FROM imports;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="When should application code use Prisma vs raw SQL for functions/operators?">
            <p>
              Use Prisma for CRUD, simple filters, aggregates, and relations. Drop to
              <code>$queryRaw</code>/<code>$executeRaw</code> for DISTINCT ON, FILTER aggregates, JSONB path,
              window functions, and vendor-specific operators. Always parameterize raw SQL to avoid injection.
            </p>
            <CodeBlock
              title="Parameterized raw query"
              language="typescript"
              code={`const minScore = 80;
const rows = await prisma.$queryRaw\`
  SELECT id, payload
  FROM events
  WHERE jsonb_path_exists(
    payload,
    '$.meta.score ? (@ >= $score)'
  )
\`;
// Prefer Prisma.sql / tagged templates with bound params;
// never interpolate user input into the SQL string.`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Explain functional indexes and expression indexes with functions.">
            <p>
              You can index expressions like <code>LOWER(email)</code> so case-insensitive lookups use an index.
              The query must match the expression for the planner to use it.
            </p>
            <CodeBlock
              title="Expression index"
              language="sql"
              code={`CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email));

SELECT * FROM users WHERE LOWER(email) = LOWER('Ada@Example.com');`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
