import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: INSERT and RETURNING - Module 5 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on INSERT: multi-row inserts, INSERT ... SELECT, DEFAULT values, RETURNING, getting the generated id, and how Prisma create maps to SQL.',
};

export default function M5L1InsertAndReturning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: INSERT and RETURNING</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Adding rows is the first write you learn. The interesting part is getting the new id back and
          inserting many rows at once without a loop.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DML?">
            <p>DML means the SQL that changes rows: insert, update, and delete. It does not create or drop tables (that is DDL).</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The write commands are <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code></li>
              <li><code>SELECT</code> only reads. <code>MERGE</code> (Postgres 15+) can insert or update in one statement</li>
              <li>Put several writes in a transaction so they all succeed or all roll back</li>
              <li>DML can be rolled back. DDL such as <code>DROP TABLE</code> is also transactional in PostgreSQL, which is not true in every database</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How does INSERT ... RETURNING work?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>RETURNING</code> gives you the new row in the same command, so you do not need a second SELECT</li>
              <li>Use it to get the new id, default values, and timestamps</li>
              <li><code>UPDATE</code> and <code>DELETE</code> can use <code>RETURNING</code> too</li>
              <li>It works for multi-row inserts as well: you get one output row per inserted row</li>
              <li>This is a PostgreSQL strength. Other databases need a separate call to fetch the generated id</li>
            </ul>
            <CodeBlock
              title="INSERT RETURNING"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('ada@example.com', 'Ada')
RETURNING id, created_at;

-- Return the whole row
INSERT INTO users (email, name)
VALUES ('grace@example.com', 'Grace')
RETURNING *;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you get the id that the database generated?">
            <p>
              In PostgreSQL the direct answer is <code>RETURNING id</code>. Everything else is a fallback for
              older code or other databases.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Best:</strong> <code>INSERT ... RETURNING id</code>. One round trip, works for many rows, safe with concurrency</li>
              <li><code>currval(&apos;users_id_seq&apos;)</code> and <code>lastval()</code> return the last value your own session generated. They are session-local so another user cannot steal your value, but they only give you one id and they fail if nothing was generated yet</li>
              <li>Never use <code>SELECT max(id) FROM users</code>. Under concurrency you get someone else&apos;s row</li>
              <li>You can also grab the id <em>before</em> inserting with <code>nextval()</code>, which is handy when a parent and child are inserted together</li>
              <li>Prisma&apos;s <code>create</code> already returns the created object, including the id, because it uses <code>RETURNING</code> underneath</li>
            </ul>
            <CodeBlock
              title="Getting the new id"
              language="sql"
              code={`-- Preferred
INSERT INTO users (email) VALUES ('ada@example.com') RETURNING id;

-- Session-local fallback
SELECT currval('users_id_seq');

-- Reserve the id first, then use it in two inserts
BEGIN;
SELECT nextval('orders_id_seq') AS new_id;   -- say it returns 1001
INSERT INTO orders (id, user_id) VALUES (1001, 7);
INSERT INTO order_items (order_id, sku) VALUES (1001, 'ABC');
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does DEFAULT do on an insert?">
            <p>
              A default is the value the database puts in when your insert does not mention that column. You
              can also ask for it explicitly with the keyword <code>DEFAULT</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Leave the column out of the column list and the default applies</li>
              <li>Send the keyword <code>DEFAULT</code> in the values list to be explicit, which is useful when you insert several rows and only some should use the default</li>
              <li>Sending <code>NULL</code> is not the same as sending <code>DEFAULT</code>. An explicit NULL overrides the default and fails if the column is <code>NOT NULL</code></li>
              <li>A default can be an expression such as <code>now()</code> or <code>gen_random_uuid()</code>, evaluated once per row at insert time</li>
              <li><code>INSERT INTO t DEFAULT VALUES</code> inserts one row using defaults for every column</li>
              <li>Watch out with ORMs: a client sending <code>undefined</code> usually means “omit the column” (default applies), while <code>null</code> means “store NULL”</li>
            </ul>
            <CodeBlock
              title="DEFAULT on insert"
              language="sql"
              code={`CREATE TABLE tickets (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref        UUID NOT NULL DEFAULT gen_random_uuid(),
  status     TEXT NOT NULL DEFAULT 'open',
  priority   INT  NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- status, priority, created_at, ref all filled in for you
INSERT INTO tickets (id) VALUES (DEFAULT);

-- Mix explicit values and defaults across rows
INSERT INTO tickets (status, priority)
VALUES
  ('open', 1),
  (DEFAULT, DEFAULT);

-- Every column takes its default
INSERT INTO tickets DEFAULT VALUES;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you insert many rows in one statement, and why is that better than a loop?">
            <p>
              List the value groups after <code>VALUES</code>, separated by commas. One statement, one trip to
              the server, one set of constraint and index work.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A loop of 1000 single-row inserts pays 1000 network round trips. One multi-row insert pays one</li>
              <li>It is also atomic by itself: either all the listed rows go in, or none do</li>
              <li>Keep batches to a sane size, roughly a few hundred to a few thousand rows, so the statement stays small and locks are short</li>
              <li>PostgreSQL has a limit of 65535 bind parameters per statement, which caps how many rows you can send with placeholders</li>
              <li>For tens of thousands of rows or more, <code>COPY</code> is the right tool</li>
            </ul>
            <CodeBlock
              title="Multi-row insert"
              language="sql"
              code={`INSERT INTO events (user_id, event_type)
VALUES
  (1, 'login'),
  (1, 'view'),
  (2, 'login');

-- Same idea with UNNEST, which needs only 2 parameters for any row count
INSERT INTO events (user_id, event_type)
SELECT * FROM unnest($1::bigint[], $2::text[]);`}
            />
            <CodeBlock
              title="Prisma createMany"
              language="typescript"
              code={`await prisma.event.createMany({
  data: [
    { userId: 1, eventType: 'login' },
    { userId: 1, eventType: 'view' },
    { userId: 2, eventType: 'login' },
  ],
  skipDuplicates: true, // ON CONFLICT DO NOTHING style when unique would collide
});

// Need the created rows back? PostgreSQL supports createManyAndReturn
const created = await prisma.event.createManyAndReturn({
  data: [{ userId: 3, eventType: 'login' }],
  select: { id: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is INSERT ... SELECT and when do you use it?">
            <p>
              Instead of a <code>VALUES</code> list, the rows come from a query. The data never leaves the
              database, which makes it the fastest way to copy or transform rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Classic uses: promoting a staging table into the live table, archiving old rows, building a summary table, backfilling a new column into a new table</li>
              <li>Column order matters — the SELECT list must line up with the insert column list, so name the columns explicitly</li>
              <li>You can add <code>WHERE</code>, joins, aggregates, or a CTE, so filtering and transforming happen in the same pass</li>
              <li>Combine with <code>ON CONFLICT</code> to make the load repeatable, and with <code>RETURNING</code> if you need the new ids</li>
              <li>A very large <code>INSERT ... SELECT</code> is one long transaction. Batch it if the source table is huge</li>
            </ul>
            <CodeBlock
              title="INSERT ... SELECT"
              language="sql"
              code={`-- Promote validated staging rows, skipping ones already present
INSERT INTO users (email, name)
SELECT lower(email), name
FROM staging_users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Build a summary table from a group-by
INSERT INTO daily_sales (day, order_count, revenue)
SELECT date_trunc('day', created_at), count(*), sum(total)
FROM orders
WHERE created_at >= current_date - 30
GROUP BY 1;

-- Move rows and delete them in one statement using a CTE
WITH moved AS (
  DELETE FROM orders
  WHERE created_at < now() - interval '2 years'
  RETURNING *
)
INSERT INTO orders_archive
SELECT * FROM moved;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do Prisma create and update map to SQL?">
            <p>
              <code>create</code> becomes an <code>INSERT ... RETURNING</code>, <code>update</code> becomes an
              <code>UPDATE ... WHERE id = ... RETURNING</code>, and <code>delete</code> becomes a
              <code>DELETE ... RETURNING</code>. That is why each one hands you the row back.
            </p>
            <CodeBlock
              title="Prisma create / update"
              language="typescript"
              code={`const user = await prisma.user.create({
  data: { email: 'ada@example.com', name: 'Ada' },
});

const updated = await prisma.user.update({
  where: { id: user.id },
  data: { name: 'Ada Lovelace' },
});

await prisma.user.delete({ where: { id: user.id } });`}
            />
            <CodeBlock
              title="Nested create: parent and children in one transaction"
              language="typescript"
              code={`const order = await prisma.order.create({
  data: {
    userId: 1,
    total: 42.5,
    items: {
      create: [
        { sku: 'ABC', qty: 2 },
        { sku: 'XYZ', qty: 1 },
      ],
    },
  },
  include: { items: true },
});`}
            />
            <p>
              To see the real SQL, start the client with query logging:
              <code>new PrismaClient({'{ log: ["query"] }'})</code>.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
