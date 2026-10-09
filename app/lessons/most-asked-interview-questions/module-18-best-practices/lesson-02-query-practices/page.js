import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Query Practices - Module 18 - Most Asked Interview Questions',
  description:
    'Most asked SQL query best-practice interview questions: why SELECT * is bad, listing columns explicitly, parameterised queries instead of string concatenation, functions on indexed columns, EXISTS vs NOT IN, keeping transactions short, and offset vs cursor pagination.',
};

export default function M18L2QueryPractices() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Query Practices</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These are the habits reviewers look for in every pull request that touches the database: name your
          columns, never glue SQL together from strings, write conditions the index can actually use, and do not
          hold a transaction open while you wait for something slow.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Why is SELECT * considered a bad practice?">
            <p>
              <code>SELECT *</code> asks for every column, including the ones you never read. That costs real work
              and it makes your code depend on the table&apos;s exact shape.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Pulls unused columns. Large text and JSONB columns are stored out of line in what PostgreSQL calls
                TOAST, so reading them means extra disk reads and extra bytes over the network
              </li>
              <li>Breaks clients when a column is added, renamed or reordered; the contract is unclear</li>
              <li>
                Prevents a covering index. PostgreSQL can answer a query from the index alone, an
                &quot;index only scan&quot;, but only if every column you asked for is in that index
              </li>
              <li>
                Hides accidental leaks. A <code>password_hash</code> column added later is suddenly in your API
                response
              </li>
            </ul>
            <CodeBlock
              title="Prefer explicit columns"
              language="sql"
              code={`-- Bad
SELECT * FROM users;

-- Good
SELECT id, email, created_at FROM users WHERE id = $1;`}
            />
            <CodeBlock
              title="The covering index payoff"
              language="sql"
              code={`CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);

-- Can be an index only scan: both columns live in the index
EXPLAIN ANALYZE
SELECT user_id, created_at FROM orders WHERE user_id = 42;

-- SELECT * must visit the table for every row
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42;`}
            />
            <CodeBlock
              title="Prisma: select what you need"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, createdAt: true },
});`}
            />
            <p>
              Note that Prisma returns all scalar fields by default, which is the same problem with a different
              syntax. Using <code>select</code> is how you opt out.
            </p>
            <p>
              The one place <code>SELECT *</code> is fine: ad-hoc exploration in psql, and inside{' '}
              <code>EXISTS</code> or <code>COUNT(*)</code>, where the planner never actually reads the columns.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Why should you list columns explicitly in INSERT too?"
          >
            <p>
              An <code>INSERT</code> without a column list depends on the physical order of columns in the table.
              That order is not part of your API, and it changes.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Adding a column in the middle, or restoring a table from a slightly different dump, silently
                shifts your values into the wrong columns
              </li>
              <li>
                If both are <code>TEXT</code>, there is no type error. The data is just wrong
              </li>
              <li>
                With a column list, a new nullable column or a column with a default simply gets its default
              </li>
            </ul>
            <CodeBlock
              title="Positional INSERT is fragile"
              language="sql"
              code={`-- Fragile: depends on column order
INSERT INTO users VALUES (DEFAULT, 'ada@example.com', 'Ada');

-- Safe: order is stated, new columns take their defaults
INSERT INTO users (email, name) VALUES ($1, $2);

-- Same idea for the values you get back
INSERT INTO users (email, name)
VALUES ($1, $2)
RETURNING id, created_at;`}
            />
            <p>
              The same reasoning applies to <code>ORDER BY 1, 2</code> and <code>GROUP BY 1</code>. They work, but
              they break quietly when someone edits the select list. Name the columns.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Why must you never build SQL by string concatenation?"
          >
            <p>
              Because the database cannot tell the difference between the query you meant and the query the user
              typed. Gluing a value into the SQL text lets the value become code. That is SQL injection.
            </p>
            <p>
              The fix is a <strong>parameterised query</strong>: you send the SQL with placeholders such as{' '}
              <code>$1</code>, and send the values separately. The driver never mixes them, so a value can never
              turn into a keyword.
            </p>
            <CodeBlock
              title="The classic hole"
              language="javascript"
              code={`// Never do this. If email is "x' OR 1=1 --" the WHERE clause disappears.
const sql = "SELECT * FROM users WHERE email = '" + email + "'";
await client.query(sql);

// Parameterised: the value stays a value
await client.query('SELECT id, email FROM users WHERE email = $1', [email]);`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`// The query builder is parameterised for you
await prisma.user.findMany({ where: { email } });

// Raw SQL: pass values as arguments, never inside the string
await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE email = $1',
  email
);

// For dynamic identifiers, validate against an allow-list first.
// Table and column names cannot be parameterised.
const sortable = { createdAt: 'created_at', email: 'email' };
const column = sortable[sortBy] ?? 'created_at';
await prisma.$queryRawUnsafe(
  'SELECT id FROM users ORDER BY ' + column + ' DESC LIMIT $1',
  limit
);`}
            />
            <p>
              Two extra points that separate a good answer from a memorised one. Parameters also help performance,
              because the same SQL text can reuse a cached plan. And parameters cannot carry table or column
              names, so dynamic sorting or filtering must be checked against a fixed allow-list, as above.
            </p>
            <p>
              Beyond parameters, the other defence is permissions. The role your application connects with should
              not be able to drop tables, so even a successful injection has a small blast radius.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Why should you avoid wrapping an indexed column in a function inside WHERE?"
          >
            <p>
              An index stores the column&apos;s values. If you wrap the column in a function, the index no longer
              matches what you are comparing, so PostgreSQL has to compute the function for every row. That means
              a sequential scan.
            </p>
            <p>
              The jargon for a condition an index can use is <strong>sargable</strong>, short for &quot;search
              argument able&quot;. The rule of thumb: keep the bare column on the left of the operator, and do the
              transforming on the value side.
            </p>
            <CodeBlock
              title="Rewrite to keep the index"
              language="sql"
              code={`CREATE INDEX users_email_idx ON users (email);
CREATE INDEX orders_created_at_idx ON orders (created_at);

-- Cannot use the index
SELECT * FROM users WHERE lower(email) = 'ada@example.com';
-- Can, if you store email already lowercased
SELECT * FROM users WHERE email = 'ada@example.com';

-- Cannot use the index
SELECT * FROM orders WHERE date(created_at) = '2026-01-05';
-- Can: a range on the bare column
SELECT * FROM orders
WHERE created_at >= '2026-01-05'
  AND created_at <  '2026-01-06';

-- Cannot use the index
SELECT * FROM orders WHERE created_at + interval '1 day' > now();
-- Can: move the maths to the other side
SELECT * FROM orders WHERE created_at > now() - interval '1 day';`}
            />
            <p>
              When you genuinely need the function, do not fight it. Build an <strong>expression index</strong>,
              which indexes the result of the function instead of the column. PostgreSQL will then match the same
              expression in your query.
            </p>
            <CodeBlock
              title="Expression index when the function is unavoidable"
              language="sql"
              code={`CREATE INDEX users_email_lower_idx ON users (lower(email));

-- Now this uses the index
SELECT * FROM users WHERE lower(email) = lower($1);

-- Same trick for a JSONB key
CREATE INDEX events_user_idx ON events ((payload->>'user_id'));`}
            />
            <p>
              Two related traps. A leading wildcard (<code>LIKE &apos;%ada%&apos;</code>) cannot use a normal
              B-tree index either; that needs a trigram index with the <code>pg_trgm</code> extension. And
              comparing columns of different types can force an implicit cast that hides the index, so keep your
              parameter types matching the column types.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Why prefer EXISTS over NOT IN when checking for missing rows?"
          >
            <p>
              Because of NULL. <code>NOT IN</code> on a subquery that returns even one NULL returns no rows at all,
              and it does so silently. This is one of the most common real bugs in production SQL.
            </p>
            <p>
              The reason is three-valued logic. <code>x NOT IN (1, NULL)</code> means{' '}
              <code>x &lt;&gt; 1 AND x &lt;&gt; NULL</code>. The second part is never true, it is unknown, so the
              whole condition is never true.
            </p>
            <CodeBlock
              title="The NOT IN trap"
              language="sql"
              code={`-- Returns ZERO rows if any order has a NULL customer_id
SELECT c.id, c.name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);

-- Correct and NULL-safe
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Also correct: anti-join
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;`}
            />
            <p>
              The same argument applies on the positive side. <code>EXISTS</code> stops at the first matching row,
              so it is a good fit for &quot;does this customer have any order&quot; checks, while{' '}
              <code>IN</code> with a large subquery may build the whole list first. On modern PostgreSQL the
              planner often turns both into the same semi-join, so the real reason to prefer{' '}
              <code>EXISTS</code> is correctness, not speed.
            </p>
            <CodeBlock
              title="EXISTS in Prisma"
              language="typescript"
              code={`// Customers with no orders: Prisma compiles this to an anti-join
await prisma.customer.findMany({
  where: { orders: { none: {} } },
  select: { id: true, name: true },
});

// Customers with at least one paid order
await prisma.customer.findMany({
  where: { orders: { some: { status: 'paid' } } },
});`}
            />
            <p>
              <code>IN</code> with an explicit list of literals is perfectly fine, as long as the list is small.
              A list of ten thousand ids is better written as a join against{' '}
              <code>unnest($1::bigint[])</code> or a temporary table.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Offset vs cursor pagination — which should you use?"
          >
            <p>
              <strong>Offset</strong> pagination (<code>LIMIT</code> and <code>OFFSET</code>, or Prisma{' '}
              <code>skip</code> and <code>take</code>) is simple and lets you jump to page 50. The problems show
              up at scale: to skip 100,000 rows the database must read and discard 100,000 rows, so deep pages get
              slower and slower. Worse, if rows are inserted while a user pages, they see duplicates or miss rows.
            </p>
            <p>
              <strong>Cursor</strong> pagination, also called keyset pagination, remembers the last row you saw and
              asks for rows after it. Cost is the same on page 1 and page 5,000, and concurrent inserts cannot
              shift the window.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The sort key must be unique, so add the primary key as a tie-breaker</li>
              <li>The index must match the sort order, otherwise you are back to sorting everything</li>
              <li>You lose random page access, which is usually fine for feeds and infinite scroll</li>
              <li>Use offset for small admin tables where page numbers are a feature</li>
            </ul>
            <CodeBlock
              title="Cursor pagination SQL"
              language="sql"
              code={`CREATE INDEX posts_created_id_idx ON posts (created_at DESC, id DESC);

SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < ($1, $2)   -- the last row of the previous page
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
            />
            <p>
              That row comparison is doing real work: it means &quot;created earlier, or created at the same
              instant but with a smaller id&quot;. Writing it as two separate conditions joined by{' '}
              <code>OR</code> is correct too, but the tuple form is what the index can use directly.
            </p>
            <CodeBlock
              title="Prisma cursor"
              language="typescript"
              code={`const page = await prisma.post.findMany({
  take: 20,
  skip: 1,                 // skip the cursor row itself
  cursor: { id: lastId },
  orderBy: { id: 'desc' },
  select: { id: true, title: true, createdAt: true },
});

const nextCursor = page.length === 20 ? page[page.length - 1].id : null;`}
            />
            <p>
              A practical tip for APIs: encode the cursor as an opaque string rather than exposing the raw id and
              timestamp. That lets you change the sort key later without breaking clients.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why must transactions be kept short?">
            <p>
              An open transaction holds resources, and in PostgreSQL it holds one more thing than people expect:
              it pins the oldest row version the database is allowed to clean up.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Locks:</strong> every row you updated stays locked until commit, so other writers on those
                rows wait
              </li>
              <li>
                <strong>Connections:</strong> a transaction owns a connection for its whole life. Long
                transactions drain the pool, and then unrelated requests start timing out waiting for a connection
              </li>
              <li>
                <strong>Vacuum:</strong> autovacuum cannot remove dead row versions newer than your transaction&apos;s
                snapshot. One transaction left open for hours causes table and index bloat across the entire
                database
              </li>
              <li>
                <strong>Deadlock risk</strong> grows with the number of rows you touch and the time you hold them
              </li>
            </ul>
            <p>
              The single worst pattern is doing slow non-database work inside a transaction: calling a payment
              provider, sending an email, resizing an image. The transaction sits in the{' '}
              <code>idle in transaction</code> state doing nothing while the network call runs.
            </p>
            <CodeBlock
              title="Move the slow call out"
              language="typescript"
              code={`// Bad: the HTTP call happens with the transaction open
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data });
  const charge = await stripe.charges.create({ amount: order.total }); // slow
  await tx.order.update({ where: { id: order.id }, data: { chargeId: charge.id } });
});

// Better: transaction 1, external call, transaction 2
const order = await prisma.order.create({ data: { ...data, status: 'pending' } });
const charge = await stripe.charges.create({
  amount: order.total,
  idempotencyKey: order.id,
});
await prisma.order.update({
  where: { id: order.id },
  data: { chargeId: charge.id, status: 'paid' },
});`}
            />
            <p>
              The trade-off is that you no longer get one atomic step, so the second transaction must be safe to
              retry. That is what the idempotency key is for, and it is the honest senior answer: you exchange
              database atomicity for an idempotent workflow.
            </p>
            <CodeBlock
              title="Guardrails so a forgotten transaction cannot hurt you"
              language="sql"
              code={`ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE app_user SET lock_timeout = '5s';

-- Find long-running transactions right now
SELECT pid, state, now() - xact_start AS age, left(query, 60) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY age DESC;`}
            />
            <p>
              Also batch large writes. Deleting ten million rows in one statement is one enormous transaction;
              deleting them in chunks of ten thousand, each committed, lets vacuum keep up and keeps locks short.
            </p>
            <CodeBlock
              title="Chunked delete"
              language="sql"
              code={`-- Repeat until zero rows are affected
DELETE FROM events
WHERE id IN (
  SELECT id FROM events
  WHERE created_at < now() - interval '90 days'
  LIMIT 10000
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
