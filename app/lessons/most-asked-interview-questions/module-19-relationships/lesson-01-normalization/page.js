import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Normalization - Module 19 - Most Asked Interview Questions',
  description:
    'Most asked normalization interview questions: what problem normalization solves with a duplicated address example, 1NF, 2NF, 3NF and BCNF explained simply, functional dependencies in plain words, a table that breaks 2NF, whether 3NF is always the goal, and when to denormalize on purpose.',
};

export default function M19L1Normalization() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Normalization</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Normalization is the habit of storing each fact in exactly one place. This lesson starts with the concrete
          problem it solves, walks through the normal forms in plain language, and finishes with the cases where
          breaking the rules on purpose is the right call.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What problem does normalization actually solve? Give a concrete example."
          >
            <p>
              It solves the problem of the same fact being written down more than once. Once a fact lives in two
              rows, the two copies can disagree, and then there is no way to tell which one is right.
            </p>
            <p>
              Take an <code>orders</code> table that stores the customer&apos;s address on every order. A customer
              with 40 orders has their address written 40 times.
            </p>
            <CodeBlock
              title="The duplicated address"
              language="sql"
              code={`-- Bad: the address is repeated on every order
CREATE TABLE orders (
  id               BIGINT PRIMARY KEY,
  customer_email   TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_street  TEXT NOT NULL,
  customer_city    TEXT NOT NULL,
  customer_zip     TEXT NOT NULL,
  total            NUMERIC(12,2) NOT NULL
);

-- id | customer_email  | customer_city | ...
-- 1  | ada@example.com | Bristol       | ...
-- 2  | ada@example.com | Bristol       | ...
-- 3  | ada@example.com | Bistol        | ...   <-- typo, now which is right?`}
            />
            <p>Textbooks call the three things that go wrong anomalies, and all three are visible here:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Update anomaly:</strong> Ada moves house. You must update 40 rows. Miss one and the data is
                now inconsistent
              </li>
              <li>
                <strong>Insert anomaly:</strong> you cannot record a new customer until they place an order,
                because the only place a customer exists is the order table
              </li>
              <li>
                <strong>Delete anomaly:</strong> delete Ada&apos;s only order and her address is gone from the
                system entirely
              </li>
            </ul>
            <p>
              The fix is to give the customer their own table and let orders point at it. Now the address exists
              once. Changing it is one <code>UPDATE</code> on one row, and it is impossible for two orders to
              disagree about it.
            </p>
            <CodeBlock
              title="The normalized version"
              language="sql"
              code={`CREATE TABLE customers (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email  TEXT NOT NULL UNIQUE,
  name   TEXT NOT NULL,
  street TEXT NOT NULL,
  city   TEXT NOT NULL,
  zip    TEXT NOT NULL
);

CREATE TABLE orders (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  total       NUMERIC(12,2) NOT NULL
);

-- One row changes, every order sees the new address
UPDATE customers SET city = 'Bath' WHERE id = 7;`}
            />
            <p>
              There is one important exception that interviewers love to raise. A <em>shipping</em> address on a
              past order is not the same fact as the customer&apos;s <em>current</em> address. An invoice must show
              where the parcel actually went, so that copy is deliberate and belongs on the order. The test is
              whether the value is a snapshot of history or a duplicate of a live fact.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is normalization? What are 1NF, 2NF, 3NF and BCNF?">
            <p>
              Normalization means splitting data so you do not store the same fact in many places. The normal forms
              are a checklist, each one stricter than the last.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1NF:</strong> each cell holds one value. No lists like &quot;red, blue&quot; in one column,
                and no repeating column groups such as <code>phone1</code>, <code>phone2</code>,{' '}
                <code>phone3</code>
              </li>
              <li>
                <strong>2NF:</strong> 1NF, and every non-key column depends on the whole key, not just part of a
                composite key
              </li>
              <li>
                <strong>3NF:</strong> 2NF, and non-key columns do not depend on other non-key columns. The classic
                example is city depending on zip, and zip depending on the customer
              </li>
              <li>
                <strong>BCNF:</strong> a stricter 3NF. Every column that determines another column must be a
                candidate key. It only differs from 3NF in tables with several overlapping candidate keys, which is
                why it is asked less often
              </li>
            </ul>
            <CodeBlock
              title="1NF: one value per cell"
              language="sql"
              code={`-- Not 1NF: a list inside a column
-- id | name | tags
-- 1  | Ada  | 'vip, newsletter'

-- 1NF: one row per tag
CREATE TABLE customer_tags (
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  PRIMARY KEY (customer_id, tag)
);`}
            />
            <CodeBlock
              title="3NF: the zip and city case"
              language="sql"
              code={`-- Not 3NF: city is determined by zip, not by the customer
-- customers(id, name, zip, city)

-- 3NF: the zip-to-city fact lives once
CREATE TABLE postcodes (
  zip  TEXT PRIMARY KEY,
  city TEXT NOT NULL
);

CREATE TABLE customers (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  zip  TEXT NOT NULL REFERENCES postcodes(zip)
);`}
            />
            <p>
              Start at 3NF. In practice 3NF removes essentially all the duplication that causes real bugs, and the
              higher forms (4NF and 5NF) come up in exams far more often than in jobs. Denormalize later, only when
              a query you measured is too slow.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is a functional dependency, in simple words?"
          >
            <p>
              A functional dependency means: if you know this, you know that. If knowing the value of column A
              always tells you exactly one value of column B, then B depends on A. People write it{' '}
              <code>A determines B</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>employee_id</code> determines <code>name</code>. Given an id, there is exactly one name
              </li>
              <li>
                <code>zip</code> determines <code>city</code>. Given a postcode, there is one city
              </li>
              <li>
                <code>name</code> does not determine <code>employee_id</code>, because two people can share a name
              </li>
              <li>
                Nothing determines a genuinely independent value. <code>employee_id</code> does not determine the
                number of hours they worked yesterday, because that changes without the id changing
              </li>
            </ul>
            <p>
              Why it matters: every normal form is a statement about dependencies. The whole checklist boils down to
              one sentence — <strong>every non-key column must depend on the key, the whole key, and nothing but
              the key</strong>. 2NF is the &quot;whole key&quot; part, and 3NF is the &quot;nothing but the
              key&quot; part.
            </p>
            <p>
              Note that a dependency is a statement about the business rules, not about the rows you happen to
              have. If today no two customers share an email, that might be coincidence; if the business says an
              email identifies a customer, that is a dependency, and it belongs in a <code>UNIQUE</code>{' '}
              constraint.
            </p>
            <CodeBlock
              title="Dependencies you can read off a schema"
              language="sql"
              code={`CREATE TABLE employees (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- id determines everything below
  email      TEXT NOT NULL UNIQUE,   -- email also determines the row: a candidate key
  name       TEXT NOT NULL,
  department TEXT NOT NULL
);

-- Transitive dependency: id -> department -> department_budget.
-- Storing department_budget here would break 3NF, so it lives in its own table.
CREATE TABLE departments (
  name   TEXT PRIMARY KEY,
  budget NUMERIC(14,2) NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Show a table that breaks 2NF and fix it."
          >
            <p>
              2NF only bites when the primary key is made of more than one column. The rule is that every other
              column must depend on all of the key, not on just part of it.
            </p>
            <p>
              Here is an order lines table keyed on <code>(order_id, product_id)</code>. The quantity depends on
              both columns, which is fine. The product name depends only on <code>product_id</code>, which is a
              partial dependency and breaks 2NF.
            </p>
            <CodeBlock
              title="Breaks 2NF"
              language="sql"
              code={`CREATE TABLE order_lines (
  order_id     BIGINT NOT NULL,
  product_id   BIGINT NOT NULL,
  qty          INT NOT NULL,        -- depends on both: correct
  product_name TEXT NOT NULL,       -- depends only on product_id: partial
  product_size TEXT NOT NULL,       -- same problem
  PRIMARY KEY (order_id, product_id)
);

-- The consequence: renaming a product means updating every line
-- that ever sold it, and two lines can disagree about its name.`}
            />
            <CodeBlock
              title="2NF: the product facts move to the product"
              language="sql"
              code={`CREATE TABLE products (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL
);

CREATE TABLE order_lines (
  order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  qty        INT NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);`}
            />
            <p>
              Now watch the exception, because this is the follow-up question. The <em>price</em> on an order line
              looks like the same mistake, but it is not: the price at the time of sale is a historical fact about
              that line, and it must not change when the product price changes next month. So{' '}
              <code>unit_price</code> belongs on <code>order_lines</code> even though{' '}
              <code>products.price</code> also exists.
            </p>
            <CodeBlock
              title="A snapshot column is not a normalization error"
              language="sql"
              code={`ALTER TABLE order_lines
  ADD COLUMN unit_price NUMERIC(12,2) NOT NULL;   -- price at purchase time

ALTER TABLE products
  ADD COLUMN price NUMERIC(12,2) NOT NULL;        -- price today`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Is 3NF always the goal?">
            <p>
              It is the right default and a good answer to &quot;where do you start&quot;, but it is not a rule to
              follow past the point where it helps. There are three honest reasons to stop short of it or go past
              it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Analytics does it differently on purpose.</strong> A data warehouse uses a star schema:
                one big fact table plus wide dimension tables that are deliberately not in 3NF, because reporting
                queries scan and group rather than update
              </li>
              <li>
                <strong>Snapshots are not duplication.</strong> Invoice totals, prices at purchase time and
                shipping addresses on past orders must be frozen. Normalizing them away is a bug, not an
                improvement
              </li>
              <li>
                <strong>Over-splitting has a cost.</strong> Breaking a table into six tables that are always
                queried together buys nothing and adds six joins to every query. If the data has no independent
                life, it does not need an independent table
              </li>
            </ul>
            <p>
              Also be clear that 3NF is about correctness first and performance second. People say
              &quot;normalization is slow because of joins&quot;. PostgreSQL joins indexed keys very well, and
              normalized tables are narrower, so more rows fit in each page and more of the table fits in memory.
              Joins are usually not the bottleneck people assume.
            </p>
            <p>
              The way to say this in an interview: normalize the source of truth to 3NF, then add denormalized
              copies as a deliberate, documented optimisation on top, never as a replacement.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When do you denormalize on purpose?">
            <p>
              When you have measured a query that is too slow, you understand why, and you can name who keeps the
              copy correct. Denormalization is a cache, and every cache needs an invalidation story.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Counters:</strong> <code>post.comment_count</code> so a feed of 50 posts does not run 50
                aggregate queries
              </li>
              <li>
                <strong>Copied display fields:</strong> <code>order.customer_name</code> so a list screen needs no
                join. Cheap win, but it now needs updating when the customer is renamed
              </li>
              <li>
                <strong>Materialized views:</strong> the best option when the data can be slightly stale, because
                PostgreSQL owns the refresh and you write no sync code at all
              </li>
              <li>
                <strong>Rollup tables:</strong> daily or hourly aggregates built by a job, so dashboards read
                thousands of rows instead of billions
              </li>
              <li>
                <strong>Precomputed paths:</strong> a materialized path column on a tree so subtree queries do not
                recurse
              </li>
            </ul>
            <p>Whatever you choose, pick one of exactly three owners for keeping the copy correct:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The database,</strong> via a trigger. Always correct, but it adds a write lock on the
                parent row for every child insert
              </li>
              <li>
                <strong>The application,</strong> in the same transaction. Fast and visible in code, but every new
                write path must remember
              </li>
              <li>
                <strong>An async job,</strong> for materialized views and rollups. Cheapest on the write path, and
                the data is stale by design
              </li>
            </ul>
            <CodeBlock
              title="Materialized view, refreshed without blocking readers"
              language="sql"
              code={`CREATE MATERIALIZED VIEW post_stats AS
SELECT p.id AS post_id,
       count(c.id)  AS comment_count,
       max(c.created_at) AS last_comment_at
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id;

-- A unique index is required for CONCURRENTLY
CREATE UNIQUE INDEX post_stats_pkey ON post_stats (post_id);

-- Readers keep seeing the old data until the refresh finishes
REFRESH MATERIALIZED VIEW CONCURRENTLY post_stats;`}
            />
            <CodeBlock
              title="Application-owned counter, in one transaction"
              language="typescript"
              code={`await prisma.$transaction([
  prisma.comment.create({ data: { postId, authorId, body } }),
  prisma.post.update({
    where: { id: postId },
    data: { commentCount: { increment: 1 } },
  }),
]);`}
            />
            <CodeBlock
              title="Always ship the query that proves the copy is still right"
              language="sql"
              code={`SELECT p.id, p.comment_count, count(c.id) AS real_count
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.comment_count
HAVING p.comment_count <> count(c.id);`}
            />
            <p>
              The senior-level detail is contention. A counter on a very hot row serializes every writer behind one
              row lock. The standard fix is to write small delta rows and roll them up periodically, trading
              instant accuracy for throughput.
            </p>
            <CodeBlock
              title="Delta rows instead of one hot counter"
              language="sql"
              code={`CREATE TABLE post_count_deltas (
  post_id BIGINT NOT NULL,
  delta   INT NOT NULL,
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

-- Writers only insert, so they never block each other
INSERT INTO post_count_deltas (post_id, delta) VALUES ($1, 1);

-- A job folds them in, then clears them
WITH folded AS (
  DELETE FROM post_count_deltas RETURNING post_id, delta
), summed AS (
  SELECT post_id, sum(delta) AS d FROM folded GROUP BY post_id
)
UPDATE posts p SET comment_count = p.comment_count + s.d
FROM summed s WHERE s.post_id = p.id;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
