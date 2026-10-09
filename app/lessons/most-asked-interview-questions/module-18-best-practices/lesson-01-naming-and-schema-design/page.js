import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Naming and Schema Design - Module 18 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL and Prisma naming and schema design interview questions: snake_case vs camelCase, singular vs plural table names, @map and @@map, surrogate keys, text vs enum types, schema smells, and when denormalization is acceptable.',
};

export default function M18L1NamingAndSchemaDesign() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Naming and Schema Design</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Names are the first thing a reviewer sees and the hardest thing to change later. This lesson covers the
          naming rules teams actually agree on, how to keep database names and Prisma names in sync, how to pick
          primary keys, and how to spot a bad schema before it ships.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What naming conventions should you use for PostgreSQL and Prisma?"
          >
            <p>
              There is no law here, but there is a widely used default. Follow the database convention in the
              database and the JavaScript convention in your code, then map between them.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                SQL: <code>snake_case</code> tables and columns (<code>order_items.created_at</code>)
              </li>
              <li>
                Prisma models: <code>PascalCase</code> models, <code>camelCase</code> fields; map to the database
                names with <code>@map</code> and <code>@@map</code>
              </li>
              <li>
                Indexes and constraints: readable names, usually{' '}
                <code>table_column_suffix</code> — <code>orders_user_id_idx</code>,{' '}
                <code>users_email_key</code>
              </li>
              <li>Avoid reserved words as identifiers; be consistent across the whole codebase</li>
            </ul>
            <p>
              The reason to avoid reserved words is practical. If you name a column <code>order</code> or{' '}
              <code>user</code>, every query has to quote it as <code>&quot;order&quot;</code>, and the day
              someone forgets the quotes you get a confusing syntax error.
            </p>
            <CodeBlock
              title="Prisma @map for a snake_case database"
              language="typescript"
              code={`model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("order_items")
  @@index([orderId], map: "order_items_order_id_idx")
}`}
            />
            <CodeBlock
              title="Constraint names you will recognise later"
              language="sql"
              code={`-- PostgreSQL generates these shapes by default, so match them
CREATE UNIQUE INDEX users_email_key ON users (email);
CREATE INDEX orders_user_id_idx ON orders (user_id);

ALTER TABLE orders
  ADD CONSTRAINT orders_total_check CHECK (total >= 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers (id);`}
            />
            <p>
              Why it matters in an interview: a named constraint appears in the error message your API returns. If
              the name is <code>orders_total_check</code>, you can map it to a friendly message. If PostgreSQL
              invented a name like <code>orders_total_check1</code>, you cannot.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Should table names be singular or plural?"
          >
            <p>
              Both are defensible. What is not defensible is mixing them. Pick one and write it down in the team
              README.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Plural</strong> (<code>users</code>, <code>orders</code>) reads well in queries, because a
                table holds many rows: <code>SELECT * FROM users</code>. This is the most common choice in the
                PostgreSQL world.
              </li>
              <li>
                <strong>Singular</strong> (<code>user</code>, <code>order</code>) reads well as a type name, which
                is why most ORMs name their models that way.
              </li>
            </ul>
            <p>
              Prisma sidesteps the argument: the model is singular because it describes one record, and{' '}
              <code>@@map</code> points it at a plural table. So a team can have plural tables and singular models
              at the same time, which is usually the happiest answer.
            </p>
            <CodeBlock
              title="Singular model, plural table"
              language="typescript"
              code={`model User {
  id    Int    @id @default(autoincrement())
  email String @unique

  @@map("users")
}

// Reads naturally in both languages:
//   SELECT id FROM users;
//   await prisma.user.findMany();`}
            />
            <p>
              One tie-breaker for plural: singular names collide with reserved words far more often.{' '}
              <code>user</code>, <code>order</code>, <code>group</code> and <code>role</code> are all reserved or
              semi-reserved in PostgreSQL. Their plurals are not.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you keep snake_case in the database but camelCase in Prisma?"
          >
            <p>
              You use two mapping attributes. <code>@map</code> renames a single field, and <code>@@map</code>{' '}
              renames the whole model. Neither changes your JavaScript code; they only change the SQL that Prisma
              generates.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>@map(&quot;column_name&quot;)</code> on a field
              </li>
              <li>
                <code>@@map(&quot;table_name&quot;)</code> on a model
              </li>
              <li>
                <code>@@index([...], map: &quot;index_name&quot;)</code> to control the index name too
              </li>
              <li>
                <code>@map</code> also works on <code>enum</code> values, which matters when the database stores
                uppercase values
              </li>
            </ul>
            <CodeBlock
              title="Full mapping example"
              language="typescript"
              code={`model BlogPost {
  id          Int      @id @default(autoincrement())
  authorId    Int      @map("author_id")
  publishedAt DateTime? @map("published_at")
  isFeatured  Boolean  @default(false) @map("is_featured")

  author User @relation(fields: [authorId], references: [id])

  @@map("blog_posts")
  @@index([authorId, publishedAt], map: "blog_posts_author_published_idx")
}

enum OrderStatus {
  Pending   @map("pending")
  Paid      @map("paid")
  Cancelled @map("cancelled")

  @@map("order_status")
}`}
            />
            <p>
              In your code you still write <code>post.publishedAt</code>. Prisma sends{' '}
              <code>published_at</code> to PostgreSQL. If you introduce Prisma to an existing database,{' '}
              <code>prisma db pull</code> generates these <code>@map</code> lines for you.
            </p>
            <p>
              One warning worth saying out loud in an interview: adding <code>@map</code> to a field that already
              exists is a rename in the eyes of Prisma Migrate. Check the generated SQL, because a careless rename
              can come out as a drop plus an add, which loses data.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Should every table always have a surrogate id?"
          >
            <p>
              A <strong>surrogate key</strong> is an id the system invents, like an auto-incrementing integer or a
              UUID. A <strong>natural key</strong> is a value that already means something in the business, like an
              email address or an ISO country code.
            </p>
            <p>
              The default advice is yes, use a surrogate key, because natural values change. People change email
              addresses, products get renamed, and a country changes its name. Every table that referenced the old
              value now needs updating.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Surrogate key as the primary key, plus a <code>UNIQUE</code> constraint on the natural key</li>
              <li>
                That gives you a stable value for foreign keys and a business rule that still blocks duplicates
              </li>
              <li>
                Reasonable exceptions: a junction table can use the pair of foreign keys as its primary key, and a
                small fixed lookup table can use a short stable code
              </li>
            </ul>
            <CodeBlock
              title="Surrogate primary key plus unique natural key"
              language="sql"
              code={`CREATE TABLE users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,      -- natural key, still enforced
  name  TEXT NOT NULL
);

-- Changing an email touches exactly one row
UPDATE users SET email = $1 WHERE id = $2;

-- A junction table is the common exception
CREATE TABLE post_tag (
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);`}
            />
            <p>
              The follow-up question is usually integer versus UUID. Integers are smaller, sort in insertion order
              and keep indexes compact. Random UUIDs are larger and scatter index writes, which hurts on very
              large tables, but they can be generated on the client and do not leak how many rows you have. If you
              want UUIDs, prefer a time-ordered version such as UUIDv7 so the values still sort roughly by
              creation time.
            </p>
            <CodeBlock
              title="Prisma: both styles"
              language="typescript"
              code={`model Invoice {
  id     BigInt @id @default(autoincrement())
  number String @unique
}

model Session {
  id        String   @id @default(cuid())
  userId    Int
  expiresAt DateTime
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Should a status column be TEXT with a CHECK, or a PostgreSQL enum type?"
          >
            <p>
              Both stop bad values. They differ in how easy they are to change later, which is the whole point of
              the question.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Enum type:</strong> compact storage, self-documenting, and it sorts in the order you
                declared. Adding a value is cheap; removing or renaming one needs a new type and a rewrite.
              </li>
              <li>
                <strong>TEXT plus CHECK:</strong> changing the allowed list is one <code>ALTER CONSTRAINT</code>{' '}
                migration. Slightly larger on disk and it sorts alphabetically.
              </li>
              <li>
                <strong>Lookup table with a foreign key:</strong> the right answer when the list is data, not
                code — when non-engineers add values, or each value needs extra columns like a label or a sort
                order.
              </li>
            </ul>
            <p>
              A simple rule: if the list is short, stable and meaningful to the code (<code>pending</code>,{' '}
              <code>paid</code>, <code>cancelled</code>), use an enum. If the list changes with the business, use
              a lookup table.
            </p>
            <CodeBlock
              title="All three shapes"
              language="sql"
              code={`-- 1. Enum type
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled');
ALTER TABLE orders ADD COLUMN status order_status NOT NULL DEFAULT 'pending';

-- Adding a value is safe and fast
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';

-- 2. TEXT plus CHECK
ALTER TABLE orders
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled'));

-- 3. Lookup table
CREATE TABLE order_statuses (
  code  TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL
);
ALTER TABLE orders
  ADD CONSTRAINT orders_status_fkey
  FOREIGN KEY (status) REFERENCES order_statuses (code);`}
            />
            <p>
              Two enum gotchas interviewers like. First, <code>ADD VALUE</code> could not run inside a
              transaction block before PostgreSQL 12, and even now you cannot use the new value in the same
              transaction that added it. Second, you cannot drop a value at all; you create a new type, convert
              the column and drop the old type.
            </p>
            <CodeBlock
              title="Prisma enum, mapped to the database type"
              language="typescript"
              code={`enum OrderStatus {
  pending
  paid
  cancelled
  refunded

  @@map("order_status")
}

model Order {
  id     BigInt      @id @default(autoincrement())
  status OrderStatus @default(pending)
}`}
            />
            <p>
              Prisma gives you a generated TypeScript union either way, so the type safety in your editor is not
              the deciding factor. Migration cost is.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What schema design smells do interviewers expect you to name?"
          >
            <p>
              A smell is not automatically a bug. It is a pattern that is usually wrong and always worth a
              question in review.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Missing foreign keys, so relations are enforced only by application code and slowly drift out of
                sync
              </li>
              <li>
                God tables with dozens of unrelated nullable columns. The extreme version is
                entity-attribute-value, where one table stores a row per field name and value, and nothing can be
                type checked
              </li>
              <li>
                Comma separated strings or untyped JSON where a real relation belongs, such as{' '}
                <code>tags = &apos;red,blue&apos;</code>
              </li>
              <li>
                Polymorphic foreign keys without constraints (<code>parent_type</code> plus{' '}
                <code>parent_id</code>), which no database can validate
              </li>
              <li>Indexes that do not match any real query, plus duplicate indexes nobody removed</li>
              <li>
                Mutable natural primary keys, such as using an email address as the primary key
              </li>
              <li>
                Repeated column groups like <code>phone1</code>, <code>phone2</code>, <code>phone3</code>, which
                should be a child table
              </li>
              <li>
                Money stored in <code>float</code> instead of <code>numeric</code>, so totals drift by a cent
              </li>
              <li>
                Timestamps stored as <code>timestamp</code> without a time zone, so the meaning depends on which
                server wrote the row
              </li>
            </ul>
            <CodeBlock
              title="A smelly table and its fix"
              language="sql"
              code={`-- Smelly
CREATE TABLE contacts (
  email   TEXT PRIMARY KEY,     -- mutable natural key
  phone1  TEXT,                 -- repeated group
  phone2  TEXT,
  tags    TEXT,                 -- 'vip,newsletter'
  balance FLOAT,                -- money in a float
  created TIMESTAMP             -- no time zone
);

-- Fixed
CREATE TABLE contacts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  balance    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_phones (
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL,
  kind       TEXT NOT NULL,
  PRIMARY KEY (contact_id, phone)
);

CREATE TABLE contact_tags (
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (contact_id, tag)
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When is denormalization acceptable?">
            <p>
              Denormalization means deliberately storing the same fact twice so reads get cheaper. It is
              acceptable when you have measured a real problem, and you can say exactly who keeps the copy
              correct.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Read-heavy paths where joins dominate latency, such as a cached <code>like_count</code> on a post
              </li>
              <li>Reporting and analytics tables fed by a job from the normalized tables</li>
              <li>Materialized views for aggregates that are expensive and tolerate being slightly stale</li>
              <li>
                A snapshot that must not change, which is a different thing entirely: an invoice line should store
                the price at purchase time, because the product price will change later
              </li>
              <li>
                Always document the source of truth and the update strategy: a trigger, the application write
                path, or an async job
              </li>
            </ul>
            <p>
              The interesting part of the answer is the failure mode. A cached counter drifts, and drift is
              invisible. So pair every denormalized value with a way to recompute it and a check that compares the
              two.
            </p>
            <CodeBlock
              title="Denormalized counter, updated in one transaction"
              language="typescript"
              code={`await prisma.$transaction([
  prisma.like.create({ data: { postId, userId } }),
  prisma.post.update({
    where: { id: postId },
    data: { likeCount: { increment: 1 } },
  }),
]);`}
            />
            <CodeBlock
              title="A reconciliation query you can run nightly"
              language="sql"
              code={`SELECT p.id, p.like_count, count(l.post_id) AS real_count
FROM posts p
LEFT JOIN likes l ON l.post_id = p.id
GROUP BY p.id, p.like_count
HAVING p.like_count <> count(l.post_id);`}
            />
            <CodeBlock
              title="Or let the database keep it correct"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION bump_like_count() RETURNS trigger AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER likes_count_trg
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION bump_like_count();`}
            />
            <p>
              The trade-off with the trigger version: correctness moves into the database, which is good, but
              every like now takes a row lock on the post. On a very hot post that serializes writes, and the fix
              is to insert into a small deltas table and roll it up periodically.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
